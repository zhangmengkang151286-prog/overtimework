-- ============================================
-- 修复 archive_daily_data 函数逻辑
-- ============================================

-- 删除旧函数
DROP FUNCTION IF EXISTS archive_daily_data(DATE);

-- 创建新的归档函数（修复逻辑）
CREATE OR REPLACE FUNCTION archive_daily_data(target_date DATE)
RETURNS TABLE (
  archived_date DATE,
  participant_count BIGINT,
  overtime_count BIGINT,
  on_time_count BIGINT
) AS $$
DECLARE
  v_participant_count BIGINT;
  v_overtime_count BIGINT;
  v_on_time_count BIGINT;
  v_tag_distribution JSONB;
BEGIN
  -- 第1步：获取每个用户在当天的最后一次提交
  -- 然后统计参与人数、加班人数、准点人数
  WITH latest_submissions AS (
    SELECT DISTINCT ON (user_id)
      user_id,
      is_overtime,
      tag_id,
      submitted_at
    FROM status_records
    WHERE date = target_date
    ORDER BY user_id, submitted_at DESC  -- 每个用户取最后一次提交
  )
  SELECT 
    COUNT(DISTINCT user_id),
    COUNT(*) FILTER (WHERE is_overtime = true),
    COUNT(*) FILTER (WHERE is_overtime = false)
  INTO v_participant_count, v_overtime_count, v_on_time_count
  FROM latest_submissions;

  -- 第2步：获取标签分布（也是基于最后一次提交）
  WITH latest_submissions AS (
    SELECT DISTINCT ON (user_id)
      user_id,
      is_overtime,
      tag_id,
      submitted_at
    FROM status_records
    WHERE date = target_date
    ORDER BY user_id, submitted_at DESC
  )
  SELECT 
    COALESCE(
      jsonb_object_agg(
        t.name,
        jsonb_build_object(
          'overtime', COUNT(*) FILTER (WHERE ls.is_overtime = true),
          'ontime', COUNT(*) FILTER (WHERE ls.is_overtime = false)
        )
      ),
      '{}'::jsonb
    )
  INTO v_tag_distribution
  FROM latest_submissions ls
  LEFT JOIN tags t ON ls.tag_id = t.id
  WHERE t.name IS NOT NULL
  GROUP BY t.name;

  -- 第3步：删除旧的归档记录（如果存在）
  DELETE FROM daily_history WHERE date = target_date;

  -- 第4步：插入新的归档记录
  INSERT INTO daily_history (
    date,
    participant_count,
    overtime_count,
    on_time_count,
    tag_distribution
  ) VALUES (
    target_date,
    v_participant_count,
    v_overtime_count,
    v_on_time_count,
    v_tag_distribution
  );

  -- 第5步：返回归档结果
  RETURN QUERY
  SELECT 
    target_date,
    v_participant_count,
    v_overtime_count,
    v_on_time_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 验证修复
-- ============================================

-- 测试：重新归档 2月6日
SELECT * FROM archive_daily_data('2026-02-06'::DATE);

-- 查看归档结果
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数",
  CASE 
    WHEN overtime_count > on_time_count THEN '🔴 红色（加班多）'
    WHEN overtime_count < on_time_count THEN '🟢 绿色（准点多）'
    ELSE '🟡 黄色（相等）'
  END as "圆点颜色"
FROM daily_history
WHERE date = '2026-02-06';

-- 对比原始数据（应该一致）
WITH latest_submissions AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    is_overtime,
    submitted_at
  FROM status_records
  WHERE date = '2026-02-06'
  ORDER BY user_id, submitted_at DESC
)
SELECT 
  '原始数据（最后一次提交）' as "数据来源",
  COUNT(DISTINCT user_id) as "参与人数",
  COUNT(*) FILTER (WHERE is_overtime = true) as "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false) as "准点人数"
FROM latest_submissions

UNION ALL

SELECT 
  '归档数据' as "数据来源",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数"
FROM daily_history
WHERE date = '2026-02-06';

-- ============================================
-- 说明
-- ============================================
-- 
-- 修复内容：
-- 1. 使用 DISTINCT ON (user_id) 获取每个用户的最后一次提交
-- 2. 基于最后一次提交统计加班/准点人数
-- 3. 标签分布也基于最后一次提交
-- 
-- 预期结果（2月6日）：
-- - 参与人数：1
-- - 加班人数：1（最后一次提交是 18:01:23 加班）
-- - 准点人数：0
-- - 圆点颜色：🔴 红色

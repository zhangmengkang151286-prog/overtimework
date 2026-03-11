-- ============================================
-- 修复 2月6日 归档数据
-- ============================================

-- 第1步：删除 2月6日 的旧归档数据（如果存在）
DELETE FROM daily_history
WHERE date = '2026-02-06';

-- 第2步：重新归档 2月6日 的数据
SELECT * FROM archive_daily_data('2026-02-06'::DATE);

-- 第3步：验证归档结果
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数",
  CASE 
    WHEN overtime_count > on_time_count THEN '🔴 红色（加班多）'
    WHEN overtime_count < on_time_count THEN '🟢 绿色（准点多）'
    ELSE '🟡 黄色（相等）'
  END as "圆点颜色",
  TO_CHAR(created_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "创建时间（北京）"
FROM daily_history
WHERE date = '2026-02-06';

-- 第4步：对比原始数据，确保一致
SELECT 
  '原始数据' as "数据来源",
  date as "日期",
  COUNT(DISTINCT user_id) as "参与人数",
  COUNT(*) FILTER (WHERE is_overtime = true) as "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false) as "准点人数"
FROM status_records
WHERE date = '2026-02-06'
GROUP BY date

UNION ALL

SELECT 
  '归档数据' as "数据来源",
  date::text as "日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数"
FROM daily_history
WHERE date = '2026-02-06';

-- ============================================
-- 说明
-- ============================================
-- 
-- 这个脚本会：
-- 1. 删除 2月6日 的旧归档数据
-- 2. 重新归档 2月6日 的数据
-- 3. 验证归档结果
-- 4. 对比原始数据和归档数据，确保一致
-- 
-- 执行后，刷新应用，2月6日的圆点应该显示正确的数据

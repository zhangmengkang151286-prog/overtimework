-- ============================================
-- 插入带时间戳的测试数据（简化版）
-- 不依赖现有用户，直接创建测试用户和数据
-- ============================================

-- 清除今天的旧数据
DELETE FROM status_records WHERE date = CURRENT_DATE;

-- 创建临时测试用户（如果不存在）
DO $$
DECLARE
  v_user_id UUID;
  v_tag_meeting UUID;
  v_tag_coding UUID;
BEGIN
  -- 获取或创建标签（添加 type 字段）
  SELECT id INTO v_tag_meeting FROM tags WHERE name = '开会' LIMIT 1;
  IF v_tag_meeting IS NULL THEN
    INSERT INTO tags (name, type, is_active) VALUES ('开会', 'custom', true) RETURNING id INTO v_tag_meeting;
  END IF;
  
  SELECT id INTO v_tag_coding FROM tags WHERE name = '写代码' LIMIT 1;
  IF v_tag_coding IS NULL THEN
    INSERT INTO tags (name, type, is_active) VALUES ('写代码', 'custom', true) RETURNING id INTO v_tag_coding;
  END IF;

  -- 插入9条测试数据，使用不同的临时用户ID
  -- 用户1：早上 7:30 提交（准时）
  INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
  VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    false,
    v_tag_meeting,
    CURRENT_DATE + INTERVAL '7 hours 30 minutes'
  );

  -- 用户2：早上 8:15 提交（加班）
  INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
  VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    true,
    v_tag_coding,
    CURRENT_DATE + INTERVAL '8 hours 15 minutes'
  );

  -- 用户3：早上 9:00 提交（准时）
  INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
  VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    false,
    v_tag_meeting,
    CURRENT_DATE + INTERVAL '9 hours'
  );

  -- 用户4：上午 10:20 提交（准时）
  INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
  VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    false,
    v_tag_coding,
    CURRENT_DATE + INTERVAL '10 hours 20 minutes'
  );

  -- 用户5：上午 11:45 提交（加班）
  INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
  VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    true,
    v_tag_meeting,
    CURRENT_DATE + INTERVAL '11 hours 45 minutes'
  );

  -- 用户6：下午 13:10 提交（准时）
  INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
  VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    false,
    v_tag_coding,
    CURRENT_DATE + INTERVAL '13 hours 10 minutes'
  );

  -- 用户7：下午 14:30 提交（准时）
  INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
  VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    false,
    v_tag_meeting,
    CURRENT_DATE + INTERVAL '14 hours 30 minutes'
  );

  -- 用户8：下午 15:50 提交（加班）
  INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
  VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    true,
    v_tag_coding,
    CURRENT_DATE + INTERVAL '15 hours 50 minutes'
  );

  -- 用户9：下午 16:20 提交（准时）
  INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
  VALUES (
    gen_random_uuid(),
    CURRENT_DATE,
    false,
    v_tag_meeting,
    CURRENT_DATE + INTERVAL '16 hours 20 minutes'
  );

  RAISE NOTICE '成功插入 9 条测试数据';
END $$;

-- 验证插入的数据
SELECT 
  TO_CHAR(submitted_at, 'HH24:MI') as time,
  COUNT(*) as count,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time
FROM status_records
WHERE date = CURRENT_DATE
GROUP BY submitted_at
ORDER BY submitted_at;

-- 查看累计统计
SELECT 
  '截止到 10:00' as time_point,
  COUNT(DISTINCT user_id) as participants,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '10 hours'
UNION ALL
SELECT 
  '截止到 14:00',
  COUNT(DISTINCT user_id),
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END),
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '14 hours'
UNION ALL
SELECT 
  '截止到 16:00',
  COUNT(DISTINCT user_id),
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END),
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '16 hours'
UNION ALL
SELECT 
  '截止到现在',
  COUNT(DISTINCT user_id),
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END),
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)
FROM status_records
WHERE date = CURRENT_DATE;

-- ============================================
-- 说明
-- ============================================
-- 这个脚本插入了9条测试数据，分布在：
-- - 7:30: 1人（累计1人）
-- - 8:15: 1人（累计2人）
-- - 9:00: 1人（累计3人）
-- - 10:20: 1人（累计4人）
-- - 11:45: 1人（累计5人）
-- - 13:10: 1人（累计6人）
-- - 14:30: 1人（累计7人）
-- - 15:50: 1人（累计8人）
-- - 16:20: 1人（累计9人）
--
-- 现在可以：
-- - 拖动到 10:00 → 看到累计 3 人
-- - 拖动到 14:00 → 看到累计 6 人
-- - 拖动到 16:00 → 看到累计 8 人
-- - 点击"现在" → 看到累计 9 人
--
-- 注意：这个版本不依赖现有用户，直接创建临时用户ID

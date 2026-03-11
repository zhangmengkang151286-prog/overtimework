-- ============================================
-- 插入带时间戳的测试数据
-- 模拟用户在不同时间点提交状态
-- ============================================

-- 清除今天的旧数据
DELETE FROM status_records WHERE date = CURRENT_DATE;

-- 插入测试数据（9条记录，分布在不同时间）
-- 假设有3个测试用户，在不同时间提交状态

-- 用户1：早上 7:30 提交（准时）
INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
VALUES (
  (SELECT id FROM users WHERE phone = '13800000001' LIMIT 1),
  CURRENT_DATE,
  false,
  (SELECT id FROM tags WHERE name = '开会' LIMIT 1),
  CURRENT_DATE + INTERVAL '7 hours 30 minutes'
);

-- 用户2：早上 8:15 提交（加班）
INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
VALUES (
  (SELECT id FROM users WHERE phone = '13800000002' LIMIT 1),
  CURRENT_DATE,
  true,
  (SELECT id FROM tags WHERE name = '写代码' LIMIT 1),
  CURRENT_DATE + INTERVAL '8 hours 15 minutes'
);

-- 用户3：早上 9:00 提交（准时）
INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
VALUES (
  (SELECT id FROM users WHERE phone = '13800000003' LIMIT 1),
  CURRENT_DATE,
  false,
  (SELECT id FROM tags WHERE name = '开会' LIMIT 1),
  CURRENT_DATE + INTERVAL '9 hours'
);

-- 用户4：上午 10:20 提交（准时）
INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
VALUES (
  (SELECT id FROM users WHERE phone = '13800000004' LIMIT 1),
  CURRENT_DATE,
  false,
  (SELECT id FROM tags WHERE name = '写代码' LIMIT 1),
  CURRENT_DATE + INTERVAL '10 hours 20 minutes'
);

-- 用户5：上午 11:45 提交（加班）
INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
VALUES (
  (SELECT id FROM users WHERE phone = '13800000005' LIMIT 1),
  CURRENT_DATE,
  true,
  (SELECT id FROM tags WHERE name = '开会' LIMIT 1),
  CURRENT_DATE + INTERVAL '11 hours 45 minutes'
);

-- 用户6：下午 13:10 提交（准时）
INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
VALUES (
  (SELECT id FROM users WHERE phone = '13800000006' LIMIT 1),
  CURRENT_DATE,
  false,
  (SELECT id FROM tags WHERE name = '写代码' LIMIT 1),
  CURRENT_DATE + INTERVAL '13 hours 10 minutes'
);

-- 用户7：下午 14:30 提交（准时）
INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
VALUES (
  (SELECT id FROM users WHERE phone = '13800000007' LIMIT 1),
  CURRENT_DATE,
  false,
  (SELECT id FROM tags WHERE name = '开会' LIMIT 1),
  CURRENT_DATE + INTERVAL '14 hours 30 minutes'
);

-- 用户8：下午 15:50 提交（加班）
INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
VALUES (
  (SELECT id FROM users WHERE phone = '13800000008' LIMIT 1),
  CURRENT_DATE,
  true,
  (SELECT id FROM tags WHERE name = '写代码' LIMIT 1),
  CURRENT_DATE + INTERVAL '15 hours 50 minutes'
);

-- 用户9：下午 16:20 提交（准时）
INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
VALUES (
  (SELECT id FROM users WHERE phone = '13800000009' LIMIT 1),
  CURRENT_DATE,
  false,
  (SELECT id FROM tags WHERE name = '开会' LIMIT 1),
  CURRENT_DATE + INTERVAL '16 hours 20 minutes'
);

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

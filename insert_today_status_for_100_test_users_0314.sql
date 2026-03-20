-- ============================================
-- 为 100 个测试用户插入今天的状态数据（随机）
-- 手机号模式：13900200%
-- 约 60% 加班，40% 准时
-- ============================================

-- 第1步：清理今天已有的测试用户状态（避免重复）
DELETE FROM status_records
WHERE date = CURRENT_DATE
  AND user_id IN (SELECT id FROM users WHERE phone_number LIKE '13900200%');

-- 第2步：插入随机状态（先统一插入，is_overtime 由 random 决定）
INSERT INTO status_records (user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
SELECT
  u.id,
  CURRENT_DATE,
  -- 60% 概率加班
  (r.rnd < 0.6) AS is_overtime,
  -- 根据加班/准时选对应 category 的标签
  CASE
    WHEN r.rnd < 0.6 THEN (
      SELECT id FROM tags
      WHERE type = 'custom' AND category = 'overtime' AND is_active = true
      ORDER BY random() LIMIT 1
    )
    ELSE (
      SELECT id FROM tags
      WHERE type = 'custom' AND category = 'ontime' AND is_active = true
      ORDER BY random() LIMIT 1
    )
  END AS tag_id,
  -- 加班时长：加班 1~5 小时，准时为 NULL
  CASE
    WHEN r.rnd < 0.6 THEN (1 + floor(random() * 5))::int
    ELSE NULL
  END AS overtime_hours,
  -- 提交时间：今天 08:00 ~ 22:00 随机（北京时间）
  (CURRENT_DATE + make_interval(hours => (8 + floor(random() * 14))::int,
                                 mins => floor(random() * 60)::int))
    AT TIME ZONE 'Asia/Shanghai' AS submitted_at
FROM users u
CROSS JOIN LATERAL (SELECT random() AS rnd) r
WHERE u.phone_number LIKE '13900200%';

-- 第3步：验证结果
SELECT
  COUNT(*) AS "今日状态总数",
  COUNT(*) FILTER (WHERE is_overtime = true) AS "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false) AS "准点人数",
  CASE WHEN COUNT(*) > 0
    THEN ROUND(COUNT(*) FILTER (WHERE is_overtime = true) * 100.0 / COUNT(*), 1)
    ELSE 0
  END AS "加班率%",
  TO_CHAR(MIN(submitted_at AT TIME ZONE 'Asia/Shanghai'), 'HH24:MI') AS "最早提交",
  TO_CHAR(MAX(submitted_at AT TIME ZONE 'Asia/Shanghai'), 'HH24:MI') AS "最晚提交"
FROM status_records
WHERE date = CURRENT_DATE
  AND user_id IN (SELECT id FROM users WHERE phone_number LIKE '13900200%');

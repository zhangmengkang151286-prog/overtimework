-- 为已有的 100 个测试用户提交今天的状态
-- 手机号模式：13900200%
-- 使用纯 SQL（无 DO 块），避免 psql 解析问题

-- 先清理今天已有的测试用户状态
DELETE FROM status_records
WHERE date = CURRENT_DATE
  AND user_id IN (SELECT id FROM users WHERE phone_number LIKE '13900200%');

-- 使用 INSERT ... SELECT + random() 为每个测试用户生成状态
-- 约 60% 加班，40% 准时
INSERT INTO status_records (user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
SELECT
  u.id,
  CURRENT_DATE,
  -- 60% 概率加班
  (random() < 0.6) AS is_overtime,
  -- 根据加班/准时随机选一个对应 category 的标签
  CASE
    WHEN random() < 0.6 THEN (
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
  -- 加班时长：加班 1~5 小时，准时为 NULL（通过后续 UPDATE 处理）
  CASE
    WHEN random() < 0.6 THEN (1 + floor(random() * 5))::int
    ELSE NULL
  END AS overtime_hours,
  -- 提交时间：今天 8:00 ~ 22:00 之间随机
  (CURRENT_DATE + make_interval(hours => (8 + floor(random() * 14))::int,
                                 mins => floor(random() * 60)::int))
    AT TIME ZONE 'Asia/Shanghai' AS submitted_at
FROM users u
WHERE u.phone_number LIKE '13900200%'
ON CONFLICT (user_id, date) DO UPDATE SET
  is_overtime = EXCLUDED.is_overtime,
  tag_id = EXCLUDED.tag_id,
  overtime_hours = EXCLUDED.overtime_hours,
  submitted_at = EXCLUDED.submitted_at;

-- 修正数据一致性：准时的用户 overtime_hours 应为 NULL，加班的用户必须有 overtime_hours
UPDATE status_records SET overtime_hours = NULL
WHERE date = CURRENT_DATE
  AND is_overtime = false
  AND overtime_hours IS NOT NULL
  AND user_id IN (SELECT id FROM users WHERE phone_number LIKE '13900200%');

UPDATE status_records SET overtime_hours = (1 + floor(random() * 5))::int
WHERE date = CURRENT_DATE
  AND is_overtime = true
  AND overtime_hours IS NULL
  AND user_id IN (SELECT id FROM users WHERE phone_number LIKE '13900200%');

-- 修正标签一致性：加班用户用 overtime 标签，准时用户用 ontime 标签
UPDATE status_records sr SET tag_id = (
  SELECT t.id FROM tags t
  WHERE t.type = 'custom' AND t.category = 'overtime' AND t.is_active = true
  ORDER BY random() LIMIT 1
)
WHERE sr.date = CURRENT_DATE
  AND sr.is_overtime = true
  AND sr.user_id IN (SELECT id FROM users WHERE phone_number LIKE '13900200%')
  AND sr.tag_id IN (SELECT id FROM tags WHERE category = 'ontime');

UPDATE status_records sr SET tag_id = (
  SELECT t.id FROM tags t
  WHERE t.type = 'custom' AND t.category = 'ontime' AND t.is_active = true
  ORDER BY random() LIMIT 1
)
WHERE sr.date = CURRENT_DATE
  AND sr.is_overtime = false
  AND sr.user_id IN (SELECT id FROM users WHERE phone_number LIKE '13900200%')
  AND sr.tag_id IN (SELECT id FROM tags WHERE category = 'overtime');

-- 验证结果
SELECT
  COUNT(*) AS "今日测试用户状态总数",
  COUNT(*) FILTER (WHERE is_overtime = true) AS "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false) AS "准点人数"
FROM status_records
WHERE date = CURRENT_DATE
  AND user_id IN (SELECT id FROM users WHERE phone_number LIKE '13900200%');

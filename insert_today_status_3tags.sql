-- ============================================
-- 为 500 个测试用户插入今日状态，每人3个随机标签
-- 约束：unique(user_id, date, tag_id)
-- 加班用户 → 3个 overtime 标签
-- 准时用户 → 3个 ontime 标签
-- ============================================

-- 第一步：清理今天已有的测试用户状态
DELETE FROM public.status_records
WHERE date = CURRENT_DATE
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

-- 第二步：生成每人的 is_overtime 决策，存入临时表
CREATE TEMP TABLE tmp_user_status AS
SELECT
  u.id AS user_id,
  CASE
    WHEN extract(dow FROM CURRENT_DATE) IN (0, 6)
    THEN (random() < 0.30)
    ELSE (random() < 0.55)
  END AS is_overtime,
  -- 提交时间：北京时间 17:00~23:59，转 UTC 存储
  (
    CURRENT_DATE::timestamp
    + make_interval(
        hours => (17 + floor(random() * 7))::int,
        mins  => floor(random() * 60)::int
      )
    - interval '8 hours'
  )::timestamptz AS submitted_at
FROM public.users u
WHERE u.phone_number ~ '^13900[0-9]{6}$'
  AND u.phone_number::bigint BETWEEN 13900000001 AND 13900000500;

-- 第三步：为加班用户插入3个随机 overtime 标签（不重复）
INSERT INTO public.status_records (id, user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
SELECT
  gen_random_uuid(),
  us.user_id,
  CURRENT_DATE,
  true,
  t.id AS tag_id,
  (1 + floor(random() * 5))::int AS overtime_hours,
  us.submitted_at
FROM tmp_user_status us
-- 用 LATERAL 为每个用户随机取3个不重复的 overtime 标签
CROSS JOIN LATERAL (
  SELECT id FROM public.tags
  WHERE type = 'custom' AND category = 'overtime' AND is_active = true
  ORDER BY random()
  LIMIT 3
) t
WHERE us.is_overtime = true
ON CONFLICT (user_id, date, tag_id) DO NOTHING;

-- 第四步：为准时用户插入3个随机 ontime 标签（不重复）
INSERT INTO public.status_records (id, user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
SELECT
  gen_random_uuid(),
  us.user_id,
  CURRENT_DATE,
  false,
  t.id AS tag_id,
  NULL AS overtime_hours,
  us.submitted_at
FROM tmp_user_status us
CROSS JOIN LATERAL (
  SELECT id FROM public.tags
  WHERE type = 'custom' AND category = 'ontime' AND is_active = true
  ORDER BY random()
  LIMIT 3
) t
WHERE us.is_overtime = false
ON CONFLICT (user_id, date, tag_id) DO NOTHING;

-- 清理临时表
DROP TABLE tmp_user_status;

-- 验证结果
SELECT
  COUNT(DISTINCT user_id)                                              AS "提交用户数",
  COUNT(*)                                                             AS "总记录数",
  COUNT(*) FILTER (WHERE is_overtime = true)                          AS "加班记录数",
  COUNT(*) FILTER (WHERE is_overtime = false)                         AS "准时记录数",
  COUNT(DISTINCT user_id) FILTER (WHERE is_overtime = true)           AS "加班人数",
  COUNT(DISTINCT user_id) FILTER (WHERE is_overtime = false)          AS "准时人数"
FROM public.status_records
WHERE date = CURRENT_DATE
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

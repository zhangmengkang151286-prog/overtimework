-- ============================================
-- 为 500 个测试用户插入今日随机状态
-- 手机号：13900000001 - 13900000500
-- 执行方式：DMS 或 ECS psql
-- ============================================

-- 第一步：清理今天已有的测试用户状态
DELETE FROM public.status_records
WHERE date = CURRENT_DATE
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

-- 第二步：插入今日状态（工作日加班概率55%，周末30%）
INSERT INTO public.status_records (id, user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
SELECT
  gen_random_uuid(),
  u.id,
  CURRENT_DATE,
  CASE
    WHEN extract(dow FROM CURRENT_DATE) IN (0, 6)
    THEN (random() < 0.30)
    ELSE (random() < 0.55)
  END AS is_overtime,
  (
    SELECT t.id FROM public.tags t
    WHERE t.type = 'custom' AND t.is_active = true
    ORDER BY random() LIMIT 1
  ) AS tag_id,
  (1 + floor(random() * 5))::int AS overtime_hours,
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
  AND u.phone_number::bigint BETWEEN 13900000001 AND 13900000500
ON CONFLICT (user_id, date) DO NOTHING;

-- 第三步：修正标签一致性（加班用户 → overtime 标签）
UPDATE public.status_records sr
SET tag_id = (
  SELECT t.id FROM public.tags t
  WHERE t.type = 'custom' AND t.category = 'overtime' AND t.is_active = true
  ORDER BY random() LIMIT 1
)
WHERE sr.date = CURRENT_DATE
  AND sr.is_overtime = true
  AND sr.user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  )
  AND sr.tag_id IN (SELECT id FROM public.tags WHERE category = 'ontime');

-- 第四步：修正标签一致性（准时用户 → ontime 标签）
UPDATE public.status_records sr
SET tag_id = (
  SELECT t.id FROM public.tags t
  WHERE t.type = 'custom' AND t.category = 'ontime' AND t.is_active = true
  ORDER BY random() LIMIT 1
)
WHERE sr.date = CURRENT_DATE
  AND sr.is_overtime = false
  AND sr.user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  )
  AND sr.tag_id IN (SELECT id FROM public.tags WHERE category = 'overtime');

-- 第五步：准时用户 overtime_hours 清空
UPDATE public.status_records
SET overtime_hours = NULL
WHERE date = CURRENT_DATE
  AND is_overtime = false
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

-- 验证结果
SELECT
  COUNT(*)                                           AS "总提交数",
  COUNT(*) FILTER (WHERE is_overtime = true)         AS "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false)        AS "准时人数",
  ROUND(
    COUNT(*) FILTER (WHERE is_overtime = true)::numeric / COUNT(*) * 100, 1
  )                                                  AS "加班比例%"
FROM public.status_records
WHERE date = CURRENT_DATE
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

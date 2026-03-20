-- ============================================
-- 为 500 个测试用户插入今日随机状态
-- 约束：unique(user_id, date, tag_id)，先删再插
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
-- 每人一条记录，tag 与 is_overtime 保持一致
INSERT INTO public.status_records (id, user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
SELECT
  gen_random_uuid(),
  u.id,
  CURRENT_DATE,
  -- 加班概率
  CASE
    WHEN extract(dow FROM CURRENT_DATE) IN (0, 6)
    THEN (random() < 0.30)
    ELSE (random() < 0.55)
  END AS is_overtime,
  -- 根据 is_overtime 选对应分类的标签（子查询用 lateral）
  NULL::uuid AS tag_id,
  NULL::int AS overtime_hours,
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

-- 第三步：更新 tag_id（加班用户 → overtime 标签）
UPDATE public.status_records sr
SET
  tag_id = (
    SELECT t.id FROM public.tags t
    WHERE t.type = 'custom' AND t.category = 'overtime' AND t.is_active = true
    ORDER BY random() LIMIT 1
  ),
  overtime_hours = (1 + floor(random() * 5))::int
WHERE sr.date = CURRENT_DATE
  AND sr.is_overtime = true
  AND sr.tag_id IS NULL
  AND sr.user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

-- 第四步：更新 tag_id（准时用户 → ontime 标签）
UPDATE public.status_records sr
SET tag_id = (
  SELECT t.id FROM public.tags t
  WHERE t.type = 'custom' AND t.category = 'ontime' AND t.is_active = true
  ORDER BY random() LIMIT 1
)
WHERE sr.date = CURRENT_DATE
  AND sr.is_overtime = false
  AND sr.tag_id IS NULL
  AND sr.user_id IN (
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
    COUNT(*) FILTER (WHERE is_overtime = true)::numeric
    / NULLIF(COUNT(*), 0) * 100, 1
  )                                                  AS "加班比例%"
FROM public.status_records
WHERE date = CURRENT_DATE
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

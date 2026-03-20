-- ============================================
-- 为 500 个测试用户生成今天的状态数据
-- 手机号模式：13900000001 - 13900000500
-- 今天日期：CURRENT_DATE（北京时间）
-- ============================================

-- 第一步：清理今天已有的测试用户状态（避免冲突）
DELETE FROM public.status_records
WHERE date = CURRENT_DATE
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

-- 第二步：插入今天的状态数据
-- 加班概率：今天是工作日约 55%，周末约 30%
INSERT INTO public.status_records (id, user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
SELECT
  gen_random_uuid(),
  u.id,
  CURRENT_DATE,
  -- 根据今天是否周末决定加班概率
  CASE
    WHEN extract(dow FROM CURRENT_DATE) IN (0, 6)
    THEN (random() < 0.30)
    ELSE (random() < 0.55)
  END AS is_overtime,
  -- 先随机选一个标签（后面再修正一致性）
  (
    SELECT t.id FROM public.tags t
    WHERE t.type = 'custom' AND t.is_active = true
    ORDER BY random() LIMIT 1
  ) AS tag_id,
  -- 加班时长暂时随机（后面修正）
  (1 + floor(random() * 5))::int AS overtime_hours,
  -- 提交时间：今天 17:00 ~ 23:59 北京时间随机
  (
    CURRENT_DATE::timestamp
    + make_interval(hours => (17 + floor(random() * 7))::int,
                    mins  => floor(random() * 60)::int)
    + interval '8 hours'  -- 转为 UTC 存储（北京时间 = UTC+8）
  )::timestamptz AS submitted_at
FROM public.users u
WHERE u.phone_number ~ '^13900[0-9]{6}$'
  AND u.phone_number::bigint BETWEEN 13900000001 AND 13900000500
ON CONFLICT (user_id, date) DO NOTHING;

-- 第三步：修正标签一致性
-- 加班用户 → overtime 标签
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
  AND sr.tag_id IN (
    SELECT id FROM public.tags WHERE category = 'ontime'
  );

-- 准时用户 → ontime 标签
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
  AND sr.tag_id IN (
    SELECT id FROM public.tags WHERE category = 'overtime'
  );

-- 第四步：修正加班时长一致性
-- 准时用户 overtime_hours 清零
UPDATE public.status_records
SET overtime_hours = NULL
WHERE date = CURRENT_DATE
  AND is_overtime = false
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

-- 第五步：验证结果
SELECT
  COUNT(*)                                          AS "今日状态总数",
  COUNT(*) FILTER (WHERE is_overtime = true)        AS "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false)       AS "准时人数",
  ROUND(
    COUNT(*) FILTER (WHERE is_overtime = true)::numeric
    / COUNT(*) * 100, 1
  )                                                 AS "加班比例%"
FROM public.status_records
WHERE date = CURRENT_DATE
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

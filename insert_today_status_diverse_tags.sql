-- ============================================
-- 为 500 个测试用户重新插入今日状态，确保标签真正随机分散
-- 策略：用 row_number + 随机偏移，保证每人3个不同标签，且500人之间标签分布均匀
-- ============================================

-- 清理今天已有的测试用户状态
DELETE FROM public.status_records
WHERE date = CURRENT_DATE
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

-- 第一步：为每个用户生成随机决策（加班/准时 + 提交时间）
CREATE TEMP TABLE tmp_user_status AS
SELECT
  u.id AS user_id,
  CASE
    WHEN extract(dow FROM CURRENT_DATE) IN (0, 6)
    THEN (random() < 0.30)
    ELSE (random() < 0.55)
  END AS is_overtime,
  -- 每个用户一个独立随机种子（用于后续标签偏移）
  floor(random() * 10000)::int AS rand_offset,
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

-- 第二步：给所有 overtime 标签编号
CREATE TEMP TABLE tmp_overtime_tags AS
SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn
FROM public.tags
WHERE type = 'custom' AND category = 'overtime' AND is_active = true;

-- 第三步：给所有 ontime 标签编号
CREATE TEMP TABLE tmp_ontime_tags AS
SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn
FROM public.tags
WHERE type = 'custom' AND category = 'ontime' AND is_active = true;

-- 第四步：为加班用户插入3个不同的 overtime 标签（用偏移量错开）
INSERT INTO public.status_records (id, user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
SELECT
  gen_random_uuid(),
  us.user_id,
  CURRENT_DATE,
  true,
  ot.id AS tag_id,
  (1 + floor(random() * 5))::int AS overtime_hours,
  us.submitted_at
FROM tmp_user_status us
-- 用 generate_series(0,2) 生成3个标签槽位
CROSS JOIN generate_series(0, 2) AS slot
-- 用 (rand_offset + slot) % total_count 取不同标签
JOIN tmp_overtime_tags ot
  ON ot.rn = (us.rand_offset + slot) % (SELECT COUNT(*) FROM tmp_overtime_tags)
WHERE us.is_overtime = true
ON CONFLICT (user_id, date, tag_id) DO NOTHING;

-- 第五步：为准时用户插入3个不同的 ontime 标签（用偏移量错开）
INSERT INTO public.status_records (id, user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
SELECT
  gen_random_uuid(),
  us.user_id,
  CURRENT_DATE,
  false,
  ot.id AS tag_id,
  NULL AS overtime_hours,
  us.submitted_at
FROM tmp_user_status us
CROSS JOIN generate_series(0, 2) AS slot
JOIN tmp_ontime_tags ot
  ON ot.rn = (us.rand_offset + slot) % (SELECT COUNT(*) FROM tmp_ontime_tags)
WHERE us.is_overtime = false
ON CONFLICT (user_id, date, tag_id) DO NOTHING;

-- 清理临时表
DROP TABLE tmp_user_status;
DROP TABLE tmp_overtime_tags;
DROP TABLE tmp_ontime_tags;

-- 验证结果
SELECT
  COUNT(DISTINCT user_id)                                    AS "提交用户数",
  COUNT(*)                                                   AS "总记录数",
  COUNT(DISTINCT tag_id)                                     AS "去重标签数",
  COUNT(DISTINCT tag_id) FILTER (WHERE is_overtime = true)   AS "加班标签种类",
  COUNT(DISTINCT tag_id) FILTER (WHERE is_overtime = false)  AS "准时标签种类",
  COUNT(DISTINCT user_id) FILTER (WHERE is_overtime = true)  AS "加班人数",
  COUNT(DISTINCT user_id) FILTER (WHERE is_overtime = false) AS "准时人数"
FROM public.status_records
WHERE date = CURRENT_DATE
  AND user_id IN (
    SELECT id FROM public.users
    WHERE phone_number ~ '^13900[0-9]{6}$'
      AND phone_number::bigint BETWEEN 13900000001 AND 13900000500
  );

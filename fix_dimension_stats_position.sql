-- ============================================
-- 修复 get_dimension_stats 函数 - 职位维度使用 position 字段
-- ============================================

DROP FUNCTION IF EXISTS get_dimension_stats();

CREATE OR REPLACE FUNCTION get_dimension_stats()
RETURNS TABLE (
  dimension TEXT,
  id TEXT,
  name TEXT,
  overtime_count BIGINT,
  on_time_count BIGINT
) AS $func$
DECLARE
  v_work_date DATE;
BEGIN
  -- 计算当前工作日（北京时间 06:00 - 次日 05:59）
  v_work_date := get_work_date(NOW());

  -- 按用户去重：同一用户同一天可能有多条记录，取最新一条
  RETURN QUERY
  WITH latest_records AS (
    SELECT DISTINCT ON (sr.user_id)
      sr.user_id,
      sr.is_overtime
    FROM status_records sr
    WHERE sr.date = v_work_date
    ORDER BY sr.user_id, sr.submitted_at DESC
  ),
  -- 关联用户信息
  user_status AS (
    SELECT
      lr.user_id,
      lr.is_overtime,
      u.industry,
      u.position,  -- 修改：使用 position 而不是 position_category
      u.province,
      u.birth_year
    FROM latest_records lr
    INNER JOIN users u ON u.id = lr.user_id
  ),
  -- 行业维度聚合
  industry_stats AS (
    SELECT
      'industry'::TEXT AS dim,
      COALESCE(us.industry, '未知')::TEXT AS dim_id,
      COALESCE(us.industry, '未知')::TEXT AS dim_name,
      SUM(CASE WHEN us.is_overtime THEN 1 ELSE 0 END)::BIGINT AS ot_count,
      SUM(CASE WHEN NOT us.is_overtime THEN 1 ELSE 0 END)::BIGINT AS ont_count
    FROM user_status us
    WHERE us.industry IS NOT NULL AND us.industry != ''
    GROUP BY us.industry
  ),
  -- 职位维度聚合（修改：使用 position）
  position_stats AS (
    SELECT
      'position'::TEXT AS dim,
      COALESCE(us.position, '未知')::TEXT AS dim_id,
      COALESCE(us.position, '未知')::TEXT AS dim_name,
      SUM(CASE WHEN us.is_overtime THEN 1 ELSE 0 END)::BIGINT AS ot_count,
      SUM(CASE WHEN NOT us.is_overtime THEN 1 ELSE 0 END)::BIGINT AS ont_count
    FROM user_status us
    WHERE us.position IS NOT NULL AND us.position != ''
    GROUP BY us.position
  ),
  -- 省份维度聚合
  province_stats AS (
    SELECT
      'province'::TEXT AS dim,
      COALESCE(us.province, '未知')::TEXT AS dim_id,
      COALESCE(us.province, '未知')::TEXT AS dim_name,
      SUM(CASE WHEN us.is_overtime THEN 1 ELSE 0 END)::BIGINT AS ot_count,
      SUM(CASE WHEN NOT us.is_overtime THEN 1 ELSE 0 END)::BIGINT AS ont_count
    FROM user_status us
    WHERE us.province IS NOT NULL AND us.province != ''
    GROUP BY us.province
  ),
  -- 年龄维度聚合
  age_stats AS (
    SELECT
      'age'::TEXT AS dim,
      sub.age_group::TEXT AS dim_id,
      sub.age_group::TEXT AS dim_name,
      SUM(CASE WHEN sub.is_overtime THEN 1 ELSE 0 END)::BIGINT AS ot_count,
      SUM(CASE WHEN NOT sub.is_overtime THEN 1 ELSE 0 END)::BIGINT AS ont_count
    FROM (
      SELECT
        us.is_overtime,
        CASE
          WHEN us.birth_year >= 2010 THEN '10后及以后'
          WHEN us.birth_year >= 2000 THEN '00后'
          WHEN us.birth_year >= 1995 THEN '95后'
          WHEN us.birth_year >= 1990 THEN '90后'
          WHEN us.birth_year >= 1985 THEN '85后'
          WHEN us.birth_year >= 1980 THEN '80后'
          WHEN us.birth_year >= 1975 THEN '75后'
          ELSE '70后及以前'
        END AS age_group
      FROM user_status us
      WHERE us.birth_year IS NOT NULL
    ) sub
    GROUP BY sub.age_group
  )
  -- 合并所有维度
  SELECT i.dim, i.dim_id, i.dim_name, i.ot_count, i.ont_count FROM industry_stats i
  UNION ALL
  SELECT p.dim, p.dim_id, p.dim_name, p.ot_count, p.ont_count FROM position_stats p
  UNION ALL
  SELECT pr.dim, pr.dim_id, pr.dim_name, pr.ot_count, pr.ont_count FROM province_stats pr
  UNION ALL
  SELECT a.dim, a.dim_id, a.dim_name, a.ot_count, a.ont_count FROM age_stats a;
END;
$func$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_dimension_stats() IS '获取多维度统计数据（行业、职位、省份、年龄），基于当前工作日的 status_records 关联 users 表';

-- 测试函数
SELECT * FROM get_dimension_stats() WHERE dimension = 'position';

-- 验证各维度数据
SELECT
  dimension AS "维度",
  COUNT(*) AS "分组数",
  SUM(overtime_count + on_time_count) AS "总人数"
FROM get_dimension_stats()
GROUP BY dimension
ORDER BY dimension;

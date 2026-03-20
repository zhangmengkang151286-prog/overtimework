-- 修复 get_dimension_stats 函数中的年龄段分组
-- 从旧格式（80后、90后）改为新格式（≤18, 19~23, 24~28, ...）
-- 基于当前年份动态计算年龄

DROP FUNCTION IF EXISTS get_dimension_stats();

CREATE OR REPLACE FUNCTION get_dimension_stats()
RETURNS TABLE(
  dimension TEXT,
  dimension_id TEXT,
  dimension_name TEXT,
  overtime_count BIGINT,
  ontime_count BIGINT
) LANGUAGE plpgsql AS $$
DECLARE
  v_work_date DATE;
  v_current_year INT;
BEGIN
  v_work_date := get_work_date(NOW());
  v_current_year := EXTRACT(YEAR FROM NOW())::INT;

  RETURN QUERY
  WITH latest_records AS (
    SELECT DISTINCT ON (sr.user_id)
      sr.user_id,
      sr.is_overtime
    FROM status_records sr
    WHERE sr.date = v_work_date
    ORDER BY sr.user_id, sr.submitted_at DESC
  ),
  user_status AS (
    SELECT
      lr.user_id,
      lr.is_overtime,
      u.industry,
      u.position,
      u.province,
      u.birth_year
    FROM latest_records lr
    INNER JOIN users u ON u.id = lr.user_id
  ),
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
  -- 年龄维度：基于当前年份动态计算年龄，使用新的年龄段格式
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
          WHEN (v_current_year - us.birth_year) <= 18 THEN '≤18'
          WHEN (v_current_year - us.birth_year) <= 23 THEN '19~23'
          WHEN (v_current_year - us.birth_year) <= 28 THEN '24~28'
          WHEN (v_current_year - us.birth_year) <= 33 THEN '29~33'
          WHEN (v_current_year - us.birth_year) <= 38 THEN '34~38'
          WHEN (v_current_year - us.birth_year) <= 43 THEN '39~43'
          WHEN (v_current_year - us.birth_year) <= 48 THEN '44~48'
          WHEN (v_current_year - us.birth_year) <= 53 THEN '49~53'
          WHEN (v_current_year - us.birth_year) <= 58 THEN '54~58'
          WHEN (v_current_year - us.birth_year) <= 63 THEN '59~63'
          ELSE '≥64'
        END AS age_group
      FROM user_status us
      WHERE us.birth_year IS NOT NULL
    ) sub
    GROUP BY sub.age_group
  )
  SELECT i.dim, i.dim_id, i.dim_name, i.ot_count, i.ont_count FROM industry_stats i
  UNION ALL
  SELECT p.dim, p.dim_id, p.dim_name, p.ot_count, p.ont_count FROM position_stats p
  UNION ALL
  SELECT pr.dim, pr.dim_id, pr.dim_name, pr.ot_count, pr.ont_count FROM province_stats pr
  UNION ALL
  SELECT a.dim, a.dim_id, a.dim_name, a.ot_count, a.ont_count FROM age_stats a;
END;
$$;

-- 验证
SELECT * FROM get_dimension_stats() WHERE dimension = 'age';

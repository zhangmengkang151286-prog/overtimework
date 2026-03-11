-- ============================================
-- 修复实时统计：改为直接查询 status_records
-- ============================================
-- 问题：get_real_time_stats() 仍在读取物化视图，
--       物化视图没有自动刷新，导致返回 0
-- 修复：改为直接查询 status_records 表
-- 执行位置：Supabase SQL Editor
-- ============================================

-- 1. 修复 get_real_time_stats 函数
CREATE OR REPLACE FUNCTION get_real_time_stats()
RETURNS TABLE (
  participant_count BIGINT,
  overtime_count BIGINT,
  on_time_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT sr.user_id)::BIGINT as participant_count,
    COUNT(DISTINCT CASE WHEN sr.is_overtime THEN sr.user_id END)::BIGINT as overtime_count,
    COUNT(DISTINCT CASE WHEN NOT sr.is_overtime THEN sr.user_id END)::BIGINT as on_time_count,
    COALESCE(MAX(sr.submitted_at), NOW()) as last_updated
  FROM status_records sr
  WHERE sr.date = get_work_date(NOW());
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. 修复 get_top_tags 函数
CREATE OR REPLACE FUNCTION get_top_tags(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  tag_id UUID,
  tag_name VARCHAR,
  overtime_count BIGINT,
  on_time_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.tag_id,
    t.name as tag_name,
    SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END)::BIGINT as overtime_count,
    SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END)::BIGINT as on_time_count,
    COUNT(*)::BIGINT as total_count
  FROM status_records sr
  JOIN tags t ON sr.tag_id = t.id
  WHERE sr.date = get_work_date(NOW())
  GROUP BY sr.tag_id, t.name
  ORDER BY total_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 3. 验证修复结果
SELECT '修复后实时统计' as info, * FROM get_real_time_stats();
SELECT '修复后标签排行' as info, * FROM get_top_tags(10);

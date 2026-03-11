-- 修复 get_real_time_stats 函数
-- 问题：函数可能还在使用旧的 COUNT(DISTINCT user_id) 逻辑

-- 1. 查看当前函数定义
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'get_real_time_stats';

-- 2. 删除旧函数
DROP FUNCTION IF EXISTS get_real_time_stats();

-- 3. 重新创建函数，使用 COUNT(*) 而不是 COUNT(DISTINCT user_id)
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
    COUNT(*)::BIGINT as participant_count,  -- 使用 COUNT(*) 计算所有记录
    SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END)::BIGINT as overtime_count,
    SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)::BIGINT as on_time_count,
    MAX(submitted_at) as last_updated
  FROM status_records
  WHERE date = CURRENT_DATE;
  
  -- 如果没有数据，返回 0
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 测试新函数
SELECT * FROM get_real_time_stats();

-- 5. 验证结果
SELECT 
  'Direct query' as source,
  COUNT(*) as participant_count
FROM status_records
WHERE date = CURRENT_DATE
UNION ALL
SELECT 
  'Function result' as source,
  participant_count
FROM get_real_time_stats();

-- 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✓ get_real_time_stats() 函数已修复';
  RAISE NOTICE '  - 现在使用 COUNT(*) 而不是 COUNT(DISTINCT user_id)';
  RAISE NOTICE '  - 函数应该返回正确的参与人数';
  RAISE NOTICE '';
END $$;

-- 检查 realtime_cache 表是否存在以及是否有数据
-- 这可能是导致 App 显示错误数据的原因

-- 1. 检查 realtime_cache 表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'realtime_cache'
) as table_exists;

-- 2. 如果表存在，查看今天的数据
SELECT * FROM realtime_cache 
WHERE date = CURRENT_DATE
ORDER BY last_updated DESC;

-- 3. 查看 get_real_time_stats 函数的定义
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_real_time_stats';

-- 4. 测试调用 get_real_time_stats() 函数
SELECT * FROM get_real_time_stats();

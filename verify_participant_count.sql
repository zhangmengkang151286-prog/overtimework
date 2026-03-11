-- 验证参与人数修复是否生效

-- 1. 检查物化视图是否存在并使用了正确的定义
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE matviewname = 'real_time_stats';

-- 2. 查看今日所有提交记录
SELECT 
  id,
  user_id,
  date,
  is_overtime,
  tag_id,
  submitted_at
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY submitted_at DESC;

-- 3. 查看今日提交统计
SELECT 
  COUNT(*) as total_submissions,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count
FROM status_records
WHERE date = CURRENT_DATE;

-- 4. 手动刷新物化视图
REFRESH MATERIALIZED VIEW real_time_stats;

-- 5. 查看物化视图的当前数据
SELECT * FROM real_time_stats WHERE date = CURRENT_DATE;

-- 6. 测试 get_real_time_stats 函数
SELECT * FROM get_real_time_stats();

-- 7. 如果上面的结果显示 participant_count 还是用的 COUNT(DISTINCT user_id)
-- 说明视图没有正确更新，需要强制重建
DROP MATERIALIZED VIEW IF EXISTS real_time_stats CASCADE;

CREATE MATERIALIZED VIEW real_time_stats AS
SELECT 
  date,
  COUNT(*) as participant_count,  -- 使用 COUNT(*) 而不是 COUNT(DISTINCT user_id)
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count,
  MAX(submitted_at) as last_updated
FROM status_records
WHERE date = CURRENT_DATE
GROUP BY date;

CREATE UNIQUE INDEX real_time_stats_date_idx ON real_time_stats (date);

REFRESH MATERIALIZED VIEW real_time_stats;

-- 8. 再次验证
SELECT 
  'status_records' as source,
  COUNT(*) as count
FROM status_records
WHERE date = CURRENT_DATE
UNION ALL
SELECT 
  'real_time_stats' as source,
  participant_count as count
FROM real_time_stats
WHERE date = CURRENT_DATE;

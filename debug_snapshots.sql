-- ============================================
-- 调试快照功能
-- ============================================

-- 1. 检查 status_records 表是否有 submitted_at 字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'status_records' 
  AND column_name = 'submitted_at';

-- 2. 查看今天的提交记录（带时间戳）
SELECT 
  id,
  user_id,
  date,
  is_overtime,
  TO_CHAR(submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_at,
  (SELECT name FROM tags WHERE id = tag_id) as tag_name
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY submitted_at;

-- 3. 查看 hourly_snapshots 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hourly_snapshots'
ORDER BY ordinal_position;

-- 4. 查看今天的快照数据
SELECT 
  snapshot_date,
  snapshot_hour,
  TO_CHAR(snapshot_time, 'YYYY-MM-DD HH24:MI:SS') as snapshot_time,
  participant_count,
  overtime_count,
  on_time_count,
  tag_distribution
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

-- 5. 手动测试累计统计（截止到 10:00）
SELECT 
  COUNT(DISTINCT user_id) as participants,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '10 hours';

-- 6. 手动测试累计统计（截止到 14:00）
SELECT 
  COUNT(DISTINCT user_id) as participants,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '14 hours';

-- 7. 手动测试累计统计（截止到 18:00）
SELECT 
  COUNT(DISTINCT user_id) as participants,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '18 hours';

-- 8. 检查 save_hourly_snapshot 函数是否存在
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'save_hourly_snapshot';

-- ============================================
-- 说明
-- ============================================
-- 执行这个脚本来诊断问题：
-- 1. 检查字段是否存在
-- 2. 查看数据是否正确
-- 3. 查看快照是否生成
-- 4. 手动测试累计统计逻辑

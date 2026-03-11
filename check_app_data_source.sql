-- 诊断 App 数据来源问题
-- 检查所有可能影响 App 显示的数据源

-- 1. 检查今天的 status_records（应该只有9条）
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(submitted_at) as first_submission,
  MAX(submitted_at) as last_submission
FROM status_records
WHERE date = CURRENT_DATE;

-- 2. 检查今天的 hourly_snapshots（应该有15条：8-22点）
SELECT 
  COUNT(*) as total_snapshots,
  MIN(snapshot_hour) as min_hour,
  MAX(snapshot_hour) as max_hour
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE;

-- 3. 检查 6 点的快照（用户说显示9个人）
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count,
  tag_distribution
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
AND snapshot_hour = 6;

-- 4. 检查 13 点的快照（用户说显示1个人，标签为0）
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count,
  tag_distribution
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
AND snapshot_hour = 13;

-- 5. 检查 8 点的快照（第一个快照）
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count,
  tag_distribution
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
AND snapshot_hour = 8;

-- 6. 检查所有快照的标签分布是否正确
SELECT 
  snapshot_hour,
  participant_count,
  jsonb_array_length(tag_distribution) as tag_count,
  tag_distribution
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

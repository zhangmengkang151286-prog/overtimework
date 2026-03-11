-- 诊断标签分布问题

-- 1. 检查 13 点快照的标签分布
SELECT 
  snapshot_hour,
  tag_distribution
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
AND snapshot_hour = 13;

-- 2. 手动计算 13 点应该有的标签分布
SELECT 
  t.name as tag_name,
  SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END) as on_time_count,
  COUNT(*) as total_count
FROM status_records sr
JOIN tags t ON sr.tag_id = t.id
WHERE sr.date = CURRENT_DATE
AND sr.submitted_at <= (CURRENT_DATE + INTERVAL '13 hours')
GROUP BY t.name
ORDER BY total_count DESC;

-- 3. 检查所有快照的标签数量
SELECT 
  snapshot_hour,
  jsonb_array_length(tag_distribution) as tag_count,
  tag_distribution
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

-- 4. 检查 tags 表是否有活跃的标签
SELECT id, name, type, is_active
FROM tags
WHERE is_active = true
ORDER BY na
-- 简化的标签检查

-- 1. 查看 13 点快照的标签数量
SELECT 
  snapshot_hour,
  jsonb_array_length(tag_distribution) as tag_count
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
AND snapshot_hour = 13;

-- 2. 手动计算 13 点应该有的标签（只看标签名和数量）
SELECT 
  t.name as tag_name,
  COUNT(*) as total_count
FROM status_records sr
JOIN tags t ON sr.tag_id = t.id
WHERE sr.date = CURRENT_DATE
AND sr.submitted_at <= (CURRENT_DATE + INTERVAL '13 hours')
GROUP BY t.name
ORDER BY total_count DESC;

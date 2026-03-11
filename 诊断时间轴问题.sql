-- 诊断时间轴日期问题
-- 查看今天的快照数据

SELECT 
  snapshot_date,
  snapshot_hour,
  snapshot_time,
  participant_count,
  overtime_count,
  on_time_count
FROM hourly_snapshots
WHERE snapshot_date >= CURRENT_DATE - INTERVAL '2 days'
ORDER BY snapshot_date DESC, snapshot_hour DESC;

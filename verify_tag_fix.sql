-- 验证标签分布修复结果
-- 执行 fix_tag_distribution_in_snapshots.sql 后运行此脚本

-- 1. 查看每个小时的标签数量
SELECT 
  snapshot_hour as "时间",
  participant_count as "参与人数",
  overtime_count as "加班次数",
  on_time_count as "准时次数",
  jsonb_array_length(tag_distribution) as "标签数量",
  tag_distribution as "标签详情"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

-- 2. 查看具体的标签分布（只显示有数据的时间点）
SELECT 
  snapshot_hour as "时间",
  jsonb_pretty(tag_distribution) as "标签分布"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
AND jsonb_array_length(tag_distribution) > 0
ORDER BY snapshot_hour;

-- 3. 验证关键时间点
-- 8点应该有1个标签（开会）
-- 10点应该有2个标签（开会、写代码）
-- 14点应该有3个标签（开会、写代码、调试）
SELECT 
  snapshot_hour as "时间",
  jsonb_array_length(tag_distribution) as "标签数量",
  CASE 
    WHEN snapshot_hour = 8 AND jsonb_array_length(tag_distribution) = 1 THEN '✅ 正确'
    WHEN snapshot_hour = 10 AND jsonb_array_length(tag_distribution) = 2 THEN '✅ 正确'
    WHEN snapshot_hour = 14 AND jsonb_array_length(tag_distribution) = 3 THEN '✅ 正确'
    WHEN snapshot_hour IN (6, 7) AND jsonb_array_length(tag_distribution) = 0 THEN '✅ 正确'
    ELSE '❌ 错误'
  END as "验证结果"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
AND snapshot_hour IN (6, 7, 8, 10, 14)
ORDER BY snapshot_hour;

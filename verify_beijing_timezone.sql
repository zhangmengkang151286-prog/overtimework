-- ============================================
-- 验证北京时区配置
-- ============================================

-- 1. 查看当前时间（UTC 和北京时间）
SELECT 
  NOW() as "当前UTC时间",
  timezone('Asia/Shanghai', NOW()) as "当前北京时间",
  EXTRACT(HOUR FROM timezone('Asia/Shanghai', NOW()))::INTEGER as "北京时间小时";

-- 2. 手动触发快照
SELECT save_hourly_snapshot();

-- 3. 查看最新快照（应该显示北京时间）
SELECT 
  snapshot_hour as "时间（北京）",
  TO_CHAR(snapshot_time, 'YYYY-MM-DD HH24:MI:SS') as "快照时间",
  EXTRACT(HOUR FROM snapshot_time)::INTEGER as "快照小时数",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准时",
  jsonb_array_length(tag_distribution) as "标签数"
FROM hourly_snapshots
WHERE snapshot_date = timezone('Asia/Shanghai', NOW())::DATE
ORDER BY snapshot_hour DESC
LIMIT 3;

-- 4. 验证时区一致性
-- snapshot_hour 应该等于 EXTRACT(HOUR FROM snapshot_time)
SELECT 
  snapshot_hour,
  EXTRACT(HOUR FROM snapshot_time)::INTEGER as actual_hour,
  CASE 
    WHEN snapshot_hour = EXTRACT(HOUR FROM snapshot_time)::INTEGER 
    THEN '✅ 一致' 
    ELSE '❌ 不一致' 
  END as "验证结果"
FROM hourly_snapshots
WHERE snapshot_date = timezone('Asia/Shanghai', NOW())::DATE
ORDER BY snapshot_hour DESC
LIMIT 5;

-- ============================================
-- 预期结果
-- ============================================
-- 1. "当前北京时间" 应该比 "当前UTC时间" 多 8 小时
-- 2. "时间（北京）" 应该等于 "快照小时数"
-- 3. "验证结果" 应该全部显示 "✅ 一致"

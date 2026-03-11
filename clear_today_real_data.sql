-- ============================================
-- 清理今天的真实数据
-- 用于测试时间轴功能，只保留测试快照数据
-- ============================================

-- 1. 查看今天有多少条真实数据
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count
FROM status_records
WHERE date = CURRENT_DATE;

-- 2. 查看这些数据的详情
SELECT 
  id,
  user_id,
  is_overtime,
  tag_id,
  date
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY id;

-- 3. 删除今天的所有真实数据
-- ⚠️ 注意：这会删除今天所有的 status_records 记录
DELETE FROM status_records WHERE date = CURRENT_DATE;

-- 4. 验证删除结果
SELECT COUNT(*) as remaining_records 
FROM status_records 
WHERE date = CURRENT_DATE;

-- 5. 现在实时统计应该显示 0
-- 你可以在应用中点击"现在"按钮，应该看到参与人数为 0

-- 6. 但是历史快照数据仍然存在
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

-- ============================================
-- 说明
-- ============================================
-- 执行此脚本后：
-- 1. 点击"现在"：显示 0 人（因为今天没有真实数据）
-- 2. 拖动到历史时间点：显示测试数据（5人、12人、25人...）
-- 
-- 这样可以清楚地看到时间轴功能的效果：
-- - 当前时间 = 实时数据（0人）
-- - 历史时间 = 快照数据（测试数据）

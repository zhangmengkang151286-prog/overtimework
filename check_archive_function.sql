-- ============================================
-- 检查 archive_daily_data 函数定义
-- ============================================

-- 查看函数定义
SELECT 
  proname as "函数名",
  pg_get_functiondef(oid) as "函数定义"
FROM pg_proc
WHERE proname = 'archive_daily_data';

-- ============================================
-- 手动测试归档逻辑
-- ============================================

-- 模拟归档函数的逻辑，看看会得到什么结果
WITH archive_data AS (
  SELECT 
    '2026-02-06'::DATE as target_date,
    COUNT(DISTINCT user_id) as participant_count,
    COUNT(*) FILTER (WHERE is_overtime = true) as overtime_count,
    COUNT(*) FILTER (WHERE is_overtime = false) as on_time_count
  FROM status_records
  WHERE date = '2026-02-06'
)
SELECT 
  target_date as "归档日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数",
  CASE 
    WHEN overtime_count > on_time_count THEN '🔴 红色'
    WHEN overtime_count < on_time_count THEN '🟢 绿色'
    ELSE '🟡 黄色'
  END as "应该显示的颜色"
FROM archive_data;

-- ============================================
-- 说明
-- ============================================
-- 
-- 这个脚本会：
-- 1. 显示 archive_daily_data 函数的完整定义
-- 2. 手动模拟归档逻辑，看看应该得到什么结果
-- 
-- 对比手动计算的结果和实际归档的结果：
-- - 如果一致 → 归档函数正常，可能是数据问题
-- - 如果不一致 → 归档函数有 bug，需要修复

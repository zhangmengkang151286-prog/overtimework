-- ============================================
-- 诊断2月5号每日状态数据（简化版）
-- ============================================

-- 1. 检查 daily_history 表中最近7天的数据
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数",
  CASE 
    WHEN overtime_count > on_time_count THEN '🔴 红色'
    WHEN overtime_count < on_time_count THEN '🟢 绿色'
    ELSE '🟡 黄色'
  END as "圆点颜色",
  TO_CHAR(created_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "创建时间（北京）"
FROM daily_history
WHERE date >= '2026-01-30' AND date <= '2026-02-06'
ORDER BY date DESC;

-- 2. 检查 status_records 表中最近7天的原始数据
SELECT 
  date as "日期",
  COUNT(DISTINCT user_id) as "参与人数",
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as "加班人数",
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as "准点人数",
  MIN(TO_CHAR(submitted_at AT TIME ZONE 'Asia/Shanghai', 'HH24:MI:SS')) as "最早提交",
  MAX(TO_CHAR(submitted_at AT TIME ZONE 'Asia/Shanghai', 'HH24:MI:SS')) as "最晚提交"
FROM status_records
WHERE date >= '2026-01-30' AND date <= '2026-02-06'
GROUP BY date
ORDER BY date DESC;

-- ============================================
-- 说明
-- ============================================
-- 
-- 对比两个查询结果：
-- 
-- 如果 daily_history 表中缺少某天的数据，
-- 但 status_records 表中有该天的数据，
-- 说明归档任务没有执行或执行失败
-- 
-- 解决方案：执行 fix_feb5_daily_archive.sql

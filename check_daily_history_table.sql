-- ============================================
-- 检查 daily_history 表中的数据
-- ============================================

-- 这是 APP 7个圆点实际读取的表
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

-- ============================================
-- 说明
-- ============================================
-- 
-- 如果这个查询结果中**没有 2月5日**的数据，
-- 说明归档任务没有执行成功。
-- 
-- 你刚才给我的诊断结果是 status_records 表（原始数据），
-- 不是 daily_history 表（归档数据）。
-- 
-- APP 读取的是 daily_history 表，所以看不到 2月5日的数据。

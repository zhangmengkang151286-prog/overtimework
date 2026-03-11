-- ============================================
-- 修复2月5号每日归档数据
-- ============================================

-- 手动执行归档函数，生成2月5号的数据
SELECT archive_daily_data('2026-02-05'::DATE);

-- 验证2月5号的数据是否已生成
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数",
  CASE 
    WHEN overtime_count > on_time_count THEN '🔴 红色（加班多）'
    WHEN overtime_count < on_time_count THEN '🟢 绿色（准点多）'
    ELSE '🟡 黄色（相等）'
  END as "圆点颜色",
  TO_CHAR(created_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "创建时间（北京）"
FROM daily_history
WHERE date >= '2026-02-01' AND date <= '2026-02-06'
ORDER BY date DESC;

-- ============================================
-- 说明
-- ============================================
-- 
-- 这个脚本会：
-- 1. 调用 archive_daily_data() 函数生成2月5号的归档数据
-- 2. 验证数据是否正确生成
-- 3. 显示圆点应该是什么颜色
-- 
-- 执行后，7个圆点应该能正确显示2月5号的数据

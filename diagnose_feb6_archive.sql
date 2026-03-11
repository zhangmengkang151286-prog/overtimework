-- ============================================
-- 诊断 2月6日 归档数据问题
-- ============================================

-- 第1步：查看 status_records 表中 2月6日的原始数据
SELECT 
  '原始数据 (status_records)' as "数据来源",
  date as "日期",
  COUNT(DISTINCT user_id) as "参与人数",
  COUNT(*) FILTER (WHERE is_overtime = true) as "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false) as "准点人数",
  MIN(submitted_at AT TIME ZONE 'Asia/Shanghai') as "最早提交时间",
  MAX(submitted_at AT TIME ZONE 'Asia/Shanghai') as "最晚提交时间"
FROM status_records
WHERE date = '2026-02-06'
GROUP BY date;

-- 第2步：查看 daily_history 表中 2月6日的归档数据
SELECT 
  '归档数据 (daily_history)' as "数据来源",
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
WHERE date = '2026-02-06';

-- 第3步：查看 2月6日 每个用户的提交记录
SELECT 
  user_id as "用户ID",
  date as "日期",
  is_overtime as "是否加班",
  TO_CHAR(submitted_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "提交时间（北京）"
FROM status_records
WHERE date = '2026-02-06'
ORDER BY submitted_at;

-- 第4步：检查是否有重复的归档记录
SELECT 
  date as "日期",
  COUNT(*) as "记录数量",
  STRING_AGG(
    TO_CHAR(created_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS'),
    ', '
  ) as "创建时间列表"
FROM daily_history
WHERE date = '2026-02-06'
GROUP BY date;

-- ============================================
-- 说明
-- ============================================
-- 
-- 这个脚本会帮你诊断：
-- 1. 原始数据是否正确（status_records 表）
-- 2. 归档数据是否正确（daily_history 表）
-- 3. 每个用户的具体提交情况
-- 4. 是否有重复归档的问题
-- 
-- 对比第1步和第2步的结果：
-- - 如果参与人数不一致 → 归档函数有问题
-- - 如果加班/准点人数不一致 → 归档逻辑有问题
-- - 如果第4步显示多条记录 → 重复归档了

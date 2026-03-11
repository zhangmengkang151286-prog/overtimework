-- 调试2月4日（昨天）的数据问题

-- 1. 检查 status_records 表中2月4日的原始数据
SELECT 
  date as "日期",
  COUNT(*) as "提交次数",
  COUNT(DISTINCT user_id) as "参与人数",
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as "加班人数",
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as "准点人数"
FROM status_records
WHERE date = '2024-02-04'
GROUP BY date;

-- 2. 检查 daily_history 表中2月4日的归档数据
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  created_at as "创建时间"
FROM daily_history
WHERE date = '2024-02-04';

-- 3. 调用 get_daily_status 函数查看最近7天的数据
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  is_overtime_dominant as "加班占优"
FROM get_daily_status(7)
ORDER BY date DESC;

-- 4. 检查最近7天的所有数据（包括今天）
SELECT 
  date as "日期",
  COUNT(*) as "提交次数",
  COUNT(DISTINCT user_id) as "参与人数",
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as "加班人数",
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as "准点人数"
FROM status_records
WHERE date >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY date
ORDER BY date DESC;

-- 5. 检查 get_daily_status 函数的定义
-- 查看函数是如何处理数据的
SELECT 
  routine_name as "函数名",
  routine_definition as "函数定义"
FROM information_schema.routines
WHERE routine_name = 'get_daily_status'
  AND routine_schema = 'public';

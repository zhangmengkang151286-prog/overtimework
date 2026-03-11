-- ============================================
-- 诊断2月5号每日状态数据
-- ============================================

-- 1. 检查 daily_history 表中2月5号的数据
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数",
  TO_CHAR(created_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "创建时间（北京）"
FROM daily_history
WHERE date >= '2026-02-01' AND date <= '2026-02-06'
ORDER BY date DESC;

-- 2. 检查 status_records 表中2月5号的原始数据
SELECT 
  date as "日期",
  COUNT(DISTINCT user_id) as "参与人数",
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as "加班人数",
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as "准点人数",
  MIN(TO_CHAR(submitted_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS')) as "最早提交时间",
  MAX(TO_CHAR(submitted_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS')) as "最晚提交时间"
FROM status_records
WHERE date >= '2026-02-01' AND date <= '2026-02-06'
GROUP BY date
ORDER BY date DESC;

-- 3. 检查 GitHub Actions 每日归档任务的执行情况
-- 查看 cron.job 表
SELECT 
  jobid as "任务ID",
  jobname as "任务名称",
  schedule as "执行计划",
  active as "是否激活"
FROM cron.job
WHERE jobname LIKE '%daily%' OR jobname LIKE '%archive%';

-- 4. 查看最近的归档任务执行记录
SELECT 
  jobname as "任务名称",
  start_time AT TIME ZONE 'Asia/Shanghai' as "执行时间（北京）",
  status as "状态",
  return_message as "返回信息"
FROM cron.job_run_details 
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE '%daily%' OR jobname LIKE '%archive%')
ORDER BY start_time DESC
LIMIT 10;

-- ============================================
-- 说明
-- ============================================
-- 
-- 如果 daily_history 表中没有2月5号的数据，说明：
-- 1. GitHub Actions 每日归档任务可能没有执行
-- 2. 或者执行失败了
-- 
-- 解决方案：
-- 1. 手动执行归档函数生成2月5号的数据
-- 2. 检查 GitHub Actions 日志确认任务状态

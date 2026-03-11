-- 设置每日自动归档任务（中国时区版本）
-- 每天北京时间 23:59 自动将当天的数据归档到 daily_history 表

-- 1. 启用 pg_cron 扩展（需要在 Supabase Dashboard 中启用）
-- 注意：pg_cron 扩展需要在 Supabase 项目设置中启用
-- 路径：Database > Extensions > 搜索 "pg_cron" > 启用

-- 2. 删除旧的定时任务（如果存在）
SELECT cron.unschedule('daily-archive-job');

-- 3. 创建新的定时任务（中国时区）
-- ⚠️ 重要：Supabase 使用 UTC 时区
-- 北京时间 23:59 = UTC 15:59
-- 所以使用 '59 15 * * *' 而不是 '59 23 * * *'
SELECT cron.schedule(
  'daily-archive-job',           -- 任务名称
  '59 15 * * *',                 -- Cron 表达式：UTC 15:59 = 北京时间 23:59
  $$SELECT archive_daily_data()$$  -- 执行的 SQL
);

-- 4. 查看已创建的定时任务
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'daily-archive-job';

-- 5. 查看定时任务执行历史
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-archive-job')
ORDER BY start_time DESC 
LIMIT 10;

-- ============================================
-- 手动测试归档函数
-- ============================================
-- 立即执行一次归档（用于测试）
-- SELECT archive_daily_data();

-- 查看归档结果
-- SELECT * FROM daily_history 
-- ORDER BY date DESC 
-- LIMIT 7;

-- ============================================
-- 时区说明
-- ============================================
-- Supabase 使用 UTC 时区
-- 中国在 UTC+8 时区
-- 
-- 时间转换：
-- - 北京时间 00:00 = UTC 16:00（前一天）
-- - 北京时间 23:59 = UTC 15:59
-- - UTC 00:00 = 北京时间 08:00
-- - UTC 23:59 = 北京时间 07:59（第二天）
--
-- 归档逻辑：
-- - archive_daily_data() 函数归档的是"昨天"的数据
-- - 在北京时间 2月1日 23:59 执行时，会归档 1月31日的数据
-- - 这样确保当天的数据已经完整收集

-- ============================================
-- 其他 Cron 表达式示例（UTC 时区）
-- ============================================
-- '0 16 * * *'  - 北京时间每天 00:00（UTC 16:00）
-- '30 18 * * *' - 北京时间每天 02:30（UTC 18:30）
-- '0 1 * * *'   - 北京时间每天 09:00（UTC 01:00）
-- '0 */6 * * *' - 每6小时执行一次

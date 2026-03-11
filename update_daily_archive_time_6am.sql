-- ============================================
-- 修改每日归档时间为北京时间早上 6点
-- ============================================

-- 删除旧任务
SELECT cron.unschedule('daily-archive');

-- 创建新任务：每天 22:00 UTC = 06:00 北京时间
SELECT cron.schedule(
  'daily-archive',
  '0 22 * * *',  -- 22:00 UTC = 06:00 北京时间
  $$
  SELECT archive_daily_data((CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai' - INTERVAL '1 day')::DATE);
  $$
);

-- 验证任务
SELECT 
  jobid as "任务ID",
  jobname as "任务名称",
  schedule as "执行计划",
  active as "是否激活"
FROM cron.job
WHERE jobname = 'daily-archive';

-- ============================================
-- 说明
-- ============================================
-- 
-- 执行计划：0 22 * * *
-- UTC 时间：每天 22:00
-- 北京时间：每天 06:00（次日）
-- 
-- 归档逻辑：在北京时间 06:00 时，归档前一天的数据
-- 例如：2月7日 06:00 归档 2月6日的数据

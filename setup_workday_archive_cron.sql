-- ============================================
-- 工作日归档定时任务设置脚本
-- ============================================
-- 功能：设置每天早上 06:00 执行数据归档
-- 执行时间：在 Supabase SQL Editor 中执行
-- ============================================

-- 删除旧的定时任务（如果存在）
SELECT cron.unschedule('daily-archive-job');
SELECT cron.unschedule('archive-daily-data');

-- 创建新的定时任务：每天早上 06:00 (UTC) 执行归档
-- 注意：Supabase 使用 UTC 时区
-- UTC 06:00 = 北京时间 14:00
-- 如果需要北京时间 06:00，请使用 UTC 22:00（前一天）
SELECT cron.schedule(
  'workday-archive-job',
  '0 6 * * *',                    -- 每天 UTC 06:00
  $$SELECT archive_daily_data()$$
);

-- 验证定时任务
SELECT * FROM cron.job WHERE jobname = 'workday-archive-job';

-- 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '工作日归档定时任务设置完成！';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '任务名称: workday-archive-job';
  RAISE NOTICE '执行时间: 每天 UTC 06:00';
  RAISE NOTICE '执行内容: archive_daily_data()';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  时区说明：';
  RAISE NOTICE '  - Supabase 使用 UTC 时区';
  RAISE NOTICE '  - UTC 06:00 = 北京时间 14:00';
  RAISE NOTICE '  - 如需北京时间 06:00，请使用 UTC 22:00';
  RAISE NOTICE '';
  RAISE NOTICE '工作日定义：';
  RAISE NOTICE '  - 早上 06:00 - 次日 05:59';
  RAISE NOTICE '  - 凌晨 00:00-05:59 算前一天';
  RAISE NOTICE '===========================================';
END $$;

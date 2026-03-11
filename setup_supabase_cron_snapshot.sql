-- ============================================
-- 零延迟快照：使用 Supabase Cron
-- ============================================
-- 目标：在每小时的第0分钟立即生成快照，延迟 < 100ms
-- 方案：使用 pg_cron 扩展在数据库内部执行定时任务

-- ============================================
-- 步骤1：启用 pg_cron 扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 步骤2：删除旧的定时任务（如果存在）
-- ============================================
-- 注意：如果任务不存在，这个命令会报错，但不影响后续操作
DO $$
BEGIN
  PERFORM cron.unschedule('hourly-snapshot');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No existing hourly-snapshot job to remove';
END $$;

-- ============================================
-- 步骤3：创建新的每小时快照任务
-- ============================================
-- 注意：
-- 1. cron 使用 UTC 时间，但 save_hourly_snapshot() 函数内部会转换为北京时间
-- 2. '0 * * * *' 表示每小时的第0分钟执行
-- 3. 例如：UTC 06:00 执行 → 北京时间 14:00 的快照
SELECT cron.schedule(
  'hourly-snapshot',                        -- 任务名称
  '0 * * * *',                              -- 每小时第0分钟（UTC时间）
  $$ SELECT save_hourly_snapshot(); $$      -- 执行的SQL
);

-- ============================================
-- 步骤4：验证任务已创建
-- ============================================
SELECT 
  jobid as "任务ID",
  jobname as "任务名称",
  schedule as "执行计划",
  command as "执行命令",
  active as "是否激活"
FROM cron.job 
WHERE jobname = 'hourly-snapshot';

-- 预期结果：
-- | 任务ID | 任务名称          | 执行计划    | 执行命令                              | 是否激活 |
-- |--------|------------------|-------------|--------------------------------------|---------|
-- | 1      | hourly-snapshot  | 0 * * * *   | SELECT save_hourly_snapshot();       | t       |

-- ============================================
-- 步骤5：查看任务执行历史（可选）
-- ============================================
SELECT 
  jobid as "任务ID",
  runid as "运行ID",
  status as "状态",
  return_message as "返回信息",
  start_time AT TIME ZONE 'Asia/Shanghai' as "开始时间（北京）",
  end_time AT TIME ZONE 'Asia/Shanghai' as "结束时间（北京）"
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hourly-snapshot')
ORDER BY start_time DESC
LIMIT 10;

-- ============================================
-- 步骤6：手动测试（可选）
-- ============================================
-- 手动执行一次，验证是否正常工作
SELECT save_hourly_snapshot();

-- 查看最新快照
SELECT 
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  TO_CHAR(snapshot_time AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "快照时间（北京）",
  TO_CHAR(created_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "创建时间（北京）"
FROM hourly_snapshots
WHERE snapshot_date = timezone('Asia/Shanghai', NOW())::DATE
ORDER BY snapshot_hour DESC
LIMIT 5;

-- ============================================
-- 工作原理说明
-- ============================================
-- 
-- 时间线：
-- 14:00:00.000 → Supabase Cron 触发（数据库内部）
-- 14:00:00.050 → save_hourly_snapshot() 执行完成
-- 14:00:00.100 → 用户拖动时间轴到14:00 → 立即显示数据 ✅
-- 
-- 14:00:30 → GitHub Actions 开始执行（备份）
-- 14:01:00 → GitHub Actions 调用 API
-- 14:01:05 → 快照已存在（ON CONFLICT DO UPDATE）
-- 
-- 优势：
-- ✅ 零延迟：延迟 < 100ms
-- ✅ 数据准确：在整点执行，完全符合累计逻辑
-- ✅ 可靠性高：数据库内部执行，不受网络影响
-- ✅ 双重保障：GitHub Actions 作为备份

-- ============================================
-- 监控和维护
-- ============================================

-- 查看任务配置
-- SELECT * FROM cron.job WHERE jobname = 'hourly-snapshot';

-- 查看最近10次执行记录
-- SELECT 
--   start_time AT TIME ZONE 'Asia/Shanghai' as "执行时间（北京）",
--   status as "状态",
--   return_message as "返回信息"
-- FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hourly-snapshot')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- 暂停任务
-- SELECT cron.unschedule('hourly-snapshot');

-- 重新启动任务
-- SELECT cron.schedule(
--   'hourly-snapshot',
--   '0 * * * *',
--   $$ SELECT save_hourly_snapshot(); $$
-- );

-- ============================================
-- 完成！
-- ============================================
-- 
-- 下一步：
-- 1. ✅ 执行此 SQL 文件
-- 2. ✅ 验证任务已创建（查看上面的输出）
-- 3. ⏳ 等待下一个整点，观察快照是否立即生成
-- 4. ✅ 保留 GitHub Actions 作为备份（不需要修改）
-- 
-- 预期效果：
-- - 用户在14:00拖动时间轴，立即看到14:00的数据
-- - 不再有任何延迟
-- - 完美符合"零延迟"的要求 ✅

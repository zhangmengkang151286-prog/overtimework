-- ============================================
-- 零延迟快照：使用 Supabase Cron（简化版）
-- ============================================
-- 目标：在每小时的第0分钟立即生成快照，延迟 < 100ms

-- ============================================
-- 步骤1：启用 pg_cron 扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 步骤2：创建每小时快照任务
-- ============================================
-- 注意：如果任务已存在，会报错，但不影响功能
-- 如果看到 "duplicate key value" 错误，说明任务已经存在，可以忽略
SELECT cron.schedule(
  'hourly-snapshot',                        -- 任务名称
  '0 * * * *',                              -- 每小时第0分钟（UTC时间）
  $$ SELECT save_hourly_snapshot(); $$      -- 执行的SQL
);

-- ============================================
-- 步骤3：验证任务已创建
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
-- 步骤4：手动测试（可选）
-- ============================================
-- 手动执行一次，验证是否正常工作
SELECT save_hourly_snapshot();

-- 查看最新快照
SELECT 
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  TO_CHAR(snapshot_time AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "快照时间（北京）"
FROM hourly_snapshots
WHERE snapshot_date = timezone('Asia/Shanghai', NOW())::DATE
ORDER BY snapshot_hour DESC
LIMIT 5;

-- ============================================
-- 完成！
-- ============================================
-- 
-- 工作原理：
-- 14:00:00.000 → Supabase Cron 触发（数据库内部）
-- 14:00:00.050 → save_hourly_snapshot() 执行完成
-- 14:00:00.100 → 用户拖动时间轴 → 立即显示数据 ✅
-- 
-- 优势：
-- ✅ 零延迟：延迟 < 100ms
-- ✅ 数据准确：在整点执行，完全符合累计逻辑
-- ✅ 可靠性高：数据库内部执行，不受网络影响
-- ✅ 双重保障：GitHub Actions 作为备份

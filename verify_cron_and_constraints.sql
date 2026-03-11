-- ============================================
-- 验证 Cron 任务和数据库约束
-- ============================================

-- 第1步：查看所有 Cron 任务
SELECT 
  jobid as "任务ID",
  jobname as "任务名称",
  schedule as "执行计划",
  active as "是否激活",
  command as "执行命令"
FROM cron.job
ORDER BY jobid;

-- 第2步：查看 status_records 表的约束
SELECT 
  conname as "约束名称",
  contype as "约束类型",
  pg_get_constraintdef(oid) as "约束定义"
FROM pg_constraint
WHERE conrelid = 'status_records'::regclass
ORDER BY conname;

-- 第3步：查看 archive_daily_data 函数是否存在
SELECT 
  proname as "函数名称",
  pg_get_functiondef(oid) as "函数定义"
FROM pg_proc
WHERE proname = 'archive_daily_data';

-- 第4步：查看最近的归档数据
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
  created_at AT TIME ZONE 'Asia/Shanghai' as "创建时间（北京）"
FROM daily_history
ORDER BY date DESC
LIMIT 10;

-- 第5步：查看今天的快照数据
SELECT 
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

-- 第6步：查看用户数量
SELECT 
  COUNT(*) as "用户总数",
  COUNT(*) FILTER (WHERE id = '00000000-0000-0000-0000-000000000001') as "测试账户数量"
FROM users;

-- ============================================
-- 预期结果
-- ============================================
-- 
-- Cron 任务：
-- - 任务1: hourly-snapshot (0 * * * *) - 每小时生成快照
-- - 任务3: daily-archive (0 22 * * *) - 每天 06:00 北京时间归档
-- 
-- 约束：
-- - unique_user_date: UNIQUE (user_id, date) - 每用户每天只能提交一次
-- 
-- 函数：
-- - archive_daily_data(DATE) - 归档函数已修复
-- 
-- 归档数据：
-- - 最近7天的数据应该都存在
-- 
-- 快照数据：
-- - 今天的每小时快照应该都存在
-- 
-- 用户：
-- - 测试账户应该已删除（测试账户数量 = 0）
-- - 用户总数应该是 10

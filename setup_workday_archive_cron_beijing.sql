-- ============================================
-- 配置 Supabase Cron 每日归档任务（北京时间）
-- ============================================

-- 第1步：确保 pg_cron 扩展已启用
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 第2步：删除旧的归档任务（如果存在）
SELECT cron.unschedule('daily-archive') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-archive'
);

-- 第3步：创建新的每日归档任务
-- 时间：每天 16:00 UTC = 00:00 北京时间（次日）
-- 功能：归档当天的数据（在北京时间 00:00 时，归档刚刚结束的那一天）
SELECT cron.schedule(
  'daily-archive',           -- 任务名称
  '0 16 * * *',             -- 每天 16:00 UTC = 00:00 北京时间
  $$
  SELECT archive_daily_data((CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai' - INTERVAL '1 day')::DATE);
  $$
);

-- 第4步：验证任务是否创建成功
SELECT 
  jobid as "任务ID",
  jobname as "任务名称",
  schedule as "执行计划",
  active as "是否激活",
  command as "执行命令"
FROM cron.job
WHERE jobname = 'daily-archive';

-- ============================================
-- 说明
-- ============================================

/*
## 配置说明

### 执行时间
- Cron 表达式：`0 16 * * *`
- UTC 时间：每天 16:00
- 北京时间：每天 00:00（次日）

### 归档逻辑
- 在北京时间 00:00 时，归档刚刚结束的那一天的数据
- 例如：2月6日 00:00 归档 2月5日的数据

### 为什么选择 00:00 北京时间？
1. 工作日刚结束，数据已完整
2. 用户不太可能在 00:00 查看应用，不影响体验
3. 符合"每日归档"的语义

### 双重保障
1. **Supabase Cron**（主要）：数据库内部执行，零延迟，高可靠性
2. **GitHub Actions**（备份）：每天 22:00 UTC (06:00 北京时间) 执行

### 验证归档是否成功
```sql
-- 查看最近7天的归档数据
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点下班人数",
  TO_CHAR(created_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "创建时间（北京）"
FROM daily_history
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

### 手动触发归档（测试用）
```sql
-- 归档昨天的数据
SELECT * FROM archive_daily_data((CURRENT_DATE - INTERVAL '1 day')::DATE);

-- 归档指定日期的数据
SELECT * FROM archive_daily_data('2026-02-05'::DATE);
```

### 查看 Cron 任务执行历史
```sql
-- 查看最近的执行记录
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time AT TIME ZONE 'Asia/Shanghai' as "开始时间（北京）",
  end_time AT TIME ZONE 'Asia/Shanghai' as "结束时间（北京）"
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-archive')
ORDER BY start_time DESC
LIMIT 10;
```

## 下一步

1. ✅ 执行此脚本配置 Supabase Cron
2. ✅ 验证任务是否创建成功
3. ✅ 手动触发一次测试：`SELECT * FROM archive_daily_data('2026-02-05'::DATE);`
4. ✅ 等待明天 00:00 北京时间，检查是否自动归档
5. ✅ 保留 GitHub Actions 作为备份机制

*/


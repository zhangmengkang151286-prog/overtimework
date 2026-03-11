# 每日自动归档设置指南

## 功能说明

每天23:59自动将当天的统计数据归档到 `daily_history` 表，用于历史状态指示器的显示。

## 设置步骤

### 1. 启用 pg_cron 扩展

在 Supabase Dashboard 中启用 pg_cron 扩展：

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单 **Database** → **Extensions**
4. 搜索 `pg_cron`
5. 点击启用（Enable）

### 2. 执行定时任务设置脚本

在 Supabase SQL Editor 中执行 `setup_daily_archive_cron.sql` 脚本：

1. 进入 **SQL Editor**
2. 创建新查询
3. 复制 `setup_daily_archive_cron.sql` 的内容
4. 执行脚本

### 3. 验证定时任务

执行以下 SQL 查看定时任务是否创建成功：

```sql
-- 查看所有定时任务
SELECT * FROM cron.job;

-- 应该看到一个名为 'daily-archive-job' 的任务
```

### 4. 查看执行历史

定时任务执行后，可以查看执行历史：

```sql
-- 查看最近10次执行记录
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
ORDER BY start_time DESC 
LIMIT 10;
```

## 手动测试

如果想立即测试归档功能，可以手动执行：

```sql
-- 手动执行归档函数
SELECT archive_daily_data();

-- 查看归档结果
SELECT * FROM daily_history 
ORDER BY date DESC 
LIMIT 7;
```

## 定时任务说明

- **任务名称**: `daily-archive-job`
- **执行时间**: 每天 23:59
- **执行内容**: 调用 `archive_daily_data()` 函数
- **Cron 表达式**: `59 23 * * *`

## 修改执行时间

如果需要修改执行时间，先删除旧任务，再创建新任务：

```sql
-- 1. 删除旧任务
SELECT cron.unschedule('daily-archive-job');

-- 2. 创建新任务（例如改为每天00:00执行）
SELECT cron.schedule(
  'daily-archive-job',
  '0 0 * * *',                    -- 每天00:00
  $$SELECT archive_daily_data()$$
);
```

## 常见 Cron 表达式

| 表达式 | 说明 |
|--------|------|
| `59 23 * * *` | 每天 23:59 |
| `0 0 * * *` | 每天 00:00（午夜） |
| `30 2 * * *` | 每天 02:30 |
| `0 */6 * * *` | 每6小时执行一次 |
| `0 9 * * 1` | 每周一 09:00 |
| `0 0 1 * *` | 每月1号 00:00 |

## 故障排查

### 问题1：pg_cron 扩展无法启用

**解决方案**：
- 确保你的 Supabase 项目计划支持 pg_cron（免费计划可能有限制）
- 联系 Supabase 支持

### 问题2：定时任务没有执行

**检查步骤**：

1. 确认任务已创建：
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-archive-job';
```

2. 查看执行日志：
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-archive-job')
ORDER BY start_time DESC;
```

3. 检查 `archive_daily_data()` 函数是否存在：
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'archive_daily_data';
```

### 问题3：归档数据不正确

**检查步骤**：

1. 手动执行归档函数查看错误：
```sql
SELECT archive_daily_data();
```

2. 查看 `user_status` 表是否有数据：
```sql
SELECT COUNT(*) FROM user_status 
WHERE DATE(created_at) = CURRENT_DATE;
```

3. 查看 `daily_history` 表：
```sql
SELECT * FROM daily_history 
ORDER BY date DESC 
LIMIT 7;
```

## 注意事项

1. **时区问题**：Supabase 使用 UTC 时区，如果你在中国（UTC+8），23:59 UTC 相当于北京时间第二天 07:59
   - 如果需要北京时间 23:59 执行，应该设置为 `59 15 * * *`（UTC 15:59 = 北京时间 23:59）

2. **数据完整性**：`archive_daily_data()` 函数使用 `ON CONFLICT` 处理，不会重复插入相同日期的数据

3. **性能影响**：归档操作在23:59执行，对用户影响最小

## 时区调整示例

如果需要按北京时间（UTC+8）执行：

```sql
-- 删除旧任务
SELECT cron.unschedule('daily-archive-job');

-- 创建新任务（北京时间 23:59 = UTC 15:59）
SELECT cron.schedule(
  'daily-archive-job',
  '59 15 * * *',                  -- UTC 15:59 = 北京时间 23:59
  $$SELECT archive_daily_data()$$
);
```

## 完成

设置完成后，系统将每天自动归档数据，历史状态指示器将显示最近7天的数据。

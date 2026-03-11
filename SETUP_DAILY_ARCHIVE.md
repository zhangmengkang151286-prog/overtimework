# 设置每日自动归档

## 问题

7个圆点显示的数据都是0（除了1月30日），这是因为**没有自动归档服务在运行**。

`daily_history` 表需要每天自动归档前一天的数据，但目前没有任何自动化任务在执行这个操作。

## 解决方案

### 步骤1：手动归档最近几天的数据

在 Supabase SQL Editor 中执行：

```bash
# 打开文件
OvertimeIndexApp/manual_archive_recent_days.sql
```

这个脚本会：
1. 检查最近7天的原始数据
2. 将数据归档到 `daily_history` 表
3. 验证归档结果

### 步骤2：设置自动归档

在 Supabase SQL Editor 中执行：

```bash
# 打开文件
OvertimeIndexApp/setup_auto_daily_archive.sql
```

这个脚本会：
1. 创建 `archive_daily_data()` 函数
2. 尝试设置 Supabase Cron 任务（如果支持）
3. 每天早上 6:00 北京时间自动归档前一天的数据

## 自动归档方案

### 方案1：Supabase Cron（推荐）

如果你的 Supabase 项目支持 `pg_cron` 扩展，执行 `setup_auto_daily_archive.sql` 后会自动创建定时任务。

**验证是否成功**：
```sql
SELECT * FROM cron.job WHERE jobname = 'daily_archive_task';
```

如果返回结果，说明 cron 任务已创建成功。

### 方案2：GitHub Actions（推荐，已创建）

✅ **已创建工作流文件**: `.github/workflows/daily-archive.yml`

**运行时间**: 每天 22:00 UTC = 次日 06:00 北京时间

**推送到 GitHub**:
```bash
git add .github/workflows/daily-archive.yml
git commit -m "feat: add daily archive workflow"
git push origin main
```

**手动触发测试**:
1. 打开 GitHub 仓库 → Actions 标签页
2. 找到 "Daily Archive" 工作流
3. 点击 "Run workflow" 手动触发

**配置 GitHub Secrets**（应该已经配置好）：
- `SUPABASE_URL`: 你的 Supabase 项目 URL
- `SUPABASE_ANON_KEY`: 你的 Supabase Anon Key

## 手动归档

如果需要手动归档某一天的数据：

```sql
-- 归档昨天
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '1 day');

-- 归档指定日期（例如2月4日）
SELECT * FROM archive_daily_data('2024-02-04');

-- 归档2月1日到2月4日
SELECT * FROM archive_daily_data('2024-02-01');
SELECT * FROM archive_daily_data('2024-02-02');
SELECT * FROM archive_daily_data('2024-02-03');
SELECT * FROM archive_daily_data('2024-02-04');
```

## 验证

执行归档后，验证数据是否正确：

```sql
-- 查看最近7天的归档数据
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点"
FROM daily_history
WHERE date >= CURRENT_DATE - INTERVAL '6 days'
ORDER BY date DESC;

-- 查看 get_daily_status 函数返回的数据
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  CASE 
    WHEN participant_count = 0 THEN '⚪ 无数据'
    WHEN is_overtime_dominant THEN '🔴 红点'
    ELSE '🟢 绿点'
  END as "显示"
FROM get_daily_status(7)
ORDER BY date DESC;
```

## 应用端验证

归档数据后，在应用中：
1. 重新加载应用（手机上摇一摇 → Reload）
2. 查看7个圆点，应该显示正确的颜色
3. 点击圆点查看具体数据

## 监控

定期检查归档任务是否正常运行：

```sql
-- 检查最近7天是否都有归档数据
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE - INTERVAL '1 day',
    '1 day'::interval
  )::DATE as date
)
SELECT 
  ds.date as "日期",
  CASE 
    WHEN dh.date IS NULL THEN '❌ 缺失'
    ELSE '✅ 存在'
  END as "状态",
  COALESCE(dh.participant_count, 0) as "参与人数"
FROM date_series ds
LEFT JOIN daily_history dh ON ds.date = dh.date
ORDER BY ds.date DESC;
```

## 相关文件

- ✅ `OvertimeIndexApp/manual_archive_recent_days.sql` - 手动归档脚本
- ✅ `OvertimeIndexApp/setup_auto_daily_archive.sql` - 设置自动归档
- ✅ `.github/workflows/daily-archive.yml` - GitHub Actions 工作流（已创建）
- ✅ `OvertimeIndexApp/DAILY_ARCHIVE_COMPLETE_GUIDE.md` - 完整解决方案指南
- ✅ `OvertimeIndexApp/立即执行_修复7个圆点.md` - 快速执行指南（中文）
- `OvertimeIndexApp/fix_feb4_daily_status.sql` - 修复特定日期（已过时，不再需要）

## 总结

1. **立即执行**：`manual_archive_recent_days.sql` 归档最近几天的数据
2. **设置自动化**：`setup_auto_daily_archive.sql` 设置自动归档任务
3. **选择方案**：Supabase Cron 或 GitHub Actions
4. **定期监控**：确保归档任务正常运行

# 修复2月4日每日状态数据问题

## 问题描述

7个圆点（历史状态指示器）中，昨天（2月4日）的数据显示为0，但实际上应该有数据。

## 问题原因

`get_daily_status()` 函数从 `daily_history` 表读取数据，而不是直接从 `status_records` 表读取。可能的原因：

1. **每日归档任务未运行**：2月4日的数据没有被归档到 `daily_history` 表
2. **归档任务失败**：归档过程中出现错误
3. **时区问题**：归档任务在错误的时间执行

## 数据流程

```
status_records (实时提交)
    ↓
每日归档任务 (每天凌晨6点)
    ↓
daily_history (历史归档)
    ↓
get_daily_status() 函数
    ↓
应用显示7个圆点
```

## 解决方案

### 方案1：手动修复2月4日的数据（推荐）

在 Supabase SQL Editor 中执行：

```sql
-- 执行修复脚本
\i OvertimeIndexApp/fix_feb4_daily_status.sql
```

或者直接复制 `fix_feb4_daily_status.sql` 的内容到 Supabase SQL Editor 执行。

### 方案2：调用归档函数

如果数据库中有 `archive_daily_data()` 函数，可以手动调用：

```sql
-- 归档2月4日的数据
SELECT archive_daily_data('2024-02-04');

-- 验证结果
SELECT * FROM daily_history WHERE date = '2024-02-04';
```

### 方案3：检查并修复归档任务

1. **检查 Supabase Cron 任务**：
   ```sql
   -- 查看所有 cron 任务
   SELECT * FROM cron.job;
   
   -- 查看归档任务的执行历史
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily_archive')
   ORDER BY start_time DESC
   LIMIT 10;
   ```

2. **检查 GitHub Actions**：
   - 访问 GitHub 仓库 → Actions
   - 查看是否有每日归档的工作流
   - 检查最近的运行记录

## 验证修复

执行以下SQL验证数据是否正确：

```sql
-- 1. 检查 daily_history 表
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点"
FROM daily_history
WHERE date >= '2024-02-01'
ORDER BY date DESC;

-- 2. 检查 get_daily_status 函数
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

修复数据后，在应用中：

1. **重新加载应用**（手机上摇一摇 → Reload）
2. **查看7个圆点**：
   - 2月4日的圆点应该显示正确的颜色（红色或绿色）
   - 不应该是灰色或显示为0
3. **点击圆点**：
   - 应该显示2月4日的具体数据
   - 参与人数、加班人数、准点人数应该正确

## 预防措施

### 1. 确保每日归档任务正常运行

检查以下任务是否配置正确：

#### Supabase Cron 任务
```sql
-- 创建或更新每日归档任务
SELECT cron.schedule(
  'daily_archive',
  '0 6 * * *',  -- 每天早上6点（北京时间）
  $$
  SELECT archive_daily_data(CURRENT_DATE - INTERVAL '1 day');
  $$
);
```

#### GitHub Actions
确保 `.github/workflows/daily-archive.yml` 存在并正常运行。

### 2. 监控归档任务

定期检查归档任务的执行情况：

```sql
-- 检查最近7天的归档数据是否完整
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE,
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

### 3. 手动补充缺失数据

如果发现某天的数据缺失，可以使用以下脚本补充：

```sql
-- 补充指定日期的归档数据
INSERT INTO daily_history (
  date,
  participant_count,
  overtime_count,
  on_time_count,
  tag_distribution
)
SELECT 
  '2024-02-XX'::DATE,  -- 替换为实际日期
  COUNT(DISTINCT user_id),
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END)::INTEGER,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)::INTEGER,
  '{}'::jsonb  -- 简化版，不包含标签分布
FROM status_records
WHERE date = '2024-02-XX'  -- 替换为实际日期
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count;
```

## 相关文件

- `OvertimeIndexApp/fix_feb4_daily_status.sql` - 修复脚本
- `OvertimeIndexApp/debug_daily_status_feb4.sql` - 诊断脚本
- `OvertimeIndexApp/src/components/HistoricalStatusIndicator.tsx` - 圆点组件
- `OvertimeIndexApp/src/services/supabaseService.ts` - 数据服务
- `OvertimeIndexApp/setup_daily_archive_cron.sql` - 归档任务设置

## 总结

问题的根本原因是 `daily_history` 表中缺少2月4日的数据。通过执行修复脚本，可以从 `status_records` 表中重新生成归档数据。同时需要确保每日归档任务正常运行，避免未来再次出现类似问题。

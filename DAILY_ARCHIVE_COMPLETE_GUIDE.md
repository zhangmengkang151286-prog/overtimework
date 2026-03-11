# 每日归档完整解决方案

## 问题总结

7个历史状态圆点显示数据为0（除了1月30日有32人的数据），根本原因是：**没有自动归档服务在运行**。

`get_daily_status()` 函数从 `daily_history` 表读取数据，但该表需要每天自动归档 `status_records` 表的数据。目前没有任何自动化任务在执行归档操作。

## 解决方案

### ✅ 已完成

1. **创建了归档函数** (`setup_auto_daily_archive.sql`)
   - `archive_daily_data()` 函数可以归档指定日期的数据
   - 支持手动调用和自动调用

2. **创建了手动归档脚本** (`manual_archive_recent_days.sql`)
   - 可以一次性归档最近7天的数据
   - 包含完整的验证步骤

3. **创建了 GitHub Actions 工作流** (`.github/workflows/daily-archive.yml`)
   - 每天 22:00 UTC (次日 06:00 北京时间) 自动运行
   - 自动归档前一天的数据
   - 包含验证步骤

## 立即执行步骤

### 步骤1：在 Supabase 中创建归档函数

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 执行 `OvertimeIndexApp/setup_auto_daily_archive.sql`

这会创建 `archive_daily_data()` 函数。

### 步骤2：手动归档最近7天的数据

在 Supabase SQL Editor 中执行：

```sql
-- 打开并执行
OvertimeIndexApp/manual_archive_recent_days.sql
```

这个脚本会：
- 检查 `status_records` 表中最近7天的原始数据
- 将数据归档到 `daily_history` 表
- 验证归档结果
- 测试 `get_daily_status()` 函数

**预期结果**：
```
日期         参与人数  加班  准点  显示状态
2026-02-04   XX      XX    XX    🔴/🟢
2026-02-03   XX      XX    XX    🔴/🟢
2026-02-02   XX      XX    XX    🔴/🟢
2026-02-01   XX      XX    XX    🔴/🟢
2026-01-31   XX      XX    XX    🔴/🟢
2026-01-30   32      XX    XX    🔴/🟢
2026-01-29   XX      XX    XX    🔴/🟢
```

### 步骤3：推送 GitHub Actions 工作流

```bash
# 在项目根目录执行
git add .github/workflows/daily-archive.yml
git commit -m "feat: add daily archive GitHub Actions workflow"
git push origin main
```

### 步骤4：验证 GitHub Actions

1. 打开 GitHub 仓库
2. 进入 Actions 标签页
3. 找到 "Daily Archive" 工作流
4. 点击 "Run workflow" 手动触发一次测试

**预期结果**：
- 工作流成功运行
- 日志显示 "Daily archive completed successfully"
- Supabase 中 `daily_history` 表有新数据

### 步骤5：在应用中验证

1. 重新加载应用（手机上摇一摇 → Reload）
2. 查看7个圆点
3. 应该显示正确的颜色：
   - 🔴 红点：加班人数 > 准点下班人数
   - 🟢 绿点：准点下班人数 >= 加班人数
   - 🟡 黄点闪烁：今天（未确定）

## 自动化方案详情

### GitHub Actions 定时任务

**文件**: `.github/workflows/daily-archive.yml`

**运行时间**: 
- 每天 22:00 UTC = 次日 06:00 北京时间
- 归档前一天的数据

**工作原理**:
1. 调用 Supabase RPC 函数 `archive_daily_data()`
2. 函数从 `status_records` 表读取前一天的数据
3. 计算统计数据（参与人数、加班人数、准点人数、标签分布）
4. 插入或更新 `daily_history` 表
5. 验证归档结果

**优势**:
- ✅ 完全自动化，无需人工干预
- ✅ 可靠性高，GitHub Actions 稳定运行
- ✅ 可以手动触发测试
- ✅ 有日志可以查看执行结果
- ✅ 免费（GitHub Actions 每月 2000 分钟免费额度）

## 手动归档命令

如果需要手动归档某一天的数据，在 Supabase SQL Editor 中执行：

```sql
-- 归档昨天
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '1 day');

-- 归档指定日期（例如2月4日）
SELECT * FROM archive_daily_data('2026-02-04');

-- 批量归档最近7天
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '7 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '6 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '5 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '4 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '3 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '2 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '1 day');
```

## 监控和维护

### 检查归档数据完整性

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

### 查看 GitHub Actions 运行历史

1. 打开 GitHub 仓库
2. 进入 Actions 标签页
3. 选择 "Daily Archive" 工作流
4. 查看运行历史和日志

### 如果归档失败

1. **检查 GitHub Actions 日志**
   - 查看错误信息
   - 确认 Secrets 配置正确

2. **手动执行归档**
   ```sql
   SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '1 day');
   ```

3. **验证函数是否存在**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'archive_daily_data';
   ```

## 相关文件

- ✅ `.github/workflows/daily-archive.yml` - GitHub Actions 工作流（已创建）
- ✅ `OvertimeIndexApp/setup_auto_daily_archive.sql` - 创建归档函数
- ✅ `OvertimeIndexApp/manual_archive_recent_days.sql` - 手动归档脚本
- ✅ `OvertimeIndexApp/SETUP_DAILY_ARCHIVE.md` - 详细设置指南
- ✅ `OvertimeIndexApp/src/components/HistoricalStatusIndicator.tsx` - 7个圆点组件
- ✅ `OvertimeIndexApp/src/services/supabaseService.ts` - 包含 `getDailyStatus()` 方法

## 总结

**问题**: 7个圆点显示数据为0，因为没有自动归档服务

**解决方案**: 
1. ✅ 创建了 `archive_daily_data()` 函数
2. ✅ 创建了手动归档脚本
3. ✅ 创建了 GitHub Actions 自动归档工作流

**下一步**:
1. 在 Supabase 中执行 `setup_auto_daily_archive.sql`
2. 在 Supabase 中执行 `manual_archive_recent_days.sql`
3. 推送 GitHub Actions 工作流到仓库
4. 手动触发一次测试
5. 在应用中验证7个圆点显示正确

**预期结果**: 
- 7个圆点显示正确的颜色
- 每天自动归档数据
- 无需人工干预

# 2月5号数据缺失问题调查

## 🔍 问题描述

用户报告：7个圆点（历史状态指示器）中，2月5号的数据又消失了，但昨天刚修复过这个功能。

## 📊 数据流程分析

### 7个圆点的数据来源

```
用户提交状态
  ↓
status_records 表（原始数据）
  ↓
archive_daily_data() 函数（每日归档）
  ↓
daily_history 表（归档数据）
  ↓
get_daily_status() RPC 函数
  ↓
前端 HistoricalStatusIndicator 组件
  ↓
显示 7 个圆点
```

### 关键发现

1. **7个圆点显示的是 `daily_history` 表的数据**
2. **`daily_history` 表需要通过 `archive_daily_data()` 函数归档**
3. **归档任务由 GitHub Actions 每天 22:00 UTC (06:00 北京时间) 执行**

## 🚨 可能的原因

### 原因1: GitHub Actions 任务失败
- GitHub Actions 可能因为网络问题、API 限制等原因失败
- 需要检查 GitHub Actions 日志

### 原因2: 归档时机问题
- GitHub Actions 在 22:00 UTC (06:00 北京时间) 运行
- 归档的是"昨天"的数据（`CURRENT_DATE - INTERVAL '1 day'`）
- 如果在 2月6日 06:00 运行，归档的是 2月5日的数据
- 但如果任务失败或延迟，2月5日的数据就不会被归档

### 原因3: Supabase Cron 未配置
- 用户配置了 Supabase Cron 用于小时快照（hourly-snapshot）
- 但**没有配置 Supabase Cron 用于每日归档（daily-archive）**
- 这意味着每日归档完全依赖 GitHub Actions

### 原因4: 数据源问题
- 如果 2月5日没有人提交状态（`status_records` 表为空）
- 那么归档函数会生成一条空记录或不生成记录
- 导致 7个圆点显示为白色（无数据）

## 🎯 解决方案

### 立即执行（紧急修复）

1. **执行诊断脚本**
   ```sql
   -- 在 Supabase SQL Editor 中执行
   -- 文件: OvertimeIndexApp/diagnose_feb5_simple.sql
   ```
   这会显示：
   - `daily_history` 表中有哪些日期的数据
   - `status_records` 表中有哪些日期的数据
   - 对比找出缺失的日期

2. **手动归档 2月5日数据**
   ```sql
   -- 在 Supabase SQL Editor 中执行
   -- 文件: OvertimeIndexApp/fix_feb5_daily_archive.sql
   SELECT * FROM archive_daily_data('2026-02-05'::DATE);
   ```

### 长期解决方案（推荐）

#### 方案A: 配置 Supabase Cron（推荐）

**优点：**
- 零延迟，数据库内部执行
- 不依赖外部服务
- 更可靠

**步骤：**
1. 创建 Supabase Cron 任务用于每日归档
2. 保留 GitHub Actions 作为备份

#### 方案B: 改进 GitHub Actions

**优点：**
- 无需修改数据库配置
- 易于监控和调试

**步骤：**
1. 添加重试机制
2. 添加失败通知
3. 添加日志记录

## 📋 下一步操作

### 第1步：诊断问题
执行 `diagnose_feb5_simple.sql` 查看：
- 2月5日是否有原始数据（`status_records`）
- 2月5日是否有归档数据（`daily_history`）

### 第2步：修复当前问题
如果 2月5日有原始数据但没有归档数据：
- 执行 `fix_feb5_daily_archive.sql` 手动归档

### 第3步：检查 GitHub Actions
访问：https://github.com/zhangmengkang151286-prog/overtimework/actions
- 查看 "Daily Archive" 工作流
- 检查最近几天的运行状态
- 查看失败日志（如果有）

### 第4步：配置 Supabase Cron（推荐）
创建数据库级别的每日归档任务，确保可靠性

## 🔧 技术细节

### archive_daily_data() 函数
```sql
-- 默认归档昨天的数据
SELECT * FROM archive_daily_data();

-- 归档指定日期的数据
SELECT * FROM archive_daily_data('2026-02-05'::DATE);
```

### GitHub Actions 工作流
- 文件：`.github/workflows/daily-archive.yml`
- 触发时间：每天 22:00 UTC (06:00 北京时间)
- 调用：`archive_daily_data()` RPC 函数

### Supabase Cron 配置
```sql
-- 每天 00:00 UTC (08:00 北京时间) 归档昨天的数据
SELECT cron.schedule(
  'daily-archive',
  '0 0 * * *',
  $$
  SELECT archive_daily_data((CURRENT_DATE - INTERVAL '1 day')::DATE);
  $$
);
```

## 📝 总结

2月5号数据缺失的根本原因是：
1. **每日归档任务没有可靠执行**
2. **完全依赖 GitHub Actions，没有备份机制**
3. **缺少监控和告警**

建议：
1. ✅ 立即手动归档 2月5日数据
2. ✅ 配置 Supabase Cron 作为主要归档机制
3. ✅ 保留 GitHub Actions 作为备份
4. ✅ 添加监控和告警机制

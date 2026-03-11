# 时间戳迁移指南

## 📋 核心需求

### ✅ 设计原则（重要！）
1. **用户提交的状态都需要记录具体的日期和时间点**
   - 使用 `submitted_at TIMESTAMPTZ` 字段记录提交时间
   
2. **趋势页面显示的所有数据都是累计值**
   - 参与人数：截止到某个时间点的累计参与人数
   - 实时对比：截止到某个时间点的累计加班/准时人数
   - 标签分布：截止到某个时间点的累计标签统计
   
3. **时间轴回溯也是那个时间点的累计值**
   - 拖动到 10:00 → 显示截止到 10:00 的累计数据
   - 拖动到 14:00 → 显示截止到 14:00 的累计数据
   - 点击"现在" → 显示截止到现在的累计数据

## 📋 问题说明

当前 `status_records` 表只有 `date` 字段，缺少具体的提交时间戳。这导致：
- ❌ 无法知道用户具体几点提交的状态
- ❌ 无法计算"截止到某个时间点的累计数据"
- ❌ 无法生成基于时间的准确快照
- ❌ 无法做更细粒度的时间统计分析

## ✅ 解决方案

添加 `submitted_at` 时间戳字段，记录用户提交状态的具体时间，并修改快照函数基于时间戳计算累计值。

## 🔧 迁移步骤

### 步骤 1：添加时间戳字段

在 Supabase SQL Editor 中执行：

```
OvertimeIndexApp/add_timestamp_to_status_records.sql
```

这个脚本会：
- ✅ 添加 `submitted_at TIMESTAMPTZ` 字段
- ✅ 为现有数据设置随机时间戳（6:00-24:00）
- ✅ 创建索引优化查询性能
- ✅ 修改 `save_hourly_snapshot()` 函数，基于时间戳计算累计值

### 步骤 2：插入测试数据

在 Supabase SQL Editor 中执行：

```
OvertimeIndexApp/insert_test_data_with_timestamps.sql
```

这会插入 9 条带时间戳的测试数据，分布在不同时间点。

### 步骤 3：生成快照数据

手动执行快照保存函数：

```sql
SELECT save_hourly_snapshot();
```

或者等待定时任务自动执行（如果已配置 pg_cron）。

## 📊 数据结构变化

### 之前

```sql
CREATE TABLE status_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  is_overtime BOOLEAN NOT NULL,
  tag_id UUID
);
```

### 之后

```sql
CREATE TABLE status_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  is_overtime BOOLEAN NOT NULL,
  tag_id UUID,
  submitted_at TIMESTAMPTZ DEFAULT NOW()  -- 新增字段
);
```

## 🎯 功能改进

### 1. 累计统计

现在可以查询"截止到某个时间点的累计数据"：

```sql
-- 截止到今天 10:00 的累计人数
SELECT COUNT(DISTINCT user_id)
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '10 hours';
```

### 2. 时间轴回溯

拖动时间轴时，显示截止到那个时间点的累计数据：
- 拖动到 10:00 → 显示截止到 10:00 的累计数据
- 拖动到 14:00 → 显示截止到 14:00 的累计数据
- 点击"现在" → 显示截止到现在的累计数据

### 3. 快照保存

`save_hourly_snapshot()` 函数现在会：
- 计算截止到当前整点的累计数据
- 保存到 `hourly_snapshots` 表
- 支持时间轴回溯功能

## 📈 测试数据说明

测试数据包含 9 条记录，分布在：

| 时间 | 累计人数 | 加班 | 准时 |
|------|---------|------|------|
| 7:30 | 1 | 0 | 1 |
| 8:15 | 2 | 1 | 1 |
| 9:00 | 3 | 1 | 2 |
| 10:20 | 4 | 1 | 3 |
| 11:45 | 5 | 2 | 3 |
| 13:10 | 6 | 2 | 4 |
| 14:30 | 7 | 2 | 5 |
| 15:50 | 8 | 3 | 5 |
| 16:20 | 9 | 3 | 6 |

## 🔍 验证

### 验证时间戳字段

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'status_records'
  AND column_name = 'submitted_at';
```

### 验证累计统计

```sql
-- 截止到 10:00
SELECT COUNT(DISTINCT user_id) as participants
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '10 hours';
-- 应该返回 3

-- 截止到 14:00
SELECT COUNT(DISTINCT user_id) as participants
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '14 hours';
-- 应该返回 6

-- 截止到现在
SELECT COUNT(DISTINCT user_id) as participants
FROM status_records
WHERE date = CURRENT_DATE;
-- 应该返回 9
```

### 验证快照数据

```sql
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;
```

## 🚀 后续优化

有了时间戳字段，你可以：

1. **按小时统计**：查看每小时提交人数的分布
2. **高峰时段分析**：找出提交状态的高峰时段
3. **用户行为分析**：分析用户提交状态的时间习惯
4. **实时趋势**：展示实时的提交趋势图
5. **时间范围查询**：查询任意时间范围内的数据

## ⚠️ 注意事项

1. **时区**：`submitted_at` 使用 `TIMESTAMPTZ`（带时区），自动处理时区转换
2. **默认值**：新记录会自动使用 `NOW()` 作为提交时间
3. **索引**：已创建索引优化查询性能
4. **现有数据**：现有数据会被赋予随机时间戳（6:00-24:00）

## 📝 总结

✅ 添加了 `submitted_at` 时间戳字段  
✅ 修改了快照保存逻辑，支持累计统计  
✅ 创建了带时间戳的测试数据  
✅ 优化了查询性能（索引）  
✅ 为未来的时间分析功能打下基础

现在你的应用可以准确地展示"截止到某个时间点的累计数据"了！🎉

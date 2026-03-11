# 累计数据验证指南

## 📋 核心设计确认

### ✅ 设计原则
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

## 🔧 实施步骤

### 步骤 1：添加时间戳字段

在 Supabase SQL Editor 中执行：

```sql
-- 文件：OvertimeIndexApp/add_timestamp_to_status_records.sql
```

这个脚本会：
- ✅ 添加 `submitted_at` 字段
- ✅ 修改 `save_hourly_snapshot()` 函数，基于时间戳计算累计值
- ✅ 创建索引优化查询性能

### 步骤 2：清理旧数据（如果有）

如果你之前有手动录入的 9 条数据（没有时间戳），需要先清理：

```sql
-- 文件：OvertimeIndexApp/clear_today_real_data.sql
DELETE FROM status_records WHERE date = CURRENT_DATE;
```

### 步骤 3：插入测试数据

插入带时间戳的测试数据：

```sql
-- 文件：OvertimeIndexApp/insert_test_data_with_timestamps.sql
```

这会插入 9 条测试数据，分布在不同时间点：
- 7:30, 8:15, 9:00, 10:20, 11:45, 13:10, 14:30, 15:50, 16:20

### 步骤 4：生成快照

手动执行快照保存函数：

```sql
SELECT save_hourly_snapshot();
```

## 📊 验证累计统计

### 验证 1：查看测试数据

```sql
SELECT 
  TO_CHAR(submitted_at, 'HH24:MI') as time,
  user_id,
  is_overtime,
  tag_id
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY submitted_at;
```

应该看到 9 条记录，按时间排序。

### 验证 2：验证累计人数

```sql
-- 截止到 10:00（应该是 3 人）
SELECT COUNT(DISTINCT user_id) as participants
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '10 hours';

-- 截止到 14:00（应该是 6 人）
SELECT COUNT(DISTINCT user_id) as participants
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '14 hours';

-- 截止到 16:00（应该是 8 人）
SELECT COUNT(DISTINCT user_id) as participants
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '16 hours';

-- 截止到现在（应该是 9 人）
SELECT COUNT(DISTINCT user_id) as participants
FROM status_records
WHERE date = CURRENT_DATE;
```

### 验证 3：验证累计加班/准时统计

```sql
SELECT 
  '截止到 10:00' as time_point,
  COUNT(DISTINCT user_id) as participants,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '10 hours'
UNION ALL
SELECT 
  '截止到 14:00',
  COUNT(DISTINCT user_id),
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END),
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '14 hours'
UNION ALL
SELECT 
  '截止到现在',
  COUNT(DISTINCT user_id),
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END),
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)
FROM status_records
WHERE date = CURRENT_DATE;
```

### 验证 4：验证快照数据

```sql
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count,
  jsonb_array_length(tag_distribution) as tag_count
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;
```

## 🎯 预期结果

### 测试数据分布

| 时间 | 累计人数 | 累计加班 | 累计准时 |
|------|---------|---------|---------|
| 7:30 | 1 | 0 | 1 |
| 8:15 | 2 | 1 | 1 |
| 9:00 | 3 | 1 | 2 |
| 10:20 | 4 | 1 | 3 |
| 11:45 | 5 | 2 | 3 |
| 13:10 | 6 | 2 | 4 |
| 14:30 | 7 | 2 | 5 |
| 15:50 | 8 | 3 | 5 |
| 16:20 | 9 | 3 | 6 |

### 时间轴回溯验证

在应用中：
1. **拖动到 10:00**
   - 应该显示：参与人数 = 3（或 4，取决于是否包含 10:20 的数据）
   - 加班 = 1，准时 = 2（或 3）

2. **拖动到 14:00**
   - 应该显示：参与人数 = 6（或 7）
   - 加班 = 2，准时 = 4（或 5）

3. **拖动到 16:00**
   - 应该显示：参与人数 = 8（或 9）
   - 加班 = 3，准时 = 5（或 6）

4. **点击"现在"**
   - 应该显示：参与人数 = 9
   - 加班 = 3，准时 = 6

## 🔍 常见问题

### Q1: 为什么显示 0 人？

**可能原因**：
1. 没有执行 `add_timestamp_to_status_records.sql`
2. 没有插入测试数据
3. 快照函数没有正确计算累计值

**解决方法**：
```sql
-- 1. 检查 submitted_at 字段是否存在
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'status_records'
  AND column_name = 'submitted_at';

-- 2. 检查是否有数据
SELECT COUNT(*) FROM status_records WHERE date = CURRENT_DATE;

-- 3. 检查数据是否有时间戳
SELECT 
  id,
  submitted_at,
  is_overtime
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY submitted_at;
```

### Q2: 快照数据不正确？

**解决方法**：
```sql
-- 删除旧快照
DELETE FROM hourly_snapshots WHERE snapshot_date = CURRENT_DATE;

-- 重新生成快照
SELECT save_hourly_snapshot();

-- 验证快照
SELECT * FROM hourly_snapshots WHERE snapshot_date = CURRENT_DATE;
```

### Q3: 时间轴拖动后数据没变化？

**可能原因**：
1. 快照数据没有生成
2. 客户端没有正确调用快照服务

**解决方法**：
1. 确保快照数据已生成（见 Q2）
2. 检查客户端日志，看是否有错误
3. 确保 `hourlySnapshotService.ts` 正确实现

## 📝 总结

✅ **核心设计**：所有数据都是累计值，基于 `submitted_at` 时间戳计算  
✅ **时间轴回溯**：显示截止到某个时间点的累计数据  
✅ **快照保存**：每小时保存一次累计数据快照  
✅ **数据验证**：通过 SQL 查询验证累计统计的正确性

现在你的应用完全支持基于时间的累计统计了！🎉

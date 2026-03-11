# 累计数据功能执行清单

## 🎯 目标

实现基于时间戳的累计统计功能，让时间轴可以回溯查看任意时间点的累计数据。

## ✅ 执行步骤（按顺序）

### 步骤 1：添加时间戳字段 ⭐

在 Supabase SQL Editor 中执行：

```sql
-- 复制并执行文件内容：OvertimeIndexApp/add_timestamp_to_status_records.sql
```

**这个脚本会做什么**：
- ✅ 给 `status_records` 表添加 `submitted_at` 字段
- ✅ 为现有数据设置随机时间戳（如果有的话）
- ✅ 创建索引优化查询性能
- ✅ **修改 `save_hourly_snapshot()` 函数，基于时间戳计算累计值**

**验证**：
```sql
-- 应该返回 submitted_at 字段信息
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'status_records'
  AND column_name = 'submitted_at';
```

---

### 步骤 2：清理旧数据（如果有）

如果你之前手动录入了数据（没有时间戳），需要先清理：

```sql
-- 复制并执行文件内容：OvertimeIndexApp/clear_today_real_data.sql
DELETE FROM status_records WHERE date = CURRENT_DATE;
```

**验证**：
```sql
-- 应该返回 0
SELECT COUNT(*) FROM status_records WHERE date = CURRENT_DATE;
```

---

### 步骤 3：插入测试数据 ⭐

插入带时间戳的测试数据（使用简化版，不依赖现有用户）：

```sql
-- 复制并执行文件内容：OvertimeIndexApp/insert_test_data_with_timestamps_simple.sql
```

**这个脚本会做什么**：
- ✅ 插入 9 条测试数据
- ✅ 每条数据都有具体的提交时间（7:30, 8:15, 9:00, 10:20, 11:45, 13:10, 14:30, 15:50, 16:20）
- ✅ 自动创建临时用户ID（不依赖现有用户）
- ✅ 自动显示累计统计验证

**验证**：
```sql
-- 应该返回 9
SELECT COUNT(*) FROM status_records WHERE date = CURRENT_DATE;

-- 查看数据分布
SELECT 
  TO_CHAR(submitted_at, 'HH24:MI') as time,
  is_overtime
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY submitted_at;
```

---

### 步骤 4：生成快照数据 ⭐

手动执行快照保存函数：

```sql
SELECT save_hourly_snapshot();
```

**这个函数会做什么**：
- ✅ 计算截止到当前整点的累计数据
- ✅ 保存到 `hourly_snapshots` 表
- ✅ 支持时间轴回溯功能

**验证**：
```sql
-- 应该看到当前小时的快照
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;
```

---

### 步骤 5：验证累计统计 ⭐

验证累计数据是否正确：

```sql
-- 截止到 10:00（应该是 3 或 4 人）
SELECT 
  COUNT(DISTINCT user_id) as participants,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '10 hours';

-- 截止到 14:00（应该是 6 或 7 人）
SELECT 
  COUNT(DISTINCT user_id) as participants,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '14 hours';

-- 截止到现在（应该是 9 人）
SELECT 
  COUNT(DISTINCT user_id) as participants,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time
FROM status_records
WHERE date = CURRENT_DATE;
```

---

### 步骤 6：测试应用

在应用中测试时间轴功能：

1. **查看实时数据**
   - 应该显示：参与人数 = 9
   - 加班 = 3，准时 = 6

2. **拖动到 10:00**
   - 应该显示：参与人数 = 3 或 4
   - 数据应该变化（不是 9）

3. **拖动到 14:00**
   - 应该显示：参与人数 = 6 或 7
   - 数据应该变化

4. **点击"现在"按钮**
   - 应该恢复显示：参与人数 = 9
   - 自动刷新应该恢复

---

## 📊 预期结果

### 测试数据分布（累计值）

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

---

## 🔍 故障排查

### 问题 1：显示 0 人

**检查**：
```sql
-- 1. 检查字段是否存在
SELECT column_name FROM information_schema.columns
WHERE table_name = 'status_records' AND column_name = 'submitted_at';

-- 2. 检查是否有数据
SELECT COUNT(*) FROM status_records WHERE date = CURRENT_DATE;

-- 3. 检查数据是否有时间戳
SELECT submitted_at FROM status_records WHERE date = CURRENT_DATE LIMIT 1;
```

**解决**：
- 如果字段不存在 → 执行步骤 1
- 如果没有数据 → 执行步骤 3
- 如果时间戳为 NULL → 重新执行步骤 1

### 问题 2：时间轴拖动后数据不变

**检查**：
```sql
-- 检查快照是否存在
SELECT * FROM hourly_snapshots WHERE snapshot_date = CURRENT_DATE;
```

**解决**：
- 如果没有快照 → 执行步骤 4
- 如果有快照但数据不对 → 删除快照后重新执行步骤 4

```sql
-- 删除旧快照
DELETE FROM hourly_snapshots WHERE snapshot_date = CURRENT_DATE;

-- 重新生成
SELECT save_hourly_snapshot();
```

### 问题 3：快照数据不是累计值

**检查**：
```sql
-- 查看快照函数定义
SELECT prosrc FROM pg_proc WHERE proname = 'save_hourly_snapshot';
```

**解决**：
- 重新执行步骤 1，确保函数定义正确
- 函数中应该有 `submitted_at <= v_cutoff_time` 这样的条件

---

## 📝 总结

完成以上步骤后，你的应用将支持：

✅ 记录用户提交状态的具体时间  
✅ 显示截止到任意时间点的累计数据  
✅ 时间轴回溯功能  
✅ 每小时自动保存快照  
✅ 为未来的时间分析功能打下基础

**关键点**：所有数据都是累计值，不是增量值！🎉

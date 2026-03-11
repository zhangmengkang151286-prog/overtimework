# 立即执行 - 修复时间轴功能

## 问题诊断
- ✅ 函数 `save_hourly_snapshot()` 已存在
- ❌ `submitted_at` 字段不存在
- ❌ 没有测试数据
- ❌ 没有快照数据
- ❌ 时间轴拖动数据不变化

## 解决方案：按顺序执行以下3个SQL脚本

### 步骤 1：添加时间戳字段
在 Supabase SQL Editor 中执行：
```
OvertimeIndexApp/add_timestamp_to_status_records.sql
```

**这个脚本会：**
- 给 `status_records` 表添加 `submitted_at` 字段
- 修改 `save_hourly_snapshot()` 函数支持基于时间戳的累计统计
- 创建索引优化查询性能

---

### 步骤 2：创建测试数据
在 Supabase SQL Editor 中执行：
```
OvertimeIndexApp/setup_realistic_test_data_v2.sql
```

**这个脚本会：**
- 删除所有历史数据（包括之前的100多人数据）
- 自动查找你的用户ID（或生成新的）
- 创建今天的多次提交（从早上到当前时间）
- 所有数据时间都不超过当前时间

**预期输出：**
```
已删除所有历史数据
当前时间: 2026-01-31 XX:XX:XX, 当前小时: XX
使用现有用户ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
成功创建 X 条提交记录（截止到当前时间）
```

---

### 步骤 3：生成快照
在 Supabase SQL Editor 中执行：
```sql
SELECT save_hourly_snapshot();
```

**预期输出：**
```
Hourly snapshot saved: date=2026-01-31, hour=XX, cutoff=..., participants=1
```

---

### 步骤 4：验证数据
在 Supabase SQL Editor 中执行：
```
OvertimeIndexApp/debug_snapshots.sql
```

**预期看到：**
1. ✅ `submitted_at` 字段存在
2. ✅ 今天有多条提交记录（带时间戳）
3. ✅ 有快照数据
4. ✅ 累计统计数据正确

---

## 执行后的效果

### 时间轴功能
- ✅ 拖动时间轴到不同时间点，显示该时间点的累计数据
- ✅ 时间轴不能拖动到未来时间（maxTime = 当前时间）
- ✅ 拖动时停止自动刷新（3s 和 7s）
- ✅ 点击"现在"按钮恢复自动刷新

### 数据显示
- ✅ 参与人数：累计值（去重）
- ✅ 实时对比：累计加班 vs 累计准时
- ✅ 标签分布：累计标签统计

---

## 如果遇到问题

### 问题1：找不到用户ID
**解决方案：** 脚本会自动生成新的测试用户ID

### 问题2：tags 表 type 字段错误
**解决方案：** 脚本已经使用 'custom' 类型创建标签

### 问题3：快照没有生成
**解决方案：** 手动执行 `SELECT save_hourly_snapshot();`

---

## 快速验证命令

```sql
-- 查看提交记录
SELECT 
  TO_CHAR(submitted_at, 'HH24:MI') as time,
  is_overtime,
  (SELECT name FROM tags WHERE id = tag_id) as tag
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY submitted_at;

-- 查看快照
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

## 下一步

执行完这4个步骤后：
1. 重启 App（刷新数据）
2. 拖动时间轴测试
3. 观察数据是否随时间点变化
4. 点击"现在"按钮测试

如果还有问题，把 `debug_snapshots.sql` 的执行结果发给我。

# 真实测试数据设置指南

## 🎯 目标

创建符合实际使用场景的测试数据：
- ✅ 删除所有历史数据（包括之前的100多人数据）
- ✅ 使用你的测试用户创建今天的多次提交
- ✅ 所有数据时间不超过当前时间（例如：21:51）
- ✅ 时间轴不能拖动到未来时间

## 📋 执行步骤

### 步骤 1：添加时间戳字段（如果还没执行）

```sql
-- 在 Supabase SQL Editor 中执行：
-- 文件：OvertimeIndexApp/add_timestamp_to_status_records.sql
```

### 步骤 2：设置真实测试数据 ⭐

```sql
-- 在 Supabase SQL Editor 中执行：
-- 文件：OvertimeIndexApp/setup_realistic_test_data.sql
```

**这个脚本会做什么**：
1. ✅ 删除所有历史数据（`hourly_snapshots`, `daily_status`, `status_records`）
2. ✅ 自动获取你的测试用户（最近创建的用户）
3. ✅ 创建今天的多次提交（从早上到当前时间）
4. ✅ 所有数据时间都不超过当前时间
5. ✅ 自动创建标签（如果不存在）

**提交时间点**（只创建不超过当前时间的）：
- 7:30 (准时) - 开会
- 9:15 (加班) - 写代码
- 11:00 (准时) - 开会
- 13:30 (加班) - 调试
- 15:45 (准时) - 写代码
- 17:20 (加班) - 开会
- 19:10 (准时) - 调试
- 20:30 (加班) - 写代码
- 21:45 (准时) - 开会

### 步骤 3：生成快照

```sql
-- 在 Supabase SQL Editor 中执行：
SELECT save_hourly_snapshot();
```

## ✅ 验证

### 验证数据
```sql
-- 查看今天的提交记录
SELECT 
  TO_CHAR(submitted_at, 'HH24:MI') as time,
  is_overtime,
  (SELECT name FROM tags WHERE id = tag_id) as tag_name
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY submitted_at;

-- 查看统计
SELECT 
  COUNT(*) as total_submissions,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count
FROM status_records
WHERE date = CURRENT_DATE;
```

### 验证快照
```sql
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

## 🎮 应用中测试

### 1. 查看实时数据
- 应该显示：参与人数 = 1（你的测试用户）
- 提交次数 = 根据当前时间（例如 21:51 应该有 8 次提交）

### 2. 拖动时间轴
- **拖动到 10:00**：应该显示截止到 10:00 的累计数据（2次提交）
- **拖动到 14:00**：应该显示截止到 14:00 的累计数据（4次提交）
- **拖动到 20:00**：应该显示截止到 20:00 的累计数据（7次提交）
- **不能拖动到未来**：时间轴最多只能拖到当前时间（21:51）

### 3. 点击"现在"按钮
- 应该恢复显示实时数据
- 自动刷新应该恢复

## 🔧 代码修改

### TrendPage.tsx
已修改 `getTimeAxisRange()` 函数：
```typescript
// 实际结束时间：不超过当前时间
const workdayEnd = now < workdayTheoryEnd ? now : workdayTheoryEnd;
```

这确保了：
- ✅ 时间轴的 `maxTime` 不超过当前时间
- ✅ 用户不能拖动到未来时间
- ✅ 时间轴范围动态调整

## 📊 预期结果

### 当前时间 21:51 时

| 时间点 | 累计提交次数 | 累计加班 | 累计准时 |
|--------|-------------|---------|---------|
| 10:00  | 2           | 1       | 1       |
| 14:00  | 4           | 2       | 2       |
| 20:00  | 7           | 3       | 4       |
| 21:51  | 8           | 4       | 4       |

### 时间轴行为
- ✅ 可以拖动到 6:00 - 21:51 之间的任意时间
- ❌ 不能拖动到 21:51 之后（未来时间）
- ✅ 拖动时显示对应时间点的累计数据
- ✅ 点击"现在"恢复到实时数据

## 🔍 故障排查

### 问题 1：没有找到测试用户
```sql
-- 检查用户
SELECT id, phone, created_at FROM users ORDER BY created_at DESC LIMIT 5;

-- 如果没有用户，先创建一个
-- 参考：OvertimeIndexApp/create_test_user_simple.sql
```

### 问题 2：数据时间超过当前时间
```sql
-- 检查数据
SELECT 
  TO_CHAR(submitted_at, 'YYYY-MM-DD HH24:MI:SS') as submitted_time,
  TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as current_time
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY submitted_at DESC;

-- 如果有未来数据，重新执行 setup_realistic_test_data.sql
```

### 问题 3：时间轴可以拖到未来
- 确保已经修改了 `TrendPage.tsx` 中的 `getTimeAxisRange()` 函数
- 重新启动应用

## 📝 总结

✅ 删除了所有历史数据  
✅ 使用你的测试用户创建多次提交  
✅ 所有数据时间不超过当前时间  
✅ 时间轴不能拖动到未来  
✅ 支持累计统计和时间轴回溯

现在你的应用完全符合真实使用场景了！🎉

# 累计数据功能 - 快速设置

## 🎯 目标
实现基于时间戳的累计统计，让时间轴可以回溯查看任意时间点的累计数据。

## ⚡ 快速执行（3步）

### 1️⃣ 添加时间戳字段
```sql
-- 在 Supabase SQL Editor 中执行：
-- 文件：OvertimeIndexApp/add_timestamp_to_status_records.sql
```

### 2️⃣ 设置真实测试数据（推荐）⭐

**选项 A：自动查找用户（推荐）**
```sql
-- 在 Supabase SQL Editor 中执行：
-- 文件：OvertimeIndexApp/setup_realistic_test_data.sql
-- 
-- 这个脚本会：
-- ✅ 自动使用最近创建的用户
-- ✅ 删除所有历史数据（包括之前的100多人数据）
-- ✅ 创建今天的多次提交
-- ✅ 所有数据时间不超过当前时间
-- ✅ 时间轴只能拖动到已有数据的时间点
```

**选项 B：手动指定用户ID（如果选项A失败）**
```sql
-- 1. 先查询你的用户ID：
SELECT id, username, phone_number FROM users ORDER BY created_at DESC LIMIT 5;

-- 2. 复制你的用户ID，然后执行：
-- 文件：OvertimeIndexApp/setup_realistic_test_data_manual.sql
-- 注意：需要将脚本中的 'YOUR_USER_ID_HERE' 替换为你的实际用户ID
```

**或者使用简单测试数据**（如果没有测试用户）：
```sql
-- 文件：OvertimeIndexApp/insert_test_data_with_timestamps_simple.sql
```

### 3️⃣ 生成快照
```sql
-- 在 Supabase SQL Editor 中执行：
SELECT save_hourly_snapshot();
```

## ✅ 验证

### 快速验证
```sql
-- 1. 检查数据量（应该是 9）
SELECT COUNT(*) FROM status_records WHERE date = CURRENT_DATE;

-- 2. 检查累计统计（截止到 14:00 应该是 6 或 7 人）
SELECT COUNT(DISTINCT user_id) as participants
FROM status_records
WHERE date = CURRENT_DATE
  AND submitted_at <= CURRENT_DATE + INTERVAL '14 hours';

-- 3. 检查快照（应该有当前小时的快照）
SELECT snapshot_hour, participant_count
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE;
```

## 📊 预期结果

| 时间点 | 累计人数 |
|--------|---------|
| 10:00  | 3-4 人  |
| 14:00  | 6-7 人  |
| 16:00  | 8-9 人  |
| 现在   | 9 人    |

## 🔍 故障排查

### 问题：显示 0 人
```sql
-- 检查字段是否存在
SELECT column_name FROM information_schema.columns
WHERE table_name = 'status_records' AND column_name = 'submitted_at';

-- 检查数据
SELECT COUNT(*), MIN(submitted_at), MAX(submitted_at)
FROM status_records WHERE date = CURRENT_DATE;
```

### 问题：时间轴拖动无效
```sql
-- 删除旧快照并重新生成
DELETE FROM hourly_snapshots WHERE snapshot_date = CURRENT_DATE;
SELECT save_hourly_snapshot();
```

## 📝 核心设计

✅ 所有数据都是**累计值**（不是增量）  
✅ 基于 `submitted_at` 时间戳计算  
✅ 时间轴回溯显示截止到那个时间点的累计数据

## 📚 详细文档

- `EXECUTE_CUMULATIVE_SETUP.md` - 完整执行指南
- `CUMULATIVE_DATA_VERIFICATION.md` - 详细验证指南
- `TIMESTAMP_MIGRATION_GUIDE.md` - 迁移说明

---

**完成后，在应用中测试时间轴功能！** 🎉

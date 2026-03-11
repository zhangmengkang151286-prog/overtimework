# 快速修复 App 显示问题

## 问题
- 6点显示9个人（应该显示0人）
- 13点显示1个人但标签为0（应该有标签数据）

## 快速修复步骤

### 步骤1：生成缺失的快照（6-7点）
在 Supabase SQL Editor 中执行：

```sql
-- 执行 fix_missing_snapshots.sql
-- 这会生成 6-23 点的所有快照
```

### 步骤2：清除 realtime_cache（如果存在）
```sql
-- 检查表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'realtime_cache'
);

-- 如果存在，删除所有数据
DELETE FROM realtime_cache;
```

### 步骤3：验证快照数据
```sql
-- 应该看到 6-23 点的快照
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

预期结果：
- 6点：0人，0加班，0准点
- 7点：0人，0加班，0准点
- 8点：1人，0加班，1准点
- 13点：1人，1加班，2准点，标签数量>0
- 22点：1人，4加班，5准点

### 步骤4：重启 App
1. 完全关闭 App（从任务管理器中结束进程）
2. 重新启动 App
3. 等待数据加载完成

### 步骤5：测试时间轴
拖动时间轴到不同时间点，验证：
- 6点 → 0人
- 8点 → 1人，0加班，1准点
- 13点 → 1人，1加班，2准点，标签有数据
- 22点 → 1人，4加班，5准点

## 如果问题仍然存在

### 诊断1：检查 App 日志
在 App 控制台中查找：
```
[HourlySnapshot] Loading snapshot for hour: X
[HourlySnapshot] Snapshot loaded: ...
```

### 诊断2：检查数据库连接
```sql
-- 测试 get_real_time_stats 函数
SELECT * FROM get_real_time_stats();
```

### 诊断3：检查标签数据
```sql
-- 查看 13 点的标签分布
SELECT tag_distribution
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
AND snapshot_hour = 13;
```

应该返回类似：
```json
[
  {
    "tag_id": "...",
    "tag_name": "开会",
    "overtime_count": 0,
    "on_time_count": 2,
    "total_count": 2
  },
  {
    "tag_id": "...",
    "tag_name": "写代码",
    "overtime_count": 1,
    "on_time_count": 0,
    "total_count": 1
  }
]
```

## 预期修复结果

修复后，时间轴应该：
1. 可以拖动到 6-23 点的任意整点
2. 每个时间点显示正确的累计数据
3. 标签分布不为空（除了 6-7 点）
4. 拖动时停止自动刷新
5. 点击"现在"恢复自动刷新

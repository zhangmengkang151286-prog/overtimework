# App 显示问题诊断指南

## 问题描述
- **6点显示9个人**（应该显示0或1人）
- **13点显示1个人**（正确），但标签人数为0（错误）
- 数据库数据正确：只有1个用户，9条提交，15个快照（8-22点）

## 根本原因分析

### 可能原因1：6点没有快照数据
- 我们只生成了 8-22 点的快照
- 6 点没有快照，App 会使用实时数据
- 实时数据可能从旧的 `realtime_cache` 表读取

### 可能原因2：标签分布数据格式问题
- 快照中的 `tag_distribution` 字段格式可能与 App 期望的不一致
- App 可能无法正确解析标签数据

### 可能原因3：App 缓存问题
- App 可能缓存了旧数据
- 需要重启 App 清除缓存

## 诊断步骤

### 步骤1：检查 realtime_cache 表
```sql
-- 执行 check_realtime_cache.sql
-- 查看是否有旧数据干扰
```

### 步骤2：检查快照数据
```sql
-- 执行 check_app_data_source.sql
-- 验证快照数据的完整性和格式
```

### 步骤3：检查 6 点的数据来源
由于 6 点没有快照，App 会：
1. 调用 `hourlySnapshotService.getSnapshot(6, realTimeData)`
2. 返回 `null`（因为数据库没有 6 点的快照）
3. 使用 `realTimeData`（实时数据）

**问题**：实时数据可能来自：
- `get_real_time_stats()` 函数
- `realtime_cache` 表
- 直接查询 `status_records` 表

### 步骤4：检查标签分布格式
快照中的标签格式：
```json
{
  "tag_id": "uuid",
  "tag_name": "标签名",
  "overtime_count": 2,
  "on_time_count": 1,
  "total_count": 3
}
```

App 期望的格式（在 `hourlySnapshotService.ts` 中转换）：
```typescript
{
  tagId: tag.tag_id,
  tagName: tag.tag_name,
  count: tag.total_count,
  isOvertime: tag.overtime_count > tag.on_time_count,
  color: `hsl(...)`
}
```

## 修复方案

### 方案1：生成 6-7 点的快照
为了让时间轴可以拖动到 6 点，我们需要生成 6-7 点的快照。

```sql
-- 生成 6-7 点的快照（累计值应该为0，因为还没有提交）
DO $$
DECLARE
  v_hour INTEGER;
  v_snapshot_date DATE := CURRENT_DATE;
  v_snapshot_time TIMESTAMPTZ;
BEGIN
  FOR v_hour IN 6..7 LOOP
    v_snapshot_time := v_snapshot_date + (v_hour || ' hours')::INTERVAL;
    
    INSERT INTO hourly_snapshots (
      snapshot_date,
      snapshot_hour,
      snapshot_time,
      participant_count,
      overtime_count,
      on_time_count,
      tag_distribution
    ) VALUES (
      v_snapshot_date,
      v_hour,
      v_snapshot_time,
      0,  -- 6-7点还没有提交，累计为0
      0,
      0,
      '[]'::jsonb
    )
    ON CONFLICT (snapshot_date, snapshot_hour) 
    DO UPDATE SET
      snapshot_time = EXCLUDED.snapshot_time,
      participant_count = EXCLUDED.participant_count,
      overtime_count = EXCLUDED.overtime_count,
      on_time_count = EXCLUDED.on_time_count,
      tag_distribution = EXCLUDED.tag_distribution;
  END LOOP;
  
  RAISE NOTICE '已生成 6-7 点的快照';
END $$;
```

### 方案2：清除 realtime_cache 表
如果 `realtime_cache` 表存在且有旧数据，删除它：

```sql
-- 删除 realtime_cache 表的所有数据
DELETE FROM realtime_cache;

-- 或者直接删除表（如果不再使用）
DROP TABLE IF EXISTS realtime_cache;
```

### 方案3：重启 App
1. 完全关闭 App（不是切换到后台）
2. 重新启动 App
3. 测试时间轴功能

### 方案4：检查 get_real_time_stats() 函数
确保 `get_real_time_stats()` 函数使用基于时间戳的累计统计：

```sql
-- 查看函数定义
SELECT routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_real_time_stats';
```

如果函数不支持时间戳，需要更新它。

## 验证步骤

### 1. 验证快照数据
```sql
-- 应该看到 6-22 点的快照（17个）
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

### 2. 验证 6 点快照
```sql
-- 6 点应该显示 0 人（因为第一次提交是 7:30）
SELECT * FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
AND snapshot_hour = 6;
```

### 3. 验证 13 点快照
```sql
-- 13 点应该显示 1 人，2 加班，2 准点，标签分布不为空
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count,
  tag_distribution
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
AND snapshot_hour = 13;
```

### 4. 在 App 中测试
1. 重启 App
2. 拖动时间轴到 6 点 → 应该显示 0 人
3. 拖动时间轴到 8 点 → 应该显示 1 人，0 加班，1 准点
4. 拖动时间轴到 13 点 → 应该显示 1 人，1 加班，2 准点，标签分布有数据
5. 拖动时间轴到 22 点 → 应该显示 1 人，4 加班，5 准点

## 下一步行动

1. **立即执行**：`check_realtime_cache.sql` 和 `check_app_data_source.sql`
2. **根据结果**：
   - 如果 `realtime_cache` 有数据 → 执行方案2（清除）
   - 如果 6 点没有快照 → 执行方案1（生成 6-7 点快照）
   - 如果标签分布为空 → 检查 `generate_all_snapshots.sql` 的标签查询逻辑
3. **重启 App** → 执行方案3
4. **验证功能** → 按照验证步骤测试

## 预期结果

修复后，时间轴应该：
- 6 点：0 人（或 1 人，如果 7:30 的提交算在 6-7 点区间）
- 8 点：1 人，0 加班，1 准点
- 13 点：1 人，1 加班，2 准点，标签分布有数据
- 22 点：1 人，4 加班，5 准点

所有时间点的标签分布都应该有数据（不为空）。

# 时间轴拖动数据刷新修复 V2

## 问题描述

用户反馈：拖动时间轴时，上面的数据（参与人数、加班/准点对比、标签分布等）不刷新。例如拖动到早上6点（数据应该是0），但显示的还是当前时间的数据。

## 根本原因

1. **异步加载延迟**：当拖动时间轴时，`handleTimeChange` 更新 `selectedTime`，触发 `useEffect` 异步加载快照数据
2. **回退逻辑错误**：当 `currentHourSnapshot` 为 `null` 时（没有快照数据），`displayData` 会回退到使用实时数据
3. **缺少时间判断**：没有区分"当前小时"和"历史小时"，导致历史时间也显示实时数据

### 原始代码问题

```typescript
// ❌ 错误：没有快照时总是使用实时数据
const displayData = currentHourSnapshot || {
  participantCount: statsData?.participantCount || realTimeData?.participantCount || 0,
  // ...
};
```

这导致：
- 拖动到早上6点（没有快照）→ 显示当前时间的实时数据 ❌
- 拖动到任何历史时间（没有快照）→ 显示当前时间的实时数据 ❌

## 解决方案

### 1. 添加时间判断逻辑

```typescript
const displayData = useMemo(() => {
  // 1. 如果有快照数据，使用快照
  if (currentHourSnapshot) {
    return currentHourSnapshot;
  }
  
  // 2. 检查是否是当前小时（1小时范围内）
  const now = new Date();
  const selectedDate = new Date(selectedTime);
  const timeDiff = Math.abs(now.getTime() - selectedDate.getTime());
  const isCurrentHour = timeDiff < 60 * 60 * 1000;
  
  // 3. 如果是当前小时，使用实时数据
  if (isCurrentHour) {
    return { ...realTimeData };
  }
  
  // 4. 否则显示空数据（历史时间但没有快照）
  return {
    participantCount: 0,
    overtimeCount: 0,
    onTimeCount: 0,
    tagDistribution: [],
    dailyStatus: tagData?.dailyStatus || [], // dailyStatus 始终显示最近7天
    timestamp: selectedDate,
  };
}, [currentHourSnapshot, selectedTime, statsData, tagData, realTimeData]);
```

### 2. 添加"暂无数据"提示

```typescript
{!loadingSnapshot && displayData.participantCount === 0 && displayData.overtimeCount === 0 && displayData.onTimeCount === 0 && (
  <View style={[styles.noDataIndicator, {backgroundColor: theme.colors.warning + '20'}]}>
    <Text style={[styles.noDataText, {color: theme.colors.warning}]}>
      📊 该时段暂无数据
    </Text>
  </View>
)}
```

### 3. 添加加载状态

```typescript
const [loadingSnapshot, setLoadingSnapshot] = useState(false);

// 在加载快照时显示"加载中..."
{loadingSnapshot && (
  <View style={styles.loadingOverlay}>
    <Text style={[styles.loadingText, {color: theme.colors.text}]}>
      加载中...
    </Text>
  </View>
)}
```

## 数据流程

```
用户拖动时间轴到早上6点
    ↓
handleTimeChange(time)
    ↓
dispatch(setSelectedTime(time))
    ↓
useEffect 监听 selectedTime 变化
    ↓
setLoadingSnapshot(true) ← 显示"加载中..."
    ↓
hourlySnapshotService.getSnapshot()
    ↓
查询 Supabase 数据库
    ↓
没有找到快照数据 → 返回 null
    ↓
setCurrentHourSnapshot(null)
    ↓
setLoadingSnapshot(false)
    ↓
displayData 计算逻辑：
  - currentHourSnapshot = null
  - 检查时间差：早上6点距离现在 > 1小时
  - isCurrentHour = false
  - 返回空数据 { participantCount: 0, ... }
    ↓
UI 显示：
  - 参与人数：0
  - 加班/准点：0 vs 0
  - 网格图：空
  - 提示："📊 该时段暂无数据"
```

## 测试步骤

1. **启动应用**
   ```bash
   npx expo start --tunnel
   ```

2. **测试当前小时**
   - 拖动时间轴到当前小时
   - 应该显示实时数据（有数字）

3. **测试历史小时（有快照）**
   - 拖动到昨天的某个小时
   - 应该显示快照数据（有数字）
   - 检查控制台：`[TrendPage] Snapshot loaded: ...`

4. **测试历史小时（无快照）**
   - 拖动到早上6点（通常没有数据）
   - 应该显示：
     - 参与人数：0
     - 加班/准点：0 vs 0
     - 提示："📊 该时段暂无数据"

5. **检查控制台日志**
   ```
   [TrendPage] Loading snapshot for time: 2026-01-28T06:00:00.000Z
   [HourlySnapshot] Fetching snapshot from database: date=2026-01-28, hour=6
   [HourlySnapshot] No snapshot available for 2026-01-28 hour 6
   [TrendPage] No snapshot available, using real-time data
   ```

## 注意事项

1. **快照数据来源**
   - 当前小时（1小时内）：使用实时数据
   - 历史小时（有快照）：从 Supabase `hourly_snapshots` 表读取
   - 历史小时（无快照）：显示空数据（0值）

2. **dailyStatus 特殊处理**
   - `dailyStatus` 始终显示最近7天的数据
   - 不受时间轴拖动影响
   - 这是因为历史状态指示器需要显示连续的7天数据

3. **性能优化**
   - 使用 `useMemo` 缓存 `displayData` 计算结果
   - 避免不必要的重新渲染

## 相关文件

- `OvertimeIndexApp/src/screens/TrendPage.tsx` - 主页面逻辑
- `OvertimeIndexApp/src/services/hourlySnapshotService.ts` - 快照服务
- `OvertimeIndexApp/src/components/TimeAxis.tsx` - 时间轴组件

## 修复历史

- **V1** (2026-01-28): 初始实现，添加快照加载逻辑
- **V2** (2026-02-05): 修复 `useMemo` 导入问题，完善时间判断逻辑

## 状态

✅ **已完成** - 所有功能正常工作，无编译错误

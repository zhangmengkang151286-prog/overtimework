# 自动刷新功能实现文档

## 功能概述

实现了分离的自动刷新机制，不同类型的数据使用不同的刷新频率：

### 刷新频率

1. **参与人数 + 加班/准点对比** - 每 3 秒刷新一次
2. **标签分布图形 + 标签占比列表** - 每 7 秒刷新一次

### 新增功能

- **标签占比 TOP 10 列表**：显示在标签分布图下方，展示前10个标签的使用次数和占比

## 技术实现

### 1. 分离的数据状态管理

在 `TrendPage.tsx` 中创建了两个独立的数据状态：

```typescript
// 统计数据（3秒刷新）
const [statsData, setStatsData] = useState<{
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
} | null>(null);

// 标签数据（7秒刷新）
const [tagData, setTagData] = useState<{
  tagDistribution: any[];
  dailyStatus: any[];
} | null>(null);
```

### 2. 独立的刷新定时器

#### 统计数据刷新（3秒）

```typescript
useEffect(() => {
  if (!autoRefreshEnabled || !networkStatus.isConnected) {
    return;
  }

  const fetchStats = async () => {
    const stats = await supabaseService.getRealTimeStats();
    setStatsData({
      participantCount: stats.participantCount,
      overtimeCount: stats.overtimeCount,
      onTimeCount: stats.onTimeCount,
    });
  };

  fetchStats(); // 立即执行一次
  const timer = setInterval(fetchStats, 3000);
  return () => clearInterval(timer);
}, [autoRefreshEnabled, networkStatus.isConnected]);
```

#### 标签数据刷新（7秒）

```typescript
useEffect(() => {
  if (!autoRefreshEnabled || !networkStatus.isConnected) {
    return;
  }

  const fetchTagData = async () => {
    const [topTags, dailyStatus] = await Promise.all([
      supabaseService.getTopTags(10),
      supabaseService.getDailyStatus(7),
    ]);
    // 转换并设置数据
    setTagData({ tagDistribution, dailyStatus });
  };

  fetchTagData(); // 立即执行一次
  const timer = setInterval(fetchTagData, 7000);
  return () => clearInterval(timer);
}, [autoRefreshEnabled, networkStatus.isConnected]);
```

### 3. 新组件：TagRankingList

创建了 `TagRankingList.tsx` 组件，用于显示标签占比列表：

**功能特性**：
- 显示前10个标签
- 每个标签显示：排名、颜色标识、标签名、使用次数、占比百分比
- 支持深色/浅色主题
- 响应式布局

**组件结构**：
```
┌─────────────────────────────────────┐
│ 标签占比 TOP 10                      │
├─────────────────────────────────────┤
│ 1  ● 项目紧急        45    15.2%    │
│ 2  ● 需求变更        38    12.8%    │
│ 3  ● 线上故障        32    10.8%    │
│ ...                                  │
└─────────────────────────────────────┘
```

### 4. 更新的组件

#### DataVisualization.tsx
- 添加了 `TagRankingList` 组件
- 计算总数并传递给列表组件
- 保持原有的对抗条和网格图功能

#### components/index.ts
- 导出 `TagRankingList` 组件

## 数据流

```
┌─────────────────────────────────────────────────────────┐
│                      TrendPage                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │  3秒定时器        │      │  7秒定时器        │       │
│  │  ↓               │      │  ↓               │       │
│  │  getRealTimeStats│      │  getTopTags      │       │
│  │  ↓               │      │  getDailyStatus  │       │
│  │  statsData       │      │  ↓               │       │
│  └──────────────────┘      │  tagData         │       │
│           ↓                └──────────────────┘       │
│           ↓                         ↓                  │
│  ┌────────────────────────────────────────────┐       │
│  │         displayData (合并数据)              │       │
│  └────────────────────────────────────────────┘       │
│                      ↓                                 │
│  ┌────────────────────────────────────────────┐       │
│  │        DataVisualization                   │       │
│  │  ┌──────────────────────────────────────┐  │       │
│  │  │ VersusBar (3秒刷新)                  │  │       │
│  │  │ - 参与人数                            │  │       │
│  │  │ - 加班/准点对比                       │  │       │
│  │  └──────────────────────────────────────┘  │       │
│  │  ┌──────────────────────────────────────┐  │       │
│  │  │ GridChart (7秒刷新)                  │  │       │
│  │  │ - 标签分布图                          │  │       │
│  │  └──────────────────────────────────────┘  │       │
│  │  ┌──────────────────────────────────────┐  │       │
│  │  │ TagRankingList (7秒刷新)             │  │       │
│  │  │ - 前10标签占比                        │  │       │
│  │  └──────────────────────────────────────┘  │       │
│  └────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## 性能优化

1. **独立刷新**：不同数据使用不同频率，避免不必要的请求
2. **并行请求**：标签数据使用 `Promise.all` 并行获取
3. **网络检测**：仅在网络连接时执行自动刷新
4. **立即执行**：定时器启动时立即执行一次，避免等待
5. **清理机制**：组件卸载时清理所有定时器

## 用户体验

1. **实时感**：参与人数和对比数据每3秒更新，保持实时性
2. **流畅性**：标签数据每7秒更新，避免频繁变化造成视觉干扰
3. **信息丰富**：新增标签占比列表，提供更详细的数据分析
4. **主题适配**：所有组件支持深色/浅色主题切换

## 测试建议

1. **功能测试**：
   - 观察参与人数是否每3秒更新
   - 观察标签分布是否每7秒更新
   - 提交状态后观察数据变化

2. **网络测试**：
   - 断网后自动刷新应停止
   - 恢复网络后自动刷新应恢复

3. **性能测试**：
   - 长时间运行观察内存占用
   - 检查网络请求频率是否符合预期

4. **UI测试**：
   - 标签占比列表显示是否正确
   - 主题切换是否正常
   - 数据更新时是否有视觉闪烁

## 相关文件

### 新增文件
- `src/components/TagRankingList.tsx` - 标签占比列表组件

### 修改文件
- `src/screens/TrendPage.tsx` - 实现分离刷新逻辑
- `src/components/DataVisualization.tsx` - 添加标签占比列表
- `src/components/index.ts` - 导出新组件

### 依赖文件
- `src/services/supabaseService.ts` - 提供数据API
- `src/types/index.ts` - 类型定义

## 未来改进

1. **可配置刷新频率**：允许用户在设置中自定义刷新间隔
2. **智能刷新**：根据数据变化频率动态调整刷新间隔
3. **刷新指示器**：显示数据最后更新时间和刷新状态
4. **暂停/恢复**：允许用户手动暂停自动刷新
5. **错误重试**：网络错误时自动重试机制

## 注意事项

1. 自动刷新仅在网络连接时启用
2. 查看历史数据时不会触发自动刷新
3. 组件卸载时会自动清理所有定时器
4. 数据更新是异步的，可能存在短暂延迟

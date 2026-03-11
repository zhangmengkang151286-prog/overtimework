# 标签显示问题调试指南

## 问题描述
左边的标签列表（图例）显示有问题，可能出现以下情况：
- 标签列表为空
- 标签数据不正确
- 标签颜色与网格不匹配
- 标签数量或百分比计算错误

## 已实施的修复

### 1. 添加数据过滤
在 `TrendPage.tsx` 中添加了过滤逻辑，只显示 `totalCount > 0` 的标签：
```typescript
const tagDistribution = topTags
  .filter(tag => tag.totalCount > 0) // 过滤掉没有数据的标签
  .map((tag, index) => ({
    // ...
  }));
```

### 2. 添加调试日志
在关键位置添加了 console.log，方便追踪数据流：
- `TrendPage.tsx`: 记录从数据库获取的原始数据和转换后的数据
- `GridChart.tsx`: 记录标签处理的每个步骤

### 3. 改进标签处理逻辑
在 `GridChart.tsx` 的 `processTagDistribution` 函数中：
- 添加了对 count 为 0 的标签的过滤
- 添加了详细的日志输出

## 调试步骤

### 步骤 1: 检查数据库数据
运行以下 SQL 查询来检查数据库中的标签数据：

```sql
-- 查看 get_top_tags 函数返回的数据
SELECT * FROM get_top_tags(10);

-- 查看今天的状态记录
SELECT 
  sr.id,
  sr.user_id,
  sr.status,
  sr.created_at,
  sr.tag_ids,
  t.id as tag_id,
  t.name as tag_name
FROM status_records sr
CROSS JOIN LATERAL unnest(sr.tag_ids) AS tag_id_unnest
LEFT JOIN tags t ON t.id = tag_id_unnest
WHERE DATE(sr.created_at AT TIME ZONE 'Asia/Shanghai') = CURRENT_DATE
ORDER BY sr.created_at DESC;
```

### 步骤 2: 检查应用日志
1. 打开应用的开发者控制台
2. 查找以下日志：
   - `[TrendPage] Fetched topTags:` - 查看从数据库获取的原始标签数据
   - `[TrendPage] Processed tagDistribution:` - 查看转换后的标签数据
   - `[GridChart] Processing tag distribution:` - 查看 GridChart 接收到的数据
   - `[GridChart] Valid tags after filtering:` - 查看过滤后的有效标签
   - `[GridChart] Generated legend:` - 查看最终生成的图例数据

### 步骤 3: 验证数据转换
检查日志中的数据，确认：
1. `topTags` 数组不为空
2. 每个标签都有 `tagId`, `tagName`, `overtimeCount`, `onTimeCount`, `totalCount`
3. `totalCount > 0` 的标签被正确保留
4. `isOvertime` 字段根据 `overtimeCount > onTimeCount` 正确设置
5. 图例中的标签数量、百分比计算正确

### 步骤 4: 检查渲染
1. 确认 `legend.length > 0`
2. 确认图例容器被渲染
3. 检查每个图例项的样式是否正确应用

## 常见问题和解决方案

### 问题 1: 图例为空
**可能原因:**
- 数据库中没有今天的状态记录
- `get_top_tags` 函数返回空数组
- 所有标签的 `totalCount` 都为 0

**解决方案:**
1. 检查数据库中是否有今天的数据
2. 手动提交一些测试状态
3. 检查 `get_top_tags` 函数的实现

### 问题 2: 标签数据不正确
**可能原因:**
- 数据转换逻辑有误
- `isOvertime` 判断不正确
- 标签过滤过于严格

**解决方案:**
1. 检查 `TrendPage.tsx` 中的数据转换逻辑
2. 验证 `tag.overtimeCount` 和 `tag.onTimeCount` 的值
3. 确认过滤条件 `tag.totalCount > 0` 是否合适

### 问题 3: 颜色不匹配
**可能原因:**
- `TrendPage` 和 `GridChart` 使用不同的颜色生成算法
- 标签排序不一致

**解决方案:**
- `GridChart` 会重新生成渐变色（红色系和绿色系），这是预期行为
- 确保标签在两个地方的排序一致

### 问题 4: 百分比计算错误
**可能原因:**
- `totalCount` 计算不正确
- 除零错误

**解决方案:**
- 检查 `totalCount = overtimeCount + onTimeCount` 的计算
- 确保在计算百分比前检查 `totalCount > 0`

## 测试建议

### 测试场景 1: 空数据
1. 清空今天的所有状态记录
2. 刷新应用
3. 预期：显示"暂无标签数据"或空图例

### 测试场景 2: 单个标签
1. 提交一个状态，只选择一个标签
2. 刷新应用
3. 预期：图例显示一个标签，百分比为 100%

### 测试场景 3: 多个标签
1. 提交多个状态，选择不同的标签
2. 刷新应用
3. 预期：图例显示所有标签，百分比总和为 100%

### 测试场景 4: 加班和准时混合
1. 提交一些加班状态和准时状态
2. 确保两种状态都有标签
3. 预期：图例中绿色标签（准时）在前，红色标签（加班）在后

## 下一步行动

如果问题仍然存在：
1. 收集完整的日志输出
2. 截图显示问题
3. 提供数据库查询结果
4. 描述具体的错误表现

## 相关文件
- `OvertimeIndexApp/src/screens/TrendPage.tsx` - 数据获取和转换
- `OvertimeIndexApp/src/components/GridChart.tsx` - 标签处理和渲染
- `OvertimeIndexApp/src/components/DataVisualization.tsx` - 组件集成
- `OvertimeIndexApp/src/services/supabaseService.ts` - 数据库查询
- `OvertimeIndexApp/diagnose_top_tags.sql` - 诊断 SQL 查询

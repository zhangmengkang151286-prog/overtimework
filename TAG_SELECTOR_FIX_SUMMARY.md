# 标签选择器错误修复总结

## 🐛 问题描述

在实现新的全屏标签选择器后，应用出现了以下错误：

```
ErrorBoundary caught an error: [TypeError: Cannot assign to read-only property]
Call Stack: SearchableSelector (src\components\SearchableSelector.tsx)
```

## 🔍 根本原因

在 `SearchableSelector.tsx` 的 `filteredItems` useMemo 中，直接对 `items` 数组调用 `.sort()` 方法：

```typescript
// ❌ 错误代码
return items
  .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
  .slice(0, 50);
```

**问题**：
- `items` 数组来自 Redux store，是只读的（immutable）
- `.sort()` 方法会直接修改原数组
- 尝试修改只读数组导致 `TypeError: Cannot assign to read-only property`

## ✅ 解决方案

使用展开运算符 `[...items]` 创建数组副本，然后对副本进行排序：

```typescript
// ✅ 正确代码
return [...items]
  .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
  .slice(0, 50);
```

**修复原理**：
1. `[...items]` 创建一个新数组（浅拷贝）
2. 对新数组调用 `.sort()` 不会影响原数组
3. Redux store 中的数据保持不可变

## 🔧 修复的文件

- `OvertimeIndexApp/src/components/SearchableSelector.tsx` (第 46 行)

## 📊 修复前后对比

### 修复前
```typescript
const filteredItems = useMemo(() => {
  if (!searchQuery.trim()) {
    return items
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 50);
  }
  // ...
}, [items, searchQuery]);
```

### 修复后
```typescript
const filteredItems = useMemo(() => {
  if (!searchQuery.trim()) {
    return [...items]  // 创建副本
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 50);
  }
  // ...
}, [items, searchQuery]);
```

## ✨ 测试结果

修复后应用应该能够：
- ✅ 正常打开标签选择器
- ✅ 显示按使用频率排序的50个标签
- ✅ 搜索功能正常工作
- ✅ 不再出现 TypeError 错误

## 📝 经验教训

1. **Redux 数据不可变性**：从 Redux store 获取的数据是只读的，不能直接修改
2. **数组方法注意事项**：
   - `.sort()`, `.reverse()`, `.splice()` 等方法会修改原数组
   - 使用前应先创建副本：`[...array]` 或 `array.slice()`
3. **useMemo 中的数据处理**：在 useMemo 中处理数据时，确保不修改外部状态

## 🎯 下一步

应用现在应该可以正常使用了！请测试：
1. 点击"提交今日状态"按钮
2. 选择"加班"或"准点下班"
3. 查看全屏标签选择器
4. 搜索标签功能
5. 选择标签并提交

---

**修复时间**: 2026-01-29
**修复状态**: ✅ 完成

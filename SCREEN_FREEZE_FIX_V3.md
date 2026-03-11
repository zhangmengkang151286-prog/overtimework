# 屏幕卡住问题修复 V3

## 问题描述

测试账号第二次提交准点下班后，屏幕卡住无法滑动。

## 问题分析

### 根本原因

`SearchableSelector` 组件使用全屏Modal (`transparent={false}`)，当用户选择标签后：

1. `handleTagSelect` 被调用
2. `setShowTagSelector(false)` 设置状态
3. 几乎同时调用 `submitStatus`
4. `TrendPage` 的 `onStatusSelect` 被触发
5. Modal卸载可能有延迟，导致遮罩层残留

### 时序问题

```
用户选择标签
  ↓
setShowTagSelector(false)  ← 状态更新是异步的
  ↓
submitStatus()             ← 立即执行
  ↓
onStatusSelect()           ← 触发父组件
  ↓
Modal还在卸载中...         ← 遮罩层残留
```

## 解决方案

### 修改 1：增加延迟时间

将延迟从 100ms 增加到 150ms，给Modal更多时间完全卸载：

```typescript
const handleTagSelect = (tag: Tag) => {
  setSelectedTag(tag);
  
  // 立即关闭标签选择器
  setShowTagSelector(false);

  if (selectedStatus === true) {
    // 延迟显示时长选择，确保标签选择器完全关闭
    setTimeout(() => {
      setStep('hours');
    }, 150);
  } else {
    // 延迟提交确保UI完全更新
    setTimeout(() => {
      submitStatus(false, tag.id, undefined);
    }, 150);
  }
};
```

### 修改 2：确保 onClose 回调正确

```typescript
<SearchableSelector
  visible={showTagSelector}
  onClose={() => {
    // 确保关闭标签选择器
    setShowTagSelector(false);
  }}
  // ... 其他props
/>
```

## 修改文件

- `OvertimeIndexApp/src/components/UserStatusSelector.tsx`

## 测试步骤

1. 重启应用
2. 登录测试账号
3. 提交第一次准点下班
4. 提交第二次准点下班
5. 观察屏幕是否卡住
6. 尝试滑动屏幕
7. 检查是否有灰色遮罩层

## 预期结果

✅ 选择标签后，Modal完全关闭
✅ 屏幕可以正常滑动
✅ 没有灰色遮罩层残留
✅ 数据正常提交和刷新

## 如果问题仍然存在

### 临时解决方案

重启应用可以清除残留的Modal状态。

### 进一步调试

1. 检查控制台是否有错误
2. 查看是否有多个Modal同时显示
3. 检查 `visible` 状态是否正确更新

### 终极方案

如果问题持续，可以考虑：

1. 将 `SearchableSelector` 改为 `transparent={true}`
2. 添加强制卸载逻辑
3. 使用 `key` prop 强制重新渲染

## 完成状态

✅ 代码已修改
✅ 延迟时间已增加到 150ms
✅ onClose 回调已加强
⏳ 需要测试验证

## 下一步

重启应用并测试多次提交功能。

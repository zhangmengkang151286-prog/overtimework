# 屏幕卡住修复 V5 - 增强延迟和调试

## 问题

用户反馈：提交状态后屏幕还是卡住了，同时有序列化报错。

## 本次修复内容

### 1. 增加 Modal 卸载延迟

**文件**：`src/screens/TrendPage.tsx`

```typescript
// ❌ 之前：200ms 延迟
await new Promise(resolve => setTimeout(resolve, 200));

// ✅ 现在：500ms 延迟
await new Promise(resolve => setTimeout(resolve, 500));
```

**原因**：iOS 上 Modal 卸载需要更多时间，特别是嵌套 Modal。

### 2. 优化标签选择流程

**文件**：`src/components/UserStatusSelector.tsx`

```typescript
// ✅ 使用 requestAnimationFrame + setTimeout
const handleTagSelect = (tag: Tag) => {
  setShowTagSelector(false);
  
  requestAnimationFrame(() => {
    setTimeout(() => {
      // 执行下一步操作
    }, 300); // 增加到 300ms
  });
};
```

**原因**：
- `requestAnimationFrame` 确保在下一帧执行
- `setTimeout` 提供额外的缓冲时间
- 双重保险确保 Modal 完全卸载

### 3. 强化状态重置

**文件**：`src/components/UserStatusSelector.tsx`

```typescript
useEffect(() => {
  if (!visible) {
    // 延迟重置，避免与卸载冲突
    const resetTimer = setTimeout(() => {
      setStep('status');
      setSelectedStatus(null);
      setSelectedTag(null);
      setSelectedHours(1);
      setShowTagSelector(false);
    }, 100);
    
    return () => clearTimeout(resetTimer);
  }
}, [visible]);
```

**原因**：确保所有状态在 Modal 完全卸载后才重置。

### 4. 添加详细调试日志

在关键位置添加日志：

```typescript
// TrendPage.tsx
console.log('[TrendPage] handleStatusSelect - Start');
console.log('[TrendPage] Closing status selector...');
console.log('[TrendPage] Waiting for Modal to unmount (500ms)...');
console.log('[TrendPage] Submitting user status...');
console.log('[TrendPage] Submission successful');
console.log('[TrendPage] Auto-refreshing data after submission...');
console.log('[TrendPage] Refresh complete');
console.log('[TrendPage] handleStatusSelect - End');

// UserStatusSelector.tsx
console.log('[UserStatusSelector] handleTagSelect - Tag:', tag.name);
console.log('[UserStatusSelector] Closing tag selector...');
console.log('[UserStatusSelector] requestAnimationFrame callback');
console.log('[UserStatusSelector] Moving to hours selection...');
console.log('[UserStatusSelector] Submitting on-time status...');

// SearchableSelector.tsx
console.log('[SearchableSelector] handleSelect - Item:', item.name);
console.log('[SearchableSelector] handleClose');
```

**用途**：帮助诊断卡住发生在哪个环节。

## 测试步骤

### 1. 重启应用

```bash
# 停止当前服务
Ctrl+C

# 清除缓存并重启
npm start -- --reset-cache
```

### 2. 打开调试控制台

确保能看到所有日志输出。

### 3. 测试准点下班

1. 点击"提交今日状态"
2. 选择"准点下班"
3. 选择一个标签

**观察**：
- 控制台日志流程
- 屏幕是否卡住
- 是否有序列化警告

**预期日志顺序**：
```
[UserStatusSelector] handleTagSelect - Tag: 项目上线
[UserStatusSelector] Closing tag selector...
[SearchableSelector] handleSelect - Item: 项目上线
[UserStatusSelector] requestAnimationFrame callback
[UserStatusSelector] Submitting on-time status...
[TrendPage] handleStatusSelect - Start
[TrendPage] Closing status selector...
[TrendPage] Waiting for Modal to unmount (500ms)...
[TrendPage] Submitting user status...
[TrendPage] Submission successful
[TrendPage] Auto-refreshing data after submission...
[TrendPage] Refresh complete
[TrendPage] handleStatusSelect - End
```

### 4. 测试加班

1. 点击"提交今日状态"
2. 选择"加班"
3. 选择一个标签
4. 选择加班时长
5. 点击"确认提交"

**观察**：
- 控制台日志流程
- 时长选择界面是否正常显示
- 屏幕是否卡住
- 是否有序列化警告

**预期日志顺序**：
```
[UserStatusSelector] handleTagSelect - Tag: 紧急需求
[UserStatusSelector] Closing tag selector...
[SearchableSelector] handleSelect - Item: 紧急需求
[UserStatusSelector] requestAnimationFrame callback
[UserStatusSelector] Moving to hours selection...
(用户选择时长并点击确认)
[TrendPage] handleStatusSelect - Start
[TrendPage] Closing status selector...
[TrendPage] Waiting for Modal to unmount (500ms)...
[TrendPage] Submitting user status...
[TrendPage] Submission successful
[TrendPage] Auto-refreshing data after submission...
[TrendPage] Refresh complete
[TrendPage] handleStatusSelect - End
```

### 5. 连续提交测试

作为测试账号，连续提交 3-5 次，确保：
- ✅ 每次都能正常提交
- ✅ 屏幕从不卡住
- ✅ 参与人数正确累加
- ✅ 没有序列化警告

## 如果还是卡住

### 情况 A：卡在标签选择后

**日志停在**：
```
[UserStatusSelector] Closing tag selector...
```

**说明**：`SearchableSelector` 的 Modal 没有正常卸载。

**解决方案**：
1. 检查 `SearchableSelector` 的 `visible` prop 是否正确更新
2. 尝试增加 `handleTagSelect` 中的延迟到 500ms
3. 考虑移除 `SearchableSelector` 的 Modal，改用其他方式

### 情况 B：卡在提交前

**日志停在**：
```
[TrendPage] Waiting for Modal to unmount (500ms)...
```

**说明**：`UserStatusSelector` 的 Modal 没有正常卸载。

**解决方案**：
1. 增加 `TrendPage` 中的延迟到 1000ms
2. 检查 `showStatusSelector` 状态是否正确更新
3. 考虑移除 `UserStatusSelector` 的 Modal

### 情况 C：卡在提交中

**日志停在**：
```
[TrendPage] Submitting user status...
```

**说明**：网络请求阻塞或 Redux 更新问题。

**解决方案**：
1. 检查网络连接
2. 查看 Supabase 请求是否超时
3. 检查是否有其他错误日志

### 情况 D：卡在刷新中

**日志停在**：
```
[TrendPage] Auto-refreshing data after submission...
```

**说明**：自动刷新与提交冲突。

**解决方案**：
1. 临时禁用自动刷新
2. 增加刷新延迟
3. 检查刷新逻辑是否有死循环

## 序列化警告处理

如果还有序列化警告，记录完整信息：

```
A non-serializable value was detected in an action, in the path: `payload.XXX`
Value: XXX
Action: {"payload": {...}, "type": "XXX"}
```

**需要的信息**：
1. `path` 是什么？（例如：`payload.timestamp`）
2. `Value` 是什么类型？（例如：Date 对象）
3. `type` 是哪个 action？（例如：`user/setUser`）

根据这些信息，我们可以：
1. 在 dispatch 前序列化该字段
2. 在 Redux store 配置中忽略该 action
3. 修改数据结构避免非序列化值

## 延迟时间说明

当前延迟配置：
- `TrendPage.handleStatusSelect`: 500ms（Modal 卸载）
- `UserStatusSelector.handleTagSelect`: 300ms（标签选择后）
- `UserStatusSelector.useEffect`: 100ms（状态重置）

**总延迟**：最多 800ms（500 + 300）

如果这还不够，可以继续增加：
- 500ms → 1000ms
- 300ms → 500ms
- 100ms → 200ms

但延迟太长会影响用户体验，需要权衡。

## 最终目标

- ✅ 提交后屏幕不卡住
- ✅ 可以连续多次提交
- ✅ 没有序列化警告
- ✅ 参与人数正确累加
- ✅ 用户体验流畅

## 下一步

根据测试结果：

### 如果修复成功
→ 可以考虑优化延迟时间
→ 移除调试日志（或改为开发模式专用）
→ 完成功能

### 如果还是卡住
→ 提供完整的控制台日志
→ 说明卡在哪个环节
→ 尝试诊断文档中的其他方案

### 如果有序列化警告
→ 提供完整的警告信息
→ 继续修复序列化问题

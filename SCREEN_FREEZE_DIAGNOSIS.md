# 屏幕卡住问题 - 完整诊断方案

## 当前状态

已完成的修复：
- ✅ Redux 序列化警告（timestamp, createdAt, updatedAt）
- ✅ 动画状态丢失（useRef 保持引用）
- ✅ Modal 透明化（transparent={true}）

**但用户反馈：提交后屏幕还是卡住了**

## 可能的原因

### 1. 序列化问题未完全解决
虽然我们已经修复了大部分，但可能还有其他地方：
- ❓ `setUser` action 中的 Date 对象
- ❓ 其他 Redux actions 中的非序列化数据

### 2. Modal 卸载延迟
即使使用 `transparent={true}`，iOS 上的 Modal 卸载仍可能有延迟：
- ❓ 需要更长的延迟时间
- ❓ 需要强制卸载机制

### 3. 网络请求阻塞
提交状态时的网络请求可能阻塞 UI：
- ❓ Supabase 请求未使用异步
- ❓ 没有超时机制

### 4. 状态更新冲突
多个状态同时更新可能导致 UI 冻结：
- ❓ Redux 状态更新过于频繁
- ❓ 自动刷新与提交冲突

## 诊断步骤

### 步骤 1：检查控制台日志

重启应用，提交状态，查看控制台：

```bash
# 查找这些关键信息
- "A non-serializable value was detected" - 序列化警告
- "Auto-refreshing" - 自动刷新日志
- "User status submitted" - 提交成功日志
- 任何错误堆栈
```

**关键问题**：
1. 是否还有序列化警告？
2. 警告中的 `path` 是什么？
3. 是否有其他错误？

### 步骤 2：测试不同场景

#### 场景 A：关闭自动刷新
如果自动刷新与提交冲突，关闭它：

**临时修改** `TrendPage.tsx`：
```typescript
// 第 60 行左右
const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false); // ← 改为 false
```

**测试**：提交状态，看是否还卡住

#### 场景 B：增加延迟
如果 Modal 卸载需要更多时间：

**临时修改** `TrendPage.tsx`：
```typescript
// 第 280 行左右
const handleStatusSelect = async (submission: UserStatusSubmission) => {
  setShowStatusSelector(false);
  
  // 增加延迟到 500ms
  await new Promise(resolve => setTimeout(resolve, 500)); // ← 改为 500
  
  const success = await submitUserStatus(submission);
  // ...
};
```

**测试**：提交状态，看是否还卡住

#### 场景 C：禁用动画
如果动画导致问题：

**临时修改** `UserStatusSelector.tsx`：
```typescript
// 第 35 行左右
useEffect(() => {
  if (visible) {
    // 注释掉动画
    // Animated.spring(slideAnim, {
    //   toValue: 1,
    //   useNativeDriver: true,
    //   tension: 50,
    //   friction: 8,
    // }).start();
    slideAnim.setValue(1); // ← 直接设置值
  } else {
    // ...
  }
}, [visible]);
```

**测试**：提交状态，看是否还卡住

### 步骤 3：检查 Modal 层级

可能有多个 Modal 同时存在：

**检查** `TrendPage.tsx` 和 `UserStatusSelector.tsx`：
- `TrendPage` 有菜单 Modal
- `UserStatusSelector` 有状态选择 Modal
- `SearchableSelector` 有标签选择 Modal

**可能的问题**：3 个 Modal 嵌套导致卸载失败

## 推荐的修复方案

### 方案 1：完全移除 UserStatusSelector 的 Modal

将 `UserStatusSelector` 改为直接渲染，不使用 Modal：

**文件**：`src/components/UserStatusSelector.tsx`

```typescript
// 移除 Modal，直接使用 Animated.View
return (
  <>
    {visible && !showTagSelector && (
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, {backgroundColor}, animationStyle]}>
          {step === 'status' && renderStatusSelection()}
          {step === 'hours' && renderHoursSelection()}
        </Animated.View>
      </View>
    )}
    
    <SearchableSelector
      visible={showTagSelector}
      // ...
    />
  </>
);
```

### 方案 2：使用 Portal

使用 `react-native-paper` 的 Portal 来管理 Modal：

```bash
npm install react-native-paper
```

```typescript
import {Portal} from 'react-native-paper';

return (
  <Portal>
    <Modal visible={visible} ...>
      {/* 内容 */}
    </Modal>
  </Portal>
);
```

### 方案 3：强制卸载机制

在关闭 Modal 后强制清理：

**文件**：`src/components/UserStatusSelector.tsx`

```typescript
const handleTagSelect = (tag: Tag) => {
  setSelectedTag(tag);
  setShowTagSelector(false);
  
  // 强制清理
  requestAnimationFrame(() => {
    if (selectedStatus === true) {
      setStep('hours');
    } else {
      submitStatus(false, tag.id, undefined);
    }
  });
};
```

## 立即测试方案

### 最简单的测试：增加延迟

**修改** `TrendPage.tsx` 第 280 行：

```typescript
const handleStatusSelect = async (submission: UserStatusSubmission) => {
  setShowStatusSelector(false);
  
  // 增加延迟到 1000ms（1秒）
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const success = await submitUserStatus(submission);
  if (success) {
    Alert.alert('提交成功', '您的工作状态已记录');
    await refresh();
  } else {
    Alert.alert('提交失败', '请检查网络连接后重试');
  }
};
```

**重启应用，测试提交**

如果 1 秒延迟能解决问题，说明是 Modal 卸载延迟。
如果还是卡住，说明是其他原因（网络、状态更新等）。

## 下一步

根据测试结果：

### 如果延迟有效
→ 实施方案 1 或方案 3（移除 Modal 或强制卸载）

### 如果延迟无效
→ 检查网络请求和状态更新
→ 查看控制台日志
→ 可能需要禁用自动刷新

### 如果还有序列化警告
→ 继续修复序列化问题
→ 检查所有 Redux actions

## 需要用户提供的信息

1. **控制台日志**：提交时的完整日志
2. **序列化警告**：如果有，完整的警告信息
3. **测试结果**：
   - 关闭自动刷新是否有效？
   - 增加延迟是否有效？
   - 禁用动画是否有效？

## 临时解决方案

如果以上都不行，可以暂时：

1. **禁用自动刷新**
2. **使用 1 秒延迟**
3. **提交后手动刷新**

这样至少能保证功能可用，然后慢慢排查根本原因。

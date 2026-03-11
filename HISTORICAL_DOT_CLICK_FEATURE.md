# 历史状态圆点点击功能

## 功能描述

为历史状态指示器的圆点添加点击功能，点击后显示该日期的详细统计信息。

## 实现内容

### 1. 添加点击交互

- 将每个圆点包裹在 `TouchableOpacity` 中
- 设置 `activeOpacity={0.7}` 提供点击反馈
- 添加 `onPress` 事件处理函数

### 2. 信息显示

点击圆点后，使用 `Alert.alert` 显示弹窗：

#### 历史数据（红点/绿点）
```
标题：X月X日
内容：
准点下班 - XX人
加班 - XX人
```

#### 今天数据（黄点）
```
标题：X月X日
内容：今天还未出结果
```

### 3. 日期格式化

- 使用 `formatDate` 函数将日期转换为 "X月X日" 格式
- 支持 `Date` 对象和 ISO 字符串两种输入格式

## 代码修改

### 文件：`src/components/HistoricalStatusIndicator.tsx`

#### 新增函数

```typescript
/**
 * 格式化日期显示
 */
const formatDate = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

/**
 * 处理圆点点击
 */
const handleDotPress = (item: DailyStatus) => {
  const dateStr = formatDate(item.date);
  const isPending = item.status === 'pending';
  
  if (isPending) {
    Alert.alert(
      `${dateStr}`,
      '今天还未出结果',
      [{text: '确定', style: 'default'}]
    );
  } else {
    Alert.alert(
      `${dateStr}`,
      `准点下班 - ${item.onTimeCount}人\n加班 - ${item.overtimeCount}人`,
      [{text: '确定', style: 'default'}]
    );
  }
};
```

#### 修改渲染逻辑

```typescript
return (
  <TouchableOpacity
    key={`${item.date}-${index}`}
    onPress={() => handleDotPress(item)}
    activeOpacity={0.7}
  >
    <Animated.View
      style={[
        styles.statusDot,
        {
          backgroundColor: dotColor,
          opacity: isPending ? blinkAnim : 1,
        },
      ]}
    />
  </TouchableOpacity>
);
```

## 使用示例

### 场景 1：点击历史红点（加班多）
```
弹窗显示：
标题：1月23日
内容：
准点下班 - 7人
加班 - 18人
```

### 场景 2：点击历史绿点（准时下班多）
```
弹窗显示：
标题：1月24日
内容：
准点下班 - 20人
加班 - 10人
```

### 场景 3：点击今天黄点（pending）
```
弹窗显示：
标题：1月31日
内容：今天还未出结果
```

## 用户体验

1. **视觉反馈**：点击时圆点透明度变为 70%
2. **信息清晰**：使用原生 Alert 弹窗，简洁明了
3. **操作简单**：单击即可查看详情
4. **格式友好**：日期显示为中文格式（X月X日）

## 测试要点

1. ✅ 点击红点显示正确的加班/准时下班人数
2. ✅ 点击绿点显示正确的加班/准时下班人数
3. ✅ 点击黄点显示"今天还未出结果"
4. ✅ 日期格式正确（X月X日）
5. ✅ 点击反馈流畅（透明度变化）
6. ✅ 弹窗可以正常关闭

## 注意事项

- 使用 React Native 的 `Alert.alert` API
- 在 iOS 和 Android 上表现一致
- 不会影响圆点的闪烁动画
- 不会影响现有的自动刷新功能

---

**日期**: 2025-01-31
**状态**: 已完成
**影响**: 用户可以点击历史圆点查看详细统计信息

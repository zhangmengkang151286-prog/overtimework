# Glassmorphism 风格示例 - 今日参与人数卡片

## 完成时间
2026-02-13

## 概述

这是一个玻璃拟态（Glassmorphism）风格的示例卡片，用于展示效果。该示例**不影响现有代码**，是一个独立的组件。

---

## 示例文件

**文件位置**: `src/components/GlassmorphismCard.example.tsx`

这是一个完整的玻璃拟态风格卡片示例，展示了：
- 深蓝至黑色线性渐变背景
- 半透明玻璃卡片
- 发光数字效果
- 极细边框
- 现代字体排版

---

## 设计规范实现

### 1. 全局底色 ✅
```typescript
// 深蓝至黑色线性渐变
<LinearGradient
  colors={['#020617', '#000000']}
  start={{x: 0, y: 0}}
  end={{x: 0, y: 1}}
/>
```

### 2. 卡片材质 ✅
```typescript
backgroundColor: 'rgba(255, 255, 255, 0.05)', // 半透明背景
borderWidth: 0.5,                              // 极细边框
borderColor: 'rgba(255, 255, 255, 0.2)',      // 边框颜色
borderRadius: 16,                              // 圆角
```

### 3. 发光数字效果 ✅
```typescript
// 主数字发光
textShadowColor: 'rgba(0, 217, 255, 0.8)',
textShadowOffset: {width: 0, height: 0},
textShadowRadius: 20,

// 准时下班数字（青色发光）
color: '#00D9FF',
textShadowColor: 'rgba(0, 217, 255, 0.6)',
textShadowRadius: 12,

// 加班数字（红色发光）
color: '#EF4444',
textShadowColor: 'rgba(239, 68, 68, 0.6)',
textShadowRadius: 12,
```

### 4. 现代字体排版 ✅
```typescript
fontFamily: 'System',  // 系统字体（iOS: SF Pro, Android: Roboto）
letterSpacing: 1,      // 1px 字间距
fontWeight: '600',     // 通过字重区分层级
```

---

## 关于背景模糊

### 当前实现
示例使用 `rgba(255, 255, 255, 0.05)` 半透明背景模拟玻璃效果。

### 真正的背景模糊（需要额外依赖）

如果要实现真正的背景模糊（Backdrop Blur），需要：

1. **安装依赖**:
```bash
npx expo install expo-blur expo-linear-gradient
```

2. **使用 BlurView**:
```typescript
import {BlurView} from 'expo-blur';

<BlurView
  intensity={20}
  tint="dark"
  style={styles.glassCard}
>
  {/* 卡片内容 */}
</BlurView>
```

### 性能考虑

⚠️ **重要提示**:
- `BlurView` 在 React Native 中性能开销较大
- 在低端设备上可能导致卡顿
- 建议先在目标设备上测试性能
- 可以考虑只在高端设备上启用模糊效果

---

## 如何测试示例

### ✅ 已集成到 TrendPage（推荐）

**最简单的测试方法**：

1. **启动应用**:
```bash
cd OvertimeIndexApp
npx expo start --clear
```

2. **在趋势页面中切换风格**:
   - 打开应用，进入趋势页面
   - 在"本轮参与人数"标题右侧，点击切换按钮
   - 🎨 玻璃拟态 ↔️ 💼 金融终端
   - 实时对比两种风格的效果

3. **观察效果**:
   - 玻璃拟态：深蓝渐变背景、半透明卡片、发光数字
   - 金融终端：纯黑背景、极细边框、等宽字体

### 方法 2: 创建独立测试页面（可选）

如果想单独测试，可以创建一个新的测试页面：

```typescript
// src/screens/GlassmorphismDemo.tsx
import React from 'react';
import {ScrollView} from 'react-native';
import {GlassmorphismCard} from '../components/GlassmorphismCard.example';

export const GlassmorphismDemo = () => {
  return (
    <ScrollView style={{flex: 1, backgroundColor: '#000'}}>
      <GlassmorphismCard
        participantCount={128}
        overtimeCount={45}
        onTimeCount={83}
      />
    </ScrollView>
  );
};
```

---

## 效果对比

### 硬核金融终端风格（当前）
- 纯黑背景 (#000000)
- 极细边框 (0.5px, #27272A)
- 统一 4px 圆角
- 等宽字体
- 无阴影、无渐变
- 干脆利落

### Glassmorphism 风格（示例）
- 深蓝渐变背景 (#020617 → #000000)
- 半透明玻璃卡片 (rgba(255, 255, 255, 0.05))
- 极细边框 (0.5px, rgba(255, 255, 255, 0.2))
- 16px 圆角
- 系统字体
- 发光数字效果
- 通透感、层次感

---

## 下一步决策

请查看示例效果后，选择以下方案之一：

### 方案 A: 全面切换到 Glassmorphism
- 替换所有组件为玻璃拟态风格
- 安装 expo-blur 实现真正的背景模糊
- 更新全局主题配置

### 方案 B: 保留两套主题
- 保留硬核金融终端风格
- 添加 Glassmorphism 作为可选主题
- 用户可以在设置中切换

### 方案 C: 混合使用
- 主要界面使用硬核金融终端风格
- 特定卡片使用 Glassmorphism 风格
- 创造独特的视觉层次

### 方案 D: 继续优化硬核金融终端风格
- 放弃 Glassmorphism
- 继续完善当前的硬核金融终端风格
- 专注于数据可视化和性能优化

---

## 技术限制

### React Native 的限制
1. **背景模糊**: 需要 `expo-blur`，性能开销较大
2. **文字发光**: 使用 `textShadow` 模拟，效果有限
3. **渐变**: 需要 `expo-linear-gradient`（需要安装）
4. **性能**: 玻璃拟态效果在低端设备上可能卡顿

### 建议
- 先在目标设备上测试性能
- 考虑提供"性能模式"选项
- 在低端设备上自动降级到简化版本

---

## 安装依赖（如果决定采用）

```bash
# 安装必需的依赖
npx expo install expo-blur expo-linear-gradient

# 重启开发服务器
npx expo start --clear
```

---

## 总结

示例已创建完成，展示了玻璃拟态风格的"今日参与人数"卡片。请测试效果后告诉我您的决定，我会根据您的选择继续执行相应的方案。

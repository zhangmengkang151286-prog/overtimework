# 主题系统快速参考

## 快速开始

```typescript
import {useTheme} from '../hooks/useTheme';

function MyComponent() {
  const theme = useTheme();
  // 现在可以使用 theme.colors, theme.typography, theme.spacing 等
}
```

## 常用颜色

### 背景色
```typescript
theme.colors.background          // 主背景色
theme.colors.backgroundSecondary // 次要背景色
theme.colors.surface             // 表面色(卡片等)
```

### 文本颜色
```typescript
theme.colors.text                // 主文本
theme.colors.textSecondary       // 次要文本
theme.colors.textTertiary        // 三级文本
```

### 状态颜色
```typescript
theme.colors.overtime            // 加班 - 红色
theme.colors.ontime              // 准时下班 - 绿色
theme.colors.pending             // 待定 - 黄色
```

### 语义颜色
```typescript
theme.colors.success             // 成功 - 绿色
theme.colors.warning             // 警告 - 橙色
theme.colors.error               // 错误 - 红色
theme.colors.info                // 信息 - 蓝色
```

## 常用排版

### 标题
```typescript
theme.typography.styles.h1       // 最大标题 (32px)
theme.typography.styles.h2       // 二级标题 (28px)
theme.typography.styles.h3       // 三级标题 (24px)
```

### 正文
```typescript
theme.typography.styles.body     // 正文 (16px)
theme.typography.styles.bodySmall // 小正文 (14px)
theme.typography.styles.caption  // 说明文字 (12px)
```

### 特殊样式
```typescript
theme.typography.styles.number   // 数字显示 (48px, 等宽)
theme.typography.styles.time     // 时间显示 (16px, 等宽)
theme.typography.styles.button   // 按钮文字 (16px)
```

## 常用间距

```typescript
theme.spacing.xs      // 4px
theme.spacing.sm      // 8px
theme.spacing.md      // 12px
theme.spacing.base    // 16px (推荐默认值)
theme.spacing.lg      // 20px
theme.spacing.xl      // 24px
theme.spacing['2xl'] // 32px
```

## 常用布局

### 圆角
```typescript
theme.layout.borderRadius.sm     // 4px
theme.layout.borderRadius.md     // 8px (推荐默认值)
theme.layout.borderRadius.lg     // 12px
theme.layout.borderRadius.xl     // 16px
```

### 阴影
```typescript
theme.layout.shadow.sm           // 小阴影
theme.layout.shadow.md           // 中等阴影 (推荐默认值)
theme.layout.shadow.lg           // 大阴影
```

### 边框
```typescript
theme.layout.borderWidth.hairline // 0.5px (iOS) / 1px (Android)
theme.layout.borderWidth.thin     // 1px (推荐默认值)
theme.layout.borderWidth.medium   // 2px
```

## 响应式工具

```typescript
import {responsive} from '../theme';

// 根据屏幕宽度缩放
responsive.scale(16)              // 在不同屏幕上自动调整

// 根据屏幕尺寸选择值
responsive.select({
  xs: 12,      // 小屏幕 (<375px)
  sm: 14,      // 中小屏幕 (375-414px)
  md: 16,      // 中等屏幕 (414-768px)
  lg: 18,      // 大屏幕 (768-1024px)
  default: 16, // 默认值
})
```

## 常用模式

### 卡片样式
```typescript
<View style={[
  {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.borderRadius.md,
    padding: theme.spacing.base,
  },
  theme.layout.shadow.md,
]}>
```

### 按钮样式
```typescript
<TouchableOpacity style={{
  backgroundColor: theme.colors.primary,
  paddingHorizontal: theme.spacing.lg,
  paddingVertical: theme.spacing.md,
  borderRadius: theme.layout.borderRadius.md,
}}>
  <Text style={[
    theme.typography.styles.button,
    {color: theme.colors.buttonPrimaryText}
  ]}>
    按钮文字
  </Text>
</TouchableOpacity>
```

### 输入框样式
```typescript
<TextInput style={{
  backgroundColor: theme.colors.input,
  borderWidth: theme.layout.borderWidth.thin,
  borderColor: theme.colors.inputBorder,
  borderRadius: theme.layout.borderRadius.md,
  padding: theme.spacing.md,
  color: theme.colors.text,
}} />
```

### 分隔线
```typescript
<View style={{
  height: theme.layout.borderWidth.hairline,
  backgroundColor: theme.colors.divider,
  marginVertical: theme.spacing.md,
}} />
```

## 主题判断

```typescript
import {useIsDarkMode} from '../hooks/useTheme';

function MyComponent() {
  const isDark = useIsDarkMode();
  
  return (
    <Text>{isDark ? '🌙 深色模式' : '☀️ 浅色模式'}</Text>
  );
}
```

## 工具函数

### 添加透明度
```typescript
import {addOpacity} from '../theme';

const semiTransparentColor = addOpacity(theme.colors.primary, 0.5);
// 结果: '#007AFF80'
```

### 创建边框
```typescript
import {createBorder} from '../theme';

<View style={createBorder(theme, 'thin', theme.colors.border)} />
```

### 创建圆角
```typescript
import {createBorderRadius} from '../theme';

<View style={createBorderRadius(theme, 'md')} />
```

## 动画配置

```typescript
import Animated, {withTiming} from 'react-native-reanimated';

// 使用主题动画配置
opacity.value = withTiming(1, {
  duration: theme.animations.duration.normal,
  easing: theme.animations.easing.easeOut,
});
```

## 最佳实践

1. ✅ 始终使用主题颜色，不要硬编码颜色值
2. ✅ 使用预定义的间距值，保持一致性
3. ✅ 使用排版样式，确保文字层次清晰
4. ✅ 使用响应式工具，适配不同屏幕
5. ✅ 使用主题工具函数，简化代码

6. ❌ 不要直接使用数字值作为间距
7. ❌ 不要硬编码颜色值
8. ❌ 不要忽略深色模式的适配
9. ❌ 不要在组件中重复定义相同的样式

## 调试技巧

### 查看当前主题
```typescript
console.log('Current theme:', theme.isDark ? 'dark' : 'light');
console.log('Primary color:', theme.colors.primary);
```

### 测试响应式
```typescript
console.log('Screen width:', theme.layout.screen.width);
console.log('Is tablet:', theme.layout.isTablet);
```

## 需要帮助？

- 查看完整文档: `src/theme/README.md`
- 查看使用示例: `src/theme/EXAMPLES.md`
- 查看实施总结: `THEME_SYSTEM_SUMMARY.md`

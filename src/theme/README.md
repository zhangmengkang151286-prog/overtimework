# 主题系统文档

## 概述

本应用实现了一个完整的设计系统，包括颜色、排版、间距、布局和动画等方面。主题系统支持浅色和深色两种模式，并提供了响应式布局工具。

## 验证需求

- **需求 3.2**: 主题切换功能
- **需求 11.1**: 简洁现代的设计语言
- **需求 11.2**: 清晰的排版和字体层次
- **需求 11.3**: 专业的配色方案
- **需求 11.4**: 视觉元素的对齐和间距一致性
- **需求 11.5**: 流畅的动画过渡和反馈效果
- **需求 1.5**: 响应式布局适配

## 使用方法

### 1. 在组件中使用主题

```typescript
import {useTheme} from '../hooks/useTheme';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <View style={{backgroundColor: theme.colors.background}}>
      <Text style={{color: theme.colors.text}}>
        Hello World
      </Text>
    </View>
  );
}
```

### 2. 使用主题模式判断

```typescript
import {useIsDarkMode} from '../hooks/useTheme';

function MyComponent() {
  const isDark = useIsDarkMode();
  
  return (
    <Text>{isDark ? '🌙' : '☀️'}</Text>
  );
}
```

### 3. 使用响应式工具

```typescript
import {responsive} from '../theme';

const styles = StyleSheet.create({
  container: {
    padding: responsive.scale(16),
    width: responsive.select({
      xs: '100%',
      md: '80%',
      lg: '60%',
      default: '100%',
    }),
  },
});
```

## 主题结构

### 颜色系统 (colors.ts)

提供完整的颜色方案，包括：
- 主色调和次要色调
- 语义颜色（成功、警告、错误、信息）
- 背景色和表面色
- 文本颜色
- 边框和分隔线颜色
- 状态颜色（加班、准时下班、待定）
- 按钮和输入框颜色
- 图表颜色

### 排版系统 (typography.ts)

提供统一的文字样式：
- 字体家族
- 字体大小（xs 到 6xl）
- 字重（light 到 extrabold）
- 行高和字间距
- 预定义样式（标题、正文、按钮、数字等）

### 间距系统 (spacing.ts)

提供一致的间距值：
- 基础间距单位（4px）
- 预定义间距值（xs 到 6xl）
- 内边距和外边距预设
- 容器和组件间距
- 屏幕边距

### 布局系统 (layout.ts)

提供布局相关工具：
- 屏幕尺寸和断点
- 圆角半径
- 边框宽度
- 阴影预设
- 不透明度
- 图标和按钮尺寸
- Z-index层级
- 响应式工具函数

### 动画系统 (animations.ts)

提供动画配置：
- 动画时长
- 缓动函数
- 预定义动画配置
- 交互动画
- 页面过渡动画

## 最佳实践

### 1. 使用主题颜色而非硬编码

❌ 不推荐：
```typescript
<View style={{backgroundColor: '#FFFFFF'}}>
```

✅ 推荐：
```typescript
<View style={{backgroundColor: theme.colors.background}}>
```

### 2. 使用预定义的间距值

❌ 不推荐：
```typescript
<View style={{padding: 17}}>
```

✅ 推荐：
```typescript
<View style={{padding: theme.spacing.base}}>
```

### 3. 使用排版样式

❌ 不推荐：
```typescript
<Text style={{fontSize: 32, fontWeight: '700'}}>
```

✅ 推荐：
```typescript
<Text style={theme.typography.styles.h1}>
```

### 4. 使用响应式工具

❌ 不推荐：
```typescript
<View style={{width: 300}}>
```

✅ 推荐：
```typescript
<View style={{width: responsive.scale(300)}}>
```

### 5. 使用预定义的阴影

❌ 不推荐：
```typescript
<View style={{
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 2},
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 4,
}}>
```

✅ 推荐：
```typescript
<View style={theme.layout.shadow.md}>
```

## 主题切换

主题切换通过 Redux 状态管理实现：

```typescript
import {useAppDispatch} from '../hooks/redux';
import {toggleTheme} from '../store/slices/uiSlice';

function ThemeToggleButton() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  
  return (
    <TouchableOpacity onPress={() => dispatch(toggleTheme())}>
      <Text>{theme.isDark ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
}
```

## 扩展主题

如需添加新的颜色或样式，请在相应的文件中添加：

1. 在 `colors.ts` 中添加新颜色
2. 在 `typography.ts` 中添加新的文字样式
3. 在 `spacing.ts` 中添加新的间距值
4. 在 `layout.ts` 中添加新的布局工具
5. 在 `animations.ts` 中添加新的动画配置

确保在 `lightColors` 和 `darkColors` 中都添加相应的值。

## 性能考虑

- 主题对象在应用启动时创建，不会在每次渲染时重新创建
- 使用 `useTheme` Hook 可以确保组件在主题变化时正确更新
- 响应式工具函数使用缓存的屏幕尺寸，避免重复计算

## 可访问性

主题系统考虑了可访问性：
- 深色模式下的颜色对比度符合 WCAG 标准
- 文字大小和行高确保可读性
- 触摸目标尺寸符合最小尺寸要求（44x44pt）

# 颜色迁移指南 - gluestack-ui Tokens

## 概述

本文档记录了从硬编码颜色值迁移到 gluestack-ui 颜色 tokens 的映射关系。

## gluestack-ui 颜色 Token 系统

### 背景色 Tokens
- `$backgroundLight0` - 浅色模式主背景 (#FFFFFF)
- `$backgroundLight50` - 浅色模式次要背景
- `$backgroundLight100` - 浅色模式第三背景
- `$backgroundDark900` - 深色模式主背景 (#09090B)
- `$backgroundDark950` - 深色模式最深背景 (#000000)

### 文本色 Tokens
- `$textLight900` - 浅色模式主文本 (#000000)
- `$textLight700` - 浅色模式次要文本
- `$textLight600` - 浅色模式第三文本
- `$textDark50` - 深色模式主文本 (#E8EAED)
- `$textDark300` - 深色模式次要文本
- `$textDark400` - 深色模式第三文本

### 边框色 Tokens
- `$borderLight200` - 浅色模式边框 (#E0E0E0)
- `$borderDark800` - 深色模式边框 (#27272A)

### 语义色 Tokens
- `$primary500` - 主色 (#00D9FF 青色)
- `$success500` - 成功色 (#00C896 绿色)
- `$error500` - 错误色 (#EF4444 红色)
- `$warning500` - 警告色 (#FFB020 黄色)
- `$info500` - 信息色 (#00D9FF 青色)

### 状态色变体
- `$error400` - 浅色错误
- `$success400` - 浅色成功
- `$primary100` - 极浅主色（用于选中背景）

## 需要更新的文件

### 1. GridChart.tsx ✅
**问题**: 使用 `rgb()` 函数生成渐变色
**解决方案**: 保留 RGB 生成逻辑，但使用 gluestack-ui 的颜色值作为起止点
- 起始色: `#09090B` (surface)
- 红色终点: `#EF4444` (destructive/error500)
- 青色终点: `#00D9FF` (primary500)

### 2. NetworkStatusBar.tsx ⚠️
**问题**: 使用 `rgba(255, 255, 255, 0.2)` 作为按钮背景
**解决方案**: 
- 方案1: 使用 `$backgroundLight100` / `$backgroundDark800`
- 方案2: 保留 rgba，因为这是半透明效果，gluestack-ui 没有对应 token

**决定**: 保留 rgba，添加注释说明这是设计需要的半透明效果

### 3. UserStatusSelector.tsx ⚠️
**问题**: 使用 `rgba(0, 0, 0, 0.8)` 作为遮罩背景
**解决方案**: 保留 rgba，这是 Modal 遮罩的标准做法

### 4. GlassmorphismCard.example.tsx ⚠️
**问题**: 大量使用 rgba 实现玻璃拟态效果
**解决方案**: 保留所有 rgba，这是玻璃拟态设计的核心特性

### 5. theme/colors.ts ✅
**问题**: 定义了自定义颜色系统
**解决方案**: 
- 保留现有颜色定义（用于非 gluestack 组件）
- 添加 gluestack-ui token 映射文档
- 新组件优先使用 gluestack-ui tokens

## 迁移原则

1. **gluestack-ui 组件**: 必须使用 gluestack-ui tokens
2. **自定义组件**: 优先使用 gluestack-ui tokens，特殊效果除外
3. **特殊效果**: 
   - 半透明效果 (rgba)
   - 渐变效果 (linear-gradient)
   - 玻璃拟态效果
   - 这些可以保留硬编码值，但需要添加注释说明

4. **深色模式支持**: 使用 `$dark-` 前缀或 `sx` 属性
   ```tsx
   <Box
     bg="$backgroundLight0"
     $dark-bg="$backgroundDark900"
   />
   ```

## 已完成的迁移

### gluestack 组件
- ✅ DataCard.tsx - 完全使用 gluestack-ui tokens
- ✅ StatusButton.tsx - 使用 action 属性（positive/negative/secondary）
- ✅ StatusIndicator.tsx - 使用 action 属性（success/error/warning）
- ✅ Button.tsx - 使用 action 和 variant 属性
- ✅ Input.tsx - 使用 gluestack-ui tokens（但引用了 theme/colors）

### 数据可视化组件
- ✅ VersusBar.tsx - 使用 $error500 和 $success500
- ✅ GridChart.tsx - 使用 gluestack-ui 颜色值生成渐变
- ✅ TimeAxis.tsx - 使用 gluestack-ui tokens

### 其他组件
- ⚠️ NetworkStatusBar.tsx - 保留 rgba（半透明效果）
- ⚠️ UserStatusSelector.tsx - 保留 rgba（遮罩效果）
- ⚠️ GlassmorphismCard.example.tsx - 保留 rgba（玻璃拟态）

## 需要修复的问题

### Input.tsx
**问题**: 引用了 `theme/colors` 而不是 gluestack-ui tokens
```tsx
import { colors } from '../../theme/colors';
// ...
color={colors.text}
placeholderTextColor={colors.muted}
```

**解决方案**: 使用 gluestack-ui tokens
```tsx
color="$textLight900"
$dark-color="$textDark50"
placeholderTextColor="$textLight600"
$dark-placeholderTextColor="$textDark400"
```

## 测试清单

- [ ] 浅色模式下所有颜色正常显示
- [ ] 深色模式下所有颜色正常显示
- [ ] 主题切换时颜色平滑过渡
- [ ] 所有语义色（成功/错误/警告）正确显示
- [ ] 边框和分隔线在两种模式下都可见
- [ ] 文本在两种模式下都有足够对比度

## 参考资源

- [gluestack-ui 颜色系统](https://gluestack.io/ui/docs/theme/colors)
- [gluestack-ui 主题配置](https://gluestack.io/ui/docs/theme/configuration)

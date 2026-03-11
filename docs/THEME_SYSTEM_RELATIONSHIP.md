# 主题系统关系说明

## 概述

本项目目前同时存在两套主题系统：

1. **旧主题系统** (`src/theme/`)
2. **Tamagui 主题系统** (`tamagui.config.ts`)

本文档说明两者的关系、使用场景和未来规划。

---

## 两套系统的关系

### 旧主题系统 (src/theme/)

**位置**: `src/theme/`

**组成**:
- `colors.ts` - 颜色定义
- `typography.ts` - 字体样式
- `spacing.ts` - 间距定义
- `layout.ts` - 布局常量
- `animations.ts` - 动画配置
- `utils.ts` - 工具函数

**使用场景**:
- 为 Tamagui 配置提供颜色值
- 少数未迁移的组件仍在使用
- 作为设计系统的参考文档

**示例**:

```typescript
// src/theme/colors.ts
export const darkColors = {
  background: '#0A0E0F',
  text: '#E8EAED',
  primary: '#00D9FF',
  // ...
}
```

### Tamagui 主题系统

**位置**: `tamagui.config.ts`

**组成**:
- 基于 `@tamagui/config/v2` 的默认配置
- 扩展的自定义主题（dark, light）
- 从旧主题系统导入的颜色值

**使用场景**:
- 所有新组件和已迁移组件
- 主题切换功能
- 响应式设计

**示例**:

```typescript
// tamagui.config.ts
import { darkColors, lightColors } from './src/theme/colors'

const appConfig = createTamagui({
  themes: {
    dark: {
      background: darkColors.background,
      color: darkColors.text,
      primary: darkColors.primary,
      // ...
    },
  },
})
```

---

## 当前状态

### 已迁移到 Tamagui

✅ 所有主要界面组件
✅ 基础 UI 组件（Button, Card, Input）
✅ 应用特定组件（DataCard, StatusButton, StatusIndicator）
✅ 数据可视化组件（VersusBar, GridChart, TimeAxis）
✅ 主题切换功能

### 仍使用旧主题系统

⚠️ 少数工具组件：
- `Toast` - 通知组件
- `NetworkStatusBar` - 网络状态栏
- `LoadingSkeleton` - 加载骨架屏
- `ErrorBoundary` - 错误边界

⚠️ Tamagui 配置本身（导入颜色值）

---

## 为什么保留旧主题系统？

### 1. 作为颜色值来源

Tamagui 配置需要从某处获取颜色值，旧主题系统提供了这些值：

```typescript
// tamagui.config.ts
import { darkColors, lightColors } from './src/theme/colors'

const appConfig = createTamagui({
  themes: {
    dark: {
      background: darkColors.background, // 从旧系统导入
      // ...
    },
  },
})
```

### 2. 设计系统文档

`src/theme/` 目录包含了完整的设计系统文档，包括：
- 颜色规范和使用说明
- 字体层次和使用场景
- 间距系统和最佳实践
- 动画配置和示例

这些文档对开发者很有价值。

### 3. 向后兼容

少数未迁移的组件仍在使用旧主题系统，保留它们可以确保应用正常运行。

---

## 使用指南

### 新组件开发

**✅ 推荐**: 使用 Tamagui 组件和主题系统

```tsx
import { View, Text, useTheme } from 'tamagui'
import { AppButton, AppCard } from '@/components/tamagui'

function MyComponent() {
  const theme = useTheme()
  
  return (
    <AppCard>
      <View backgroundColor={theme.background}>
        <Text color={theme.color}>内容</Text>
        <AppButton variant="primary">按钮</AppButton>
      </View>
    </AppCard>
  )
}
```

### 旧组件维护

**⚠️ 临时方案**: 继续使用旧主题系统

```tsx
import { View, Text } from 'react-native'
import { colors } from '../theme/colors'

function LegacyComponent() {
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>内容</Text>
    </View>
  )
}
```

### 访问颜色值

**场景 1**: 在 Tamagui 组件中

```tsx
import { useTheme } from 'tamagui'

const theme = useTheme()
const backgroundColor = theme.background
```

**场景 2**: 在非 Tamagui 组件中

```tsx
import { colors } from '../theme/colors'

const backgroundColor = colors.background
```

**场景 3**: 在配置文件中

```typescript
import { darkColors } from './src/theme/colors'

const config = {
  backgroundColor: darkColors.background,
}
```

---

## 未来规划

### 短期（1-2 个月）

1. **迁移剩余组件**
   - 将 Toast, NetworkStatusBar 等迁移到 Tamagui
   - 确保所有组件使用统一的主题系统

2. **优化 Tamagui 配置**
   - 考虑直接在 `tamagui.config.ts` 中定义颜色值
   - 减少对旧主题系统的依赖

### 中期（3-6 个月）

1. **评估旧主题系统**
   - 如果所有组件都已迁移，考虑移除旧系统
   - 保留设计文档，移除代码实现

2. **文档整合**
   - 将旧主题系统的文档整合到 Tamagui 文档中
   - 创建统一的设计系统文档

### 长期（6 个月以上）

1. **完全移除旧系统**
   - 删除 `src/theme/` 目录（保留文档）
   - 所有颜色值直接在 `tamagui.config.ts` 中定义

2. **设计系统演进**
   - 根据使用反馈优化设计系统
   - 添加更多主题变体（如高对比度模式）

---

## 迁移建议

### 对于新功能

**始终使用 Tamagui**

```tsx
// ✅ 推荐
import { AppButton, AppCard } from '@/components/tamagui'

// ❌ 不推荐
import { TouchableOpacity, View } from 'react-native'
import { colors } from '../theme/colors'
```

### 对于现有功能

**渐进式迁移**

1. 优先迁移高频使用的组件
2. 迁移后运行测试确保功能正常
3. 逐步减少对旧主题系统的依赖

### 对于设计规范

**参考旧系统文档**

旧主题系统的文档（如 `src/theme/README.md`）包含了详细的设计规范，在开发新组件时可以参考。

---

## 常见问题

### Q: 我应该使用哪个主题系统？

A: 
- **新组件**: 使用 Tamagui
- **旧组件维护**: 继续使用旧系统，但计划迁移
- **配置文件**: 可以从旧系统导入颜色值

### Q: 旧主题系统会被删除吗？

A: 
- **短期**: 不会，仍有组件在使用
- **中期**: 可能移除代码实现，保留文档
- **长期**: 完全移除，所有内容整合到 Tamagui

### Q: 如何确保两套系统的颜色一致？

A: Tamagui 配置从旧系统导入颜色值，确保了一致性：

```typescript
// tamagui.config.ts
import { darkColors } from './src/theme/colors'

const appConfig = createTamagui({
  themes: {
    dark: {
      background: darkColors.background, // 保证一致
    },
  },
})
```

### Q: 我可以直接修改旧主题系统的颜色吗？

A: 可以，但需要注意：
1. 修改后需要重启应用
2. 确保 Tamagui 配置也更新了
3. 运行测试确保没有破坏现有功能

---

## 相关文档

- [Tamagui 使用指南](./TAMAGUI_GUIDE.md)
- [Tamagui 迁移指南](./TAMAGUI_MIGRATION_GUIDE.md)
- [旧主题系统文档](../src/theme/README.md)
- [设计系统规范](../.kiro/specs/ui-design-system/design.md)

---

**最后更新**: 2026-02-12  
**版本**: v1.0

# Tamagui 迁移指南

## 目录

1. [迁移概述](#迁移概述)
2. [迁移前准备](#迁移前准备)
3. [组件迁移映射](#组件迁移映射)
4. [样式迁移](#样式迁移)
5. [主题系统迁移](#主题系统迁移)
6. [常见迁移场景](#常见迁移场景)
7. [迁移检查清单](#迁移检查清单)
8. [故障排除](#故障排除)

---

## 迁移概述

本指南帮助你将现有的 React Native 组件迁移到 Tamagui 组件系统。

### 迁移策略

- **渐进式迁移**: 逐步替换组件，不影响现有功能
- **保持兼容**: 迁移过程中保持 API 兼容性
- **测试驱动**: 每次迁移后运行测试确保功能正常

### 迁移状态

| 阶段 | 状态 | 说明 |
|------|------|------|
| 基础设施搭建 | ✅ 完成 | Tamagui 配置和主题系统 |
| 核心组件创建 | ✅ 完成 | Button, Card, Input 等基础组件 |
| 应用特定组件 | ✅ 完成 | DataCard, StatusButton 等 |
| 界面迁移 | ✅ 完成 | 所有主要界面已迁移 |
| 主题切换功能 | ✅ 完成 | 深色/浅色模式切换 |
| 性能优化 | ✅ 完成 | 编译时优化和懒加载 |
| 测试和验证 | ✅ 完成 | 单元测试和集成测试 |

---

## 迁移前准备

### 1. 备份代码

```bash
git checkout -b tamagui-migration
git add .
git commit -m "备份：开始 Tamagui 迁移"
```

### 2. 确认依赖已安装

```bash
npm list tamagui @tamagui/config @tamagui/babel-plugin
```

### 3. 运行现有测试

```bash
npm test
```

确保所有测试通过后再开始迁移。

---

## 组件迁移映射

### React Native → Tamagui

| React Native | Tamagui | 说明 |
|--------------|---------|------|
| `View` | `View`, `XStack`, `YStack` | 使用 XStack/YStack 替代 flexDirection |
| `Text` | `Text`, `Heading`, `Paragraph` | 根据语义选择组件 |
| `TouchableOpacity` | `Button` | 使用 Tamagui Button |
| `TextInput` | `Input` | 使用 AppInput 封装 |
| `ScrollView` | `ScrollView` | Tamagui 提供的 ScrollView |
| `Image` | `Image` | Tamagui 提供的 Image |
| `Switch` | `Switch` | Tamagui 提供的 Switch |
| `Modal` | `Dialog`, `Sheet` | 根据需求选择 |

### 自定义组件 → Tamagui

| 旧组件 | 新组件 | 说明 |
|--------|--------|------|
| 自定义 Button | `AppButton` | 统一的按钮组件 |
| 自定义 Card | `AppCard` | 统一的卡片组件 |
| 自定义 Input | `AppInput` | 统一的输入框组件 |
| 数据卡片 | `DataCard` | 数据展示卡片 |
| 状态按钮 | `StatusButton` | 状态主题按钮 |
| 状态指示器 | `StatusIndicator` | 状态圆点指示器 |

---

## 样式迁移

### 1. StyleSheet → Tamagui Props

**迁移前:**

```tsx
import { View, Text, StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0A0E0F',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8EAED',
    marginBottom: 12,
  },
})

<View style={styles.container}>
  <Text style={styles.title}>标题</Text>
</View>
```

**迁移后:**

```tsx
import { YStack, H2 } from 'tamagui'

<YStack flex={1} padding="$4" backgroundColor="$background">
  <H2 marginBottom="$3">标题</H2>
</YStack>
```

### 2. 硬编码值 → Tokens

**迁移前:**

```tsx
<View style={{ padding: 16, gap: 8, borderRadius: 8 }}>
```

**迁移后:**

```tsx
<YStack padding="$4" gap="$2" borderRadius="$4">
```

### 3. 颜色值 → 主题颜色

**迁移前:**

```tsx
<View style={{ backgroundColor: '#0A0E0F' }}>
  <Text style={{ color: '#E8EAED' }}>文本</Text>
</View>
```

**迁移后:**

```tsx
<View backgroundColor="$background">
  <Text color="$color">文本</Text>
</View>
```

---

## 主题系统迁移

### 1. 旧主题系统

**旧代码 (src/theme/colors.ts):**

```typescript
export const darkColors = {
  background: '#0A0E0F',
  text: '#E8EAED',
  primary: '#00D9FF',
  // ...
}
```

**使用方式:**

```tsx
import { colors } from '../theme/colors'

<View style={{ backgroundColor: colors.background }}>
```

### 2. 新主题系统

**新配置 (tamagui.config.ts):**

```typescript
const appConfig = createTamagui({
  themes: {
    dark: {
      background: '#0A0E0F',
      color: '#E8EAED',
      primary: '#00D9FF',
      // ...
    },
  },
})
```

**使用方式:**

```tsx
import { useTheme } from 'tamagui'

const theme = useTheme()

<View backgroundColor={theme.background}>
```

### 3. 主题切换

**旧方式:**

```tsx
import { useTheme } from '../hooks/useTheme'

const { theme, setTheme } = useTheme()
setTheme('dark')
```

**新方式:**

```tsx
import { useThemeToggle } from '../hooks/useThemeToggle'

const { theme, toggleTheme } = useThemeToggle()
toggleTheme()
```

---

## 常见迁移场景

### 场景 1: 简单的 View 容器

**迁移前:**

```tsx
<View style={{ flexDirection: 'column', gap: 16, padding: 16 }}>
  <Text>内容1</Text>
  <Text>内容2</Text>
</View>
```

**迁移后:**

```tsx
<YStack gap="$4" padding="$4">
  <Text>内容1</Text>
  <Text>内容2</Text>
</YStack>
```

### 场景 2: 水平布局

**迁移前:**

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  <Text>左侧</Text>
  <Text>右侧</Text>
</View>
```

**迁移后:**

```tsx
<XStack alignItems="center" gap="$2">
  <Text>左侧</Text>
  <Text>右侧</Text>
</XStack>
```

### 场景 3: 按钮

**迁移前:**

```tsx
<TouchableOpacity
  style={{
    backgroundColor: '#00D9FF',
    padding: 12,
    borderRadius: 8,
  }}
  onPress={handlePress}
>
  <Text style={{ color: 'white', fontWeight: 'bold' }}>
    提交
  </Text>
</TouchableOpacity>
```

**迁移后:**

```tsx
<AppButton variant="primary" onPress={handlePress}>
  提交
</AppButton>
```

### 场景 4: 输入框

**迁移前:**

```tsx
<View>
  <Text style={{ marginBottom: 8 }}>用户名</Text>
  <TextInput
    style={{
      borderWidth: 1,
      borderColor: '#2A2F31',
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#1A1F20',
      color: '#E8EAED',
    }}
    placeholder="请输入用户名"
    value={username}
    onChangeText={setUsername}
  />
  {error && <Text style={{ color: '#FF4757' }}>{error}</Text>}
</View>
```

**迁移后:**

```tsx
<AppInput
  label="用户名"
  placeholder="请输入用户名"
  value={username}
  onChangeText={setUsername}
  error={!!error}
  errorMessage={error}
/>
```

### 场景 5: 卡片

**迁移前:**

```tsx
<View
  style={{
    backgroundColor: '#1A1F20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2F31',
    padding: 16,
  }}
>
  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
    标题
  </Text>
  <Text>内容</Text>
</View>
```

**迁移后:**

```tsx
<AppCard>
  <AppCard.Header padded>
    <H3>标题</H3>
  </AppCard.Header>
  <AppCard.Footer padded>
    <Text>内容</Text>
  </AppCard.Footer>
</AppCard>
```

### 场景 6: 条件样式

**迁移前:**

```tsx
<View
  style={{
    backgroundColor: isActive ? '#00D9FF' : '#2A2F31',
    padding: 12,
  }}
>
  <Text style={{ color: isActive ? 'white' : '#8A8F91' }}>
    {text}
  </Text>
</View>
```

**迁移后:**

```tsx
<View
  backgroundColor={isActive ? '$primary' : '$gray8'}
  padding="$3"
>
  <Text color={isActive ? 'white' : '$gray10'}>
    {text}
  </Text>
</View>
```

---

## 迁移检查清单

### 代码迁移

- [ ] 所有 `View` 替换为 `View`/`XStack`/`YStack`
- [ ] 所有 `Text` 替换为 `Text`/`Heading`/`Paragraph`
- [ ] 所有 `TouchableOpacity` 替换为 `Button` 或 `AppButton`
- [ ] 所有 `TextInput` 替换为 `AppInput`
- [ ] 所有 `StyleSheet.create` 替换为 Tamagui props
- [ ] 所有硬编码的颜色值替换为主题颜色
- [ ] 所有硬编码的间距值替换为 tokens

### 主题系统

- [ ] 移除对 `src/theme/colors.ts` 的直接导入
- [ ] 使用 `useTheme` Hook 访问主题颜色
- [ ] 使用 `useThemeToggle` Hook 切换主题
- [ ] 确保所有组件支持深色/浅色模式

### 测试

- [ ] 运行所有单元测试
- [ ] 运行所有集成测试
- [ ] 手动测试所有界面
- [ ] 测试主题切换功能
- [ ] 测试响应式布局

### 性能

- [ ] 检查打包体积
- [ ] 检查启动速度
- [ ] 检查渲染性能
- [ ] 使用 React DevTools Profiler 分析

### 文档

- [ ] 更新组件文档
- [ ] 更新 README
- [ ] 添加迁移说明
- [ ] 更新代码示例

---

## 故障排除

### 问题 1: 组件不显示

**症状**: 组件渲染后不显示任何内容

**原因**: 组件不在 `TamaguiProvider` 包裹的组件树内

**解决方案**:

```tsx
// App.tsx
import { TamaguiProvider, Theme } from 'tamagui'
import config from './tamagui.config'

export default function App() {
  return (
    <TamaguiProvider config={config}>
      <Theme name="dark">
        <YourApp />
      </Theme>
    </TamaguiProvider>
  )
}
```

### 问题 2: 样式不生效

**症状**: 传递的样式属性不生效

**原因**: 使用了错误的属性名或值

**解决方案**:

```tsx
// ❌ 错误
<View style={{ padding: 16 }}>

// ✅ 正确
<View padding="$4">
```

### 问题 3: 主题颜色不更新

**症状**: 切换主题后颜色不更新

**原因**: 使用了硬编码的颜色值

**解决方案**:

```tsx
// ❌ 错误
<View backgroundColor="#0A0E0F">

// ✅ 正确
<View backgroundColor="$background">
```

### 问题 4: TypeScript 类型错误

**症状**: TypeScript 报告类型错误

**原因**: 缺少类型定义或使用了错误的类型

**解决方案**:

```tsx
// 确保导入了正确的类型
import type { ButtonProps } from 'tamagui'

// 或者使用 ComponentProps
import type { ComponentProps } from 'react'
type MyButtonProps = ComponentProps<typeof AppButton>
```

### 问题 5: 性能问题

**症状**: 应用启动慢或渲染卡顿

**原因**: 未启用编译时优化或组件未优化

**解决方案**:

1. 确认 Babel 插件配置正确 (babel.config.js)
2. 使用 `memo` 包裹组件
3. 使用 `useMemo` 和 `useCallback`
4. 使用懒加载

```tsx
import { lazy, Suspense } from 'react'

const DataCard = lazy(() => import('./components/tamagui/DataCard'))

<Suspense fallback={<LoadingSkeleton />}>
  <DataCard />
</Suspense>
```

---

## 下一步

迁移完成后，建议：

1. 运行完整的测试套件
2. 进行性能测试和优化
3. 更新项目文档
4. 培训团队成员使用新组件

---

## 相关文档

- [Tamagui 使用指南](./TAMAGUI_GUIDE.md)
- [组件 API 文档](../src/components/tamagui/README.md)
- [设计系统规范](../.kiro/specs/ui-design-system/design.md)

---

**最后更新**: 2026-02-12  
**版本**: v1.0

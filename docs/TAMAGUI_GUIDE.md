# Tamagui 组件使用指南

## 目录

1. [简介](#简介)
2. [快速开始](#快速开始)
3. [基础组件](#基础组件)
4. [应用特定组件](#应用特定组件)
5. [主题系统](#主题系统)
6. [最佳实践](#最佳实践)
7. [常见问题](#常见问题)

---

## 简介

本项目使用 **Tamagui v2** 作为 UI 组件库基础，结合金融级数据终端的专业配色，创建了统一的设计系统。

### 为什么选择 Tamagui？

- ✅ 专为 React Native 设计
- ✅ 编译时优化，性能极佳
- ✅ 完善的主题系统
- ✅ 丰富的组件库
- ✅ 支持 Web（未来扩展）
- ✅ TypeScript 原生支持

### 设计原则

1. **统一性**: 所有组件遵循相同的设计规范
2. **简洁性**: 采用现代简洁的设计风格
3. **专业性**: 金融级专业配色方案
4. **可访问性**: 符合 WCAG 标准的颜色对比度

---

## 快速开始

### 安装依赖

项目已经配置好所有必需的依赖，无需额外安装。

### 基础配置

所有组件必须在 `TamaguiProvider` 包裹的组件树内使用：

```tsx
import { TamaguiProvider, Theme } from 'tamagui'
import config from './tamagui.config'

export default function App() {
  return (
    <TamaguiProvider config={config}>
      <Theme name="dark">
        {/* 你的应用内容 */}
      </Theme>
    </TamaguiProvider>
  )
}
```

### 导入组件

```tsx
// 导入基础组件
import { AppButton, AppCard, AppInput } from '@/components/tamagui'

// 导入应用特定组件
import { DataCard, StatusButton, StatusIndicator } from '@/components/tamagui'

// 导入 Tamagui 原生组件
import { View, Text, XStack, YStack, H1, H2, H3, Paragraph } from 'tamagui'
```

---

## 基础组件

### AppButton - 按钮组件

统一的按钮组件，支持多种变体和加载状态。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | 按钮变体 |
| `loading` | `boolean` | `false` | 加载状态 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| 其他 | `ButtonProps` | - | Tamagui Button 的所有属性 |

#### 示例

```tsx
import { AppButton } from '@/components/tamagui'

// 主要按钮
<AppButton variant="primary" onPress={handleSubmit}>
  提交
</AppButton>

// 次要按钮
<AppButton variant="secondary" onPress={handleCancel}>
  取消
</AppButton>

// 加载状态
<AppButton variant="primary" loading onPress={handleSubmit}>
  提交中...
</AppButton>

// 危险操作
<AppButton variant="danger" onPress={handleDelete}>
  删除
</AppButton>

// 幽灵按钮
<AppButton variant="ghost" onPress={handleCancel}>
  取消
</AppButton>

// 禁用状态
<AppButton variant="primary" disabled>
  已禁用
</AppButton>
```

#### 样式覆盖

```tsx
<AppButton
  variant="primary"
  backgroundColor="$red10"
  color="white"
  borderRadius="$10"
  paddingHorizontal="$6"
>
  自定义样式
</AppButton>
```

---

### AppCard - 卡片组件

统一的卡片组件，支持边框和阴影效果。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bordered` | `boolean` | `true` | 是否显示边框 |
| `elevate` | `boolean` | `false` | 是否显示阴影 |
| 其他 | `CardProps` | - | Tamagui Card 的所有属性 |

#### 子组件

- `AppCard.Header`: 卡片头部
- `AppCard.Footer`: 卡片底部
- `AppCard.Background`: 卡片背景

#### 示例

```tsx
import { AppCard } from '@/components/tamagui'
import { H3, Text } from 'tamagui'

// 基础卡片
<AppCard>
  <AppCard.Header padded>
    <H3>标题</H3>
  </AppCard.Header>
  <AppCard.Footer padded>
    <Text>内容</Text>
  </AppCard.Footer>
</AppCard>

// 带阴影的卡片
<AppCard bordered elevate>
  <Text padding="$4">这是一个带阴影的卡片</Text>
</AppCard>

// 可点击的卡片
<AppCard onPress={() => console.log('点击')}>
  <Text padding="$4">点击我</Text>
</AppCard>

// 无边框卡片
<AppCard bordered={false}>
  <Text padding="$4">无边框卡片</Text>
</AppCard>
```

---

### AppInput - 输入框组件

统一的输入框组件，支持错误状态和标签。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | - | 输入框标签 |
| `error` | `boolean` | `false` | 错误状态 |
| `errorMessage` | `string` | - | 错误提示信息 |
| 其他 | `InputProps` | - | Tamagui Input 的所有属性 |

#### 示例

```tsx
import { AppInput } from '@/components/tamagui'

// 基础输入框
<AppInput
  placeholder="请输入内容"
  value={value}
  onChangeText={setValue}
/>

// 带标签的输入框
<AppInput
  label="用户名"
  placeholder="请输入用户名"
  value={username}
  onChangeText={setUsername}
/>

// 错误状态
<AppInput
  label="手机号"
  placeholder="请输入手机号"
  value={phone}
  onChangeText={setPhone}
  error={!!errors.phone}
  errorMessage={errors.phone}
/>

// 密码输入框
<AppInput
  label="密码"
  placeholder="请输入密码"
  secureTextEntry
  value={password}
  onChangeText={setPassword}
/>

// 多行文本
<AppInput
  label="备注"
  placeholder="请输入备注"
  multiline
  numberOfLines={4}
  value={note}
  onChangeText={setNote}
/>
```

---

## 应用特定组件

### DataCard - 数据展示卡片

用于展示关键数据指标的卡片组件。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | - | 卡片标题 |
| `value` | `string \| number` | - | 主要数值 |
| `subtitle` | `string` | - | 副标题/说明文字 |
| `icon` | `React.ReactNode` | - | 图标元素 |
| `onPress` | `() => void` | - | 点击事件 |
| `bordered` | `boolean` | `true` | 是否显示边框 |
| `elevate` | `boolean` | `false` | 是否显示阴影 |

#### 示例

```tsx
import { DataCard } from '@/components/tamagui'

// 基础数据卡片
<DataCard
  title="参与人数"
  value="1,234"
  subtitle="较昨日 +12%"
/>

// 带阴影的数据卡片
<DataCard
  title="加班人数"
  value="856"
  subtitle="占比 69.4%"
  elevate
/>

// 可点击的数据卡片
<DataCard
  title="准时下班人数"
  value="378"
  onPress={() => console.log('查看详情')}
  elevate
/>

// 带图标的数据卡片
<DataCard
  title="今日趋势"
  value="+15%"
  subtitle="持续上升"
  icon={<TrendingUp size={24} />}
/>
```

---

### StatusButton - 状态按钮

根据不同状态显示不同主题色的按钮组件。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `status` | `'overtime' \| 'ontime' \| 'pending'` | - | 状态类型 |
| 其他 | `ButtonProps` | - | Tamagui Button 的所有属性 |

#### 状态主题

- `overtime`: 红色主题（加班）
- `ontime`: 绿色主题（准时下班）
- `pending`: 黄色主题（待定）

#### 示例

```tsx
import { StatusButton } from '@/components/tamagui'

// 加班按钮
<StatusButton status="overtime" onPress={handleOvertime}>
  加班
</StatusButton>

// 准时下班按钮
<StatusButton status="ontime" onPress={handleOntime}>
  准时下班
</StatusButton>

// 待定按钮
<StatusButton status="pending" disabled>
  待定
</StatusButton>

// 自定义大小
<StatusButton status="overtime" size="$5" onPress={handleOvertime}>
  加班
</StatusButton>
```

---

### StatusIndicator - 状态指示器

显示圆形状态指示器，支持不同大小和可选标签。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `status` | `'overtime' \| 'ontime' \| 'pending'` | - | 状态类型 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 指示器大小 |
| `showLabel` | `boolean` | `false` | 是否显示标签 |
| `label` | `string` | - | 自定义标签文字 |

#### 状态颜色

- `overtime`: 红色
- `ontime`: 绿色
- `pending`: 黄色

#### 示例

```tsx
import { StatusIndicator } from '@/components/tamagui'

// 带标签的指示器
<StatusIndicator status="overtime" showLabel />

// 不同大小
<StatusIndicator status="ontime" size="lg" showLabel />

// 只显示圆点
<StatusIndicator status="pending" size="sm" />

// 自定义标签
<StatusIndicator status="overtime" showLabel label="正在加班" />

// 在列表中使用
<XStack gap="$2" alignItems="center">
  <StatusIndicator status="overtime" size="sm" />
  <Text>张三</Text>
</XStack>
```

---

## 主题系统

### 主题切换

使用 `useThemeToggle` Hook 切换主题：

```tsx
import { useThemeToggle } from '@/hooks/useThemeToggle'

function ThemeToggleButton() {
  const { theme, toggleTheme } = useThemeToggle()
  
  return (
    <AppButton onPress={toggleTheme}>
      切换到 {theme === 'dark' ? '浅色' : '深色'} 模式
    </AppButton>
  )
}
```

### 访问主题颜色

```tsx
import { useTheme } from 'tamagui'

function MyComponent() {
  const theme = useTheme()
  
  return (
    <View backgroundColor={theme.background}>
      <Text color={theme.color}>文本</Text>
    </View>
  )
}
```

### 自定义主题

在 `tamagui.config.ts` 中自定义主题：

```typescript
const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    dark: {
      ...config.themes.dark,
      background: '#0A0E0F',
      primary: '#00D9FF',
      // 其他自定义颜色
    },
  },
})
```

---

## 最佳实践

### 1. 使用布局组件

优先使用 Tamagui 的布局组件而不是 React Native 的 View：

```tsx
// ✅ 推荐
import { XStack, YStack } from 'tamagui'

<YStack gap="$4" padding="$4">
  <XStack gap="$2">
    <AppButton>按钮1</AppButton>
    <AppButton>按钮2</AppButton>
  </XStack>
</YStack>

// ❌ 不推荐
import { View } from 'react-native'

<View style={{ flexDirection: 'column', gap: 16, padding: 16 }}>
  <View style={{ flexDirection: 'row', gap: 8 }}>
    <AppButton>按钮1</AppButton>
    <AppButton>按钮2</AppButton>
  </View>
</View>
```

### 2. 使用 Tokens

使用 Tamagui 的 tokens 而不是硬编码的值：

```tsx
// ✅ 推荐
<View padding="$4" gap="$2" borderRadius="$4">

// ❌ 不推荐
<View style={{ padding: 16, gap: 8, borderRadius: 8 }}>
```

### 3. 响应式设计

使用 Tamagui 的响应式属性：

```tsx
<AppButton
  size={{
    xs: '$3',
    sm: '$4',
    md: '$5',
  }}
  width={{
    xs: '100%',
    md: 'auto',
  }}
>
  响应式按钮
</AppButton>
```

### 4. 组件组合

通过组合创建复杂组件：

```tsx
function UserCard({ user }) {
  return (
    <AppCard elevate>
      <XStack padding="$4" gap="$3" alignItems="center">
        <StatusIndicator status={user.status} size="md" />
        <YStack flex={1}>
          <Text fontSize="$5" fontWeight="bold">{user.name}</Text>
          <Text fontSize="$3" color="$gray10">{user.department}</Text>
        </YStack>
        <AppButton variant="ghost" size="$3">
          详情
        </AppButton>
      </XStack>
    </AppCard>
  )
}
```

### 5. 性能优化

使用 `memo` 和 `useMemo` 优化性能：

```tsx
import { memo } from 'react'

const DataCard = memo(({ title, value, subtitle }) => {
  return (
    <AppCard>
      <YStack padding="$4">
        <Text>{title}</Text>
        <H1>{value}</H1>
        {subtitle && <Text>{subtitle}</Text>}
      </YStack>
    </AppCard>
  )
})
```

---

## 常见问题

### Q: 为什么组件不显示？

A: 确保你的组件在 `TamaguiProvider` 包裹的组件树内：

```tsx
<TamaguiProvider config={config}>
  <Theme name="dark">
    <YourComponent />
  </Theme>
</TamaguiProvider>
```

### Q: 如何自定义组件样式？

A: 可以通过传递额外的样式属性来覆盖默认样式：

```tsx
<AppButton
  backgroundColor="$red10"
  color="white"
  borderRadius="$10"
>
  自定义样式
</AppButton>
```

### Q: 主题切换后样式不更新？

A: 确保使用 `useTheme` Hook 访问主题颜色：

```tsx
import { useTheme } from 'tamagui'

function MyComponent() {
  const theme = useTheme()
  
  return (
    <View backgroundColor={theme.background}>
      <Text color={theme.color}>文本</Text>
    </View>
  )
}
```

### Q: 如何处理表单验证？

A: 使用 `AppInput` 的 `error` 和 `errorMessage` 属性：

```tsx
<AppInput
  label="手机号"
  value={phone}
  onChangeText={setPhone}
  error={!!errors.phone}
  errorMessage={errors.phone}
/>
```

### Q: 如何优化性能？

A: 
1. 使用 Tamagui 的编译时优化（已配置）
2. 使用 `memo` 包裹组件
3. 使用 `useMemo` 和 `useCallback`
4. 避免在渲染函数中创建新对象

---

## 相关文档

- [Tamagui 官方文档](https://tamagui.dev)
- [组件 API 文档](../src/components/tamagui/README.md)
- [设计系统规范](../.kiro/specs/ui-design-system/design.md)
- [迁移指南](./TAMAGUI_MIGRATION_GUIDE.md)

---

**最后更新**: 2026-02-12  
**版本**: v1.0

# Gluestack-UI 组件映射文档

## 概述

本文档详细列出了项目中所有 Tamagui 组件及其对应的 gluestack-ui 组件映射关系，用于指导 UI 框架迁移工作。

**迁移原则**:
- ✅ 最大化使用 gluestack-ui 现成组件
- ✅ 保持 APP 整体风格统一
- ✅ 参照 gluestack-ui 风格优化自定义组件
- ✅ 不做不必要的封装

---

## 一、基础布局组件

### 1.1 容器组件

| Tamagui 组件 | gluestack-ui 组件 | 迁移方式 | 优先级 | 备注 |
|-------------|------------------|---------|--------|------|
| `View` | `Box` | 直接替换 | 高 | 基础容器组件 |
| `YStack` | `VStack` | 直接替换 | 高 | 垂直堆叠布局 |
| `XStack` | `HStack` | 直接替换 | 高 | 水平堆叠布局 |
| `ScrollView` | `ScrollView` | 直接替换 | 高 | 滚动容器 |

**迁移示例**:
```tsx
// Tamagui
import { View, YStack, XStack } from 'tamagui'

<YStack gap="$4">
  <XStack space="$2">
    <View flex={1}>内容</View>
  </XStack>
</YStack>

// gluestack-ui
import { Box, VStack, HStack } from '@gluestack-ui/themed'

<VStack space="md">
  <HStack space="sm">
    <Box flex={1}>内容</Box>
  </HStack>
</VStack>
```

---

## 二、文本组件

### 2.1 文本显示

| Tamagui 组件 | gluestack-ui 组件 | 迁移方式 | 优先级 | 备注 |
|-------------|------------------|---------|--------|------|
| `Text` | `Text` | 直接替换 | 高 | 基础文本组件 |
| `Heading` | `Heading` | 直接替换 | 高 | 标题组件 |
| `H1-H6` | `Heading` (size属性) | 需要调整 | 中 | 使用 size="xl", "lg" 等 |
| `Paragraph` | `Text` | 直接替换 | 中 | 段落文本 |

**迁移示例**:
```tsx
// Tamagui
import { Text, Heading, H3, Paragraph } from 'tamagui'

<Heading size="$8">标题</Heading>
<H3>子标题</H3>
<Text fontSize="$4">正文</Text>
<Paragraph>段落</Paragraph>

// gluestack-ui
import { Text, Heading } from '@gluestack-ui/themed'

<Heading size="2xl">标题</Heading>
<Heading size="lg">子标题</Heading>
<Text size="md">正文</Text>
<Text size="md">段落</Text>
```

---

## 三、交互组件

### 3.1 按钮组件

| Tamagui 组件 | gluestack-ui 组件 | 迁移方式 | 优先级 | 备注 |
|-------------|------------------|---------|--------|------|
| `Button` | `Button` + `ButtonText` | 需要重构 | 高 | ✅ 已完成 - gluestack 需要 ButtonText 子组件 |

**迁移示例**:
```tsx
// Tamagui
import { Button } from 'tamagui'

<Button onPress={handlePress}>
  点击我
</Button>

// gluestack-ui
import { Button, ButtonText } from '@gluestack-ui/themed'

<Button onPress={handlePress}>
  <ButtonText>点击我</ButtonText>
</Button>
```

### 3.2 输入组件

| Tamagui 组件 | gluestack-ui 组件 | 迁移方式 | 优先级 | 备注 |
|-------------|------------------|---------|--------|------|
| `Input` | `Input` + `InputField` | 需要重构 | 高 | ✅ 已完成 - gluestack 需要 InputField 子组件 |

**迁移示例**:
```tsx
// Tamagui
import { Input } from 'tamagui'

<Input 
  placeholder="请输入"
  value={value}
  onChangeText={setValue}
/>

// gluestack-ui
import { Input, InputField } from '@gluestack-ui/themed'

<Input>
  <InputField
    placeholder="请输入"
    value={value}
    onChangeText={setValue}
  />
</Input>
```

**AppInput 组件封装**:
```tsx
// 使用封装的 AppInput 组件（推荐）
import { AppInput } from '@/components/gluestack'

<AppInput
  label="用户名"
  placeholder="请输入用户名"
  value={username}
  onChangeText={setUsername}
  error={!!errors.username}
  errorMessage={errors.username}
/>
```

### 3.3 开关组件

| Tamagui 组件 | gluestack-ui 组件 | 迁移方式 | 优先级 | 备注 |
|-------------|------------------|---------|--------|------|
| `Switch` | `Switch` | 直接替换 | 中 | API 基本一致 |

---

## 四、反馈组件

### 4.1 加载指示器

| Tamagui 组件 | gluestack-ui 组件 | 迁移方式 | 优先级 | 备注 |
|-------------|------------------|---------|--------|------|
| `Spinner` | `Spinner` | 直接替换 | 中 | 加载动画 |

### 4.2 分隔线

| Tamagui 组件 | gluestack-ui 组件 | 迁移方式 | 优先级 | 备注 |
|-------------|------------------|---------|--------|------|
| `Separator` | `Divider` | 直接替换 | 低 | 分隔线组件 |

---

## 五、媒体组件

### 5.1 图片组件

| Tamagui 组件 | gluestack-ui 组件 | 迁移方式 | 优先级 | 备注 |
|-------------|------------------|---------|--------|------|
| `Image` | `Image` | 直接替换 | 中 | 图片显示 |

---

## 六、应用特定组件

### 6.1 自定义封装组件

| 组件名称 | 当前实现 | gluestack-ui 方案 | 迁移方式 | 优先级 |
|---------|---------|------------------|---------|--------|
| `AppButton` | Tamagui Button 封装 | 直接使用 gluestack Button | ✅ 已完成 | 高 |
| `AppInput` | Tamagui Input 封装 | 直接使用 gluestack Input | ✅ 已完成 | 高 |
| `AppCard` | Tamagui Card 封装 | 使用 Box + VStack | 重构 | 高 |
| `DataCard` | Tamagui Card + YStack | Box + VStack + Heading + Text | 重构 | 高 |
| `StatusButton` | Tamagui Button | Button (variant + action) | ✅ 已完成 | 高 |
| `StatusIndicator` | Circle + XStack + Text | Badge + BadgeText | 重构 | 高 |

**说明**:
- `AppButton` 和 `AppInput` 已完成迁移，提供了统一的封装接口
- `AppCard` 是简单封装，应该移除，直接使用 gluestack-ui 组件
- `DataCard`, `StatusButton`, `StatusIndicator` 是业务组件，需要用 gluestack-ui 组件重构

---

## 七、数据可视化组件

### 7.1 自定义可视化组件

| 组件名称 | 当前实现 | gluestack-ui 方案 | 迁移方式 | 优先级 |
|---------|---------|------------------|---------|--------|
| `VersusBar` | View + XStack + Text | Box + HStack + Text | 重构 | 高 |
| `GridChart` | View + YStack + XStack | Box + VStack + HStack | 重构 | 高 |
| `TimeAxis` | View + XStack + Text | Box + HStack + Text | 重构 | 高 |
| `DataVisualization` | 组合组件 | 保持结构，替换基础组件 | 重构 | 高 |
| `HistoricalStatusIndicator` | 自定义组件 | 保持结构，替换基础组件 | 重构 | 中 |

**说明**:
- 这些组件包含复杂的业务逻辑和动画
- 保持组件结构和逻辑不变
- 只替换内部使用的 Tamagui 基础组件为 gluestack-ui 组件

---

## 八、功能组件

### 8.1 选择器和模态框

| 组件名称 | 当前实现 | gluestack-ui 方案 | 迁移方式 | 优先级 |
|---------|---------|------------------|---------|--------|
| `SearchableSelector` | react-native-modal + Tamagui | Modal + Box + VStack | 重构 | 高 |
| `UserStatusSelector` | 自定义组件 | 保持结构，替换基础组件 | 重构 | 高 |
| Modal (RN) | React Native Modal | gluestack Modal 或保持 RN Modal | 评估后决定 | 中 |
| Sheet | Tamagui Sheet | Modal + ActionSheet | 重构 | 低 |

**说明**:
- `SearchableSelector` 已经使用 react-native-modal，可以保持
- 只需要替换内部的 Tamagui 组件为 gluestack-ui 组件

---

## 九、主题和样式

### 9.1 主题系统

| Tamagui 特性 | gluestack-ui 方案 | 迁移方式 | 优先级 |
|-------------|------------------|---------|--------|
| `TamaguiProvider` | `GluestackUIProvider` | 替换 Provider | 高 |
| `Theme` 组件 | `useColorMode` hook | 使用 hook | 高 |
| `$color` tokens | `$primary`, `$secondary` 等 | 调整 token 名称 | 高 |
| `$space` tokens | `space="md"` 等 | 调整语法 | 高 |

**迁移示例**:
```tsx
// Tamagui
import { TamaguiProvider, Theme } from 'tamagui'
import config from './tamagui.config'

<TamaguiProvider config={config}>
  <Theme name="dark">
    <App />
  </Theme>
</TamaguiProvider>

// gluestack-ui
import { GluestackUIProvider } from '@gluestack-ui/themed'
import { config } from '@gluestack-ui/config'

<GluestackUIProvider config={config}>
  <App />
</GluestackUIProvider>
```

---

## 十、迁移优先级总结

### 高优先级（立即迁移）
1. ✅ 基础布局组件：`View` → `Box`, `YStack` → `VStack`, `XStack` → `HStack`
2. ✅ 文本组件：`Text`, `Heading`
3. ✅ 按钮和输入：`Button`, `Input`
4. ✅ 应用特定组件：`DataCard`, `StatusButton`, `StatusIndicator`
5. ✅ 主题系统：`TamaguiProvider` → `GluestackUIProvider`

### 中优先级（逐步迁移）
1. 数据可视化组件：`VersusBar`, `GridChart`, `TimeAxis`
2. 功能组件：`SearchableSelector`, `UserStatusSelector`
3. 其他交互组件：`Switch`, `Spinner`, `Image`

### 低优先级（最后处理）
1. 分隔线：`Separator` → `Divider`
2. 弹出层：`Sheet` → `ActionSheet`
3. 其他辅助组件

---

## 十一、迁移注意事项

### 11.1 API 差异

1. **Button 组件**
   - Tamagui: 文本直接作为 children
   - gluestack-ui: 需要使用 `ButtonText` 子组件

2. **Input 组件**
   - Tamagui: 直接设置 props
   - gluestack-ui: 需要使用 `InputField` 子组件

3. **间距系统**
   - Tamagui: `gap="$4"`, `space="$2"`
   - gluestack-ui: `space="md"`, `gap="sm"`

4. **颜色系统**
   - Tamagui: `$color`, `$background`
   - gluestack-ui: `$primary`, `$backgroundLight0`

### 11.2 样式属性映射

| Tamagui | gluestack-ui | 说明 |
|---------|-------------|------|
| `gap="$4"` | `space="md"` | 间距 |
| `backgroundColor="$background"` | `bg="$backgroundLight0"` | 背景色 |
| `color="$color"` | `color="$textLight900"` | 文本颜色 |
| `borderRadius="$4"` | `borderRadius="$lg"` | 圆角 |
| `padding="$4"` | `p="$4"` | 内边距 |

### 11.3 测试要点

1. ✅ 视觉一致性：确保迁移后 UI 外观保持一致
2. ✅ 交互功能：验证所有交互功能正常工作
3. ✅ 主题切换：测试深色/浅色模式切换
4. ✅ 响应式布局：测试不同屏幕尺寸
5. ✅ 性能表现：对比迁移前后的性能

---

## 十二、参考资源

- [gluestack-ui 官方文档](https://gluestack.io/ui/docs)
- [gluestack-ui 组件列表](https://gluestack.io/ui/docs/components/all-components)
- [gluestack-ui GitHub](https://github.com/gluestack/gluestack-ui)
- [Tamagui 迁移指南](https://tamagui.dev/)

---

**文档版本**: v1.0  
**最后更新**: 2026-02-18  
**维护者**: 开发团队

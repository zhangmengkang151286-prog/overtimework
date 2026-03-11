# Gluestack-UI 使用指南

本指南提供了在 OvertimeIndex 项目中使用 gluestack-ui 的完整说明和最佳实践。

---

## 目录

1. [简介](#简介)
2. [安装和配置](#安装和配置)
3. [常用组件](#常用组件)
4. [主题系统](#主题系统)
5. [布局组件](#布局组件)
6. [表单组件](#表单组件)
7. [反馈组件](#反馈组件)
8. [最佳实践](#最佳实践)
9. [常见问题](#常见问题)

---

## 简介

### 什么是 Gluestack-UI？

Gluestack-UI 是一个通用的、无样式的组件库，为 React Native 和 Web 提供了一套完整的 UI 组件。它具有以下特点：

- 🎨 **主题化**: 完整的主题系统，支持深色/浅色模式
- 📱 **跨平台**: 同时支持 React Native 和 Web
- ♿ **无障碍**: 内置无障碍支持
- 🎯 **类型安全**: 完整的 TypeScript 支持
- 🚀 **高性能**: 优化的渲染性能
- 🎭 **可定制**: 灵活的样式系统

### 为什么选择 Gluestack-UI？

在 OvertimeIndex 项目中，我们从 Tamagui 迁移到 Gluestack-UI，主要原因：

1. **更好的文档**: Gluestack-UI 提供了更完善的文档和示例
2. **更活跃的社区**: 更多的开发者使用和贡献
3. **更稳定的 API**: API 更加稳定，向后兼容性更好
4. **更丰富的组件**: 提供了更多开箱即用的组件
5. **更好的性能**: 在我们的测试中，性能表现更优

---

## 安装和配置

### 安装依赖

```bash
# 安装 gluestack-ui 核心库
npm install @gluestack-ui/themed @gluestack-style/react

# 安装图标库
npm install lucide-react-native

# 安装必需依赖
npm install react-native-svg react-native-reanimated
```

### 配置 Provider

在 `App.tsx` 中配置 `GluestackUIProvider`：

```typescript
import React from 'react';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';

export default function App() {
  return (
    <GluestackUIProvider config={config}>
      {/* 你的应用内容 */}
    </GluestackUIProvider>
  );
}
```

### 配置主题模式

```typescript
import {useColorMode} from '@gluestack-ui/themed';

function ThemeToggle() {
  const {colorMode, toggleColorMode} = useColorMode();
  
  return (
    <Button onPress={toggleColorMode}>
      <ButtonText>
        当前模式: {colorMode === 'dark' ? '深色' : '浅色'}
      </ButtonText>
    </Button>
  );
}
```

---

## 常用组件

### Box - 基础容器

`Box` 是最基础的布局组件，相当于 `View`。

```typescript
import {Box} from '@gluestack-ui/themed';

// 基础用法
<Box bg="$primary500" p="$4" borderRadius="$lg">
  <Text>内容</Text>
</Box>

// 响应式
<Box
  w="$full"
  h={{base: 100, md: 200, lg: 300}}
  bg={{base: '$red500', md: '$blue500'}}
/>
```

**常用属性**:
- `bg`: 背景色 (例: `$primary500`, `$white`)
- `p`: 内边距 (例: `$2`, `$4`, `$6`)
- `m`: 外边距
- `borderRadius`: 圆角 (例: `$sm`, `$md`, `$lg`)
- `borderWidth`: 边框宽度
- `borderColor`: 边框颜色

### VStack / HStack - 垂直/水平布局

```typescript
import {VStack, HStack} from '@gluestack-ui/themed';

// 垂直布局
<VStack space="md" reversed={false}>
  <Box />
  <Box />
</VStack>

// 水平布局
<HStack space="sm" reversed={false}>
  <Box />
  <Box />
</HStack>
```

**常用属性**:
- `space`: 子元素间距 (例: `xs`, `sm`, `md`, `lg`, `xl`)
- `reversed`: 是否反转顺序
- `justifyContent`: 主轴对齐方式
- `alignItems`: 交叉轴对齐方式

### Text / Heading - 文本组件

```typescript
import {Text, Heading} from '@gluestack-ui/themed';

// 普通文本
<Text size="md" color="$textLight900">
  这是一段文本
</Text>

// 标题
<Heading size="xl" color="$primary500">
  这是标题
</Heading>
```

**Text 尺寸**:
- `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`

**常用属性**:
- `size`: 文本大小
- `color`: 文本颜色
- `bold`: 是否加粗
- `italic`: 是否斜体
- `underline`: 是否下划线

### Button - 按钮组件

```typescript
import {Button, ButtonText, ButtonIcon} from '@gluestack-ui/themed';
import {Plus} from 'lucide-react-native';

// 基础按钮
<Button
  size="md"
  variant="solid"
  action="primary"
  onPress={() => console.log('点击')}
>
  <ButtonText>点击我</ButtonText>
</Button>

// 带图标的按钮
<Button>
  <ButtonIcon as={Plus} />
  <ButtonText>添加</ButtonText>
</Button>

// 不同样式
<Button variant="outline" action="secondary">
  <ButtonText>次要按钮</ButtonText>
</Button>

<Button variant="link" action="positive">
  <ButtonText>链接按钮</ButtonText>
</Button>
```

**variant 变体**:
- `solid`: 实心按钮（默认）
- `outline`: 边框按钮
- `link`: 链接样式
- `ghost`: 幽灵按钮

**action 动作**:
- `primary`: 主要动作（蓝色）
- `secondary`: 次要动作（灰色）
- `positive`: 积极动作（绿色）
- `negative`: 消极动作（红色）

**size 尺寸**:
- `xs`, `sm`, `md`, `lg`, `xl`

### Input - 输入框组件

```typescript
import {
  Input,
  InputField,
  InputSlot,
  InputIcon,
} from '@gluestack-ui/themed';
import {Search} from 'lucide-react-native';

// 基础输入框
<Input variant="outline" size="md">
  <InputField
    placeholder="请输入内容"
    value={value}
    onChangeText={setValue}
  />
</Input>

// 带图标的输入框
<Input>
  <InputSlot pl="$3">
    <InputIcon as={Search} />
  </InputSlot>
  <InputField placeholder="搜索..." />
</Input>

// 密码输入框
<Input>
  <InputField
    type="password"
    placeholder="请输入密码"
  />
</Input>
```

**variant 变体**:
- `outline`: 边框样式（默认）
- `underlined`: 下划线样式
- `rounded`: 圆角样式

**size 尺寸**:
- `sm`, `md`, `lg`, `xl`

### Badge - 徽章组件

```typescript
import {Badge, BadgeText, BadgeIcon} from '@gluestack-ui/themed';
import {Check} from 'lucide-react-native';

// 基础徽章
<Badge size="md" variant="solid" action="success">
  <BadgeText>成功</BadgeText>
</Badge>

// 带图标的徽章
<Badge action="error">
  <BadgeIcon as={Check} />
  <BadgeText>错误</BadgeText>
</Badge>
```

**action 动作**:
- `success`: 成功（绿色）
- `error`: 错误（红色）
- `warning`: 警告（黄色）
- `info`: 信息（蓝色）
- `muted`: 静音（灰色）

---

## 主题系统

### 颜色 Tokens

Gluestack-UI 提供了一套完整的颜色系统：

```typescript
// 主色调
$primary0 - $primary950    // 蓝色系列
$secondary0 - $secondary950 // 紫色系列

// 语义颜色
$success0 - $success950    // 绿色（成功）
$error0 - $error950        // 红色（错误）
$warning0 - $warning950    // 黄色（警告）
$info0 - $info950          // 蓝色（信息）

// 中性色
$backgroundLight0 - $backgroundLight950  // 浅色背景
$backgroundDark0 - $backgroundDark950    // 深色背景
$textLight0 - $textLight950              // 浅色文本
$textDark0 - $textDark950                // 深色文本

// 基础颜色
$white, $black
$red, $blue, $green, $yellow, $purple, $pink, $orange
```

**使用示例**:

```typescript
<Box bg="$primary500" borderColor="$primary700">
  <Text color="$white">主色调文本</Text>
</Box>

<Box bg="$success100" borderColor="$success500">
  <Text color="$success900">成功提示</Text>
</Box>
```

### 间距 Tokens

```typescript
// 间距值
$0: 0
$1: 4px
$2: 8px
$3: 12px
$4: 16px
$5: 20px
$6: 24px
$7: 28px
$8: 32px
$9: 36px
$10: 40px
$11: 44px
$12: 48px

// 命名间距
$xs: 4px
$sm: 8px
$md: 12px
$lg: 16px
$xl: 20px
$2xl: 24px
```

**使用示例**:

```typescript
<Box p="$4" m="$2">
  <VStack space="md">
    <Text>项目 1</Text>
    <Text>项目 2</Text>
  </VStack>
</Box>
```

### 圆角 Tokens

```typescript
$none: 0
$xs: 2px
$sm: 4px
$md: 6px
$lg: 8px
$xl: 12px
$2xl: 16px
$3xl: 24px
$full: 9999px
```

**使用示例**:

```typescript
<Box borderRadius="$lg">
  <Text>圆角容器</Text>
</Box>

<Button borderRadius="$full">
  <ButtonText>圆形按钮</ButtonText>
</Button>
```

### 响应式设计

Gluestack-UI 支持响应式属性：

```typescript
<Box
  w={{base: '100%', md: '50%', lg: '33%'}}
  p={{base: '$2', md: '$4', lg: '$6'}}
  bg={{base: '$red500', md: '$blue500', lg: '$green500'}}
>
  <Text>响应式内容</Text>
</Box>
```

**断点**:
- `base`: 默认（所有尺寸）
- `sm`: 小屏幕 (≥480px)
- `md`: 中等屏幕 (≥768px)
- `lg`: 大屏幕 (≥992px)
- `xl`: 超大屏幕 (≥1280px)

---

## 布局组件

### Center - 居中布局

```typescript
import {Center} from '@gluestack-ui/themed';

<Center w="$full" h={200}>
  <Text>居中内容</Text>
</Center>
```

### Divider - 分割线

```typescript
import {Divider} from '@gluestack-ui/themed';

<VStack space="md">
  <Text>内容 1</Text>
  <Divider />
  <Text>内容 2</Text>
</VStack>
```

### ScrollView - 滚动视图

```typescript
import {ScrollView} from '@gluestack-ui/themed';

<ScrollView>
  <VStack space="md" p="$4">
    {/* 内容 */}
  </VStack>
</ScrollView>
```

---

## 表单组件

### FormControl - 表单控制

```typescript
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
} from '@gluestack-ui/themed';

<FormControl isInvalid={!!error} isRequired>
  <FormControlLabel>
    <FormControlLabelText>用户名</FormControlLabelText>
  </FormControlLabel>
  
  <Input>
    <InputField
      value={username}
      onChangeText={setUsername}
    />
  </Input>
  
  <FormControlHelper>
    <FormControlHelperText>
      请输入您的用户名
    </FormControlHelperText>
  </FormControlHelper>
  
  <FormControlError>
    <FormControlErrorText>
      {error}
    </FormControlErrorText>
  </FormControlError>
</FormControl>
```

### Switch - 开关

```typescript
import {Switch} from '@gluestack-ui/themed';

<Switch
  value={isEnabled}
  onValueChange={setIsEnabled}
  size="md"
/>
```

### Checkbox - 复选框

```typescript
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
} from '@gluestack-ui/themed';
import {Check} from 'lucide-react-native';

<Checkbox
  value="option1"
  isChecked={checked}
  onChange={setChecked}
>
  <CheckboxIndicator>
    <CheckboxIcon as={Check} />
  </CheckboxIndicator>
  <CheckboxLabel>选项 1</CheckboxLabel>
</Checkbox>
```

### Radio - 单选框

```typescript
import {
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioIcon,
  RadioLabel,
} from '@gluestack-ui/themed';
import {Circle} from 'lucide-react-native';

<RadioGroup value={selected} onChange={setSelected}>
  <Radio value="option1">
    <RadioIndicator>
      <RadioIcon as={Circle} />
    </RadioIndicator>
    <RadioLabel>选项 1</RadioLabel>
  </Radio>
  
  <Radio value="option2">
    <RadioIndicator>
      <RadioIcon as={Circle} />
    </RadioIndicator>
    <RadioLabel>选项 2</RadioLabel>
  </Radio>
</RadioGroup>
```

---

## 反馈组件

### Spinner - 加载指示器

```typescript
import {Spinner} from '@gluestack-ui/themed';

<Spinner size="large" color="$primary500" />
```

### Toast - 提示消息

```typescript
import {
  Toast,
  ToastTitle,
  ToastDescription,
  useToast,
} from '@gluestack-ui/themed';

function MyComponent() {
  const toast = useToast();
  
  const showToast = () => {
    toast.show({
      placement: 'top',
      render: ({id}) => (
        <Toast nativeID={id} action="success" variant="solid">
          <ToastTitle>成功</ToastTitle>
          <ToastDescription>
            操作已完成
          </ToastDescription>
        </Toast>
      ),
    });
  };
  
  return (
    <Button onPress={showToast}>
      <ButtonText>显示提示</ButtonText>
    </Button>
  );
}
```

### Alert - 警告框

```typescript
import {
  Alert,
  AlertIcon,
  AlertText,
} from '@gluestack-ui/themed';
import {AlertCircle} from 'lucide-react-native';

<Alert action="error" variant="solid">
  <AlertIcon as={AlertCircle} />
  <AlertText>这是一个错误提示</AlertText>
</Alert>
```

---

## 最佳实践

### 1. 使用 Tokens 而非硬编码

❌ **不推荐**:
```typescript
<Box
  backgroundColor="#3B82F6"
  padding={16}
  borderRadius={8}
>
  <Text style={{color: '#FFFFFF'}}>内容</Text>
</Box>
```

✅ **推荐**:
```typescript
<Box
  bg="$primary500"
  p="$4"
  borderRadius="$lg"
>
  <Text color="$white">内容</Text>
</Box>
```

### 2. 使用组合而非封装

❌ **不推荐**:
```typescript
// 创建自定义封装
export const MyButton = ({title, ...props}) => (
  <Button {...props}>
    <ButtonText>{title}</ButtonText>
  </Button>
);
```

✅ **推荐**:
```typescript
// 直接使用 gluestack-ui 组件
<Button variant="solid" action="primary">
  <ButtonText>点击我</ButtonText>
</Button>
```

### 3. 保持一致的间距

在整个应用中使用一致的间距值：

```typescript
// 统一使用这些间距值
const SPACING = {
  xs: '$2',   // 8px
  sm: '$3',   // 12px
  md: '$4',   // 16px
  lg: '$6',   // 24px
  xl: '$8',   // 32px
};

<VStack space="md" p="$4">
  {/* 内容 */}
</VStack>
```

### 4. 使用语义化的颜色

```typescript
// 使用语义化的颜色名称
<Button action="positive">  {/* 成功/积极操作 */}
  <ButtonText>确认</ButtonText>
</Button>

<Button action="negative">  {/* 失败/消极操作 */}
  <ButtonText>删除</ButtonText>
</Button>

<Badge action="warning">    {/* 警告 */}
  <BadgeText>待处理</BadgeText>
</Badge>
```

### 5. 响应式设计

为不同屏幕尺寸提供适配：

```typescript
<Box
  w={{base: '$full', md: '80%', lg: '60%'}}
  p={{base: '$4', md: '$6', lg: '$8'}}
>
  <Heading size={{base: 'lg', md: 'xl', lg: '2xl'}}>
    标题
  </Heading>
</Box>
```

### 6. 无障碍支持

始终提供无障碍属性：

```typescript
<Button
  accessibilityLabel="提交表单"
  accessibilityHint="点击提交您的信息"
>
  <ButtonText>提交</ButtonText>
</Button>

<Input>
  <InputField
    accessibilityLabel="用户名输入框"
    placeholder="请输入用户名"
  />
</Input>
```

### 7. 性能优化

使用 `React.memo` 和 `useMemo` 优化性能：

```typescript
import React, {memo, useMemo} from 'react';

const DataCard = memo(({data}) => {
  const formattedData = useMemo(
    () => formatData(data),
    [data]
  );
  
  return (
    <Box bg="$white" p="$4" borderRadius="$lg">
      <Text>{formattedData}</Text>
    </Box>
  );
});
```

---

## 常见问题

### Q1: 如何自定义主题颜色？

A: 创建自定义配置：

```typescript
import {createConfig} from '@gluestack-ui/themed';

const customConfig = createConfig({
  tokens: {
    colors: {
      primary500: '#FF6B6B',  // 自定义主色
      secondary500: '#4ECDC4',
    },
  },
});

<GluestackUIProvider config={customConfig}>
  {/* 应用 */}
</GluestackUIProvider>
```

### Q2: 如何处理深色模式？

A: 使用 `useColorMode` hook：

```typescript
import {useColorMode} from '@gluestack-ui/themed';

function MyComponent() {
  const {colorMode} = useColorMode();
  
  return (
    <Box
      bg={colorMode === 'dark' ? '$backgroundDark900' : '$backgroundLight0'}
    >
      <Text
        color={colorMode === 'dark' ? '$textDark50' : '$textLight900'}
      >
        内容
      </Text>
    </Box>
  );
}
```

### Q3: 如何处理表单验证？

A: 使用 `FormControl` 的 `isInvalid` 属性：

```typescript
const [error, setError] = useState('');

<FormControl isInvalid={!!error}>
  <Input>
    <InputField
      value={value}
      onChangeText={(text) => {
        setValue(text);
        if (!text) {
          setError('此字段必填');
        } else {
          setError('');
        }
      }}
    />
  </Input>
  
  <FormControlError>
    <FormControlErrorText>{error}</FormControlErrorText>
  </FormControlError>
</FormControl>
```

### Q4: 如何优化长列表性能？

A: 使用 `FlatList` 或 `FlashList`：

```typescript
import {FlatList} from 'react-native';

<FlatList
  data={items}
  renderItem={({item}) => (
    <Box p="$4" borderBottomWidth={1} borderColor="$borderLight200">
      <Text>{item.title}</Text>
    </Box>
  )}
  keyExtractor={(item) => item.id}
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### Q5: 如何处理图片加载？

A: 使用 `Image` 组件：

```typescript
import {Image} from '@gluestack-ui/themed';

<Image
  source={{uri: imageUrl}}
  alt="描述"
  size="md"
  borderRadius="$lg"
/>
```

---

## 参考资源

- [Gluestack-UI 官方文档](https://ui.gluestack.io/)
- [Gluestack-UI GitHub](https://github.com/gluestack/gluestack-ui)
- [Lucide Icons](https://lucide.dev/)
- [React Native 文档](https://reactnative.dev/)

---

**最后更新**: 2024年
**维护者**: OvertimeIndex 开发团队

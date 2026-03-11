# 代码质量检查清单

## 概述

本文档提供了一个全面的代码质量检查清单，用于确保代码符合项目标准。

---

## 组件开发检查清单

### 基础要求

- [ ] 使用 TypeScript
- [ ] 使用函数式组件 + Hooks
- [ ] 提供完整的类型定义
- [ ] 添加 JSDoc 注释
- [ ] 遵循命名规范（PascalCase for components）

### Tamagui 组件

- [ ] 优先使用 Tamagui 组件而不是 React Native 组件
- [ ] 使用 `XStack`/`YStack` 而不是 `View` + flexDirection
- [ ] 使用 Tamagui tokens 而不是硬编码值
- [ ] 使用 `gap` 而不是 `space` 属性
- [ ] 支持主题切换（使用 `useTheme`）
- [ ] 支持响应式设计

### 样式

- [ ] 不使用硬编码的颜色值（如 `#FF0000`）
- [ ] 不使用硬编码的间距值（如 `16`）
- [ ] 使用主题颜色（如 `$background`, `$primary`）
- [ ] 使用 tokens（如 `$4`, `$6`）
- [ ] 避免使用 `StyleSheet.create`

### 性能

- [ ] 使用 `memo` 包裹纯组件
- [ ] 使用 `useMemo` 缓存计算结果
- [ ] 使用 `useCallback` 缓存回调函数
- [ ] 避免在渲染函数中创建新对象/数组
- [ ] 使用懒加载（`lazy` + `Suspense`）

---

## 代码风格检查清单

### 导入顺序

```typescript
// 1. React 相关
import React, { useState, useEffect } from 'react'

// 2. 第三方库
import { View, Text } from 'tamagui'

// 3. 项目组件
import { AppButton, AppCard } from '@/components/tamagui'

// 4. Hooks
import { useTheme } from '@/hooks/useTheme'

// 5. 工具函数
import { formatDate } from '@/utils'

// 6. 类型
import type { User } from '@/types'

// 7. 样式（如果有）
import { styles } from './styles'
```

### 命名规范

- [ ] 组件: `PascalCase` (例: `UserCard`)
- [ ] 函数: `camelCase` (例: `handleSubmit`)
- [ ] 常量: `UPPER_SNAKE_CASE` (例: `MAX_LENGTH`)
- [ ] 类型/接口: `PascalCase` (例: `UserProps`)
- [ ] 文件名: 与导出的主要内容一致

### 代码组织

```typescript
// 1. 类型定义
interface Props {
  title: string
}

// 2. 常量
const MAX_LENGTH = 100

// 3. 组件
export const MyComponent: React.FC<Props> = ({ title }) => {
  // 4. Hooks
  const [state, setState] = useState('')
  const theme = useTheme()
  
  // 5. 计算值
  const computedValue = useMemo(() => {
    return state.length
  }, [state])
  
  // 6. 事件处理
  const handlePress = useCallback(() => {
    // ...
  }, [])
  
  // 7. Effects
  useEffect(() => {
    // ...
  }, [])
  
  // 8. 渲染
  return (
    <View>
      <Text>{title}</Text>
    </View>
  )
}
```

---

## 类型安全检查清单

### TypeScript

- [ ] 不使用 `any` 类型
- [ ] 为所有函数参数添加类型
- [ ] 为所有函数返回值添加类型
- [ ] 为所有组件 Props 添加类型
- [ ] 使用 `interface` 而不是 `type`（除非需要联合类型）
- [ ] 导出所有公共类型

### Props 类型

```typescript
// ✅ 推荐
interface ButtonProps {
  title: string
  onPress: () => void
  disabled?: boolean
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, disabled = false }) => {
  // ...
}

// ❌ 不推荐
export const Button = ({ title, onPress, disabled }: any) => {
  // ...
}
```

---

## 测试检查清单

### 单元测试

- [ ] 每个组件都有对应的测试文件
- [ ] 测试覆盖率 > 80%
- [ ] 测试所有主要功能
- [ ] 测试边界情况
- [ ] 测试错误处理

### 测试文件命名

- 组件测试: `ComponentName.test.tsx`
- 工具函数测试: `utilName.test.ts`
- Hook 测试: `useHookName.test.ts`

### 测试结构

```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // ...
  })
  
  it('should handle user interaction', () => {
    // ...
  })
  
  it('should handle error state', () => {
    // ...
  })
})
```

---

## 文档检查清单

### 组件文档

- [ ] 添加组件描述
- [ ] 列出所有 Props
- [ ] 提供使用示例
- [ ] 说明注意事项

### JSDoc 注释

```typescript
/**
 * 用户卡片组件
 * 
 * @param props - 组件属性
 * @param props.user - 用户信息
 * @param props.onPress - 点击事件处理函数
 * 
 * @example
 * ```tsx
 * <UserCard user={user} onPress={handlePress} />
 * ```
 */
export const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => {
  // ...
}
```

---

## 性能检查清单

### 渲染优化

- [ ] 避免不必要的重新渲染
- [ ] 使用 `memo` 包裹纯组件
- [ ] 使用 `useMemo` 缓存计算结果
- [ ] 使用 `useCallback` 缓存回调函数
- [ ] 避免在渲染函数中创建新对象

### 列表优化

- [ ] 使用 `FlatList` 而不是 `ScrollView` + `map`
- [ ] 提供 `keyExtractor`
- [ ] 使用 `getItemLayout`（如果可能）
- [ ] 使用 `removeClippedSubviews`
- [ ] 限制初始渲染数量

### 图片优化

- [ ] 使用适当的图片尺寸
- [ ] 使用图片缓存
- [ ] 使用懒加载
- [ ] 使用占位符

---

## 可访问性检查清单

### 基础要求

- [ ] 所有交互元素都可以通过键盘访问
- [ ] 提供适当的 `accessibilityLabel`
- [ ] 提供适当的 `accessibilityHint`
- [ ] 使用语义化的 HTML 元素（Web）
- [ ] 颜色对比度符合 WCAG 标准

### 示例

```typescript
<AppButton
  accessibilityLabel="提交表单"
  accessibilityHint="点击提交您填写的信息"
  onPress={handleSubmit}
>
  提交
</AppButton>
```

---

## 安全检查清单

### 数据处理

- [ ] 验证所有用户输入
- [ ] 清理用户输入（防止 XSS）
- [ ] 不在客户端存储敏感信息
- [ ] 使用 HTTPS
- [ ] 使用安全的密码哈希算法

### 示例

```typescript
// ✅ 推荐
const sanitizedInput = input.trim().replace(/<script>/g, '')

// ❌ 不推荐
const unsafeInput = input
```

---

## Git 提交检查清单

### 提交前

- [ ] 运行 `npm test` 确保所有测试通过
- [ ] 运行 `npx tsc --noEmit` 确保没有类型错误
- [ ] 运行 `npm run lint` 确保代码符合规范
- [ ] 检查是否有未使用的导入
- [ ] 检查是否有 console.log
- [ ] 更新相关文档

### 提交信息

```
类型(范围): 简短描述

详细描述（可选）

相关 Issue: #123
```

**类型**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

---

## 代码审查检查清单

### 审查者

- [ ] 代码符合项目规范
- [ ] 逻辑正确
- [ ] 测试充分
- [ ] 文档完整
- [ ] 性能合理
- [ ] 安全性考虑
- [ ] 可维护性好

### 被审查者

- [ ] 自我审查代码
- [ ] 运行所有测试
- [ ] 更新文档
- [ ] 添加必要的注释
- [ ] 回应所有审查意见

---

## 工具

### 自动化检查

```bash
# TypeScript 类型检查
npx tsc --noEmit

# ESLint 检查
npm run lint

# 运行测试
npm test

# 测试覆盖率
npm test -- --coverage
```

### 推荐的 VS Code 扩展

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- React Native Tools
- Tamagui

---

## 相关文档

- [项目规范](../.kiro/steering/项目规范.md)
- [Tamagui 使用指南](./TAMAGUI_GUIDE.md)
- [已知问题](./KNOWN_ISSUES.md)

---

**最后更新**: 2026-02-12  
**版本**: v1.0

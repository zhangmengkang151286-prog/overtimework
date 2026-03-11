# 主题切换功能使用指南

## 概述

本应用已实现完整的主题切换功能，支持深色和浅色两种模式，并集成了 Tamagui UI 库的主题系统。

## 功能特性

✅ 深色/浅色主题切换
✅ 主题持久化（使用 AsyncStorage）
✅ 与 Redux store 同步
✅ 集成 Tamagui 主题系统
✅ 平滑的切换动画
✅ 自动保存用户偏好

## 使用方法

### 1. 在组件中使用主题切换

```typescript
import { useThemeToggle } from '../hooks/useTheme';

function MyComponent() {
  const { theme, isDark, toggleTheme, setTheme } = useThemeToggle();

  return (
    <View>
      <Text>当前主题: {isDark ? '深色' : '浅色'}</Text>
      
      {/* 切换主题 */}
      <Button onPress={toggleTheme}>
        切换主题
      </Button>
      
      {/* 设置特定主题 */}
      <Button onPress={() => setTheme('dark')}>
        深色模式
      </Button>
      <Button onPress={() => setTheme('light')}>
        浅色模式
      </Button>
    </View>
  );
}
```

### 2. 使用 Tamagui Switch 组件

```typescript
import { Switch, XStack, Text } from 'tamagui';
import { useThemeToggle } from '../hooks/useTheme';

function ThemeSwitch() {
  const { isDark, toggleTheme } = useThemeToggle();

  return (
    <XStack alignItems="center" space="$3">
      <Text>{isDark ? '🌙' : '☀️'}</Text>
      <Text>深色模式</Text>
      <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        size="$3">
        <Switch.Thumb />
      </Switch>
    </XStack>
  );
}
```

### 3. 访问 Tamagui 主题对象

```typescript
import { useThemeToggle } from '../hooks/useTheme';

function MyComponent() {
  const { tamaguiTheme } = useThemeToggle();

  return (
    <View style={{ backgroundColor: tamaguiTheme.background }}>
      <Text style={{ color: tamaguiTheme.color }}>
        使用 Tamagui 主题颜色
      </Text>
    </View>
  );
}
```

### 4. 向后兼容的旧 API

如果你的代码使用了旧的 `useTheme` Hook，它仍然可以正常工作：

```typescript
import { useTheme, useIsDarkMode } from '../hooks/useTheme';

function MyComponent() {
  const theme = useTheme(); // 返回旧的主题对象
  const isDark = useIsDarkMode(); // 返回是否为深色模式

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text>当前是{isDark ? '深色' : '浅色'}模式</Text>
    </View>
  );
}
```

## API 参考

### `useThemeToggle()`

返回一个包含以下属性的对象：

| 属性 | 类型 | 描述 |
|------|------|------|
| `theme` | `'light' \| 'dark'` | 当前主题模式 |
| `isDark` | `boolean` | 是否为深色模式 |
| `toggleTheme` | `() => void` | 切换主题（深色 ↔ 浅色） |
| `setTheme` | `(mode: ThemeMode) => void` | 设置特定主题 |
| `tamaguiTheme` | `any` | Tamagui 主题对象 |
| `isLoading` | `boolean` | 主题是否正在加载 |

### 示例

```typescript
const {
  theme,        // 'dark' 或 'light'
  isDark,       // true 或 false
  toggleTheme,  // 切换函数
  setTheme,     // 设置函数
  tamaguiTheme, // Tamagui 主题对象
  isLoading,    // 加载状态
} = useThemeToggle();
```

## 主题配置

主题配置位于 `tamagui.config.ts`，包含：

- 深色主题（金融级专业配色）
- 浅色主题
- 自定义颜色 tokens
- 字体、间距等配置

### 自定义主题颜色

如需修改主题颜色，编辑 `src/theme/colors.ts`：

```typescript
export const darkColors = {
  primary: '#00D9FF',      // 主色调
  secondary: '#FFB020',    // 次要色
  success: '#00C896',      // 成功色
  error: '#FF4757',        // 错误色
  // ... 其他颜色
};
```

## 持久化

主题选择会自动保存到 AsyncStorage，键名为 `@app/theme`。

应用启动时会自动加载保存的主题偏好。

## 测试

运行主题切换功能的测试：

```bash
npm test -- src/hooks/__tests__/useThemeToggle.test.tsx
```

测试覆盖：
- ✅ 初始化和默认主题
- ✅ 从 AsyncStorage 加载主题
- ✅ 设置特定主题
- ✅ 切换主题
- ✅ 主题持久化
- ✅ Redux 同步
- ✅ 错误处理

## 注意事项

1. **首次加载**：应用首次启动时，会有短暂的加载状态（`isLoading: true`），此时使用默认的深色主题。

2. **Redux 同步**：主题状态同时存储在 Redux store 和 AsyncStorage 中，确保状态一致性。

3. **Tamagui 集成**：主题切换会自动更新 Tamagui 的 Theme Provider，所有使用 Tamagui 组件的地方都会自动响应主题变化。

4. **性能**：主题切换是即时的，不会造成性能问题。

## 故障排除

### 主题没有保存

检查 AsyncStorage 权限和配置。

### 主题切换没有生效

确保组件被 `TamaguiProvider` 和 `Theme` 组件包裹：

```typescript
<TamaguiProvider config={config}>
  <Theme name={theme}>
    <YourApp />
  </Theme>
</TamaguiProvider>
```

### 颜色不一致

确保使用 Tamagui 的颜色 tokens 而不是硬编码的颜色值。

## 相关文件

- `src/hooks/useThemeToggle.ts` - 主题切换 Hook
- `src/hooks/useTheme.ts` - 向后兼容的主题 Hook
- `src/store/slices/uiSlice.ts` - UI 状态管理
- `tamagui.config.ts` - Tamagui 配置
- `src/theme/colors.ts` - 颜色定义
- `src/screens/SettingsScreen.tsx` - 设置页面（包含主题切换开关）

## 更新日志

### v1.0.0 (2026-02-12)
- ✅ 实现主题切换功能
- ✅ 集成 Tamagui 主题系统
- ✅ 支持主题持久化
- ✅ 在设置页添加主题切换开关
- ✅ 完整的单元测试覆盖

---

**验证需求**: 1.2, 2.1, 7.1, 10.5

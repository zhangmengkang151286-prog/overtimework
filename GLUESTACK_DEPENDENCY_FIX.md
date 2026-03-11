# Gluestack-UI 依赖修复

## 🐛 问题描述

在配置 GluestackUIProvider 后，启动应用时遇到以下错误：

```
Unable to resolve "@react-native-aria/overlays" from "node_modules\@gluestack-ui\actionsheet\src\ActionsheetContent.tsx"
```

## 🔍 原因分析

`@gluestack-ui/themed` 包依赖了一些 `@react-native-aria` 的包，但这些包没有自动安装。具体缺失的包包括：

- `@react-native-aria/overlays`
- `@react-native-aria/dialog`
- `@react-native-aria/focus`
- `@react-native-aria/interactions`

## ✅ 解决方案

### 1. 安装缺失的依赖

```bash
cd OvertimeIndexApp
npm install @react-native-aria/overlays @react-native-aria/dialog @react-native-aria/focus @react-native-aria/interactions
```

### 2. 清除缓存并重启

```bash
npx expo start --clear
```

## 📦 已安装的依赖

执行上述命令后，以下包已成功安装：

- ✅ `@react-native-aria/overlays`
- ✅ `@react-native-aria/dialog`
- ✅ `@react-native-aria/focus`
- ✅ `@react-native-aria/interactions`

## ⚠️ 警告信息

安装过程中会看到一些 peer dependency 警告：

```
npm warn Conflicting peer dependency: react@17.0.2
```

这是因为 `@react-aria/checkbox` 期望 React 16.8 或 17.x，但项目使用的是 React 19.1.0。这个警告可以忽略，因为：

1. React 19 向后兼容 React 17 的 API
2. gluestack-ui 的核心功能不受影响
3. 这只是一个传递依赖的警告

## 🧪 验证

安装完成后，应用应该能够正常启动。可以通过以下方式验证：

1. 运行 `npx expo start --clear`
2. 检查控制台是否还有 `@react-native-aria/overlays` 相关错误
3. 应用应该能够正常加载

## 📝 为什么会出现这个问题？

这是 gluestack-ui 的一个已知问题。`@gluestack-ui/themed` 包的 peer dependencies 配置不完整，导致某些必需的 `@react-native-aria` 包没有被自动安装。

## 🔄 未来的项目

如果在新项目中使用 gluestack-ui，建议在安装 `@gluestack-ui/themed` 后立即安装这些依赖：

```bash
npm install @gluestack-ui/themed @gluestack-ui/config @gluestack-style/react
npm install @react-native-aria/overlays @react-native-aria/dialog @react-native-aria/focus @react-native-aria/interactions
npm install lucide-react-native react-native-svg react-native-reanimated
```

## 📚 相关文档

- [gluestack-ui 官方文档](https://gluestack.io/ui/docs)
- [React Native ARIA](https://react-native-aria.geekyants.com/)

---

**修复时间**: 2026-02-18
**状态**: ✅ 已解决

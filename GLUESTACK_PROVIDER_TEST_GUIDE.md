# GluestackUIProvider 测试指南

## 🎯 目标

验证 GluestackUIProvider 是否正确配置并能正常工作。

## ✅ 快速验证

### 1. 运行验证脚本

```bash
cd OvertimeIndexApp
node verify-gluestack-provider.js
```

**预期输出：**
```
✅ @gluestack-ui/themed: ^1.1.73
✅ @gluestack-ui/config: ^1.1.20
✅ App.tsx 已导入 GluestackUIProvider
✅ App.tsx 已使用 <GluestackUIProvider>
```

### 2. 启动应用

```bash
# 清除缓存并启动
npx expo start --clear
```

### 3. 检查控制台

启动后检查控制台，确保：
- ✅ 没有 "GluestackUIProvider" 相关错误
- ✅ 没有 "@gluestack-ui/config" 导入错误
- ✅ 应用正常启动

## 🧪 功能测试

### 测试 1: 使用测试应用

如果想单独测试 gluestack-ui，可以临时修改 `App.tsx`：

```typescript
// 临时导入测试应用
import TestGluestackProvider from './test-gluestack-provider';

export default function App() {
  // 临时返回测试应用
  return <TestGluestackProvider />;
}
```

**预期结果：**
- 看到 "gluestack-ui 测试" 标题
- 看到带背景色的 Box
- 看到可点击的按钮
- 看到不同颜色的 tokens 展示

### 测试 2: 在现有组件中使用

在任意现有组件中添加 gluestack-ui 组件：

```typescript
import {Box, Text} from '@gluestack-ui/themed';

// 在组件中添加
<Box bg="$primary500" p="$4" borderRadius="$md">
  <Text color="$white">测试 gluestack-ui</Text>
</Box>
```

**预期结果：**
- 组件正常渲染
- 样式正确应用
- 没有运行时错误

## 🔍 常见问题排查

### 问题 1: @react-native-aria/overlays 错误

**错误信息：**
```
Unable to resolve "@react-native-aria/overlays" from "node_modules\@gluestack-ui\actionsheet\src\ActionsheetContent.tsx"
```

**解决方案：**
```bash
npm install @react-native-aria/overlays @react-native-aria/dialog @react-native-aria/focus @react-native-aria/interactions
npx expo start --clear
```

**详细说明**：参考 `GLUESTACK_DEPENDENCY_FIX.md`

### 问题 2: 导入错误

**错误信息：**
```
Cannot find module '@gluestack-ui/config'
```

**解决方案：**
```bash
npm install @gluestack-ui/config
npx expo start --clear
```

### 问题 3: Provider 错误

**错误信息：**
```
GluestackUIProvider is not defined
```

**解决方案：**
1. 检查 `App.tsx` 是否正确导入
2. 清除缓存重启：`npx expo start --clear`

### 问题 4: 样式不生效

**可能原因：**
- 缓存问题
- Provider 顺序错误

**解决方案：**
```bash
# 清除所有缓存
npx expo start --clear

# 如果还不行，删除 node_modules 重新安装
rm -rf node_modules
npm install
npx expo start --clear
```

## 📊 验证清单

完成以下检查，确保配置正确：

- [ ] `verify-gluestack-provider.js` 脚本运行成功
- [ ] 应用启动无错误
- [ ] 可以导入 gluestack-ui 组件
- [ ] gluestack-ui 组件正常渲染
- [ ] 样式 tokens 正常工作
- [ ] 与 Tamagui 组件共存无冲突

## 🎯 成功标准

当以下所有条件满足时，说明配置成功：

1. ✅ 验证脚本全部通过
2. ✅ 应用正常启动
3. ✅ 可以使用 gluestack-ui 组件
4. ✅ 现有 Tamagui 组件仍然正常工作
5. ✅ 没有运行时错误或警告

## 📝 测试记录

测试完成后，请记录：

```
测试日期: ___________
测试人员: ___________
测试环境: iOS / Android / Web
测试结果: 通过 / 失败
问题记录: ___________
```

## 🔄 下一步

配置验证通过后，可以继续：

1. 创建组件映射文档（任务 3）
2. 开始重构基础组件（任务 4-7）
3. 逐步迁移页面组件（任务 14-19）

---

**提示**: 如果遇到任何问题，请参考 `TASK_2_GLUESTACK_PROVIDER_COMPLETE.md` 中的详细说明。

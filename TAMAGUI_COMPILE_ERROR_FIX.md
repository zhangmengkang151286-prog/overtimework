# Tamagui 编译错误修复

**日期**: 2026-02-13  
**问题**: Tamagui 静态提取器编译错误  
**错误信息**: `Error in Tamagui parse, skipping Unexpected token 'typeof'`

---

## 问题原因

Tamagui 的 Babel 插件在编译时尝试静态提取样式，但遇到了无法解析的代码（`typeof` 关键字）。这是 Tamagui 静态提取器的已知问题。

---

## 修复方案

在 `babel.config.js` 中禁用 Tamagui 的静态提取功能：

```javascript
[
  '@tamagui/babel-plugin',
  {
    components: ['tamagui'],
    config: './tamagui.config.ts',
    logTimings: true,
    disableExtraction: true, // 禁用静态提取
  },
],
```

---

## 清理缓存步骤

修改配置后必须清理缓存：

### PowerShell：
```powershell
cd OvertimeIndexApp

# 停止 Expo 服务器（Ctrl+C）

# 清理缓存
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# 重启
npx expo start --clear
```

### CMD：
```cmd
cd OvertimeIndexApp

# 停止 Expo 服务器（Ctrl+C）

# 清理缓存
rmdir /s /q .expo
rmdir /s /q node_modules\.cache

# 重启
npx expo start --clear
```

---

## 影响说明

禁用静态提取后：
- ✅ 应用仍然正常工作
- ✅ Tamagui 组件正常渲染
- ⚠️ 性能略有下降（样式在运行时计算而非编译时）
- ✅ 对于开发环境影响很小

---

## 验证修复

修复成功后，应该：
1. ✅ 不再看到 "Error in Tamagui parse" 错误
2. ✅ 应用正常启动
3. ✅ PortalProvider 正常工作
4. ✅ 所有 Tamagui 组件正常显示

---

**修复人**: Kiro AI Assistant  
**修复时间**: 2026-02-13

# Glassmorphism 依赖问题修复

## 问题描述

安装 `expo-blur` 和 `expo-linear-gradient` 后，Metro bundler 报错：
```
Unable to resolve module expo-linear-gradient
```

## 原因

Metro bundler 的缓存没有更新，需要完全清除缓存并重启。

## 🚀 快速修复（推荐）

### Windows 用户

**方法 1: 使用一键修复脚本**

双击运行以下任一脚本：
- `fix-glassmorphism.bat` （CMD 脚本）
- `fix-glassmorphism.ps1` （PowerShell 脚本）

**方法 2: 手动执行**

1. 停止当前的 Expo 服务器（Ctrl+C）
2. 在 OvertimeIndexApp 目录下运行：

```cmd
fix-glassmorphism.bat
```

或者在 PowerShell 中：

```powershell
.\fix-glassmorphism.ps1
```

## 手动修复步骤

如果自动脚本不工作，请按以下步骤手动操作：

### 步骤 1: 停止所有 Node 进程

```cmd
taskkill /F /IM node.exe
```

### 步骤 2: 清除所有缓存

```cmd
cd OvertimeIndexApp

# 清除 Metro 缓存
rmdir /s /q node_modules\.cache
rmdir /s /q .expo

# 清除系统临时文件
rmdir /s /q %TEMP%\metro-*
rmdir /s /q %TEMP%\react-*
```

### 步骤 3: 重启 Expo

```cmd
npx expo start --clear
```

## 验证依赖已安装

检查 package.json 中是否包含：

```json
{
  "dependencies": {
    "expo-blur": "~15.0.8",
    "expo-linear-gradient": "~15.0.8"
  }
}
```

检查 node_modules 中是否存在：

```cmd
dir node_modules | findstr "expo-blur expo-linear"
```

应该看到：
```
expo-blur
expo-linear-gradient
```

## 如果问题仍然存在

### 完全重新安装（最后手段）

```cmd
cd OvertimeIndexApp

# 1. 删除 node_modules
rmdir /s /q node_modules

# 2. 删除 package-lock.json
del package-lock.json

# 3. 重新安装
npm install

# 4. 清除缓存启动
npx expo start --clear
```

## 常见问题

### Q: 为什么需要清除缓存？

A: Metro bundler 会缓存模块解析结果。新安装的依赖不会自动更新到缓存中，必须手动清除。

### Q: --clear 参数做了什么？

A: `--clear` 参数会清除 Metro bundler 的所有缓存，包括：
- 模块解析缓存
- 转换缓存
- 依赖图缓存

### Q: 为什么要停止 Node 进程？

A: 确保没有进程占用缓存文件，避免删除失败。

## 下一步

修复完成后：

1. 等待 Metro bundler 完全启动
2. 在设备/模拟器上重新加载应用
3. 进入趋势页面
4. 点击"本轮参与人数"右侧的切换按钮
5. 测试 Glassmorphism 风格

## 注意事项

- 每次安装新的 Expo 依赖后都需要重启 Metro bundler
- 使用 `--clear` 参数可以清除所有缓存
- 如果问题持续，检查是否有多个 node_modules 目录
- Windows 用户可能需要以管理员身份运行脚本

# 清除缓存 - 显示真实 SVG 头像

## 问题

代码已经更新为使用真实 SVG，但应用仍然显示测试数据（数字占位符）。

## 原因

这是 **Metro bundler 缓存** 和 **Expo 缓存** 导致的问题。

## 🚀 解决方案（按顺序执行）

### 步骤 1：停止所有进程

如果 Expo 正在运行，按 `Ctrl+C` 停止。

### 步骤 2：清除所有缓存

```bash
cd OvertimeIndexApp

# 清除 Metro bundler 缓存
npx expo start --clear

# 如果还不行，执行完整清除
npx react-native start --reset-cache
```

### 步骤 3：删除缓存目录（如果步骤 2 不行）

```bash
# 删除 node_modules/.cache
rmdir /s /q node_modules\.cache

# 删除 .expo 缓存
rmdir /s /q .expo

# 删除 Metro 缓存
del /q /f metro-*.log
```

### 步骤 4：重新启动

```bash
npx expo start --clear
```

### 步骤 5：在手机上清除应用缓存

**iOS**：
1. 在 Expo Go 中，摇晃手机
2. 选择 "Reload"

**Android**：
1. 在 Expo Go 中，摇晃手机
2. 选择 "Reload"
3. 或者：卸载重装 Expo Go 应用

## 🔍 验证

清除缓存后，你应该看到：
- ✅ 20 个真实的 SVG 头像（不是数字 1-20）
- ✅ 头像选择器只显示图标，无文字
- ✅ 选中的头像有白色边框

## 🐛 如果还是不行

### 方案 A：完全重置

```bash
# 1. 停止 Expo
# 按 Ctrl+C

# 2. 删除所有缓存
rmdir /s /q node_modules\.cache
rmdir /s /q .expo
del /q /f metro-*.log

# 3. 重新安装依赖
npm install

# 4. 清除启动
npx expo start --clear
```

### 方案 B：检查 SVG 文件

确认 SVG 文件存在：

```bash
dir assets\avatars
```

应该看到 20 个 SVG 文件（avatar_01.svg 到 avatar_20.svg）。

### 方案 C：检查 Metro 配置

确认 `metro.config.js` 包含 SVG 支持：

```javascript
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};
```

## 📱 测试步骤

1. 清除缓存后重启应用
2. 进入注册流程
3. 查看"完善个人资料"页面的头像选择器
4. 应该看到 20 个真实的 SVG 头像

## ✅ 成功标志

- 头像不再是紫色圆形 + 数字
- 显示的是你放置的 SVG 图标
- 头像清晰，无失真

---

**重要**：每次修改 SVG 文件或配置后，都需要运行 `npx expo start --clear`

# 🔄 清除缓存并重启 APP

## 问题

手机里的 Redux store 可能缓存了旧的主题设置（`theme: 'light'`），即使代码已经改成 `'dark'`。

---

## ✅ 完整解决方案

### 方法 1：清除 Metro 缓存 + 重装 APP（推荐）

```bash
# 1. 停止当前运行的 Metro（按 Ctrl+C）

# 2. 清除所有缓存
cd OvertimeIndexApp
npm start -- --reset-cache

# 3. 在手机上完全卸载 APP
# iOS: 长按 APP 图标 → 删除 APP
# Android: 设置 → 应用 → 卸载

# 4. 重新安装
# Metro 会自动重新安装到手机
```

### 方法 2：清除 AsyncStorage（如果方法 1 不行）

你的 APP 可能把主题设置保存在 AsyncStorage 里。

**在代码中临时添加清除逻辑：**

编辑 `App.tsx`，在最开始添加：

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 在 AppNavigator 函数开始处添加
useEffect(() => {
  // 临时：清除所有缓存
  AsyncStorage.clear().then(() => {
    console.log('AsyncStorage cleared!');
  });
}, []);
```

保存后重启 APP，然后**删除这段代码**。

### 方法 3：强制重置 Redux Store

编辑 `src/store/slices/uiSlice.ts`，添加一个重置 action：

```typescript
// 在 reducers 中添加
resetToDefaults: (state) => {
  state.theme = 'dark'; // 强制深色
  console.log('Theme reset to dark');
},
```

然后在 `App.tsx` 中调用：

```typescript
import { resetToDefaults } from './src/store/slices/uiSlice';

useEffect(() => {
  store.dispatch(resetToDefaults());
}, []);
```

---

## 🎯 最简单的方法（推荐）

### 一键清除所有缓存：

```bash
cd OvertimeIndexApp

# Windows
rmdir /s /q node_modules
rmdir /s /q .expo
del package-lock.json
npm install
npm start -- --reset-cache

# 然后在手机上卸载并重装 APP
```

---

## 📱 手机端操作

### iOS

1. **完全卸载 APP**
   - 长按 APP 图标
   - 点击"删除 APP"
   - 选择"删除 APP"（不是移到资料库）

2. **清除系统缓存**（可选）
   - 设置 → 通用 → iPhone 储存空间
   - 找到 Expo Go
   - 删除 APP

3. **重新安装**
   - 运行 `npm start`
   - 扫描二维码重新安装

### Android

1. **完全卸载 APP**
   - 设置 → 应用 → Expo
   - 卸载

2. **清除数据**（可选）
   - 在卸载前，点击"清除数据"
   - 清除缓存

3. **重新安装**
   - 运行 `npm start`
   - 扫描二维码重新安装

---

## 🔍 验证是否生效

重启 APP 后，在控制台查看：

```typescript
// 在 TrendPage.tsx 中临时添加
console.log('Current theme:', theme.isDark ? 'dark' : 'light');
console.log('Background color:', theme.colors.background);
```

应该看到：
```
Current theme: dark
Background color: #0A0E0F
```

如果还是 `light` 和 `#FFFFFF`，说明缓存还在。

---

## 💡 为什么会有缓存？

### 1. Metro Bundler 缓存
- Metro 会缓存编译后的 JS 代码
- 解决：`npm start -- --reset-cache`

### 2. AsyncStorage 缓存
- Redux persist 可能把状态保存在 AsyncStorage
- 解决：清除 AsyncStorage 或卸载 APP

### 3. 手机系统缓存
- iOS/Android 会缓存 APP 数据
- 解决：完全卸载 APP

---

## 🚀 终极解决方案（100% 有效）

如果上面都不行，用这个：

```bash
# 1. 完全停止所有进程
# 按 Ctrl+C 停止 Metro

# 2. 删除所有缓存
cd OvertimeIndexApp
rmdir /s /q node_modules
rmdir /s /q .expo
rmdir /s /q .expo-shared
del package-lock.json

# 3. 重新安装
npm install

# 4. 清除 Metro 缓存启动
npm start -- --reset-cache --clear

# 5. 在手机上完全卸载 APP

# 6. 重新扫码安装
```

---

## 📊 检查清单

完成以下步骤后，新配色应该生效：

- [ ] 停止 Metro（Ctrl+C）
- [ ] 运行 `npm start -- --reset-cache`
- [ ] 在手机上完全卸载 APP
- [ ] 重新扫码安装 APP
- [ ] 打开 APP 查看效果

---

## 🎨 预期效果

清除缓存后，你应该看到：

### 背景色
- ❌ 旧：纯黑 `#000000`
- ✅ 新：深灰黑 `#0A0E0F`

### 主色
- ❌ 旧：iOS 蓝 `#0A84FF`
- ✅ 新：专业蓝 `#00D9FF`

### 文本
- ❌ 旧：纯白 `#FFFFFF`
- ✅ 新：柔和白 `#E8EAED`

---

## 🆘 如果还是不行

告诉我你：

1. 用的是 Expo Go 还是 Development Build？
2. 执行了哪些清除缓存的步骤？
3. 控制台输出的 theme 和 background 是什么？

我会帮你进一步排查！


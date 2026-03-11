# Expo 跨网络运行指南

## 问题
手机和电脑不在同一个网络，无法使用默认的 LAN 模式。

## 解决方案

### 方案 1: Tunnel 模式（推荐 ⭐）

使用 Expo 的隧道服务，通过云端转发流量。

#### 步骤：

1. **停止当前的 Expo 服务**（如果正在运行）
   ```bash
   # 按 Ctrl+C 停止
   ```

2. **使用 Tunnel 模式启动**
   ```bash
   cd OvertimeIndexApp
   npx expo start --tunnel
   ```

3. **等待隧道建立**
   - 首次使用可能需要安装 `@expo/ngrok`
   - 会显示类似这样的 URL：`exp://xx-xxx.xxx.exp.direct:80`

4. **在手机上扫码**
   - 使用 Expo Go 应用扫描终端显示的二维码
   - 或者手动输入隧道 URL

#### 优点：
- ✅ 不需要同一网络
- ✅ 可以在任何地方测试
- ✅ 配置简单

#### 缺点：
- ⚠️ 速度可能比 LAN 模式慢
- ⚠️ 依赖网络连接质量
- ⚠️ 首次加载可能需要较长时间

---

### 方案 2: 使用手机热点

让电脑连接到手机的热点，这样就在同一网络了。

#### 步骤：

1. **开启手机热点**
   - 在手机设置中开启"个人热点"或"便携式热点"

2. **电脑连接到手机热点**
   - 在电脑 WiFi 设置中连接到手机热点

3. **正常启动 Expo**
   ```bash
   cd OvertimeIndexApp
   npm start
   ```

4. **扫码连接**
   - 使用 Expo Go 扫描二维码

#### 优点：
- ✅ 速度快（本地网络）
- ✅ 稳定性好

#### 缺点：
- ⚠️ 消耗手机流量和电量
- ⚠️ 电脑需要断开原有网络

---

### 方案 3: 使用 USB 连接（Android）

通过 USB 数据线连接手机和电脑。

#### 步骤：

1. **启用 USB 调试**
   - Android 手机：设置 → 关于手机 → 连续点击"版本号"7次
   - 返回设置 → 开发者选项 → 启用"USB 调试"

2. **连接 USB 数据线**

3. **设置 ADB 端口转发**
   ```bash
   # 安装 Android SDK Platform Tools（如果没有）
   # 然后运行：
   adb reverse tcp:8081 tcp:8081
   ```

4. **启动 Expo**
   ```bash
   cd OvertimeIndexApp
   npm start
   ```

5. **在手机上打开 Expo Go**
   - 手动输入：`exp://localhost:8081`

#### 优点：
- ✅ 不需要网络
- ✅ 速度最快
- ✅ 最稳定

#### 缺点：
- ⚠️ 仅支持 Android
- ⚠️ 需要 USB 数据线
- ⚠️ 需要配置 ADB

---

### 方案 4: 使用 Expo Dev Client（生产环境推荐）

构建自定义的开发客户端，不依赖 Expo Go。

#### 步骤：

1. **安装 expo-dev-client**
   ```bash
   cd OvertimeIndexApp
   npx expo install expo-dev-client
   ```

2. **构建开发版本**
   ```bash
   # Android
   npx expo run:android

   # iOS (需要 Mac)
   npx expo run:ios
   ```

3. **启动开发服务器**
   ```bash
   npx expo start --dev-client
   ```

#### 优点：
- ✅ 支持自定义原生模块
- ✅ 更接近生产环境
- ✅ 不依赖 Expo Go

#### 缺点：
- ⚠️ 需要构建时间
- ⚠️ 需要 Android Studio 或 Xcode
- ⚠️ 配置较复杂

---

## 推荐方案对比

| 方案 | 难度 | 速度 | 稳定性 | 适用场景 |
|------|------|------|--------|----------|
| **Tunnel 模式** | ⭐ 简单 | ⭐⭐ 中等 | ⭐⭐ 中等 | 快速测试，不同网络 |
| **手机热点** | ⭐⭐ 简单 | ⭐⭐⭐ 快 | ⭐⭐⭐ 好 | 日常开发 |
| **USB 连接** | ⭐⭐⭐ 中等 | ⭐⭐⭐ 最快 | ⭐⭐⭐ 最好 | Android 开发 |
| **Dev Client** | ⭐⭐⭐⭐ 复杂 | ⭐⭐⭐ 快 | ⭐⭐⭐ 好 | 生产准备 |

---

## 当前推荐：使用 Tunnel 模式

对于你的情况，最简单的方法是使用 **Tunnel 模式**：

```bash
cd OvertimeIndexApp
npx expo start --tunnel
```

### 如果遇到问题：

1. **隧道无法建立**
   ```bash
   # 清除缓存重试
   npx expo start --tunnel --clear
   ```

2. **连接超时**
   - 检查防火墙设置
   - 确保手机和电脑都能访问互联网
   - 尝试切换网络

3. **加载很慢**
   - 这是正常的，首次加载需要下载 bundle
   - 后续会有缓存，速度会变快

---

## 快速命令参考

```bash
# Tunnel 模式（推荐）
npx expo start --tunnel

# LAN 模式（同一网络）
npx expo start --lan

# Localhost 模式（仅本机）
npx expo start --localhost

# 清除缓存
npx expo start --clear

# 查看所有选项
npx expo start --help
```

---

## 故障排除

### 问题 1: "Unable to start tunnel"
**解决方法：**
```bash
# 安装 ngrok
npm install -g @expo/ngrok

# 重新启动
npx expo start --tunnel
```

### 问题 2: 手机无法连接
**解决方法：**
1. 确保手机安装了最新版 Expo Go
2. 检查手机网络连接
3. 尝试手动输入 URL 而不是扫码

### 问题 3: 连接后白屏
**解决方法：**
```bash
# 清除缓存重新启动
npx expo start --tunnel --clear
```

---

## 总结

**立即可用的方案：**
```bash
cd OvertimeIndexApp
npx expo start --tunnel
```

然后在手机上用 Expo Go 扫描二维码即可！

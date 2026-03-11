# Expo USB 数据线连接 iOS 设备指南

## 方法 1：Expo Go 开发模式（推荐，最简单）

### 前提条件

1. ✅ iOS 设备和电脑在**同一 WiFi 网络**
2. ✅ iOS 设备已安装 **Expo Go** App
3. ✅ 电脑和手机用 **USB 数据线连接**

### 步骤

#### 1. 连接设备

```bash
# 进入项目目录
cd OvertimeIndexApp

# 用 USB 数据线连接 iPhone 到电脑
```

#### 2. 启动开发服务器（LAN 模式）

```bash
# 启动 Expo，使用 LAN 模式
npx expo start --lan
```

**或者**（如果上面不行）：

```bash
# 启动后手动切换到 LAN
npx expo start

# 然后在终端按 's' 切换连接类型，选择 'lan'
```

#### 3. 在 iPhone 上打开

**方式 A：扫描二维码**
- 终端会显示一个二维码
- 打开 iPhone 相机扫描二维码
- 点击通知打开 Expo Go

**方式 B：手动输入**
- 记下终端显示的 URL（类似 `exp://192.168.x.x:8081`）
- 在 Expo Go App 中手动输入这个地址

### 常见问题

#### 问题 1：无法连接

**解决方案**：
```bash
# 1. 确保在同一 WiFi
# 2. 关闭电脑防火墙（临时）
# 3. 重启 Expo 服务器
npx expo start --lan --clear
```

#### 问题 2：连接很慢

**解决方案**：
```bash
# 使用 tunnel 模式（通过 ngrok）
npx expo start --tunnel
```

---

## 方法 2：开发构建（Development Build）

如果需要使用原生模块或更接近生产环境，可以创建开发构建。

### 步骤

#### 1. 安装 EAS CLI

```bash
npm install -g eas-cli
```

#### 2. 登录 Expo 账号

```bash
eas login
```

#### 3. 配置项目

```bash
cd OvertimeIndexApp
eas build:configure
```

#### 4. 创建开发构建

```bash
# 为 iOS 创建开发构建
eas build --profile development --platform ios
```

#### 5. 安装到设备

构建完成后：
1. 下载 `.ipa` 文件
2. 使用 Apple Configurator 或 Xcode 安装到设备
3. 或者直接在设备上通过 Expo 提供的链接安装

#### 6. 运行开发服务器

```bash
npx expo start --dev-client
```

---

## 方法 3：通过 Xcode 直接运行（最稳定）

### 前提条件

- 安装 Xcode
- 安装 CocoaPods：`sudo gem install cocoapods`
- Apple Developer 账号（免费账号也可以）

### 步骤

#### 1. 预构建 iOS 项目

```bash
cd OvertimeIndexApp

# 生成 iOS 原生项目
npx expo prebuild --platform ios
```

#### 2. 安装依赖

```bash
cd ios
pod install
cd ..
```

#### 3. 在 Xcode 中打开

```bash
# 打开 Xcode 项目
open ios/OvertimeIndexApp.xcworkspace
```

#### 4. 配置签名

1. 在 Xcode 中选择项目
2. 选择 **Signing & Capabilities**
3. 勾选 **Automatically manage signing**
4. 选择你的 Apple ID Team

#### 5. 选择设备并运行

1. 在 Xcode 顶部选择你的 iPhone 设备
2. 点击 ▶️ 运行按钮
3. 首次运行需要在 iPhone 上信任开发者证书：
   - 设置 → 通用 → VPN与设备管理 → 信任

---

## 推荐方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Expo Go (LAN)** | 最简单，无需构建 | 不支持某些原生模块 | 快速开发测试 |
| **Development Build** | 支持所有原生模块 | 需要构建，较慢 | 使用原生功能 |
| **Xcode 直接运行** | 最稳定，完全控制 | 需要 Mac 和 Xcode | 生产环境测试 |

---

## 当前项目推荐

对于你的项目，**推荐使用方法 1（Expo Go + LAN 模式）**：

```bash
cd OvertimeIndexApp
npx expo start --lan
```

然后在 iPhone 上用 Expo Go 扫描二维码即可。

### 如果 LAN 模式不稳定

可以继续使用之前的 tunnel 模式：

```bash
npx expo start --tunnel
```

---

## 快速命令参考

```bash
# LAN 模式（同一 WiFi）
npx expo start --lan

# Tunnel 模式（通过 ngrok，适合中国网络）
npx expo start --tunnel

# 清除缓存重启
npx expo start --clear

# 开发构建模式
npx expo start --dev-client
```

---

## 故障排除

### 1. 无法发现设备

```bash
# 检查 iOS 设备是否被识别
xcrun xctrace list devices

# 或使用 Xcode 查看
# Xcode → Window → Devices and Simulators
```

### 2. 端口被占用

```bash
# 杀掉占用 8081 端口的进程
npx kill-port 8081

# 重新启动
npx expo start --lan
```

### 3. 网络问题

```bash
# 检查本机 IP
ipconfig getifaddr en0  # macOS WiFi
ipconfig getifaddr en1  # macOS 以太网

# 确保 iPhone 和电脑在同一网段
```

---

## 总结

**最简单的方式**：
1. 用数据线连接 iPhone 到电脑
2. 确保在同一 WiFi
3. 运行 `npx expo start --lan`
4. 用 Expo Go 扫描二维码

如果遇到问题，随时告诉我！

# Expo 中国网络环境解决方案

## 问题
```
CommandError: ngrok tunnel took too long to connect.
```

这是因为 ngrok 服务器在国外，在中国大陆连接可能超时。

---

## 🎯 推荐方案：使用手机热点（最稳定）

这是在中国最可靠的方法，速度快且稳定。

### 步骤：

#### 1. 在 iPhone 上开启个人热点

**设置路径：**
- 打开 iPhone **设置**
- 点击 **个人热点** 或 **蜂窝网络** → **个人热点**
- 开启 **允许其他人加入**
- 记住显示的 WiFi 名称和密码

#### 2. 电脑连接到 iPhone 热点

- 在电脑 WiFi 设置中
- 找到 iPhone 热点名称
- 输入密码连接

#### 3. 启动 Expo（不使用 tunnel）

```bash
cd OvertimeIndexApp
npx expo start
```

**注意：** 不要加 `--tunnel` 参数！

#### 4. 在 iPhone 上连接

- 打开 **Expo Go** 应用
- 扫描终端显示的二维码
- 或者用相机扫描，点击通知

### 优点：
- ✅ 速度最快（本地网络）
- ✅ 最稳定，不依赖外网
- ✅ 延迟最低
- ✅ 不受防火墙影响

### 缺点：
- ⚠️ 消耗手机流量（如果电脑下载大文件）
- ⚠️ 消耗手机电量
- ⚠️ 电脑需要断开原有 WiFi

### 💡 省流量技巧：
首次加载后，代码修改只会传输很小的增量更新，不会消耗太多流量。

---

## 方案 2: 使用 LAN 模式 + 手动输入 IP

如果你有路由器，可以让手机和电脑都连接到同一个 WiFi。

### 步骤：

#### 1. 确保手机和电脑在同一 WiFi

- iPhone 连接到家里/公司的 WiFi
- 电脑也连接到同一个 WiFi

#### 2. 查看电脑 IP 地址

**Windows:**
```bash
ipconfig
```
找到 `IPv4 地址`，例如：`192.168.1.100`

**Mac/Linux:**
```bash
ifconfig
```
找到 `inet` 地址

#### 3. 启动 Expo

```bash
cd OvertimeIndexApp
npx expo start --lan
```

#### 4. 手动输入 URL

如果扫码不行，在 Expo Go 中手动输入：
```
exp://你的IP地址:8081
```

例如：`exp://192.168.1.100:8081`

---

## 方案 3: 使用 Localhost 模式（仅测试）

如果只是想在电脑浏览器测试：

```bash
cd OvertimeIndexApp
npx expo start --web
```

这会在浏览器打开应用，但功能可能不完整（某些原生功能无法使用）。

---

## 方案 4: 修复 ngrok 连接（高级）

如果你有 VPN 或代理，可以尝试修复 tunnel 模式。

### 步骤 1: 全局安装 ngrok

```bash
npm install -g @expo/ngrok
```

### 步骤 2: 设置代理（如果有）

**Windows:**
```bash
set HTTP_PROXY=http://your-proxy:port
set HTTPS_PROXY=http://your-proxy:port
npx expo start --tunnel
```

### 步骤 3: 增加超时时间

创建或编辑 `app.json`，添加：

```json
{
  "expo": {
    "packagerOpts": {
      "config": "metro.config.js"
    }
  }
}
```

---

## 🎯 当前最佳实践（推荐）

### 方案对比：

| 方案 | 速度 | 稳定性 | 流量消耗 | 难度 | 推荐度 |
|------|------|--------|----------|------|--------|
| **iPhone 热点** | ⭐⭐⭐ 最快 | ⭐⭐⭐ 最好 | ⚠️ 少量 | ⭐ 简单 | ⭐⭐⭐⭐⭐ |
| 同一 WiFi | ⭐⭐⭐ 快 | ⭐⭐⭐ 好 | ✅ 无 | ⭐ 简单 | ⭐⭐⭐⭐ |
| Tunnel 模式 | ⭐ 慢 | ⭐ 差 | ✅ 无 | ⭐⭐ 中等 | ⭐ |

---

## 立即开始（推荐流程）

### 🔥 最简单的方法：

1. **iPhone 开启个人热点**
   ```
   设置 → 个人热点 → 开启
   ```

2. **电脑连接到 iPhone 热点**

3. **运行命令**
   ```bash
   cd OvertimeIndexApp
   npx expo start
   ```

4. **扫码连接**
   - 用 iPhone 相机扫描二维码
   - 或在 Expo Go 中扫描

### 预期结果：

```
Metro waiting on exp://192.168.xxx.xxx:8081
› Scan the QR code above with Expo Go
```

看到这个就成功了！速度会非常快。

---

## 常见问题

### ❓ 问题 1: 扫码后显示 "Unable to connect"

**原因：** 防火墙阻止了连接

**解决：**
```bash
# Windows 防火墙临时关闭（不推荐）
# 或者添加 Node.js 到防火墙白名单

# 更简单的方法：重启 Expo
npx expo start --clear
```

### ❓ 问题 2: 热点消耗流量太多

**解决：**
- 首次加载会下载 bundle（约 5-10MB）
- 后续代码修改只传输增量（几十 KB）
- 可以在首次加载完成后，电脑切回 WiFi，手机继续用热点

### ❓ 问题 3: 手机电量消耗快

**解决：**
- 给手机充电
- 或者使用 USB 数据线连接电脑（可以边充电边当热点）

---

## 调试技巧

### 查看连接状态

启动后会显示：
```
Metro waiting on exp://192.168.xxx.xxx:8081
```

这个 IP 地址应该是：
- **热点模式**：`172.20.10.x` 或 `192.168.43.x`
- **WiFi 模式**：`192.168.1.x` 或 `192.168.0.x`

### 测试连接

在 iPhone Safari 浏览器访问：
```
http://你的IP地址:8081
```

如果能看到 Metro Bundler 页面，说明连接正常。

---

## 总结

**立即可用的命令（使用热点）：**

```bash
# 1. iPhone 开启个人热点
# 2. 电脑连接到热点
# 3. 运行：

cd OvertimeIndexApp
npx expo start

# 4. 扫码连接
```

这个方法在中国最可靠，速度也最快！

---

## 如果还有问题

可以尝试完全重置：

```bash
# 清除所有缓存
npx expo start --clear --reset-cache

# 如果还不行，删除 node_modules 重新安装
rm -rf node_modules
npm install
npx expo start
```

有任何问题随时告诉我！🚀

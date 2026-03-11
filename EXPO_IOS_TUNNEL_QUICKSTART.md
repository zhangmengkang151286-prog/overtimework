# iOS + Tunnel 模式快速启动指南

## 前提条件

✅ 电脑已安装 Node.js 和 npm  
✅ iPhone 已安装 **Expo Go** 应用（App Store 下载）  
✅ 电脑和手机都能访问互联网（不需要同一网络）

---

## 步骤 1: 启动 Tunnel 模式

在电脑终端运行：

```bash
cd OvertimeIndexApp
npx expo start --tunnel
```

### 首次运行可能会提示：

```
› Tunnel ready.
› Press s │ switch to Expo Go
```

如果提示安装 `@expo/ngrok`，输入 `y` 确认安装。

---

## 步骤 2: 等待隧道建立

你会看到类似这样的输出：

```
Metro waiting on exp://xx-xxx.xxx.exp.direct:80
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

**重要提示：** 
- ✅ 看到 `Tunnel ready` 表示成功
- ⏳ 首次建立隧道可能需要 10-30 秒
- 🔄 如果超过 1 分钟，按 `Ctrl+C` 重新运行

---

## 步骤 3: 在 iPhone 上连接

### 方法 1: 使用相机扫码（推荐）

1. 打开 iPhone **相机**应用
2. 对准终端显示的二维码
3. 会弹出通知："在 Expo Go 中打开"
4. 点击通知，自动跳转到 Expo Go

### 方法 2: 使用 Expo Go 扫码

1. 打开 **Expo Go** 应用
2. 点击 "Scan QR code"
3. 扫描终端显示的二维码

### 方法 3: 手动输入 URL

1. 打开 **Expo Go** 应用
2. 点击 "Enter URL manually"
3. 输入终端显示的 URL（类似 `exp://xx-xxx.xxx.exp.direct:80`）

---

## 步骤 4: 等待应用加载

首次加载会经历：

1. **"Downloading JavaScript bundle"** (30秒-2分钟)
   - 这是正常的，通过隧道下载需要时间
   
2. **"Building JavaScript bundle"** (10-30秒)
   - 编译应用代码
   
3. **应用启动** ✅
   - 看到登录界面或主页面

---

## 常见问题

### ❌ 问题 1: "Unable to start tunnel"

**解决方法：**
```bash
# 全局安装 ngrok
npm install -g @expo/ngrok

# 清除缓存重试
npx expo start --tunnel --clear
```

### ❌ 问题 2: 扫码后无反应

**解决方法：**
1. 确保 iPhone 已安装最新版 Expo Go
2. 检查 iPhone 网络连接（WiFi 或 4G/5G）
3. 尝试手动输入 URL

### ❌ 问题 3: "Network response timed out"

**解决方法：**
```bash
# 停止当前服务（Ctrl+C）
# 重新启动
npx expo start --tunnel --clear
```

### ❌ 问题 4: 加载很慢或卡住

**原因：** 隧道速度取决于网络质量

**解决方法：**
1. 确保电脑和手机网络稳定
2. 关闭其他占用带宽的应用
3. 等待 2-3 分钟（首次加载确实需要时间）
4. 如果还是不行，考虑使用手机热点方案

### ❌ 问题 5: "Something went wrong"

**解决方法：**
```bash
# 完全清除缓存
npx expo start --tunnel --clear --reset-cache

# 如果还不行，删除 node_modules 重新安装
rm -rf node_modules
npm install
npx expo start --tunnel
```

---

## 性能优化建议

### 首次加载后：

1. **不要关闭 Expo Go**
   - 保持应用在后台，下次打开会快很多
   
2. **代码修改后自动刷新**
   - 保存代码后，手机会自动重新加载
   - 速度比首次快很多（有缓存）

3. **如果需要完全重新加载**
   - 在 Expo Go 中摇晃手机
   - 选择 "Reload"

---

## 调试技巧

### 查看日志

在终端会实时显示应用日志：
```
LOG  User status submitted successfully
LOG  Performing daily reset...
```

### 打开开发者菜单

在 iPhone 上：
1. 摇晃手机
2. 会弹出开发者菜单
3. 可以选择：
   - Reload（重新加载）
   - Debug Remote JS（远程调试）
   - Show Performance Monitor（性能监控）

---

## 快速命令参考

```bash
# 启动 Tunnel 模式
npx expo start --tunnel

# 清除缓存启动
npx expo start --tunnel --clear

# 完全重置
npx expo start --tunnel --clear --reset-cache

# 停止服务
# 按 Ctrl+C

# 查看帮助
npx expo start --help
```

---

## 预期时间

| 步骤 | 首次 | 后续 |
|------|------|------|
| 启动隧道 | 10-30秒 | 5-10秒 |
| 下载 bundle | 1-2分钟 | 10-30秒 |
| 应用启动 | 5-10秒 | 2-5秒 |
| **总计** | **2-3分钟** | **30秒-1分钟** |

---

## 成功标志

当你看到以下内容时，说明一切正常：

✅ 终端显示：`Tunnel ready`  
✅ 终端显示：`Metro waiting on exp://...`  
✅ iPhone 上 Expo Go 显示应用界面  
✅ 可以看到登录页面或主页面  

---

## 下一步

应用成功运行后，你可以：

1. **测试用户状态选择功能**
   - 点击 "✍️ 提交今日状态" 按钮
   - 选择准点下班或加班
   - 选择标签
   - 如果是加班，选择时长

2. **测试主题切换**
   - 点击右上角的 ☀️/🌙 图标

3. **查看数据可视化**
   - 查看加班/准点统计
   - 查看标签分布

4. **修改代码实时查看效果**
   - 在电脑上修改代码
   - 保存后手机会自动刷新

---

## 如果 Tunnel 模式不稳定

可以考虑使用**手机热点方案**（速度更快）：

1. iPhone 开启个人热点
2. 电脑连接到 iPhone 热点
3. 运行 `npx expo start`（不加 --tunnel）
4. 扫码连接

这样速度会快很多，但会消耗手机流量。

---

## 总结

**立即开始：**
```bash
cd OvertimeIndexApp
npx expo start --tunnel
```

然后用 iPhone 相机扫码，等待 2-3 分钟首次加载完成！

有任何问题随时告诉我 🚀

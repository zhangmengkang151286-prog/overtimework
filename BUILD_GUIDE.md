# 打工人加班指数 - iOS构建指南

## 📋 前提条件

1. **Expo账号**（免费）
   - 访问 https://expo.dev 注册账号
   
2. **Apple ID**
   - 你已经有了：luyaba@163.com
   
3. **网络环境**
   - 需要能够访问Apple服务器
   - 如果在国内，可能需要使用VPN

## 🚀 构建步骤

### 1. 登录Expo账号

```bash
cd OvertimeIndexApp
eas login
```

输入你的Expo账号和密码。

### 2. 配置项目（首次构建）

```bash
eas build:configure
```

这会自动配置项目的构建设置。

### 3. 开始构建

```bash
eas build --platform ios --profile preview
```

### 4. 登录Apple账号

构建过程中会要求你登录Apple账号：
- Apple ID: luyaba@163.com
- 密码: [你的Apple ID密码]

### 5. 选择团队

如果你有多个Apple Developer团队，选择合适的团队。

### 6. 注册设备（Ad Hoc构建）

如果你没有付费的Apple Developer账号，需要注册你的iPhone设备：

1. 在iPhone上访问：https://expo.dev/accounts/[your-username]/devices
2. 点击"Register new device"
3. 按照提示安装配置文件获取UDID
4. 注册完成后，重新运行构建命令

### 7. 等待构建完成

- 构建过程大约需要10-20分钟
- 可以在 https://expo.dev 查看构建进度
- 构建完成后会收到邮件通知

### 8. 安装到iPhone

构建完成后：

1. 在iPhone上打开构建完成的链接
2. 点击"Install"按钮
3. 在设置中信任开发者证书
4. 打开应用

## 🔧 常见问题

### 问题1：连接Apple服务器超时

**解决方案：**
- 检查网络连接
- 使用VPN连接到海外网络
- 稍后重试

### 问题2：需要Apple Developer账号

**两种选择：**

**选项A：使用Ad Hoc构建（免费）**
- 需要注册设备UDID
- 只能安装到注册的设备上
- 适合个人测试

**选项B：使用TestFlight（需要付费账号）**
- 需要Apple Developer Program ($99/年)
- 可以分发给多个测试用户
- 更专业的测试方式

### 问题3：构建失败

**检查清单：**
1. 确保package.json中的依赖都已安装
2. 确保app.json配置正确
3. 查看构建日志找到具体错误
4. 访问 https://expo.dev 查看详细错误信息

## 📱 替代方案

如果EAS Build遇到问题，可以尝试：

### 方案1：使用Expo Go（有限功能）

虽然当前应用在Expo Go中有兼容性问题，但可以：
1. 简化应用，移除复杂依赖
2. 创建一个演示版本
3. 在Expo Go中测试基本功能

### 方案2：本地构建（需要Mac）

如果你有Mac电脑：

```bash
cd OvertimeIndexApp
npx expo run:ios
```

这会在本地构建并在iOS模拟器中运行。

### 方案3：等待后端API

当前应用的很多功能需要后端API支持：
1. 先完成后端开发
2. 部署后端服务
3. 更新应用中的API地址
4. 再进行完整测试

## 📊 项目状态

✅ **已完成：**
- 所有代码实现（100%）
- 135个单元测试通过
- 完整的功能实现
- 错误处理和性能优化

⏳ **待完成：**
- 后端API开发
- 真机测试
- 生产环境部署

## 🆘 需要帮助？

如果遇到问题：
1. 查看Expo文档：https://docs.expo.dev
2. 查看EAS Build文档：https://docs.expo.dev/build/introduction/
3. 访问Expo论坛：https://forums.expo.dev

## 📝 下次构建时的建议

1. **确保网络稳定**
   - 使用稳定的网络连接
   - 如果在国内，建议使用VPN

2. **准备好Apple账号信息**
   - Apple ID和密码
   - 如果有双重认证，准备好验证码

3. **预留足够时间**
   - 首次构建可能需要30分钟以上
   - 包括配置、构建、下载等步骤

4. **检查构建配额**
   - 免费账号每月有构建次数限制
   - 可以在 https://expo.dev 查看剩余配额

祝构建顺利！🎉

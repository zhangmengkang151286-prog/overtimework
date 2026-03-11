# 应用运行指南

## 🚀 快速开始

### 1. 验证环境配置

确认 `.env` 文件存在并包含正确的 Supabase 配置：

```bash
# 查看环境变量
type .env
```

应该看到：
```env
SUPABASE_URL=https://mnwtjmsoayqtwmlffobf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 测试 Supabase 连接

```bash
node test-supabase-connection.js
```

**预期输出**:
```
✅ Supabase 连接正常，可以开始使用了！
```

### 3. 安装依赖（如果还没安装）

```bash
npm install
```

### 4. 启动应用

```bash
# 启动 Expo 开发服务器
npm start
```

然后选择：
- 按 `i` - 在 iOS 模拟器中打开
- 按 `a` - 在 Android 模拟器中打开
- 按 `w` - 在 Web 浏览器中打开

或者直接运行：

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

---

## 🧪 测试功能

### 1. 用户认证
- 测试手机号注册
- 测试登录流程
- 测试用户信息完善

### 2. 实时数据
- 观察实时数据更新（应该 <100ms）
- 检查参与人数变化
- 查看标签分布更新

### 3. 历史数据
- 拖动时间轴查看历史数据
- 检查数据缓存是否工作
- 验证"现在"按钮功能

### 4. 离线功能
- 关闭网络连接
- 提交状态（应该加入队列）
- 重新连接网络
- 验证数据自动同步

### 5. 数据管理
- 创建新标签
- 编辑标签
- 删除标签
- 搜索标签

---

## 🐛 常见问题

### 问题 1: Supabase 连接失败
**解决方案**:
1. 检查 `.env` 文件是否存在
2. 验证 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确
3. 检查网络连接

### 问题 2: 应用启动失败
**解决方案**:
1. 清除缓存: `npm start -- --clear`
2. 重新安装依赖: `rm -rf node_modules && npm install`
3. 检查 Node.js 版本

### 问题 3: TypeScript 编译警告
**说明**: 这些警告不影响运行时，可以忽略。主要是 Supabase 类型定义缺失。

**可选解决方案**:
```bash
# 生成 Supabase 类型定义
npx supabase gen types typescript --project-id mnwtjmsoayqtwmlffobf > src/types/supabase.ts
```

### 问题 4: 实时数据不更新
**解决方案**:
1. 检查 Supabase Realtime 是否启用
2. 查看控制台日志
3. 验证网络连接

---

## 📊 性能监控

### 查看实时性能
应用运行时，在控制台中查看：
- 实时数据更新延迟
- 网络请求数量
- 缓存命中率
- 离线队列状态

### 预期性能指标
- 实时更新延迟: <100ms
- 数据查询速度: <150ms
- 历史数据查询: <100ms
- 页面加载时间: <2s

---

## 🔍 调试技巧

### 1. 查看 Supabase 日志
在 Supabase Dashboard 中查看：
- 数据库查询日志
- 认证日志
- Realtime 连接状态

### 2. 查看应用日志
```bash
# 查看 Metro bundler 日志
npm start

# 查看设备日志
# iOS: Xcode Console
# Android: adb logcat
```

### 3. 使用 React Native Debugger
1. 安装 React Native Debugger
2. 在应用中按 `Cmd+D` (iOS) 或 `Cmd+M` (Android)
3. 选择 "Debug"

---

## 📝 下一步

### 功能测试完成后
1. 记录发现的问题
2. 测试边缘情况
3. 验证错误处理
4. 检查性能指标

### 准备生产部署
1. 更新环境变量为生产配置
2. 构建生产版本
3. 进行完整测试
4. 准备发布

---

## 📚 相关文档

- **CURRENT_STATUS.md** - 项目当前状态
- **SUPABASE_MIGRATION_README.md** - Supabase 迁移指南
- **TEST_RUN_REPORT.md** - 测试报告
- **SUPABASE_QUICKSTART.md** - Supabase 快速开始

---

**祝运行顺利！** 🎉

如有问题，请查看相关文档或联系开发团队。

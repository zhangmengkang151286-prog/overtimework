# 🚀 Supabase 快速配置指南

## 第1步：注册 Supabase（3分钟）

1. **访问**: https://supabase.com
2. **注册**: 点击 "Start your project"，用GitHub或邮箱注册
3. **创建项目**:
   - Project name: `overtime-index`
   - Database Password: **设置一个强密码并记住！**
   - Region: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
4. **等待**: 1-2分钟让项目初始化完成

---

## 第2步：运行数据库脚本（2分钟）

### 方法1：使用 SQL Editor（推荐）

1. 在Supabase项目中，点击左侧 **SQL Editor**
2. 点击 **New query**
3. 打开本地文件 `supabase_setup.sql`
4. **复制全部内容**，粘贴到SQL Editor
5. 点击右下角 **Run** 按钮
6. 看到成功提示：
   ```
   ✅ 数据库初始化完成！
   industries_count: 10
   positions_count: 10
   tags_count: 15
   admins_count: 1
   ```

### 方法2：使用命令行（可选）

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref your-project-ref

# 运行迁移
supabase db push
```

---

## 第3步：获取连接信息（1分钟）

1. 点击左侧 **Settings** → **Database**
2. 找到 **Connection string** 部分
3. 选择 **URI** 格式
4. 复制连接字符串，类似：
   ```
   postgresql://postgres.xxxxx:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

### 解析连接信息：

从连接字符串中提取：
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
              ↓              ↓                ↓                                              ↓      ↓
           DB_USER      DB_PASSWORD        DB_HOST                                      DB_PORT  DB_NAME
```

---

## 第4步：更新后端配置（1分钟）

编辑 `OvertimeIndexBackend/.env` 文件：

```env
# 服务器配置
NODE_ENV=development
PORT=3000
API_VERSION=v1

# 演示模式 - 改为 false
DEMO_MODE=false

# 数据库配置 - 使用 Supabase 信息
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.xxxxx
DB_PASSWORD=你的数据库密码

# Redis配置 - 暂时不需要（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 微信配置（暂时不需要）
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# 短信配置（暂时不需要）
SMS_ACCESS_KEY=your_sms_access_key
SMS_SECRET_KEY=your_sms_secret_key

# 地图API配置（暂时不需要）
MAP_API_KEY=your_map_api_key

# CORS配置
CORS_ORIGIN=http://localhost:19006,exp://localhost:19000

# 日志配置
LOG_LEVEL=debug
```

---

## 第5步：启动后端服务器（自动）

保存 `.env` 文件后，nodemon 会自动重启服务器。

查看终端输出，应该看到：
```
✅ 数据库连接成功
⚠️  Redis连接失败，将不使用缓存
✅ 定时任务启动成功

🚀 服务器运行在 http://localhost:3000
📚 API文档: http://localhost:3000/v1
🏥 健康检查: http://localhost:3000/health
```

---

## 第6步：测试API（1分钟）

### 测试1：健康检查
```bash
curl http://localhost:3000/health
```

### 测试2：注册用户
```bash
curl -X POST http://localhost:3000/v1/auth/register/phone ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"13800138000\",\"password\":\"123456\",\"username\":\"测试用户\"}"
```

### 测试3：登录
```bash
curl -X POST http://localhost:3000/v1/auth/login/phone ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"13800138000\",\"password\":\"123456\"}"
```

### 测试4：查看实时统计
```bash
curl http://localhost:3000/v1/realtime/statistics
```

---

## 🎉 完成！

现在你有：
- ✅ 完整的PostgreSQL数据库（Supabase托管）
- ✅ 后端API服务器运行中
- ✅ 所有核心功能可用
- ✅ 可以开始前后端集成测试

---

## 📊 Supabase 管理界面

### 查看数据
1. 点击左侧 **Table Editor**
2. 可以看到所有表和数据
3. 可以直接编辑、添加、删除数据

### 查看日志
1. 点击左侧 **Logs**
2. 可以看到所有数据库查询日志

### 监控性能
1. 点击左侧 **Reports**
2. 可以看到数据库性能指标

---

## 🔧 常见问题

### Q1: 连接超时
**解决**: 检查防火墙，确保允许访问 Supabase 域名

### Q2: 密码错误
**解决**: 
1. 在 Supabase Settings → Database
2. 点击 "Reset database password"
3. 更新 .env 文件

### Q3: 表已存在错误
**解决**: SQL脚本使用了 `IF NOT EXISTS`，可以安全重复执行

### Q4: 需要Redis吗？
**回答**: 不是必须的，没有Redis也能正常运行，只是实时统计会直接查数据库

---

## 💰 Supabase 免费额度

- ✅ 500MB 数据库存储
- ✅ 1GB 文件存储
- ✅ 2GB 带宽/月
- ✅ 50,000 月活用户
- ✅ 500MB 边缘函数调用

**足够支持初期运营！**

---

## 🚀 下一步

1. ✅ 数据库配置完成
2. ⏭️ 前端连接后端测试
3. ⏭️ 完整功能测试
4. ⏭️ 准备生产部署

有问题随时问我！💪

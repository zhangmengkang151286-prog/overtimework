# 🚀 后端启动指南

## ✅ 已完成

最小可运行版本已创建完成！包含：

### 核心文件（共8个）
1. ✅ `src/services/authService.ts` - 认证服务
2. ✅ `src/services/submissionService.ts` - 提交服务
3. ✅ `src/services/statisticsService.ts` - 统计服务
4. ✅ `src/controllers/authController.ts` - 认证控制器
5. ✅ `src/controllers/submissionController.ts` - 提交控制器
6. ✅ `src/controllers/realtimeController.ts` - 实时数据控制器
7. ✅ `src/routes/index.ts` - 路由配置
8. ✅ `src/jobs/dailyReset.ts` - 每日重置任务

### 功能清单
- ✅ 手机号注册/登录
- ✅ 微信登录
- ✅ 用户信息完善
- ✅ 状态提交
- ✅ 实时统计查询
- ✅ Top标签统计
- ✅ 历史数据查询
- ✅ 每日00:00自动重置

## 📋 启动步骤

### 1. 安装依赖

```bash
cd OvertimeIndexBackend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少配置：
```env
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=overtime_index
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key_change_this
```

### 3. 创建数据库

```bash
# 方式1: 使用createdb命令
createdb overtime_index

# 方式2: 使用psql
psql -U postgres
CREATE DATABASE overtime_index;
\q
```

### 4. 运行数据库迁移

```bash
# Windows
type src\database\migrations\001_initial.sql | psql -U postgres overtime_index

# Mac/Linux
psql -U postgres overtime_index < src/database/migrations/001_initial.sql
```

### 5. 初始化数据

```bash
# Windows
type src\database\seeds\initial_data.sql | psql -U postgres overtime_index

# Mac/Linux
psql -U postgres overtime_index < src/database/seeds/initial_data.sql
```

### 6. 启动Redis

```bash
# Windows (如果安装了Redis)
redis-server

# Mac
brew services start redis

# Linux
sudo systemctl start redis

# 或使用Docker
docker run -d -p 6379:6379 redis:alpine
```

### 7. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

## 🧪 测试API

### 1. 健康检查

```bash
curl http://localhost:3000/health
```

### 2. 查看API文档

```bash
curl http://localhost:3000/v1
```

### 3. 注册用户

```bash
curl -X POST http://localhost:3000/v1/auth/register/phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "123456",
    "username": "测试用户"
  }'
```

### 4. 登录

```bash
curl -X POST http://localhost:3000/v1/auth/login/phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "123456"
  }'
```

### 5. 提交状态（需要token）

```bash
curl -X POST http://localhost:3000/v1/submissions/today \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "on_time",
    "tagIds": [1, 2]
  }'
```

### 6. 查看实时统计

```bash
curl http://localhost:3000/v1/realtime/statistics
```

## 🔧 常见问题

### 问题1: 数据库连接失败

**解决方案**:
1. 确认PostgreSQL正在运行
2. 检查.env中的数据库配置
3. 确认数据库已创建

### 问题2: Redis连接失败

**解决方案**:
1. 确认Redis正在运行
2. 检查.env中的Redis配置
3. 或临时注释掉Redis相关代码

### 问题3: 端口被占用

**解决方案**:
修改.env中的PORT配置

### 问题4: TypeScript编译错误

**解决方案**:
```bash
npm install
npm run build
```

## 📱 前后端集成

### 更新前端API地址

编辑 `OvertimeIndexApp/src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3000/v1';
// 或使用你的服务器地址
// const API_BASE_URL = 'https://your-domain.com/v1';
```

### 测试前后端连接

1. 启动后端服务器
2. 启动前端应用
3. 在前端尝试注册/登录
4. 查看网络请求是否成功

## 🚀 部署到生产环境

### 1. 构建

```bash
npm run build
```

### 2. 使用PM2运行

```bash
npm install -g pm2
pm2 start dist/server.js --name overtime-backend
pm2 save
pm2 startup
```

### 3. 使用Docker

```bash
# 创建Dockerfile
docker build -t overtime-backend .
docker run -d -p 3000:3000 --env-file .env overtime-backend
```

## 📊 下一步

现在你可以：

1. ✅ 测试所有API接口
2. ✅ 集成前端应用
3. ✅ 添加更多功能（用户管理、数据管理等）
4. ✅ 部署到云服务器

## 🎉 恭喜！

后端最小可运行版本已完成！

- 所有核心API都已实现
- 可以立即开始前后端集成测试
- 后续可以逐步添加更多功能

有任何问题随时问我！💪

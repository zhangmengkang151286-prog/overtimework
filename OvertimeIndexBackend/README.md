# 打工人加班指数 - 后端API服务

## 📁 项目结构

```
OvertimeIndexBackend/
├── src/
│   ├── server.ts                 # 服务器入口
│   ├── config/                   # 配置文件
│   │   └── index.ts
│   ├── database/                 # 数据库
│   │   ├── connection.ts         # 数据库连接
│   │   ├── migrations/           # 数据库迁移
│   │   │   └── 001_initial.sql
│   │   └── seeds/                # 初始数据
│   │       └── initial_data.sql
│   ├── cache/                    # 缓存
│   │   └── redis.ts              # Redis连接
│   ├── models/                   # 数据模型
│   │   ├── User.ts
│   │   ├── Submission.ts
│   │   └── ...
│   ├── controllers/              # 控制器
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── submissionController.ts
│   │   ├── realtimeController.ts
│   │   ├── historyController.ts
│   │   └── dataController.ts
│   ├── services/                 # 业务逻辑
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── submissionService.ts
│   │   ├── statisticsService.ts
│   │   └── cacheService.ts
│   ├── routes/                   # 路由
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── submissions.ts
│   │   ├── realtime.ts
│   │   ├── history.ts
│   │   └── data.ts
│   ├── middleware/               # 中间件
│   │   ├── auth.ts               # 认证中间件
│   │   ├── validation.ts         # 验证中间件
│   │   ├── errorHandler.ts       # 错误处理
│   │   ├── notFoundHandler.ts    # 404处理
│   │   └── rateLimit.ts          # 限流
│   ├── utils/                    # 工具函数
│   │   ├── jwt.ts                # JWT工具
│   │   ├── bcrypt.ts             # 密码加密
│   │   ├── validator.ts          # 验证工具
│   │   └── response.ts           # 响应格式化
│   ├── jobs/                     # 定时任务
│   │   └── dailyReset.ts         # 每日重置任务
│   └── types/                    # TypeScript类型
│       └── index.ts
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd OvertimeIndexBackend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑.env文件，填入你的配置
```

### 3. 创建数据库

```bash
# 使用PostgreSQL客户端
createdb overtime_index

# 或使用psql
psql -U postgres
CREATE DATABASE overtime_index;
```

### 4. 运行数据库迁移

```bash
npm run db:migrate
```

### 5. 初始化数据

```bash
npm run db:seed
```

### 6. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

## 📚 API文档

详见 [BACKEND_API_DESIGN.md](../BACKEND_API_DESIGN.md)

## 🔧 开发命令

```bash
npm run dev          # 启动开发服务器（热重载）
npm run build        # 构建生产版本
npm start            # 启动生产服务器
npm run db:migrate   # 运行数据库迁移
npm run db:seed      # 初始化数据
npm test             # 运行测试
npm run lint         # 代码检查
```

## 📦 部署

### Docker部署（推荐）

```bash
# 构建镜像
docker build -t overtime-index-backend .

# 运行容器
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name overtime-backend \
  overtime-index-backend
```

### 传统部署

```bash
# 1. 构建
npm run build

# 2. 上传dist目录到服务器

# 3. 在服务器上安装依赖
npm install --production

# 4. 启动服务
npm start

# 或使用PM2
pm2 start dist/server.js --name overtime-backend
```

## 🔐 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务器端口 | 3000 |
| DB_HOST | 数据库主机 | localhost |
| DB_PORT | 数据库端口 | 5432 |
| DB_NAME | 数据库名称 | overtime_index |
| DB_USER | 数据库用户 | postgres |
| DB_PASSWORD | 数据库密码 | - |
| REDIS_HOST | Redis主机 | localhost |
| REDIS_PORT | Redis端口 | 6379 |
| JWT_SECRET | JWT密钥 | - |
| WECHAT_APP_ID | 微信AppID | - |
| WECHAT_APP_SECRET | 微信AppSecret | - |

## 📊 数据库表结构

详见 [BACKEND_API_DESIGN.md](../BACKEND_API_DESIGN.md#数据库设计)

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- auth.test.ts

# 生成覆盖率报告
npm test -- --coverage
```

## 📝 开发规范

### 代码风格

- 使用TypeScript
- 遵循ESLint规则
- 使用async/await处理异步
- 统一的错误处理

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

## 🐛 常见问题

### 1. 数据库连接失败

检查PostgreSQL是否运行：
```bash
pg_isready
```

### 2. Redis连接失败

检查Redis是否运行：
```bash
redis-cli ping
```

### 3. 端口被占用

修改.env中的PORT配置

## 📞 技术支持

如有问题，请查看：
1. [API设计文档](../BACKEND_API_DESIGN.md)
2. [前端项目](../OvertimeIndexApp/)
3. 提交Issue

## 📄 许可证

MIT

# 打工人加班指数 - 后端API设计文档

## 📋 目录

1. [技术栈选择](#技术栈选择)
2. [数据库设计](#数据库设计)
3. [API接口设计](#api接口设计)
4. [实时数据处理](#实时数据处理)
5. [部署方案](#部署方案)

---

## 🛠️ 技术栈选择

### 推荐方案：Node.js + Express

**理由**：
- ✅ 与前端同为JavaScript/TypeScript，技术栈统一
- ✅ 生态丰富，开发效率高
- ✅ 适合实时数据处理
- ✅ 部署简单，云服务支持好

**技术栈**：
```
- 运行环境: Node.js 18+
- Web框架: Express.js
- 数据库: PostgreSQL (主数据) + Redis (缓存)
- ORM: Prisma
- 认证: JWT
- 实时通信: Socket.io (可选)
- 部署: Docker + 云服务器
```

---

## 💾 数据库设计

### 1. 用户表 (users)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE,
  wechat_openid VARCHAR(100) UNIQUE,
  username VARCHAR(50) NOT NULL,
  avatar_url VARCHAR(500),
  province VARCHAR(50),
  city VARCHAR(50),
  industry_id INTEGER REFERENCES industries(id),
  company_id INTEGER REFERENCES companies(id),
  position_id INTEGER REFERENCES positions(id),
  work_start_time TIME,
  work_end_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_wechat ON users(wechat_openid);
CREATE INDEX idx_users_location ON users(province, city);
```

### 2. 行业表 (industries)

```sql
CREATE TABLE industries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_industries_name ON industries(name);
```

### 3. 公司表 (companies)

```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  industry_id INTEGER REFERENCES industries(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry_id);
```

### 4. 职位表 (positions)

```sql
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_positions_name ON positions(name);
```

### 5. 标签表 (tags)

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
```

### 6. 每日状态提交表 (daily_submissions)

```sql
CREATE TABLE daily_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  submission_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'on_time' 或 'overtime'
  overtime_hours DECIMAL(3,1),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, submission_date)
);

CREATE INDEX idx_submissions_date ON daily_submissions(submission_date);
CREATE INDEX idx_submissions_status ON daily_submissions(status);
CREATE INDEX idx_submissions_user_date ON daily_submissions(user_id, submission_date);
```

### 7. 提交标签关联表 (submission_tags)

```sql
CREATE TABLE submission_tags (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES daily_submissions(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(submission_id, tag_id)
);

CREATE INDEX idx_submission_tags_submission ON submission_tags(submission_id);
CREATE INDEX idx_submission_tags_tag ON submission_tags(tag_id);
```

### 8. 历史统计表 (daily_statistics)

```sql
CREATE TABLE daily_statistics (
  id SERIAL PRIMARY KEY,
  stat_date DATE NOT NULL UNIQUE,
  total_participants INTEGER DEFAULT 0,
  on_time_count INTEGER DEFAULT 0,
  overtime_count INTEGER DEFAULT 0,
  on_time_percentage DECIMAL(5,2),
  overtime_percentage DECIMAL(5,2),
  top_tags JSONB, -- 存储Top10标签及其统计
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_statistics_date ON daily_statistics(stat_date DESC);
```

### 9. 实时统计缓存表 (realtime_cache)

```sql
CREATE TABLE realtime_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(100) NOT NULL UNIQUE,
  cache_value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_key ON realtime_cache(cache_key);
```

---

## 🔌 API接口设计

### 基础URL

```
生产环境: https://api.overtimeindex.com/v1
开发环境: http://localhost:3000/v1
```

### 认证方式

使用JWT Token，在请求头中携带：
```
Authorization: Bearer <token>
```

---

### 1. 用户认证模块

#### 1.1 手机号注册

```http
POST /auth/register/phone
Content-Type: application/json

Request:
{
  "phone": "13800138000",
  "verificationCode": "123456"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "userId": 1,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "needsProfile": true
  }
}
```

#### 1.2 微信注册/登录

```http
POST /auth/register/wechat
Content-Type: application/json

Request:
{
  "code": "wechat_auth_code",
  "userInfo": {
    "nickname": "张三",
    "avatarUrl": "https://..."
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "userId": 1,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "needsProfile": true
  }
}
```

#### 1.3 完善用户信息

```http
PUT /auth/profile/complete
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "username": "张三",
  "avatarUrl": "https://...",
  "province": "北京市",
  "city": "北京市",
  "industryId": 1,
  "companyId": 10,
  "positionId": 5,
  "workStartTime": "09:00",
  "workEndTime": "18:00"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "userId": 1,
    "profileComplete": true
  }
}
```

---

### 2. 用户信息模块

#### 2.1 获取用户信息

```http
GET /users/me
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": 1,
    "username": "张三",
    "phone": "138****8000",
    "avatarUrl": "https://...",
    "province": "北京市",
    "city": "北京市",
    "industry": {
      "id": 1,
      "name": "互联网"
    },
    "company": {
      "id": 10,
      "name": "某科技公司"
    },
    "position": {
      "id": 5,
      "name": "软件工程师"
    },
    "workStartTime": "09:00",
    "workEndTime": "18:00"
  }
}
```

#### 2.2 更新用户信息

```http
PUT /users/me
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "username": "李四",
  "province": "上海市",
  "city": "上海市",
  "industryId": 2,
  "companyId": 20,
  "positionId": 6
}

Response: 200 OK
{
  "success": true,
  "data": {
    "userId": 1,
    "updated": true
  }
}
```

---

### 3. 状态提交模块

#### 3.1 提交今日状态

```http
POST /submissions/today
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "status": "overtime", // "on_time" 或 "overtime"
  "overtimeHours": 2.5, // 仅当status为overtime时需要
  "tagIds": [1, 5, 10]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "submissionId": 123,
    "submittedAt": "2026-01-29T14:30:00Z"
  }
}

Error: 400 Bad Request
{
  "success": false,
  "error": {
    "code": "ALREADY_SUBMITTED",
    "message": "今日已提交状态"
  }
}
```

#### 3.2 检查今日是否已提交

```http
GET /submissions/today/status
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "hasSubmitted": true,
    "submission": {
      "status": "overtime",
      "overtimeHours": 2.5,
      "tags": [
        {"id": 1, "name": "项目赶工"},
        {"id": 5, "name": "需求变更"}
      ],
      "submittedAt": "2026-01-29T14:30:00Z"
    }
  }
}
```

---

### 4. 实时数据模块

#### 4.1 获取实时统计数据

```http
GET /realtime/statistics

Response: 200 OK
{
  "success": true,
  "data": {
    "currentTime": "2026-01-29T14:30:00Z",
    "totalParticipants": 15234,
    "onTimeCount": 8456,
    "overtimeCount": 6778,
    "onTimePercentage": 55.5,
    "overtimePercentage": 44.5,
    "lastUpdated": "2026-01-29T14:29:57Z"
  }
}
```

#### 4.2 获取实时标签统计（Top10）

```http
GET /realtime/tags/top

Response: 200 OK
{
  "success": true,
  "data": {
    "onTimeTags": [
      {"tagId": 1, "name": "正常下班", "count": 3200, "percentage": 37.8},
      {"tagId": 2, "name": "工作完成", "count": 2100, "percentage": 24.8},
      // ... 更多
    ],
    "overtimeTags": [
      {"tagId": 10, "name": "项目赶工", "count": 2800, "percentage": 41.3},
      {"tagId": 11, "name": "需求变更", "count": 1900, "percentage": 28.0},
      // ... 更多
    ],
    "otherOnTime": {
      "count": 1500,
      "percentage": 17.7
    },
    "otherOvertime": {
      "count": 1200,
      "percentage": 17.7
    }
  }
}
```

#### 4.3 获取历史时间点数据

```http
GET /realtime/history?date=2026-01-29&time=12:00

Response: 200 OK
{
  "success": true,
  "data": {
    "queryTime": "2026-01-29T12:00:00Z",
    "totalParticipants": 8234,
    "onTimeCount": 4456,
    "overtimeCount": 3778,
    "onTimePercentage": 54.1,
    "overtimePercentage": 45.9
  }
}
```

---

### 5. 历史数据模块

#### 5.1 获取过去N天的统计

```http
GET /history/daily?days=7

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "date": "2026-01-29",
      "totalParticipants": 15234,
      "onTimeCount": 8456,
      "overtimeCount": 6778,
      "onTimePercentage": 55.5,
      "overtimePercentage": 44.5,
      "winner": "on_time" // "on_time", "overtime", 或 "pending"
    },
    {
      "date": "2026-01-28",
      "totalParticipants": 14892,
      "onTimeCount": 7234,
      "overtimeCount": 7658,
      "onTimePercentage": 48.6,
      "overtimePercentage": 51.4,
      "winner": "overtime"
    }
    // ... 更多天数
  ]
}
```

#### 5.2 获取某天的详细数据

```http
GET /history/daily/2026-01-28

Response: 200 OK
{
  "success": true,
  "data": {
    "date": "2026-01-28",
    "totalParticipants": 14892,
    "onTimeCount": 7234,
    "overtimeCount": 7658,
    "onTimePercentage": 48.6,
    "overtimePercentage": 51.4,
    "topTags": {
      "onTime": [
        {"tagId": 1, "name": "正常下班", "count": 2800},
        // ...
      ],
      "overtime": [
        {"tagId": 10, "name": "项目赶工", "count": 3200},
        // ...
      ]
    }
  }
}
```

---

### 6. 基础数据管理模块

#### 6.1 行业管理

```http
# 获取行业列表
GET /data/industries?search=互联网

Response: 200 OK
{
  "success": true,
  "data": [
    {"id": 1, "name": "互联网"},
    {"id": 2, "name": "互联网金融"}
  ]
}

# 添加行业
POST /data/industries
Authorization: Bearer <admin_token>
Content-Type: application/json

Request:
{
  "name": "新能源"
}

# 更新行业
PUT /data/industries/1
Authorization: Bearer <admin_token>

# 删除行业
DELETE /data/industries/1
Authorization: Bearer <admin_token>
```

#### 6.2 公司管理

```http
# 获取公司列表
GET /data/companies?search=腾讯&industryId=1

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": 10,
      "name": "腾讯科技",
      "industry": {"id": 1, "name": "互联网"}
    }
  ]
}

# 添加公司
POST /data/companies
Authorization: Bearer <admin_token>
Content-Type: application/json

Request:
{
  "name": "字节跳动",
  "industryId": 1
}
```

#### 6.3 职位管理

```http
# 获取职位列表
GET /data/positions?search=工程师

Response: 200 OK
{
  "success": true,
  "data": [
    {"id": 5, "name": "软件工程师"},
    {"id": 6, "name": "前端工程师"}
  ]
}
```

#### 6.4 标签管理

```http
# 获取热门标签（Top20）
GET /data/tags/popular

Response: 200 OK
{
  "success": true,
  "data": [
    {"id": 1, "name": "正常下班", "usageCount": 15234},
    {"id": 2, "name": "项目赶工", "usageCount": 12456}
  ]
}

# 搜索标签
GET /data/tags?search=项目

Response: 200 OK
{
  "success": true,
  "data": [
    {"id": 2, "name": "项目赶工", "usageCount": 12456},
    {"id": 15, "name": "项目上线", "usageCount": 8234}
  ]
}
```

---

### 7. 定位服务模块

#### 7.1 根据坐标获取省市

```http
GET /location/geocode?lat=39.9042&lng=116.4074

Response: 200 OK
{
  "success": true,
  "data": {
    "province": "北京市",
    "city": "北京市",
    "district": "朝阳区"
  }
}
```

---

## ⚡ 实时数据处理

### 数据更新策略

#### 1. 实时统计更新
```javascript
// 每次有新提交时
- 更新Redis缓存中的实时统计
- 每3秒批量写入数据库
- 客户端每3秒轮询获取最新数据
```

#### 2. 每日重置机制
```javascript
// 每天00:00执行
1. 保存当日完整统计到 daily_statistics 表
2. 清空 realtime_cache 表
3. 重置Redis缓存
4. 发送通知给在线用户
```

#### 3. 历史数据查询
```javascript
// 查询历史时间点数据
- 从 daily_submissions 表按时间范围聚合
- 缓存常用时间点的查询结果
- 使用数据库索引优化查询性能
```

---

## 🚀 部署方案

### 推荐架构

```
┌─────────────┐
│   客户端     │
│  (React Native)│
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Nginx     │ (反向代理 + SSL)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Node.js    │ (Express API)
│  服务器      │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐ ┌──────────┐
│PostgreSQL│ │  Redis   │
│  (主数据) │ │  (缓存)  │
└──────────┘ └──────────┘
```

### 云服务选择

#### 方案1：阿里云（推荐国内）
```
- ECS服务器: 2核4G (约¥100/月)
- RDS PostgreSQL: 基础版 (约¥150/月)
- Redis: 1G内存 (约¥50/月)
- 总计: 约¥300/月
```

#### 方案2：腾讯云
```
- 云服务器: 2核4G (约¥100/月)
- 云数据库PostgreSQL (约¥150/月)
- 云缓存Redis (约¥50/月)
- 总计: 约¥300/月
```

#### 方案3：AWS/Azure（国际）
```
- EC2/VM: t3.small (约$20/月)
- RDS PostgreSQL (约$30/月)
- ElastiCache Redis (约$15/月)
- 总计: 约$65/月 (约¥450/月)
```

---

## 📝 开发步骤

### 第1步：环境搭建（1天）
```bash
1. 初始化Node.js项目
2. 安装依赖包
3. 配置TypeScript
4. 设置开发环境
```

### 第2步：数据库设计（1天）
```bash
1. 创建数据库
2. 编写迁移脚本
3. 初始化基础数据
4. 测试数据库连接
```

### 第3步：核心API开发（3-5天）
```bash
1. 用户认证模块
2. 状态提交模块
3. 实时数据模块
4. 历史数据模块
```

### 第4步：管理功能开发（2天）
```bash
1. 基础数据管理
2. 管理员权限
3. 数据导入导出
```

### 第5步：测试和优化（2天）
```bash
1. 单元测试
2. 接口测试
3. 性能优化
4. 安全加固
```

### 第6步：部署上线（1-2天）
```bash
1. 购买云服务
2. 配置服务器
3. 部署应用
4. 域名和SSL配置
```

---

## 🔐 安全考虑

### 1. 认证安全
- 使用JWT Token，设置合理过期时间
- 密码使用bcrypt加密
- 实现刷新Token机制

### 2. 接口安全
- 所有接口使用HTTPS
- 实现请求频率限制
- 防止SQL注入
- 输入验证和过滤

### 3. 数据安全
- 敏感数据加密存储
- 定期数据备份
- 访问日志记录

---

## 📊 性能优化

### 1. 缓存策略
- Redis缓存实时统计数据
- 缓存热门标签列表
- 缓存用户信息

### 2. 数据库优化
- 合理使用索引
- 查询优化
- 连接池管理

### 3. API优化
- 响应数据压缩
- 分页查询
- 批量操作

---

## 📞 下一步

准备好开始开发了吗？我可以帮你：

1. **生成项目脚手架代码**
2. **编写数据库迁移脚本**
3. **实现核心API接口**
4. **提供部署指南**

告诉我你想从哪里开始！🚀

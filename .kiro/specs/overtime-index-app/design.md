# 设计文档

## 概述

打工人加班指数是一个跨平台移动应用，采用React Native框架开发，支持iOS和Android平台。应用以数据可视化为核心，提供实时的加班统计信息展示，采用现代简洁的设计风格，确保用户能够快速获取关键信息。

应用的核心价值在于通过冷静、客观的数据展示方式，帮助用户了解当前的工作状态趋势，避免情绪化的信息传递。系统设计遵循高性能、高可用性和良好用户体验的原则。

## 架构

### 整体架构

应用采用分层架构模式，包含以下主要层次：

```
┌─────────────────────────────────────┐
│           展示层 (UI Layer)          │
│  React Native Components & Screens  │
├─────────────────────────────────────┤
│         业务逻辑层 (BLL)             │
│    Services & State Management      │
├─────────────────────────────────────┤
│        数据访问层 (DAL)              │
│     API Client & Local Storage      │
├─────────────────────────────────────┤
│         基础设施层 (Infrastructure)   │
│   Network, Storage, Authentication  │
└─────────────────────────────────────┘
```

### 技术栈

- **前端框架**: React Native 0.72+
- **状态管理**: Redux Toolkit + RTK Query
- **导航**: React Navigation 6
- **UI组件库**: React Native Elements + 自定义组件
- **图表库**: Victory Native (数据可视化)
- **动画**: React Native Reanimated 3
- **本地存储**: AsyncStorage + SQLite (复杂数据)
- **后端服务**: Supabase (数据库、认证、实时订阅)
- **网络请求**: Supabase Client + RTK Query
- **认证**: Supabase Auth
- **推送通知**: React Native Firebase Messaging
- **定位服务**: React Native Geolocation

### 部署架构

```
┌─────────────────┐    ┌─────────────────┐
│   iOS App       │    │  Android App    │
│   (App Store)   │    │ (Google Play)   │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌─────────────────────┐
          │    API Gateway      │
          │   (Load Balancer)   │
          └─────────┬───────────┘
                    │
          ┌─────────────────────┐
          │   Backend Services  │
          │  (Node.js/Express)  │
          └─────────┬───────────┘
                    │
          ┌─────────────────────┐
          │     Database        │
          │  (MongoDB/Redis)    │
          └─────────────────────┘
```

## 组件和接口

### 核心组件

#### 1. TrendPage (趋势页面)
主要的数据展示页面，包含所有实时统计信息。

```typescript
interface TrendPageProps {
  realTimeData: RealTimeData;
  historicalData: HistoricalData[];
  userStatus: UserStatus | null;
}

interface RealTimeData {
  timestamp: Date;
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
  tagDistribution: TagDistribution[];
  dailyStatus: DailyStatus[];
}
```

#### 2. DataVisualization (数据可视化)
负责展示对抗条和网格图的组件。

```typescript
interface DataVisualizationProps {
  overtimeRatio: number;
  onTimeRatio: number;
  tagDistribution: TagDistribution[];
  animationDuration: number;
}

interface TagDistribution {
  tagId: string;
  tagName: string;
  count: number;
  isOvertime: boolean;
  color: string;
}
```

#### 3. TimeAxis (时间轴)
历史数据查看组件。

```typescript
interface TimeAxisProps {
  currentTime: Date;
  onTimeChange: (time: Date) => void;
  minTime: Date;
  maxTime: Date;
  interval: number; // 15分钟间隔
}
```

#### 4. UserStatusSelector (用户状态选择器)
用户状态提交组件。

```typescript
interface UserStatusSelectorProps {
  visible: boolean;
  onStatusSelect: (status: UserStatusSubmission) => void;
  availableTags: Tag[];
}

interface UserStatusSubmission {
  isOvertime: boolean;
  tagId: string;
  overtimeHours?: number; // 1-6小时
  timestamp: Date;
}
```

### API接口设计

#### 1. 实时数据接口
```typescript
// GET /api/realtime
interface RealTimeResponse {
  timestamp: string;
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
  tagDistribution: TagDistribution[];
  dailyStatus: DailyStatus[];
}
```

#### 2. 历史数据接口
```typescript
// GET /api/historical?date=YYYY-MM-DD&time=HH:mm
interface HistoricalResponse {
  data: RealTimeResponse;
  isAvailable: boolean;
}
```

#### 3. 用户状态提交接口
```typescript
// POST /api/user/status
interface StatusSubmissionRequest {
  userId: string;
  isOvertime: boolean;
  tagId: string;
  overtimeHours?: number;
  timestamp: string;
}
```

#### 4. 基础数据管理接口
```typescript
// GET /api/tags?type=industry|company|position&search=keyword
// POST /api/tags
// PUT /api/tags/:id
// DELETE /api/tags/:id
interface TagResponse {
  id: string;
  name: string;
  type: 'industry' | 'company' | 'position';
  isActive: boolean;
  createdAt: string;
}
```

## 数据模型

### Supabase 数据库架构

#### 表结构设计

**users 表**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) UNIQUE,
  wechat_id VARCHAR(100) UNIQUE,
  avatar TEXT,
  username VARCHAR(50) NOT NULL,
  province VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  company VARCHAR(200) NOT NULL,
  position VARCHAR(100) NOT NULL,
  work_start_time TIME NOT NULL,
  work_end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_wechat ON users(wechat_id);
CREATE INDEX idx_users_company ON users(company);
CREATE INDEX idx_users_industry ON users(industry);
```

**status_records 表**
```sql
CREATE TABLE status_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_overtime BOOLEAN NOT NULL,
  tag_id UUID REFERENCES tags(id),
  overtime_hours INTEGER CHECK (overtime_hours >= 1 AND overtime_hours <= 12),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 索引
CREATE INDEX idx_status_records_date ON status_records(date);
CREATE INDEX idx_status_records_user_date ON status_records(user_id, date);
CREATE INDEX idx_status_records_tag ON status_records(tag_id);
```

**tags 表**
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('industry', 'company', 'position', 'custom')),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tags_type ON tags(type);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
```

**real_time_stats 表（物化视图）**
```sql
CREATE MATERIALIZED VIEW real_time_stats AS
SELECT 
  date,
  COUNT(DISTINCT user_id) as participant_count,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count,
  MAX(submitted_at) as last_updated
FROM status_records
WHERE date = CURRENT_DATE
GROUP BY date;

-- 刷新策略：每3秒刷新一次
CREATE OR REPLACE FUNCTION refresh_real_time_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY real_time_stats;
END;
$$ LANGUAGE plpgsql;
```

**tag_stats 表（物化视图）**
```sql
CREATE MATERIALIZED VIEW tag_stats AS
SELECT 
  sr.date,
  sr.tag_id,
  t.name as tag_name,
  SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END) as on_time_count,
  COUNT(*) as total_count
FROM status_records sr
JOIN tags t ON sr.tag_id = t.id
WHERE sr.date = CURRENT_DATE
GROUP BY sr.date, sr.tag_id, t.name
ORDER BY total_count DESC;
```

**daily_history 表**
```sql
CREATE TABLE daily_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  participant_count INTEGER NOT NULL,
  overtime_count INTEGER NOT NULL,
  on_time_count INTEGER NOT NULL,
  tag_distribution JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_daily_history_date ON daily_history(date DESC);
```

#### Row Level Security (RLS) 策略

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和修改自己的数据
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 用户只能创建和查看自己的状态记录
CREATE POLICY "Users can insert own status" ON status_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own status" ON status_records
  FOR SELECT USING (auth.uid() = user_id);

-- 所有人都可以查看标签
CREATE POLICY "Anyone can view tags" ON tags
  FOR SELECT USING (true);

-- 只有管理员可以修改标签
CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

### 用户模型
```typescript
interface User {
  id: string;
  phoneNumber: string;
  wechatId?: string;
  avatar: string;
  username: string;
  province: string;
  city: string;
  industry: string;
  company: string;
  position: string;
  workStartTime: string; // HH:mm格式
  workEndTime: string;   // HH:mm格式
  createdAt: Date;
  updatedAt: Date;
}
```

### 状态记录模型
```typescript
interface StatusRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD格式
  isOvertime: boolean;
  tagId: string;
  overtimeHours?: number;
  submittedAt: Date;
}
```

### 标签模型
```typescript
interface Tag {
  id: string;
  name: string;
  type: 'industry' | 'company' | 'position' | 'custom';
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
}
```

### 实时统计模型
```typescript
interface RealTimeStats {
  date: string;
  timestamp: Date;
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
  tagStats: TagStats[];
}

interface TagStats {
  tagId: string;
  tagName: string;
  overtimeCount: number;
  onTimeCount: number;
  totalCount: number;
}
```
## 正确性属性

*属性是指在系统的所有有效执行中都应该成立的特征或行为——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性反思

在分析所有可测试的验收标准后，我识别出以下需要合并或优化的冗余属性：

- 多个3秒刷新频率的属性（1.4, 2.4, 5.4）可以合并为一个通用的数据刷新属性
- 状态指示器颜色逻辑属性（4.2, 4.3）可以合并为一个综合的状态指示器属性
- 数据管理CRUD操作属性（13.1-13.4）可以合并为一个综合的数据管理属性
- 用户信息相关的属性（8.4, 10.1, 10.2）可以合并为用户信息管理属性

### 核心正确性属性

**属性 1: 数据刷新一致性**
*对于任何*实时数据组件，数据刷新间隔应该严格保持3秒，时间显示刷新间隔应该严格保持1秒
**验证需求: 1.4, 2.2, 2.4, 5.4**

**属性 2: 时间格式一致性**
*对于任何*显示的时间，格式应该严格遵循"YYYY/MM/DD HH:mm:ss"模式
**验证需求: 2.1**

**属性 3: 数据可视化比例准确性**
*对于任何*给定的加班和准时下班人数数据，对抗条交界处位置和网格图方格分配应该准确反映实际人数比例
**验证需求: 4.5, 5.3**

**属性 4: 状态指示器逻辑正确性**
*对于任何*日期的统计数据，当加班人数大于准时下班人数时应显示浅红色圆点，当准时下班人数大于加班人数时应显示浅绿色圆点，当数据未确定时应显示闪烁的浅黄色圆点
**验证需求: 4.2, 4.3, 4.4**

**属性 5: 历史数据时间轴一致性**
*对于任何*时间轴位置变化，所有数据可视化组件应该同步更新到对应时间点的历史数据
**验证需求: 6.2, 6.5**

**属性 6: 用户状态选择流程完整性**
*对于任何*用户状态选择操作，选择准点下班应触发标签选择界面，选择加班应触发标签选择和时长选择界面，完成选择后应隐藏选择器直到次日
**验证需求: 7.2, 7.3, 7.4**

**属性 7: 搜索功能一致性**
*对于任何*搜索输入，所有支持搜索的组件（标签选择器、数据管理界面）应该根据输入内容正确过滤结果列表
**验证需求: 8.5, 9.3, 13.5**

**属性 8: 数据重置完整性**
*对于任何*日期边界（00:00），系统应该完整保存前一日数据为历史记录，然后将所有当日统计数据重置为初始状态，并重新显示用户状态选择器
**验证需求: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7**

**属性 9: 数据管理CRUD完整性**
*对于任何*基础数据类型（行业、公司、职位、标签），系统应该支持完整的增删改查操作，并在数据变更后立即在相关UI中反映变化
**验证需求: 13.1, 13.2, 13.3, 13.4, 13.6**

**属性 10: 用户信息管理一致性**
*对于任何*用户信息修改操作，系统应该提供与注册时相同的搜索和选择功能，验证信息完整性后更新数据，并立即反映在相关统计中
**验证需求: 8.4, 10.1, 10.2, 10.3, 10.4**

**属性 11: Top10数据聚合准确性**
*对于任何*标签统计数据，网格图应该仅显示占比前10的标签，其余标签应该分别合并为"加班的其他"（浅红色）和"准时下班的其他"（浅绿色）两个类别
**验证需求: 9.4, 9.5**

**属性 12: 动画效果平滑性**
*对于任何*数据变化，相关的可视化组件应该使用平滑的过渡动画，避免跳变，并在用户交互时提供适当的反馈效果
**验证需求: 2.5, 5.5, 11.5**

## 错误处理

### 网络错误处理
- **连接超时**: 显示友好的错误提示，提供重试机制
- **服务器错误**: 记录错误日志，显示通用错误信息
- **数据格式错误**: 使用默认值或缓存数据，记录异常

### 数据错误处理
- **实时数据异常**: 使用上一次有效数据，显示数据延迟提示
- **历史数据缺失**: 显示"数据不可用"提示
- **用户输入验证**: 实时验证并显示具体错误信息

### 系统错误处理
- **内存不足**: 清理缓存，优化数据加载
- **存储空间不足**: 清理历史数据，提示用户
- **权限错误**: 引导用户授权或提供替代方案

### 错误恢复策略
```typescript
interface ErrorRecoveryStrategy {
  retryCount: number;
  retryInterval: number;
  fallbackData?: any;
  userNotification: boolean;
  logLevel: 'error' | 'warn' | 'info';
}

// 网络请求错误恢复
const networkErrorStrategy: ErrorRecoveryStrategy = {
  retryCount: 3,
  retryInterval: 2000,
  userNotification: true,
  logLevel: 'error'
};

// 数据解析错误恢复
const dataParseErrorStrategy: ErrorRecoveryStrategy = {
  retryCount: 1,
  retryInterval: 1000,
  fallbackData: getDefaultData(),
  userNotification: false,
  logLevel: 'warn'
};
```

## 测试策略

### 双重测试方法

本应用采用单元测试和基于属性的测试相结合的综合测试策略：

- **单元测试**验证具体示例、边缘情况和错误条件
- **基于属性的测试**验证应该在所有输入中保持的通用属性
- 两种测试方法相互补充：单元测试捕获具体错误，基于属性的测试验证通用正确性

### 单元测试

单元测试主要覆盖：
- 特定示例，展示正确行为
- 组件间的集成点
- 重要边缘情况和错误条件

单元测试应该保持简洁，避免过度测试，因为基于属性的测试会处理大量输入覆盖。

### 基于属性的测试

**测试框架**: 使用 `fast-check` 库进行基于属性的测试
**测试配置**: 每个基于属性的测试应该运行最少100次迭代，因为属性测试过程是随机的
**测试标记**: 每个基于属性的测试必须使用注释明确引用设计文档中的正确性属性

测试标记格式: `**Feature: overtime-index-app, Property {number}: {property_text}**`

每个正确性属性必须由单独的基于属性的测试实现。

### 测试实现要求

- 每个正确性属性必须通过单独的基于属性的测试实现
- 基于属性的测试应该尽可能不使用模拟，以保持简单性
- 使用属性测试来测试跨多个输入的核心逻辑
- 编写智能生成器，合理约束输入空间
- 测试可能会发现代码中的错误，不要假设代码总是正确的
- 如果测试发现了规范或设计文档中未涵盖的令人困惑的行为，应该询问用户以获得澄清

### 性能测试

- **加载性能**: 应用启动时间 < 3秒
- **数据刷新性能**: 3秒刷新周期内完成所有数据更新
- **动画性能**: 保持60fps的流畅动画
- **内存使用**: 控制在合理范围内，避免内存泄漏

### 兼容性测试

- **iOS版本**: 支持iOS 12.0+
- **Android版本**: 支持Android API 21+
- **设备适配**: 支持各种屏幕尺寸和分辨率
- **网络环境**: 支持2G/3G/4G/5G/WiFi网络
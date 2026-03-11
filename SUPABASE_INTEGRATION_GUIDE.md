# Supabase 集成指南

## 概述

本指南详细说明如何将打工人加班指数应用与 Supabase 后端服务集成。

## 前置准备

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 记录以下信息：
   - Project URL
   - Anon Public Key
   - Service Role Key (仅用于服务端)

### 2. 安装依赖

```bash
cd OvertimeIndexApp
npm install @supabase/supabase-js
```

## 数据库设置

### 1. 创建表结构

在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
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

-- 状态记录表
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

-- 标签表
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('industry', 'company', 'position', 'custom')),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 每日历史表
CREATE TABLE daily_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  participant_count INTEGER NOT NULL,
  overtime_count INTEGER NOT NULL,
  on_time_count INTEGER NOT NULL,
  tag_distribution JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_wechat ON users(wechat_id);
CREATE INDEX idx_users_company ON users(company);
CREATE INDEX idx_users_industry ON users(industry);

CREATE INDEX idx_status_records_date ON status_records(date);
CREATE INDEX idx_status_records_user_date ON status_records(user_id, date);
CREATE INDEX idx_status_records_tag ON status_records(tag_id);

CREATE INDEX idx_tags_type ON tags(type);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);

CREATE INDEX idx_daily_history_date ON daily_history(date DESC);
```

### 2. 创建物化视图（实时统计）

```sql
-- 实时统计视图
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

-- 创建唯一索引以支持并发刷新
CREATE UNIQUE INDEX ON real_time_stats (date);

-- 标签统计视图
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

CREATE UNIQUE INDEX ON tag_stats (date, tag_id);

-- 自动刷新函数
CREATE OR REPLACE FUNCTION refresh_real_time_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY real_time_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY tag_stats;
END;
$$ LANGUAGE plpgsql;
```

### 3. 设置 Row Level Security (RLS)

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_history ENABLE ROW LEVEL SECURITY;

-- 用户策略
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 状态记录策略
CREATE POLICY "Users can insert own status" ON status_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own status" ON status_records
  FOR SELECT USING (auth.uid() = user_id);

-- 标签策略（所有人可读）
CREATE POLICY "Anyone can view tags" ON tags
  FOR SELECT USING (true);

-- 管理员可以管理标签
CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.phone_number IN ('admin_phone_numbers')
    )
  );

-- 历史数据（所有人可读）
CREATE POLICY "Anyone can view history" ON daily_history
  FOR SELECT USING (true);
```

### 4. 创建数据库函数

```sql
-- 获取实时统计数据
CREATE OR REPLACE FUNCTION get_real_time_stats()
RETURNS TABLE (
  participant_count BIGINT,
  overtime_count BIGINT,
  on_time_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(participant_count, 0)::BIGINT,
    COALESCE(overtime_count, 0)::BIGINT,
    COALESCE(on_time_count, 0)::BIGINT,
    COALESCE(last_updated, NOW())
  FROM real_time_stats
  WHERE date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 获取 Top 10 标签统计
CREATE OR REPLACE FUNCTION get_top_tags(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  tag_id UUID,
  tag_name VARCHAR,
  overtime_count BIGINT,
  on_time_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.tag_id,
    ts.tag_name,
    ts.overtime_count,
    ts.on_time_count,
    ts.total_count
  FROM tag_stats ts
  WHERE ts.date = CURRENT_DATE
  ORDER BY ts.total_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 获取过去 N 天的状态
CREATE OR REPLACE FUNCTION get_daily_status(days INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  is_overtime_dominant BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dh.date,
    (dh.overtime_count > dh.on_time_count) as is_overtime_dominant
  FROM daily_history dh
  WHERE dh.date >= CURRENT_DATE - days
  ORDER BY dh.date DESC;
END;
$$ LANGUAGE plpgsql;
```

### 5. 设置定时任务（每日重置）

```sql
-- 创建每日归档函数
CREATE OR REPLACE FUNCTION archive_daily_data()
RETURNS void AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - 1;
  stats_data RECORD;
  tag_data JSONB;
BEGIN
  -- 获取昨天的统计数据
  SELECT 
    COUNT(DISTINCT user_id) as participant_count,
    SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
    SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count
  INTO stats_data
  FROM status_records
  WHERE date = yesterday;

  -- 获取标签分布
  SELECT jsonb_agg(
    jsonb_build_object(
      'tag_id', tag_id,
      'tag_name', tag_name,
      'overtime_count', overtime_count,
      'on_time_count', on_time_count,
      'total_count', total_count
    )
  )
  INTO tag_data
  FROM tag_stats
  WHERE date = yesterday;

  -- 插入历史记录
  INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
  VALUES (yesterday, stats_data.participant_count, stats_data.overtime_count, stats_data.on_time_count, tag_data)
  ON CONFLICT (date) DO UPDATE
  SET 
    participant_count = EXCLUDED.participant_count,
    overtime_count = EXCLUDED.overtime_count,
    on_time_count = EXCLUDED.on_time_count,
    tag_distribution = EXCLUDED.tag_distribution;

  -- 刷新物化视图
  PERFORM refresh_real_time_stats();
END;
$$ LANGUAGE plpgsql;
```

使用 Supabase 的 pg_cron 扩展设置定时任务：

```sql
-- 启用 pg_cron 扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 每天 00:00 执行归档
SELECT cron.schedule(
  'archive-daily-data',
  '0 0 * * *',
  'SELECT archive_daily_data();'
);

-- 每 3 秒刷新实时统计
SELECT cron.schedule(
  'refresh-stats',
  '*/3 * * * * *',
  'SELECT refresh_real_time_stats();'
);
```

## 应用配置

### 1. 环境变量配置

创建 `.env` 文件：

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

### 2. 创建 Supabase 客户端

创建 `src/services/supabase.ts`：

```typescript
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

## 实时订阅设置

### 启用 Realtime

在 Supabase Dashboard 中：
1. 进入 Database > Replication
2. 启用需要实时更新的表：
   - status_records
   - tags
   - users

## 测试数据

插入一些测试数据：

```sql
-- 插入测试标签
INSERT INTO tags (name, type, is_active) VALUES
  ('互联网', 'industry', true),
  ('金融', 'industry', true),
  ('教育', 'industry', true),
  ('字节跳动', 'company', true),
  ('阿里巴巴', 'company', true),
  ('腾讯', 'company', true),
  ('软件工程师', 'position', true),
  ('产品经理', 'position', true),
  ('设计师', 'position', true);
```

## 下一步

1. 实现 Supabase 服务层（任务 16.1）
2. 集成认证功能（任务 16.2）
3. 迁移数据操作（任务 16.3）
4. 实现实时订阅（任务 16.4）

## 常见问题

### Q: 如何处理 RLS 策略导致的权限问题？
A: 在开发阶段，可以临时禁用 RLS 或使用 service_role key。生产环境必须启用 RLS。

### Q: 实时订阅不工作？
A: 检查 Replication 设置，确保表已启用 Realtime。

### Q: 如何优化查询性能？
A: 使用物化视图、添加适当的索引、使用 Supabase 的查询优化工具。

## 参考资源

- [Supabase 文档](https://supabase.com/docs)
- [Supabase JS 客户端](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

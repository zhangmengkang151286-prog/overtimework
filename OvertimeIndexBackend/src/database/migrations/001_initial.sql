-- 打工人加班指数数据库初始化脚本

-- 1. 行业表
CREATE TABLE IF NOT EXISTS industries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_industries_name ON industries(name);
CREATE INDEX idx_industries_active ON industries(is_active);

-- 2. 公司表
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  industry_id INTEGER REFERENCES industries(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry_id);
CREATE INDEX idx_companies_active ON companies(is_active);

-- 3. 职位表
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_positions_name ON positions(name);
CREATE INDEX idx_positions_active ON positions(is_active);

-- 4. 标签表
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX idx_tags_active ON tags(is_active);

-- 5. 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE,
  wechat_openid VARCHAR(100) UNIQUE,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255),
  avatar_url VARCHAR(500),
  province VARCHAR(50),
  city VARCHAR(50),
  industry_id INTEGER REFERENCES industries(id) ON DELETE SET NULL,
  company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL,
  work_start_time TIME,
  work_end_time TIME,
  is_active BOOLEAN DEFAULT true,
  profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_wechat ON users(wechat_openid);
CREATE INDEX idx_users_location ON users(province, city);
CREATE INDEX idx_users_industry ON users(industry_id);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_active ON users(is_active);

-- 6. 每日状态提交表
CREATE TABLE IF NOT EXISTS daily_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  submission_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('on_time', 'overtime')),
  overtime_hours DECIMAL(3,1),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, submission_date)
);

CREATE INDEX idx_submissions_date ON daily_submissions(submission_date);
CREATE INDEX idx_submissions_status ON daily_submissions(status);
CREATE INDEX idx_submissions_user_date ON daily_submissions(user_id, submission_date);
CREATE INDEX idx_submissions_user ON daily_submissions(user_id);

-- 7. 提交标签关联表
CREATE TABLE IF NOT EXISTS submission_tags (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES daily_submissions(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(submission_id, tag_id)
);

CREATE INDEX idx_submission_tags_submission ON submission_tags(submission_id);
CREATE INDEX idx_submission_tags_tag ON submission_tags(tag_id);

-- 8. 历史统计表
CREATE TABLE IF NOT EXISTS daily_statistics (
  id SERIAL PRIMARY KEY,
  stat_date DATE NOT NULL UNIQUE,
  total_participants INTEGER DEFAULT 0,
  on_time_count INTEGER DEFAULT 0,
  overtime_count INTEGER DEFAULT 0,
  on_time_percentage DECIMAL(5,2),
  overtime_percentage DECIMAL(5,2),
  top_tags JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_statistics_date ON daily_statistics(stat_date DESC);

-- 9. 实时统计缓存表
CREATE TABLE IF NOT EXISTS realtime_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(100) NOT NULL UNIQUE,
  cache_value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_key ON realtime_cache(cache_key);

-- 10. 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_username ON admins(username);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为users表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为realtime_cache表添加更新时间触发器
CREATE TRIGGER update_cache_updated_at BEFORE UPDATE ON realtime_cache
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 完成
COMMENT ON DATABASE overtime_index IS '打工人加班指数数据库';

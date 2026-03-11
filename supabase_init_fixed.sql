-- ============================================
-- 打工人加班指数 - Supabase 修复版初始化脚本
-- ============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 删除可能存在的旧表（谨慎！）
-- ============================================

-- 如果需要重新开始，取消下面的注释
-- DROP TABLE IF EXISTS status_records CASCADE;
-- DROP TABLE IF EXISTS daily_history CASCADE;
-- DROP TABLE IF EXISTS tags CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================
-- 2. 创建用户资料表（扩展 auth.users）
-- ============================================

-- 不创建 users 表，而是创建 user_profiles 表来存储额外信息
-- user_id 引用 auth.users(id)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) UNIQUE,
  wechat_id VARCHAR(100) UNIQUE,
  avatar TEXT,
  username VARCHAR(50) NOT NULL,
  province VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  company VARCHAR(200) NOT NULL,
  position VARCHAR(100) NOT NULL,
  work_start_time TIME NOT NULL DEFAULT '09:00:00',
  work_end_time TIME NOT NULL DEFAULT '18:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 创建标签表
-- ============================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('industry', 'company', 'position', 'custom')),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. 创建状态记录表
-- ============================================

CREATE TABLE IF NOT EXISTS status_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_overtime BOOLEAN NOT NULL,
  tag_id UUID REFERENCES tags(id),
  overtime_hours INTEGER CHECK (overtime_hours >= 1 AND overtime_hours <= 12),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- 5. 创建每日历史表
-- ============================================

CREATE TABLE IF NOT EXISTS daily_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  participant_count INTEGER NOT NULL,
  overtime_count INTEGER NOT NULL,
  on_time_count INTEGER NOT NULL,
  tag_distribution JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. 创建索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_wechat ON user_profiles(wechat_id);
CREATE INDEX IF NOT EXISTS idx_status_records_date ON status_records(date);
CREATE INDEX IF NOT EXISTS idx_status_records_user_date ON status_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_daily_history_date ON daily_history(date DESC);

-- ============================================
-- 7. 创建数据库函数
-- ============================================

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
    COALESCE(COUNT(DISTINCT user_id), 0)::BIGINT as participant_count,
    COALESCE(SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END), 0)::BIGINT as overtime_count,
    COALESCE(SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END), 0)::BIGINT as on_time_count,
    COALESCE(MAX(submitted_at), NOW()) as last_updated
  FROM status_records
  WHERE date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取 Top N 标签统计
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
    sr.tag_id,
    t.name as tag_name,
    COALESCE(SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END), 0)::BIGINT as overtime_count,
    COALESCE(SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END), 0)::BIGINT as on_time_count,
    COUNT(*)::BIGINT as total_count
  FROM status_records sr
  JOIN tags t ON sr.tag_id = t.id
  WHERE sr.date = CURRENT_DATE
  GROUP BY sr.tag_id, t.name
  ORDER BY total_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取过去 N 天的状态
CREATE OR REPLACE FUNCTION get_daily_status(days INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  is_overtime_dominant BOOLEAN,
  participant_count INTEGER,
  overtime_count INTEGER,
  on_time_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dh.date,
    (dh.overtime_count > dh.on_time_count) as is_overtime_dominant,
    dh.participant_count,
    dh.overtime_count,
    dh.on_time_count
  FROM daily_history dh
  WHERE dh.date >= CURRENT_DATE - days
  ORDER BY dh.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. 插入测试标签
-- ============================================

INSERT INTO tags (name, type, is_active) VALUES
  ('互联网', 'industry', true),
  ('金融', 'industry', true),
  ('教育', 'industry', true),
  ('制造业', 'industry', true),
  ('医疗', 'industry', true),
  ('字节跳动', 'company', true),
  ('阿里巴巴', 'company', true),
  ('腾讯', 'company', true),
  ('华为', 'company', true),
  ('百度', 'company', true),
  ('软件工程师', 'position', true),
  ('产品经理', 'position', true),
  ('设计师', 'position', true),
  ('运营', 'position', true),
  ('测试工程师', 'position', true),
  ('项目紧急', 'custom', true),
  ('需求变更', 'custom', true),
  ('线上故障', 'custom', true),
  ('自愿加班', 'custom', true),
  ('领导要求', 'custom', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 9. 设置 Row Level Security (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_history ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果有）
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own status" ON status_records;
DROP POLICY IF EXISTS "Users can view own status" ON status_records;
DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
DROP POLICY IF EXISTS "Anyone can view history" ON daily_history;

-- 用户资料策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 状态记录策略
CREATE POLICY "Users can insert own status" ON status_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own status" ON status_records
  FOR SELECT USING (auth.uid() = user_id);

-- 标签策略（所有人可读）
CREATE POLICY "Anyone can view tags" ON tags
  FOR SELECT USING (true);

-- 历史数据（所有人可读）
CREATE POLICY "Anyone can view history" ON daily_history
  FOR SELECT USING (true);

-- ============================================
-- 10. 设置权限
-- ============================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- 11. 验证安装
-- ============================================

-- 测试函数
SELECT * FROM get_real_time_stats();

-- 显示完成信息
DO $$
DECLARE
  tag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tag_count FROM tags;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE '数据库初始化完成！';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '已创建的表：';
  RAISE NOTICE '  - user_profiles (扩展 auth.users)';
  RAISE NOTICE '  - tags';
  RAISE NOTICE '  - status_records';
  RAISE NOTICE '  - daily_history';
  RAISE NOTICE '';
  RAISE NOTICE '已创建的函数：';
  RAISE NOTICE '  - get_real_time_stats()';
  RAISE NOTICE '  - get_top_tags()';
  RAISE NOTICE '  - get_daily_status()';
  RAISE NOTICE '';
  RAISE NOTICE '已插入 % 个测试标签', tag_count;
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE '重要提示：';
  RAISE NOTICE '  - 用户数据存储在 user_profiles 表中';
  RAISE NOTICE '  - user_id 引用 auth.users(id)';
  RAISE NOTICE '  - 需要先通过 Supabase Auth 注册用户';
  RAISE NOTICE '===========================================';
END $$;

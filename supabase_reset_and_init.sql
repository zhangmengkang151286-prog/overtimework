-- ============================================
-- 打工人加班指数 - 清理并重新初始化
-- ============================================

-- ⚠️ 警告：这将删除所有现有数据！
-- 如果有重要数据，请先备份

-- ============================================
-- 1. 删除所有旧表和函数
-- ============================================

-- 删除函数
DROP FUNCTION IF EXISTS get_real_time_stats() CASCADE;
DROP FUNCTION IF EXISTS get_top_tags(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_daily_status(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS refresh_real_time_stats() CASCADE;
DROP FUNCTION IF EXISTS archive_daily_data() CASCADE;

-- 删除视图
DROP MATERIALIZED VIEW IF EXISTS real_time_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS tag_stats CASCADE;

-- 删除表（按依赖顺序）
DROP TABLE IF EXISTS status_records CASCADE;
DROP TABLE IF EXISTS daily_history CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 2. 启用扩展
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 3. 创建新表
-- ============================================

-- 用户资料表（扩展 auth.users）
CREATE TABLE user_profiles (
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

-- 标签表
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('industry', 'company', 'position', 'custom')),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 状态记录表
CREATE TABLE status_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_overtime BOOLEAN NOT NULL,
  tag_id UUID REFERENCES tags(id),
  overtime_hours INTEGER CHECK (overtime_hours >= 1 AND overtime_hours <= 12),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
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

-- ============================================
-- 4. 创建索引
-- ============================================

CREATE INDEX idx_user_profiles_phone ON user_profiles(phone_number);
CREATE INDEX idx_user_profiles_wechat ON user_profiles(wechat_id);
CREATE INDEX idx_status_records_date ON status_records(date);
CREATE INDEX idx_status_records_user_date ON status_records(user_id, date);
CREATE INDEX idx_tags_type ON tags(type);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX idx_daily_history_date ON daily_history(date DESC);

-- ============================================
-- 5. 创建函数
-- ============================================

-- 获取实时统计
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
    COALESCE(COUNT(DISTINCT user_id), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(MAX(submitted_at), NOW())
  FROM status_records
  WHERE date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取 Top 标签
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
    t.name,
    COALESCE(SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END), 0)::BIGINT,
    COUNT(*)::BIGINT
  FROM status_records sr
  JOIN tags t ON sr.tag_id = t.id
  WHERE sr.date = CURRENT_DATE
  GROUP BY sr.tag_id, t.name
  ORDER BY COUNT(*) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取每日状态
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
    (dh.overtime_count > dh.on_time_count),
    dh.participant_count,
    dh.overtime_count,
    dh.on_time_count
  FROM daily_history dh
  WHERE dh.date >= CURRENT_DATE - days
  ORDER BY dh.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 插入测试数据
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
  ('领导要求', 'custom', true);

-- ============================================
-- 7. 设置 RLS
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_history ENABLE ROW LEVEL SECURITY;

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
-- 8. 设置权限
-- ============================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- 9. 验证
-- ============================================

SELECT * FROM get_real_time_stats();

-- 显示完成信息
DO $$
DECLARE
  tag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tag_count FROM tags;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ 数据库重置并初始化完成！';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '已创建的表：';
  RAISE NOTICE '  ✓ user_profiles';
  RAISE NOTICE '  ✓ tags';
  RAISE NOTICE '  ✓ status_records';
  RAISE NOTICE '  ✓ daily_history';
  RAISE NOTICE '';
  RAISE NOTICE '已创建的函数：';
  RAISE NOTICE '  ✓ get_real_time_stats()';
  RAISE NOTICE '  ✓ get_top_tags()';
  RAISE NOTICE '  ✓ get_daily_status()';
  RAISE NOTICE '';
  RAISE NOTICE '已插入 % 个测试标签', tag_count;
  RAISE NOTICE '===========================================';
END $$;

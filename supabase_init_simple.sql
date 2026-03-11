-- ============================================
-- 打工人加班指数 - Supabase 简化初始化脚本
-- ============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 创建表结构
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
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

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('industry', 'company', 'position', 'custom')),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 状态记录表
CREATE TABLE IF NOT EXISTS status_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_overtime BOOLEAN NOT NULL,
  tag_id UUID REFERENCES tags(id),
  overtime_hours INTEGER CHECK (overtime_hours >= 1 AND overtime_hours <= 12),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 每日历史表
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
-- 2. 创建索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_wechat ON users(wechat_id);
CREATE INDEX IF NOT EXISTS idx_status_records_date ON status_records(date);
CREATE INDEX IF NOT EXISTS idx_status_records_user_date ON status_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_daily_history_date ON daily_history(date DESC);

-- ============================================
-- 3. 创建数据库函数
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
    COUNT(DISTINCT user_id)::BIGINT as participant_count,
    SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END)::BIGINT as overtime_count,
    SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)::BIGINT as on_time_count,
    COALESCE(MAX(submitted_at), NOW()) as last_updated
  FROM status_records
  WHERE date = CURRENT_DATE;
  
  -- 如果没有数据，返回默认值
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, NOW();
  END IF;
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
    SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END)::BIGINT as overtime_count,
    SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END)::BIGINT as on_time_count,
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
-- 4. 插入测试标签
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
-- 5. 设置权限
-- ============================================

-- 授予必要的权限
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- 6. 验证安装
-- ============================================

-- 测试函数
SELECT * FROM get_real_time_stats();

-- 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '数据库初始化完成！';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '已创建的表：';
  RAISE NOTICE '  - users';
  RAISE NOTICE '  - tags';
  RAISE NOTICE '  - status_records';
  RAISE NOTICE '  - daily_history';
  RAISE NOTICE '';
  RAISE NOTICE '已创建的函数：';
  RAISE NOTICE '  - get_real_time_stats()';
  RAISE NOTICE '  - get_top_tags()';
  RAISE NOTICE '  - get_daily_status()';
  RAISE NOTICE '';
  RAISE NOTICE '已插入 % 个测试标签', (SELECT COUNT(*) FROM tags);
  RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- 打工人加班指数 - Supabase 数据库初始化脚本
-- ============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

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

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_wechat ON users(wechat_id);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company);
CREATE INDEX IF NOT EXISTS idx_users_industry ON users(industry);

-- 状态记录表索引
CREATE INDEX IF NOT EXISTS idx_status_records_date ON status_records(date);
CREATE INDEX IF NOT EXISTS idx_status_records_user_date ON status_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_status_records_tag ON status_records(tag_id);

-- 标签表索引
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(usage_count DESC);

-- 历史表索引
CREATE INDEX IF NOT EXISTS idx_daily_history_date ON daily_history(date DESC);

-- ============================================
-- 3. 创建物化视图
-- ============================================

-- 实时统计视图
CREATE MATERIALIZED VIEW IF NOT EXISTS real_time_stats AS
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
CREATE UNIQUE INDEX IF NOT EXISTS real_time_stats_date_idx ON real_time_stats (date);

-- 标签统计视图
CREATE MATERIALIZED VIEW IF NOT EXISTS tag_stats AS
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

CREATE UNIQUE INDEX IF NOT EXISTS tag_stats_date_tag_idx ON tag_stats (date, tag_id);

-- ============================================
-- 4. 创建数据库函数
-- ============================================

-- 刷新实时统计
CREATE OR REPLACE FUNCTION refresh_real_time_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY real_time_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY tag_stats;
END;
$$ LANGUAGE plpgsql;

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
    COALESCE(rts.participant_count, 0)::BIGINT,
    COALESCE(rts.overtime_count, 0)::BIGINT,
    COALESCE(rts.on_time_count, 0)::BIGINT,
    COALESCE(rts.last_updated, NOW())
  FROM real_time_stats rts
  WHERE rts.date = CURRENT_DATE;
  
  -- 如果没有数据，返回默认值
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

-- 每日数据归档函数
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

  -- 如果没有数据，跳过
  IF stats_data.participant_count IS NULL THEN
    RETURN;
  END IF;

  -- 获取标签分布
  SELECT jsonb_agg(
    jsonb_build_object(
      'tag_id', sr.tag_id,
      'tag_name', t.name,
      'overtime_count', SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END),
      'on_time_count', SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END),
      'total_count', COUNT(*)
    )
  )
  INTO tag_data
  FROM status_records sr
  JOIN tags t ON sr.tag_id = t.id
  WHERE sr.date = yesterday
  GROUP BY sr.tag_id, t.name;

  -- 插入历史记录
  INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
  VALUES (yesterday, stats_data.participant_count, stats_data.overtime_count, stats_data.on_time_count, COALESCE(tag_data, '[]'::jsonb))
  ON CONFLICT (date) DO UPDATE
  SET 
    participant_count = EXCLUDED.participant_count,
    overtime_count = EXCLUDED.overtime_count,
    on_time_count = EXCLUDED.on_time_count,
    tag_distribution = EXCLUDED.tag_distribution;

  -- 刷新物化视图
  PERFORM refresh_real_time_stats();
  
  RAISE NOTICE 'Daily data archived for %', yesterday;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. 设置 Row Level Security (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_history ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果有）
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can insert own status" ON status_records;
DROP POLICY IF EXISTS "Users can view own status" ON status_records;
DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
DROP POLICY IF EXISTS "Admins can manage tags" ON tags;
DROP POLICY IF EXISTS "Anyone can view history" ON daily_history;

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

-- 历史数据（所有人可读）
CREATE POLICY "Anyone can view history" ON daily_history
  FOR SELECT USING (true);

-- ============================================
-- 6. 插入测试数据
-- ============================================

-- 插入测试标签
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
  ('测试工程师', 'position', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 7. 设置定时任务
-- ============================================

-- 注意：pg_cron 可能需要在 Supabase Dashboard 中手动启用
-- 如果下面的命令失败，请在 Dashboard 中手动设置

-- 每天 00:00 执行归档
SELECT cron.schedule(
  'archive-daily-data',
  '0 0 * * *',
  'SELECT archive_daily_data();'
);

-- 每 3 秒刷新实时统计（注意：这个频率很高，可能需要调整）
-- 建议改为每 30 秒或 1 分钟
SELECT cron.schedule(
  'refresh-stats',
  '*/30 * * * *',
  'SELECT refresh_real_time_stats();'
);

-- ============================================
-- 完成
-- ============================================

-- 初始刷新物化视图
SELECT refresh_real_time_stats();

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
  RAISE NOTICE '已创建的视图：';
  RAISE NOTICE '  - real_time_stats';
  RAISE NOTICE '  - tag_stats';
  RAISE NOTICE '';
  RAISE NOTICE '已创建的函数：';
  RAISE NOTICE '  - refresh_real_time_stats()';
  RAISE NOTICE '  - get_real_time_stats()';
  RAISE NOTICE '  - get_top_tags()';
  RAISE NOTICE '  - get_daily_status()';
  RAISE NOTICE '  - archive_daily_data()';
  RAISE NOTICE '';
  RAISE NOTICE '已插入 % 个测试标签', (SELECT COUNT(*) FROM tags);
  RAISE NOTICE '===========================================';
END $$;

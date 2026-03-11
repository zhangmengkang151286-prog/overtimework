-- ============================================
-- 每小时数据快照表和定时任务
-- 用于时间轴功能，存储每个整点的数据快照
-- ============================================

-- 1. 创建每小时快照表
CREATE TABLE IF NOT EXISTS hourly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL,
  snapshot_hour INTEGER NOT NULL CHECK (snapshot_hour >= 0 AND snapshot_hour <= 23),
  snapshot_time TIMESTAMPTZ NOT NULL,
  participant_count INTEGER NOT NULL DEFAULT 0,
  overtime_count INTEGER NOT NULL DEFAULT 0,
  on_time_count INTEGER NOT NULL DEFAULT 0,
  tag_distribution JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一约束：每天每小时只有一个快照
  UNIQUE(snapshot_date, snapshot_hour)
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_hourly_snapshots_date_hour 
  ON hourly_snapshots(snapshot_date, snapshot_hour);

CREATE INDEX IF NOT EXISTS idx_hourly_snapshots_time 
  ON hourly_snapshots(snapshot_time DESC);

-- 3. 启用 RLS（Row Level Security）
ALTER TABLE hourly_snapshots ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略：所有人都可以读取
CREATE POLICY "Allow public read access to hourly snapshots"
  ON hourly_snapshots
  FOR SELECT
  USING (true);

-- 5. 创建函数：保存当前小时的快照
CREATE OR REPLACE FUNCTION save_hourly_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot_date DATE;
  v_snapshot_hour INTEGER;
  v_snapshot_time TIMESTAMPTZ;
  v_participant_count INTEGER;
  v_overtime_count INTEGER;
  v_on_time_count INTEGER;
  v_tag_distribution JSONB;
BEGIN
  -- 获取当前时间（北京时间 UTC+8）
  v_snapshot_time := NOW() AT TIME ZONE 'Asia/Shanghai';
  v_snapshot_date := v_snapshot_time::DATE;
  v_snapshot_hour := EXTRACT(HOUR FROM v_snapshot_time)::INTEGER;
  
  -- 获取实时统计数据
  SELECT 
    COALESCE(COUNT(DISTINCT user_id), 0),
    COALESCE(SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END), 0)
  INTO 
    v_participant_count,
    v_overtime_count,
    v_on_time_count
  FROM status_records
  WHERE date = CURRENT_DATE;
  
  -- 获取标签分布
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'tag_id', t.id,
        'tag_name', t.name,
        'overtime_count', COALESCE(tag_stats.overtime_count, 0),
        'on_time_count', COALESCE(tag_stats.on_time_count, 0),
        'total_count', COALESCE(tag_stats.total_count, 0)
      )
      ORDER BY COALESCE(tag_stats.total_count, 0) DESC
    ),
    '[]'::jsonb
  )
  INTO v_tag_distribution
  FROM tags t
  LEFT JOIN (
    SELECT 
      tag_id,
      SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
      SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count,
      COUNT(*) as total_count
    FROM status_records
    WHERE date = CURRENT_DATE AND tag_id IS NOT NULL
    GROUP BY tag_id
  ) tag_stats ON t.id = tag_stats.tag_id
  WHERE t.is_active = true
  LIMIT 10;
  
  -- 插入或更新快照（使用 UPSERT）
  INSERT INTO hourly_snapshots (
    snapshot_date,
    snapshot_hour,
    snapshot_time,
    participant_count,
    overtime_count,
    on_time_count,
    tag_distribution
  )
  VALUES (
    v_snapshot_date,
    v_snapshot_hour,
    v_snapshot_time,
    v_participant_count,
    v_overtime_count,
    v_on_time_count,
    v_tag_distribution
  )
  ON CONFLICT (snapshot_date, snapshot_hour)
  DO UPDATE SET
    snapshot_time = EXCLUDED.snapshot_time,
    participant_count = EXCLUDED.participant_count,
    overtime_count = EXCLUDED.overtime_count,
    on_time_count = EXCLUDED.on_time_count,
    tag_distribution = EXCLUDED.tag_distribution,
    created_at = NOW();
    
  RAISE NOTICE 'Hourly snapshot saved: date=%, hour=%, participants=%', 
    v_snapshot_date, v_snapshot_hour, v_participant_count;
END;
$$;

-- 6. 创建定时任务：每小时的第0分钟执行
-- 注意：需要启用 pg_cron 扩展
SELECT cron.schedule(
  'save-hourly-snapshot',
  '0 * * * *',  -- 每小时的第0分钟
  $$SELECT save_hourly_snapshot();$$
);

-- 7. 创建函数：清理旧快照（保留最近7天）
CREATE OR REPLACE FUNCTION cleanup_old_hourly_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM hourly_snapshots
  WHERE snapshot_date < CURRENT_DATE - INTERVAL '7 days';
  
  RAISE NOTICE 'Old hourly snapshots cleaned up';
END;
$$;

-- 8. 创建定时任务：每天凌晨2点清理旧快照
SELECT cron.schedule(
  'cleanup-old-hourly-snapshots',
  '0 2 * * *',  -- 每天凌晨2点
  $$SELECT cleanup_old_hourly_snapshots();$$
);

-- 9. 创建函数：获取指定日期和小时的快照
CREATE OR REPLACE FUNCTION get_hourly_snapshot(
  p_date DATE,
  p_hour INTEGER
)
RETURNS TABLE (
  snapshot_time TIMESTAMPTZ,
  participant_count INTEGER,
  overtime_count INTEGER,
  on_time_count INTEGER,
  tag_distribution JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hs.snapshot_time,
    hs.participant_count,
    hs.overtime_count,
    hs.on_time_count,
    hs.tag_distribution
  FROM hourly_snapshots hs
  WHERE hs.snapshot_date = p_date
    AND hs.snapshot_hour = p_hour;
END;
$$;

-- 10. 手动执行一次，保存当前小时的快照
SELECT save_hourly_snapshot();

-- 11. 验证快照是否创建成功
SELECT 
  snapshot_date,
  snapshot_hour,
  snapshot_time,
  participant_count,
  overtime_count,
  on_time_count,
  jsonb_array_length(tag_distribution) as tag_count
FROM hourly_snapshots
ORDER BY snapshot_time DESC
LIMIT 5;

-- ============================================
-- 使用说明
-- ============================================
-- 1. 在 Supabase SQL Editor 中执行此脚本
-- 2. 确保 pg_cron 扩展已启用（Supabase 默认启用）
-- 3. 定时任务会自动每小时保存一次快照
-- 4. 客户端可以通过 RPC 调用 get_hourly_snapshot() 获取快照
-- 5. 旧快照会自动清理（保留7天）

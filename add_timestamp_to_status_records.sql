-- ============================================
-- 给 status_records 表添加时间戳字段
-- 用于记录用户提交状态的具体时间
-- ============================================

-- 1. 添加 submitted_at 字段（带时区的时间戳）
ALTER TABLE status_records 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();

-- 2. 为现有数据设置默认时间戳
-- 如果有现有数据，将它们的时间戳设置为当天的随机时间
UPDATE status_records 
SET submitted_at = date + (RANDOM() * INTERVAL '18 hours') + INTERVAL '6 hours'
WHERE submitted_at IS NULL;

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_status_records_submitted_at 
  ON status_records(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_records_date_submitted_at 
  ON status_records(date, submitted_at);

-- 4. 修改 save_hourly_snapshot 函数，基于时间戳计算累计值
CREATE OR REPLACE FUNCTION save_hourly_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot_date DATE;
  v_snapshot_hour INTEGER;
  v_snapshot_time TIMESTAMPTZ;
  v_cutoff_time TIMESTAMPTZ;
  v_participant_count INTEGER;
  v_overtime_count INTEGER;
  v_on_time_count INTEGER;
  v_tag_distribution JSONB;
BEGIN
  -- 获取当前时间（北京时间 UTC+8）
  v_snapshot_time := NOW() AT TIME ZONE 'Asia/Shanghai';
  v_snapshot_date := v_snapshot_time::DATE;
  v_snapshot_hour := EXTRACT(HOUR FROM v_snapshot_time)::INTEGER;
  
  -- 计算截止时间：今天的这个整点
  v_cutoff_time := v_snapshot_date + (v_snapshot_hour || ' hours')::INTERVAL;
  
  -- 获取截止到这个时间点的累计统计数据
  SELECT 
    COALESCE(COUNT(DISTINCT user_id), 0),
    COALESCE(SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END), 0)
  INTO 
    v_participant_count,
    v_overtime_count,
    v_on_time_count
  FROM status_records
  WHERE date = v_snapshot_date
    AND submitted_at <= v_cutoff_time;
  
  -- 获取截止到这个时间点的累计标签分布
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
    WHERE date = v_snapshot_date 
      AND submitted_at <= v_cutoff_time
      AND tag_id IS NOT NULL
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
    
  RAISE NOTICE 'Hourly snapshot saved: date=%, hour=%, cutoff=%, participants=%', 
    v_snapshot_date, v_snapshot_hour, v_cutoff_time, v_participant_count;
END;
$$;

-- 5. 验证修改
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'status_records'
  AND column_name = 'submitted_at';

-- 6. 查看现有数据的时间戳
SELECT 
  id,
  user_id,
  date,
  submitted_at,
  is_overtime
FROM status_records
ORDER BY submitted_at DESC
LIMIT 10;

-- ============================================
-- 说明
-- ============================================
-- 执行此脚本后：
-- 1. status_records 表会有 submitted_at 字段
-- 2. 现有数据会被赋予随机时间戳（6:00-24:00）
-- 3. 新提交的数据会自动记录提交时间
-- 4. 快照保存逻辑会基于时间戳计算累计值
-- 5. 查询性能会通过索引优化

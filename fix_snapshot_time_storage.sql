-- ============================================
-- 修复快照时间存储问题
-- ============================================
-- 问题：snapshot_time 字段类型是 TIMESTAMPTZ，会自动转换为 UTC 存储
-- 解决：确保函数正确使用北京时间，并重新生成快照

-- 说明：
-- PostgreSQL 的 TIMESTAMPTZ 类型会将时间转换为 UTC 存储
-- 但在查询时会根据时区设置显示
-- 我们需要确保：
-- 1. 函数内部使用北京时间计算
-- 2. snapshot_hour 基于北京时间
-- 3. 查询时正确显示北京时间

-- 1. 更新 save_hourly_snapshot() 函数
CREATE OR REPLACE FUNCTION save_hourly_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot_date DATE;
  v_snapshot_hour INTEGER;
  v_snapshot_time TIMESTAMPTZ;
  v_beijing_time TIMESTAMPTZ;
  v_cutoff_time TIMESTAMPTZ;
  v_participant_count INTEGER;
  v_overtime_count INTEGER;
  v_on_time_count INTEGER;
  v_tag_distribution JSONB;
BEGIN
  -- 获取北京时间（这会返回一个 TIMESTAMPTZ，内部存储为 UTC，但表示北京时间）
  v_beijing_time := timezone('Asia/Shanghai', NOW());
  
  -- 使用北京时间
  v_snapshot_time := v_beijing_time;
  v_snapshot_date := (v_beijing_time AT TIME ZONE 'Asia/Shanghai')::DATE;
  v_snapshot_hour := EXTRACT(HOUR FROM (v_beijing_time AT TIME ZONE 'Asia/Shanghai'))::INTEGER;
  v_cutoff_time := v_beijing_time;
  
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
        'tag_id', tag_stats.tag_id,
        'tag_name', t.name,
        'overtime_count', tag_stats.overtime_count,
        'on_time_count', tag_stats.on_time_count,
        'total_count', tag_stats.total_count
      )
      ORDER BY tag_stats.total_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_tag_distribution
  FROM (
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
  ) tag_stats
  INNER JOIN tags t ON t.id = tag_stats.tag_id
  WHERE t.is_active = true
  LIMIT 10;
  
  -- 插入或更新快照
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
    v_snapshot_time,  -- 现在存储的是北京时间
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
    
  RAISE NOTICE 'Hourly snapshot saved (Beijing Time): date=%, hour=%, time=%, participants=%', 
    v_snapshot_date, v_snapshot_hour, v_snapshot_time, v_participant_count;
END;
$$;

-- 2. 重新生成今天的所有快照（使用北京时间）
DO $$
DECLARE
  v_hour INTEGER;
  v_beijing_now TIMESTAMPTZ;
  v_current_hour INTEGER;
BEGIN
  -- 获取当前北京时间的小时数
  v_beijing_now := timezone('Asia/Shanghai', NOW());
  v_current_hour := EXTRACT(HOUR FROM v_beijing_now)::INTEGER;
  
  -- 删除今天的旧快照
  DELETE FROM hourly_snapshots 
  WHERE snapshot_date = v_beijing_now::DATE;
  
  RAISE NOTICE '已删除今天的旧快照';
  
  -- 为今天的每个小时生成快照（从6点到当前小时）
  FOR v_hour IN 6..v_current_hour LOOP
    -- 临时修改时间来生成历史快照
    PERFORM save_hourly_snapshot_at_hour(v_beijing_now::DATE, v_hour);
  END LOOP;
  
  RAISE NOTICE '已重新生成今天的快照（6点到%点）', v_current_hour;
END;
$$;

-- 3. 创建辅助函数：在指定时间点生成快照
CREATE OR REPLACE FUNCTION save_hourly_snapshot_at_hour(
  p_date DATE,
  p_hour INTEGER
)
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
  v_snapshot_date := p_date;
  v_snapshot_hour := p_hour;
  
  -- 构造北京时间的时间戳
  v_snapshot_time := (p_date::TEXT || ' ' || p_hour::TEXT || ':00:00')::TIMESTAMP AT TIME ZONE 'Asia/Shanghai';
  v_cutoff_time := v_snapshot_time;
  
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
        'tag_id', tag_stats.tag_id,
        'tag_name', t.name,
        'overtime_count', tag_stats.overtime_count,
        'on_time_count', tag_stats.on_time_count,
        'total_count', tag_stats.total_count
      )
      ORDER BY tag_stats.total_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_tag_distribution
  FROM (
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
  ) tag_stats
  INNER JOIN tags t ON t.id = tag_stats.tag_id
  WHERE t.is_active = true
  LIMIT 10;
  
  -- 插入快照
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
    tag_distribution = EXCLUDED.tag_distribution;
END;
$$;

-- 4. 验证结果
SELECT 
  snapshot_hour as "时间（北京）",
  TO_CHAR(snapshot_time AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "快照时间（北京）",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准时",
  jsonb_array_length(tag_distribution) as "标签数"
FROM hourly_snapshots
WHERE snapshot_date = timezone('Asia/Shanghai', NOW())::DATE
ORDER BY snapshot_hour DESC
LIMIT 5;

-- ============================================
-- 说明
-- ============================================
-- 1. 修复了 snapshot_time 存储问题，现在存储北京时间
-- 2. 重新生成了今天的所有快照
-- 3. 创建了辅助函数 save_hourly_snapshot_at_hour() 用于生成历史快照
-- 4. 验证查询会显示北京时间
--
-- 预期结果：
-- - snapshot_hour 应该等于快照时间的小时数
-- - 例如：23点的快照时间应该是 2026-01-31 23:00:00

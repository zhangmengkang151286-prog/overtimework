-- ============================================
-- 修复时区问题：将所有时间转换为北京时间（UTC+8）
-- ============================================

-- 1. 更新 save_hourly_snapshot() 函数 - 使用北京时间
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
  -- 获取当前 UTC 时间，然后转换为北京时间
  -- 使用 timezone 函数正确转换
  v_beijing_time := timezone('Asia/Shanghai', NOW());
  v_snapshot_time := v_beijing_time;
  v_snapshot_date := v_beijing_time::DATE;
  v_snapshot_hour := EXTRACT(HOUR FROM v_beijing_time)::INTEGER;
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
  -- 只选择有数据的标签（使用 INNER JOIN）
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
    
  RAISE NOTICE 'Hourly snapshot saved (Beijing Time): date=%, hour=%, participants=%, tags=%', 
    v_snapshot_date, v_snapshot_hour, v_participant_count, jsonb_array_length(v_tag_distribution);
END;
$$;

-- 2. 测试函数
SELECT save_hourly_snapshot();

-- 3. 验证结果（显示北京时间）
SELECT 
  snapshot_hour as "时间（北京）",
  TO_CHAR(snapshot_time, 'YYYY-MM-DD HH24:MI:SS') as "快照时间",
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
-- 1. 函数现在使用北京时间（UTC+8）
-- 2. snapshot_date 和 snapshot_hour 都基于北京时间
-- 3. snapshot_time 存储的也是北京时间
-- 4. GitHub Actions 仍然使用 UTC 时间触发，但函数内部会转换为北京时间
-- 5. 例如：
--    - UTC 16:00 触发 → 北京时间 00:00（次日）
--    - UTC 00:00 触发 → 北京时间 08:00（当天）
--
-- 验证当前时间：
-- SELECT NOW() as "UTC时间", timezone('Asia/Shanghai', NOW()) as "北京时间";

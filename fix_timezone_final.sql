-- ============================================
-- 最终时区修复方案
-- ============================================
-- 核心问题：需要确保所有时间计算都基于北京时间

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
  v_beijing_now TIMESTAMPTZ;
  v_cutoff_time TIMESTAMPTZ;
  v_participant_count INTEGER;
  v_overtime_count INTEGER;
  v_on_time_count INTEGER;
  v_tag_distribution JSONB;
BEGIN
  -- 获取当前 UTC 时间，然后转换为北京时间
  -- NOW() 返回 UTC 时间
  -- AT TIME ZONE 'Asia/Shanghai' 将其解释为北京时间
  v_beijing_now := NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai';
  
  -- 基于北京时间计算日期和小时
  v_snapshot_date := v_beijing_now::DATE;
  v_snapshot_hour := EXTRACT(HOUR FROM v_beijing_now)::INTEGER;
  v_snapshot_time := v_beijing_now;
  v_cutoff_time := v_beijing_now;
  
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
  
  -- 获取截止到这个时间点的累计标签分布（只保存有数据的标签）
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
    
  RAISE NOTICE 'Snapshot saved: date=%, hour=%, time=%, participants=%', 
    v_snapshot_date, v_snapshot_hour, v_snapshot_time, v_participant_count;
END;
$$;

-- 2. 创建辅助函数：在指定北京时间点生成快照
CREATE OR REPLACE FUNCTION save_hourly_snapshot_at_beijing_hour(
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
  -- 例如：'2026-01-31 23:00:00' 在 Asia/Shanghai 时区
  v_snapshot_time := (p_date::TEXT || ' ' || LPAD(p_hour::TEXT, 2, '0') || ':00:00')::TIMESTAMP AT TIME ZONE 'Asia/Shanghai';
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
    
  RAISE NOTICE 'Snapshot saved at Beijing hour %: participants=%', p_hour, v_participant_count;
END;
$$;

-- 3. 重新生成今天的所有快照
DO $$
DECLARE
  v_hour INTEGER;
  v_beijing_now TIMESTAMPTZ;
  v_today DATE;
  v_current_hour INTEGER;
BEGIN
  -- 获取当前北京时间
  v_beijing_now := NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai';
  v_today := v_beijing_now::DATE;
  v_current_hour := EXTRACT(HOUR FROM v_beijing_now)::INTEGER;
  
  -- 删除今天的旧快照
  DELETE FROM hourly_snapshots WHERE snapshot_date = v_today;
  RAISE NOTICE '已删除今天的旧快照';
  
  -- 为今天的每个小时生成快照（从6点到当前小时）
  FOR v_hour IN 6..v_current_hour LOOP
    PERFORM save_hourly_snapshot_at_beijing_hour(v_today, v_hour);
  END LOOP;
  
  RAISE NOTICE '已重新生成今天的快照（6点到%点）', v_current_hour;
END;
$$;

-- 4. 验证结果
SELECT 
  snapshot_hour as "时间",
  snapshot_time AT TIME ZONE 'Asia/Shanghai' as "快照时间（北京）",
  EXTRACT(HOUR FROM (snapshot_time AT TIME ZONE 'Asia/Shanghai'))::INTEGER as "小时数",
  participant_count as "参与人数",
  CASE 
    WHEN snapshot_hour = EXTRACT(HOUR FROM (snapshot_time AT TIME ZONE 'Asia/Shanghai'))::INTEGER 
    THEN '✅' 
    ELSE '❌' 
  END as "验证"
FROM hourly_snapshots
WHERE snapshot_date = (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai')::DATE
ORDER BY snapshot_hour DESC
LIMIT 5;

-- ============================================
-- 说明
-- ============================================
-- 1. 使用 NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai' 获取北京时间
-- 2. snapshot_time 存储的是 TIMESTAMPTZ（内部为 UTC，但表示北京时间）
-- 3. 查询时使用 AT TIME ZONE 'Asia/Shanghai' 显示北京时间
-- 4. snapshot_hour 基于北京时间计算
--
-- 预期结果：
-- - 23点的快照时间应该显示为 2026-01-31 23:00:00+08
-- - "验证"列应该全部显示 ✅

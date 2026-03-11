-- ============================================
-- 确保每个小时都有快照数据
-- 为当前工作日的所有小时生成快照（包括0数据的小时）
-- ============================================

-- 1. 创建函数：为指定日期的所有小时生成快照
CREATE OR REPLACE FUNCTION generate_all_hourly_snapshots_for_date(target_date DATE)
RETURNS TABLE(
  hour INTEGER,
  participant_count INTEGER,
  overtime_count INTEGER,
  on_time_count INTEGER,
  tag_count INTEGER,
  status TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_hour INTEGER;
  v_snapshot_time TIMESTAMPTZ;
  v_cutoff_time TIMESTAMPTZ;
  v_participant_count INTEGER;
  v_overtime_count INTEGER;
  v_on_time_count INTEGER;
  v_tag_distribution JSONB;
  v_exists BOOLEAN;
BEGIN
  -- 为0-23每个小时生成快照
  FOR v_hour IN 0..23 LOOP
    -- 构造该小时的时间戳（使用小时的结束时间作为截止点）
    v_snapshot_time := (target_date + (v_hour || ' hours')::INTERVAL);
    v_cutoff_time := v_snapshot_time + INTERVAL '1 hour';
    
    -- 检查快照是否已存在
    SELECT EXISTS(
      SELECT 1 FROM hourly_snapshots 
      WHERE snapshot_date = target_date 
      AND snapshot_hour = v_hour
    ) INTO v_exists;
    
    -- 如果快照已存在，跳过
    IF v_exists THEN
      hour := v_hour;
      participant_count := NULL;
      overtime_count := NULL;
      on_time_count := NULL;
      tag_count := NULL;
      status := 'SKIPPED (already exists)';
      RETURN NEXT;
      CONTINUE;
    END IF;
    
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
    WHERE date = target_date
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
      WHERE date = target_date
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
      target_date,
      v_hour,
      v_snapshot_time,
      v_participant_count,
      v_overtime_count,
      v_on_time_count,
      v_tag_distribution
    );
    
    -- 返回结果
    hour := v_hour;
    participant_count := v_participant_count;
    overtime_count := v_overtime_count;
    on_time_count := v_on_time_count;
    tag_count := jsonb_array_length(v_tag_distribution);
    status := 'CREATED';
    RETURN NEXT;
  END LOOP;
END;
$$;

-- 2. 为今天生成所有小时的快照
SELECT * FROM generate_all_hourly_snapshots_for_date(CURRENT_DATE)
ORDER BY hour;

-- 3. 验证结果 - 应该有24条记录（0-23小时）
SELECT 
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  jsonb_array_length(tag_distribution) as "标签数",
  to_char(snapshot_time, 'YYYY-MM-DD HH24:MI:SS') as "快照时间"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

-- 4. 检查是否有缺失的小时
WITH all_hours AS (
  SELECT generate_series(0, 23) AS hour
)
SELECT 
  ah.hour as "缺失的小时"
FROM all_hours ah
LEFT JOIN hourly_snapshots hs 
  ON hs.snapshot_date = CURRENT_DATE 
  AND hs.snapshot_hour = ah.hour
WHERE hs.id IS NULL;

-- ============================================
-- 使用说明
-- ============================================
-- 1. 执行此脚本会为今天的所有24小时生成快照
-- 2. 如果某个小时已有快照，会跳过（不会重复创建）
-- 3. 即使某个小时没有数据（0参与人数），也会创建快照
-- 4. 这样可以确保时间轴拖动时，每个小时都有对应的数据

-- 为昨天生成快照（如果需要）
-- SELECT * FROM generate_all_hourly_snapshots_for_date(CURRENT_DATE - INTERVAL '1 day')
-- ORDER BY hour;

-- 为指定日期生成快照
-- SELECT * FROM generate_all_hourly_snapshots_for_date('2026-02-04'::DATE)
-- ORDER BY hour;

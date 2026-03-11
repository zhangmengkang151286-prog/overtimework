-- ============================================
-- 为今天的每个小时生成快照
-- 从 8 点到 22 点
-- ============================================

DO $func$
DECLARE
  v_hour INTEGER;
  v_snapshot_date DATE := CURRENT_DATE;
  v_snapshot_time TIMESTAMPTZ;
  v_cutoff_time TIMESTAMPTZ;
  v_participant_count INTEGER;
  v_overtime_count INTEGER;
  v_on_time_count INTEGER;
  v_tag_distribution JSONB;
BEGIN
  -- 为 8 点到 22 点的每个小时生成快照
  FOR v_hour IN 8..22 LOOP
    v_snapshot_time := v_snapshot_date + (v_hour || ' hours')::INTERVAL;
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
      v_hour,
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
      
    RAISE NOTICE '快照已生成: hour=%, participants=%, overtime=%, on_time=%', 
      v_hour, v_participant_count, v_overtime_count, v_on_time_count;
  END LOOP;
  
  RAISE NOTICE '所有快照生成完成！';
END $func$;

-- 查看生成的快照
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

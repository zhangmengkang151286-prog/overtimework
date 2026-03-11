-- 修复缺失的快照（6-7点和23点）
-- 为了让时间轴可以拖动到工作日的所有时间点

DO $$
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
  -- 为 6 点到 23 点的每个小时生成快照（如果不存在）
  FOR v_hour IN 6..23 LOOP
    -- 检查是否已存在
    IF EXISTS (
      SELECT 1 FROM hourly_snapshots 
      WHERE snapshot_date = v_snapshot_date 
      AND snapshot_hour = v_hour
    ) THEN
      RAISE NOTICE '快照已存在: % 点', v_hour;
      CONTINUE;
    END IF;
    
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
    
    -- 插入快照
    INSERT INTO hourly_snapshots (
      snapshot_date,
      snapshot_hour,
      snapshot_time,
      participant_count,
      overtime_count,
      on_time_count,
      tag_distribution
    ) VALUES (
      v_snapshot_date,
      v_hour,
      v_snapshot_time,
      v_participant_count,
      v_overtime_count,
      v_on_time_count,
      v_tag_distribution
    );
    
    RAISE NOTICE '已生成快照: % 点 (参与人数: %, 加班: %, 准点: %)',
      v_hour, v_participant_count, v_overtime_count, v_on_time_count;
  END LOOP;
  
  RAISE NOTICE '快照生成完成！';
END $$;

-- 验证结果
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count,
  jsonb_array_length(tag_distribution) as tag_count
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

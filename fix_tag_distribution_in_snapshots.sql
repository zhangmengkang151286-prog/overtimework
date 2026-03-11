-- 修复快照中的标签分布问题
-- 问题：快照包含了所有70个标签，包括 count=0 的标签
-- 解决：只保存有数据的标签（total_count > 0）

-- 重新生成所有快照，只包含有数据的标签
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
  RAISE NOTICE '========================================';
  RAISE NOTICE '开始修复标签分布...';
  RAISE NOTICE '========================================';
  
  FOR v_hour IN 6..23 LOOP
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
    -- 关键修改：只选择有数据的标签（使用 INNER JOIN 而不是 LEFT JOIN）
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
    
    -- 更新快照
    UPDATE hourly_snapshots
    SET 
      participant_count = v_participant_count,
      overtime_count = v_overtime_count,
      on_time_count = v_on_time_count,
      tag_distribution = v_tag_distribution,
      snapshot_time = v_snapshot_time
    WHERE snapshot_date = v_snapshot_date
    AND snapshot_hour = v_hour;
    
    -- 如果不存在则插入
    IF NOT FOUND THEN
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
    END IF;
    
    RAISE NOTICE '[%点] ✅ 已修复 (标签数: %)',
      v_hour, jsonb_array_length(v_tag_distribution);
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 标签分布修复完成！';
  RAISE NOTICE '========================================';
END $$;

-- 验证修复结果
SELECT 
  snapshot_hour as "时间",
  participant_count as "参与人数",
  overtime_count as "加班次数",
  on_time_count as "准时次数",
  jsonb_array_length(tag_distribution) as "标签数量"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

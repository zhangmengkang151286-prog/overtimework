-- 一键修复 App 显示问题
-- 执行此脚本后，重启 App 即可

-- ============================================
-- 步骤1：生成缺失的快照（6-23点）
-- ============================================
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
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '开始生成缺失的快照...';
  RAISE NOTICE '========================================';
  
  FOR v_hour IN 6..23 LOOP
    -- 检查是否已存在
    IF EXISTS (
      SELECT 1 FROM hourly_snapshots 
      WHERE snapshot_date = v_snapshot_date 
      AND snapshot_hour = v_hour
    ) THEN
      RAISE NOTICE '[%点] 快照已存在，跳过', v_hour;
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
    
    v_count := v_count + 1;
    RAISE NOTICE '[%点] ✅ 已生成 (参与: %, 加班: %, 准点: %, 标签: %)',
      v_hour, v_participant_count, v_overtime_count, v_on_time_count,
      jsonb_array_length(v_tag_distribution);
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 快照生成完成！共生成 % 个新快照', v_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 步骤2：清除 realtime_cache 表（如果存在）
-- ============================================
DO $$
DECLARE
  v_exists BOOLEAN;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '检查 realtime_cache 表...';
  RAISE NOTICE '========================================';
  
  -- 检查表是否存在
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'realtime_cache'
  ) INTO v_exists;
  
  IF v_exists THEN
    -- 获取记录数
    EXECUTE 'SELECT COUNT(*) FROM realtime_cache' INTO v_count;
    
    IF v_count > 0 THEN
      RAISE NOTICE 'realtime_cache 表存在，有 % 条记录', v_count;
      RAISE NOTICE '正在清除...';
      
      -- 删除所有数据
      EXECUTE 'DELETE FROM realtime_cache';
      
      RAISE NOTICE '✅ realtime_cache 表已清空';
    ELSE
      RAISE NOTICE 'realtime_cache 表存在但为空';
    END IF;
  ELSE
    RAISE NOTICE 'realtime_cache 表不存在（正常）';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 步骤3：验证快照数据
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '验证快照数据...';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  snapshot_hour as "时间",
  participant_count as "参与人数",
  overtime_count as "加班次数",
  on_time_count as "准时次数",
  jsonb_array_length(tag_distribution) as "标签数量"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

-- ============================================
-- 步骤4：验证提交记录
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '验证提交记录...';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  TO_CHAR(submitted_at, 'HH24:MI') as "提交时间",
  CASE WHEN is_overtime THEN '加班' ELSE '准时' END as "状态",
  (SELECT name FROM tags WHERE id = tag_id) as "标签"
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY submitted_at;

-- ============================================
-- 完成提示
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 修复完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '下一步：';
  RAISE NOTICE '1. 完全关闭 App（从任务管理器结束进程）';
  RAISE NOTICE '2. 重新启动 App';
  RAISE NOTICE '3. 拖动时间轴测试：';
  RAISE NOTICE '   - 6点 → 应该显示 0 人';
  RAISE NOTICE '   - 8点 → 应该显示 1 人，0 加班，1 准点';
  RAISE NOTICE '   - 13点 → 应该显示 1 人，1 加班，2 准点';
  RAISE NOTICE '   - 22点 → 应该显示 1 人，4 加班，5 准点';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 工作日逻辑实现脚本
-- ============================================
-- 功能：实现"工作日"概念（06:00-次日05:59）
-- 执行时间：在 Supabase SQL Editor 中执行
-- ============================================

-- ============================================
-- 1. 创建工作日计算函数
-- ============================================

-- 计算给定时间对应的工作日日期
-- 逻辑：凌晨 0:00-5:59 算前一天的工作日
CREATE OR REPLACE FUNCTION get_work_date(check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW())
RETURNS DATE AS $$
BEGIN
  -- 如果是凌晨 0:00-5:59，算作前一天的工作日
  IF EXTRACT(HOUR FROM check_time) < 6 THEN
    RETURN (check_time::DATE - INTERVAL '1 day')::DATE;
  ELSE
    RETURN check_time::DATE;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 测试函数
-- SELECT get_work_date('2025-02-01 02:00:00'::TIMESTAMP);  -- 应该返回 2025-01-31
-- SELECT get_work_date('2025-02-01 08:00:00'::TIMESTAMP);  -- 应该返回 2025-02-01

-- ============================================
-- 2. 更新实时统计物化视图（使用工作日）
-- ============================================

-- 删除旧的物化视图
DROP MATERIALIZED VIEW IF EXISTS real_time_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS tag_stats CASCADE;

-- 重新创建实时统计视图（使用工作日逻辑）
CREATE MATERIALIZED VIEW real_time_stats AS
SELECT 
  get_work_date(NOW()) as date,
  COUNT(DISTINCT user_id) as participant_count,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count,
  MAX(submitted_at) as last_updated
FROM status_records
WHERE date = get_work_date(NOW())
GROUP BY get_work_date(NOW());

-- 创建唯一索引以支持并发刷新
CREATE UNIQUE INDEX real_time_stats_date_idx ON real_time_stats (date);

-- 重新创建标签统计视图（使用工作日逻辑）
CREATE MATERIALIZED VIEW tag_stats AS
SELECT 
  get_work_date(NOW()) as date,
  sr.tag_id,
  t.name as tag_name,
  SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END) as on_time_count,
  COUNT(*) as total_count
FROM status_records sr
JOIN tags t ON sr.tag_id = t.id
WHERE sr.date = get_work_date(NOW())
GROUP BY get_work_date(NOW()), sr.tag_id, t.name
ORDER BY total_count DESC;

CREATE UNIQUE INDEX tag_stats_date_tag_idx ON tag_stats (date, tag_id);

-- ============================================
-- 3. 更新获取实时统计函数
-- ============================================

CREATE OR REPLACE FUNCTION get_real_time_stats()
RETURNS TABLE (
  participant_count BIGINT,
  overtime_count BIGINT,
  on_time_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(rts.participant_count, 0)::BIGINT,
    COALESCE(rts.overtime_count, 0)::BIGINT,
    COALESCE(rts.on_time_count, 0)::BIGINT,
    COALESCE(rts.last_updated, NOW())
  FROM real_time_stats rts
  WHERE rts.date = get_work_date(NOW());
  
  -- 如果没有数据，返回默认值
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. 更新获取 Top N 标签函数
-- ============================================

CREATE OR REPLACE FUNCTION get_top_tags(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  tag_id UUID,
  tag_name VARCHAR,
  overtime_count BIGINT,
  on_time_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.tag_id,
    ts.tag_name,
    ts.overtime_count,
    ts.on_time_count,
    ts.total_count
  FROM tag_stats ts
  WHERE ts.date = get_work_date(NOW())
  ORDER BY ts.total_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. 更新每日数据归档函数（归档前一个工作日）
-- ============================================

CREATE OR REPLACE FUNCTION archive_daily_data()
RETURNS void AS $$
DECLARE
  yesterday_work_date DATE := get_work_date(NOW() - INTERVAL '1 day');
  stats_data RECORD;
  tag_data JSONB;
BEGIN
  -- 获取前一个工作日的统计数据
  SELECT 
    COUNT(DISTINCT user_id) as participant_count,
    SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
    SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count
  INTO stats_data
  FROM status_records
  WHERE date = yesterday_work_date;

  -- 如果没有数据，跳过
  IF stats_data.participant_count IS NULL OR stats_data.participant_count = 0 THEN
    RAISE NOTICE 'No data to archive for work date %', yesterday_work_date;
    RETURN;
  END IF;

  -- 获取标签分布
  SELECT jsonb_agg(
    jsonb_build_object(
      'tag_id', sr.tag_id,
      'tag_name', t.name,
      'overtime_count', SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END),
      'on_time_count', SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END),
      'total_count', COUNT(*)
    )
  )
  INTO tag_data
  FROM status_records sr
  JOIN tags t ON sr.tag_id = t.id
  WHERE sr.date = yesterday_work_date
  GROUP BY sr.tag_id, t.name;

  -- 插入历史记录
  INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
  VALUES (yesterday_work_date, stats_data.participant_count, stats_data.overtime_count, stats_data.on_time_count, COALESCE(tag_data, '[]'::jsonb))
  ON CONFLICT (date) DO UPDATE
  SET 
    participant_count = EXCLUDED.participant_count,
    overtime_count = EXCLUDED.overtime_count,
    on_time_count = EXCLUDED.on_time_count,
    tag_distribution = EXCLUDED.tag_distribution;

  -- 刷新物化视图
  PERFORM refresh_real_time_stats();
  
  RAISE NOTICE 'Daily data archived for work date %', yesterday_work_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 初始刷新物化视图
-- ============================================

REFRESH MATERIALIZED VIEW CONCURRENTLY real_time_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY tag_stats;

-- ============================================
-- 7. 验证函数
-- ============================================

-- 测试工作日计算
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '工作日逻辑测试';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '当前时间: %', NOW();
  RAISE NOTICE '当前工作日: %', get_work_date(NOW());
  RAISE NOTICE '凌晨2点的工作日: %', get_work_date(NOW()::DATE + INTERVAL '2 hours');
  RAISE NOTICE '早上8点的工作日: %', get_work_date(NOW()::DATE + INTERVAL '8 hours');
  RAISE NOTICE '===========================================';
END $$;

-- 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '工作日逻辑实现完成！';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '已创建/更新的函数：';
  RAISE NOTICE '  - get_work_date()';
  RAISE NOTICE '  - get_real_time_stats()';
  RAISE NOTICE '  - get_top_tags()';
  RAISE NOTICE '  - archive_daily_data()';
  RAISE NOTICE '';
  RAISE NOTICE '已更新的物化视图：';
  RAISE NOTICE '  - real_time_stats';
  RAISE NOTICE '  - tag_stats';
  RAISE NOTICE '';
  RAISE NOTICE '工作日定义：';
  RAISE NOTICE '  - 早上 06:00 - 次日 05:59';
  RAISE NOTICE '  - 凌晨 00:00-05:59 算前一天';
  RAISE NOTICE '';
  RAISE NOTICE '下一步：';
  RAISE NOTICE '  1. 更新定时任务为每天 06:00 执行归档';
  RAISE NOTICE '  2. 更新前端UI显示工作日信息';
  RAISE NOTICE '===========================================';
END $$;

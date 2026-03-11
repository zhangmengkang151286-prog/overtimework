-- ============================================
-- 修复参与人数统计逻辑
-- ============================================
-- 问题：一个用户可以提交最多3个标签，每个标签一条记录
--       overtime_count 和 on_time_count 统计的是记录数，不是人数
-- 修复：改为按用户去重统计
-- 执行位置：Supabase SQL Editor
-- ============================================

-- 1. 删除旧的物化视图
DROP MATERIALIZED VIEW IF EXISTS real_time_stats CASCADE;

-- 2. 重新创建物化视图（按用户去重统计人数）
CREATE MATERIALIZED VIEW real_time_stats AS
SELECT 
  CURRENT_DATE as date,
  COUNT(DISTINCT user_id) as participant_count,
  COUNT(DISTINCT CASE WHEN is_overtime THEN user_id END) as overtime_count,
  COUNT(DISTINCT CASE WHEN NOT is_overtime THEN user_id END) as on_time_count,
  MAX(submitted_at) as last_updated
FROM status_records
WHERE date = CURRENT_DATE
GROUP BY CURRENT_DATE;

-- 创建唯一索引以支持并发刷新
CREATE UNIQUE INDEX real_time_stats_date_idx ON real_time_stats (date);

-- 3. 更新 get_real_time_stats 函数
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
  WHERE rts.date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 更新 archive_daily_data 函数（归档时也按用户去重）
CREATE OR REPLACE FUNCTION archive_daily_data()
RETURNS void AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - 1;
  stats_data RECORD;
  tag_data JSONB;
BEGIN
  SELECT 
    COUNT(DISTINCT user_id) as participant_count,
    COUNT(DISTINCT CASE WHEN is_overtime THEN user_id END) as overtime_count,
    COUNT(DISTINCT CASE WHEN NOT is_overtime THEN user_id END) as on_time_count
  INTO stats_data
  FROM status_records
  WHERE date = yesterday;

  IF stats_data.participant_count IS NULL OR stats_data.participant_count = 0 THEN
    RAISE NOTICE 'No data to archive for date %', yesterday;
    RETURN;
  END IF;

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
  WHERE sr.date = yesterday
  GROUP BY sr.tag_id, t.name;

  INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
  VALUES (yesterday, stats_data.participant_count, stats_data.overtime_count, stats_data.on_time_count, COALESCE(tag_data, '[]'::jsonb))
  ON CONFLICT (date) DO UPDATE
  SET 
    participant_count = EXCLUDED.participant_count,
    overtime_count = EXCLUDED.overtime_count,
    on_time_count = EXCLUDED.on_time_count,
    tag_distribution = EXCLUDED.tag_distribution;

  REFRESH MATERIALIZED VIEW CONCURRENTLY real_time_stats;
  
  RAISE NOTICE 'Daily data archived for date %', yesterday;
END;
$$ LANGUAGE plpgsql;

-- 5. 刷新物化视图
REFRESH MATERIALIZED VIEW real_time_stats;

-- 6. 验证结果
SELECT '修复后' as info, * FROM get_real_time_stats();

SELECT 
  '记录数（旧）' as type,
  COUNT(*) as total,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as ontime
FROM status_records
WHERE date = CURRENT_DATE
UNION ALL
SELECT 
  '人数（新）' as type,
  COUNT(DISTINCT user_id) as total,
  COUNT(DISTINCT CASE WHEN is_overtime THEN user_id END) as overtime,
  COUNT(DISTINCT CASE WHEN NOT is_overtime THEN user_id END) as ontime
FROM status_records
WHERE date = CURRENT_DATE;

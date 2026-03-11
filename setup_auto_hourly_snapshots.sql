-- ============================================
-- 自动每小时数据快照（修复版）
-- 只保存有数据的标签（count > 0）
-- 使用 Supabase Edge Functions 触发
-- ============================================

-- 1. 更新 save_hourly_snapshot() 函数
-- 关键修改：使用 INNER JOIN 而不是 LEFT JOIN，只保存有数据的标签
CREATE OR REPLACE FUNCTION save_hourly_snapshot()
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
  -- 获取当前时间
  v_snapshot_time := NOW();
  v_snapshot_date := v_snapshot_time::DATE;
  v_snapshot_hour := EXTRACT(HOUR FROM v_snapshot_time)::INTEGER;
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
    
  RAISE NOTICE 'Hourly snapshot saved: date=%, hour=%, participants=%, tags=%', 
    v_snapshot_date, v_snapshot_hour, v_participant_count, jsonb_array_length(v_tag_distribution);
END;
$$;

-- 2. 测试函数
SELECT save_hourly_snapshot();

-- 3. 验证结果
SELECT 
  snapshot_hour as "时间",
  participant_count as "参与人数",
  overtime_count as "加班次数",
  on_time_count as "准时次数",
  jsonb_array_length(tag_distribution) as "标签数量"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour DESC
LIMIT 5;

-- ============================================
-- 自动触发方案
-- ============================================

-- 方案1：使用 Supabase Edge Functions（推荐）
-- 创建一个 Edge Function，每小时调用一次 save_hourly_snapshot()
-- 
-- 步骤：
-- 1. 在 Supabase Dashboard 中创建 Edge Function
-- 2. 使用 Supabase 的 Cron Jobs 功能（如果可用）
-- 3. 或使用外部定时任务服务（如 GitHub Actions、Vercel Cron）

-- 方案2：使用 pg_cron（如果 Supabase 支持）
-- SELECT cron.schedule(
--   'save-hourly-snapshot',
--   '0 * * * *',  -- 每小时的第0分钟
--   $SELECT save_hourly_snapshot();$
-- );

-- 方案3：客户端定时触发（备用方案）
-- 在 App 中每小时调用一次 RPC

-- ============================================
-- 使用说明
-- ============================================
-- 1. 执行此脚本更新 save_hourly_snapshot() 函数
-- 2. 设置自动触发（选择上述方案之一）
-- 3. 函数会自动：
--    - 每小时保存一次快照
--    - 只保存有数据的标签（count > 0）
--    - 基于时间戳的累计统计
-- 4. 客户端通过 hourly_snapshots 表读取快照数据

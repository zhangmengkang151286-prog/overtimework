-- ============================================
-- 为10个用户生成最近7天的测试数据
-- ============================================

-- 第1步：为每个用户生成最近7天的随机状态
-- 每个用户每天只提交一次
WITH user_list AS (
  SELECT id, username FROM users ORDER BY phone_number
),
date_list AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  )::DATE as date
),
random_data AS (
  SELECT 
    u.id as user_id,
    d.date,
    -- 随机决定是否加班（60%概率加班）
    (random() < 0.6) as is_overtime,
    -- 随机选择一个标签
    (SELECT id FROM tags WHERE type = 'company' ORDER BY random() LIMIT 1) as tag_id,
    -- 随机加班小时数（1-5小时）
    (1 + floor(random() * 5))::INTEGER as overtime_hours,
    -- 随机提交时间（17:00-22:00之间）
    (d.date + TIME '17:00:00' + (random() * INTERVAL '5 hours'))::TIMESTAMP as submitted_at
  FROM user_list u
  CROSS JOIN date_list d
)
INSERT INTO status_records (user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
SELECT 
  user_id,
  date,
  is_overtime,
  tag_id,
  overtime_hours,
  submitted_at
FROM random_data
ON CONFLICT (user_id, date) DO NOTHING;  -- 如果已存在，跳过

-- 第2步：验证数据生成
SELECT 
  date as "日期",
  COUNT(DISTINCT user_id) as "参与人数",
  COUNT(*) FILTER (WHERE is_overtime = true) as "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false) as "准点人数",
  MIN(submitted_at AT TIME ZONE 'Asia/Shanghai') as "最早提交",
  MAX(submitted_at AT TIME ZONE 'Asia/Shanghai') as "最晚提交"
FROM status_records
WHERE date >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY date
ORDER BY date DESC;

-- 第3步：归档所有历史数据
DO $$
DECLARE
  target_date DATE;
BEGIN
  FOR target_date IN 
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '6 days',
      CURRENT_DATE - INTERVAL '1 day',  -- 不归档今天
      INTERVAL '1 day'
    )::DATE
  LOOP
    PERFORM archive_daily_data(target_date);
    RAISE NOTICE '✅ 已归档: %', target_date;
  END LOOP;
END $$;

-- 第4步：验证归档结果
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数",
  CASE 
    WHEN overtime_count > on_time_count THEN '🔴 红色'
    WHEN overtime_count < on_time_count THEN '🟢 绿色'
    ELSE '🟡 黄色'
  END as "圆点颜色"
FROM daily_history
WHERE date >= CURRENT_DATE - INTERVAL '6 days'
ORDER BY date DESC;

-- 第5步：生成今天的每小时快照
DO $$
DECLARE
  current_hour INTEGER;
BEGIN
  FOR current_hour IN 0..EXTRACT(HOUR FROM CURRENT_TIME)::INTEGER
  LOOP
    PERFORM save_hourly_snapshot(
      CURRENT_DATE,
      current_hour
    );
    RAISE NOTICE '✅ 已生成快照: % 点', current_hour;
  END LOOP;
END $$;

-- 第6步：验证快照数据
SELECT 
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

-- ============================================
-- 说明
-- ============================================
-- 
-- 执行完成后：
-- 1. ✅ 为10个用户生成了最近7天的随机数据
-- 2. ✅ 每个用户每天只有一条记录
-- 3. ✅ 60%概率加班，40%概率准点
-- 4. ✅ 提交时间在 17:00-22:00 之间
-- 5. ✅ 已归档历史数据到 daily_history
-- 6. ✅ 已生成今天的每小时快照
-- 
-- 现在可以：
-- - 刷新应用，查看 7个圆点
-- - 查看时间轴数据
-- - 查看实时统计

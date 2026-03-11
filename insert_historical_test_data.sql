-- 插入过去10天的历史测试数据
-- 用于测试历史状态指示器的显示效果
-- 确保有足够的数据用于显示最近7天

-- 删除可能存在的旧测试数据
DELETE FROM daily_history WHERE date >= CURRENT_DATE - INTERVAL '10 days';

-- 插入过去8天的数据
-- 日期从8天前到昨天
-- 使用 INSERT ... ON CONFLICT 处理重复数据

-- 8天前：加班多（红点）
INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE - INTERVAL '8 days',
  25,
  18,
  7,
  '[]'::jsonb
)
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count,
  tag_distribution = EXCLUDED.tag_distribution;

-- 7天前：准时下班多（绿点）
INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE - INTERVAL '7 days',
  30,
  10,
  20,
  '[]'::jsonb
)
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count,
  tag_distribution = EXCLUDED.tag_distribution;

-- 6天前：加班多（红点）
INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE - INTERVAL '6 days',
  22,
  15,
  7,
  '[]'::jsonb
)
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count,
  tag_distribution = EXCLUDED.tag_distribution;

-- 5天前：准时下班多（绿点）
INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE - INTERVAL '5 days',
  28,
  8,
  20,
  '[]'::jsonb
)
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count,
  tag_distribution = EXCLUDED.tag_distribution;

-- 4天前：加班多（红点）
INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE - INTERVAL '4 days',
  35,
  25,
  10,
  '[]'::jsonb
)
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count,
  tag_distribution = EXCLUDED.tag_distribution;

-- 3天前：准时下班多（绿点）
INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE - INTERVAL '3 days',
  20,
  5,
  15,
  '[]'::jsonb
)
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count,
  tag_distribution = EXCLUDED.tag_distribution;

-- 2天前：加班多（红点）
INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE - INTERVAL '2 days',
  40,
  30,
  10,
  '[]'::jsonb
)
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count,
  tag_distribution = EXCLUDED.tag_distribution;

-- 昨天：准时下班多（绿点）
INSERT INTO daily_history (date, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE - INTERVAL '1 day',
  32,
  12,
  20,
  '[]'::jsonb
)
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count,
  tag_distribution = EXCLUDED.tag_distribution;

-- 验证插入的数据
SELECT 
  date,
  participant_count,
  overtime_count,
  on_time_count,
  CASE 
    WHEN overtime_count > on_time_count THEN '红点 (加班多)'
    ELSE '绿点 (准时下班多)'
  END as status_display
FROM daily_history
WHERE date >= CURRENT_DATE - INTERVAL '8 days'
ORDER BY date DESC;

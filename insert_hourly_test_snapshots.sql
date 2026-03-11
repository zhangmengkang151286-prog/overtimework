-- ============================================
-- 插入今天各个整点的测试快照数据
-- 用于测试时间轴功能
-- ============================================

-- 删除今天的旧测试数据
DELETE FROM hourly_snapshots WHERE snapshot_date = CURRENT_DATE;

-- 插入今天从早上6点到现在的每个整点的测试数据
-- 数据会随着时间递增，模拟真实场景

-- 6:00 - 工作日开始
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  6,
  CURRENT_DATE + INTERVAL '6 hours',
  5,
  2,
  3,
  '[{"tag_id": "1", "tag_name": "开会", "overtime_count": 1, "on_time_count": 2, "total_count": 3}]'::jsonb
);

-- 7:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  7,
  CURRENT_DATE + INTERVAL '7 hours',
  12,
  5,
  7,
  '[{"tag_id": "1", "tag_name": "开会", "overtime_count": 2, "on_time_count": 3, "total_count": 5}, {"tag_id": "2", "tag_name": "写代码", "overtime_count": 3, "on_time_count": 4, "total_count": 7}]'::jsonb
);

-- 8:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  8,
  CURRENT_DATE + INTERVAL '8 hours',
  25,
  10,
  15,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 5, "on_time_count": 8, "total_count": 13}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 3, "on_time_count": 5, "total_count": 8}]'::jsonb
);

-- 9:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  9,
  CURRENT_DATE + INTERVAL '9 hours',
  38,
  15,
  23,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 8, "on_time_count": 12, "total_count": 20}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 5, "on_time_count": 8, "total_count": 13}]'::jsonb
);

-- 10:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  10,
  CURRENT_DATE + INTERVAL '10 hours',
  52,
  22,
  30,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 12, "on_time_count": 15, "total_count": 27}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 8, "on_time_count": 12, "total_count": 20}]'::jsonb
);

-- 11:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  11,
  CURRENT_DATE + INTERVAL '11 hours',
  65,
  28,
  37,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 15, "on_time_count": 18, "total_count": 33}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 10, "on_time_count": 15, "total_count": 25}]'::jsonb
);

-- 12:00 - 午餐时间
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  12,
  CURRENT_DATE + INTERVAL '12 hours',
  70,
  30,
  40,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 16, "on_time_count": 20, "total_count": 36}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 11, "on_time_count": 16, "total_count": 27}]'::jsonb
);

-- 13:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  13,
  CURRENT_DATE + INTERVAL '13 hours',
  75,
  32,
  43,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 17, "on_time_count": 22, "total_count": 39}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 12, "on_time_count": 17, "total_count": 29}]'::jsonb
);

-- 14:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  14,
  CURRENT_DATE + INTERVAL '14 hours',
  82,
  35,
  47,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 19, "on_time_count": 24, "total_count": 43}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 13, "on_time_count": 19, "total_count": 32}]'::jsonb
);

-- 15:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  15,
  CURRENT_DATE + INTERVAL '15 hours',
  88,
  38,
  50,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 21, "on_time_count": 26, "total_count": 47}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 14, "on_time_count": 20, "total_count": 34}]'::jsonb
);

-- 16:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  16,
  CURRENT_DATE + INTERVAL '16 hours',
  95,
  42,
  53,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 23, "on_time_count": 28, "total_count": 51}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 16, "on_time_count": 21, "total_count": 37}]'::jsonb
);

-- 17:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  17,
  CURRENT_DATE + INTERVAL '17 hours',
  100,
  45,
  55,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 25, "on_time_count": 30, "total_count": 55}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 17, "on_time_count": 22, "total_count": 39}]'::jsonb
);

-- 18:00 - 下班时间
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  18,
  CURRENT_DATE + INTERVAL '18 hours',
  105,
  48,
  57,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 27, "on_time_count": 31, "total_count": 58}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 18, "on_time_count": 23, "total_count": 41}]'::jsonb
);

-- 19:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  19,
  CURRENT_DATE + INTERVAL '19 hours',
  108,
  52,
  56,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 29, "on_time_count": 31, "total_count": 60}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 20, "on_time_count": 23, "total_count": 43}]'::jsonb
);

-- 20:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  20,
  CURRENT_DATE + INTERVAL '20 hours',
  110,
  58,
  52,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 32, "on_time_count": 30, "total_count": 62}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 23, "on_time_count": 20, "total_count": 43}]'::jsonb
);

-- 21:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  21,
  CURRENT_DATE + INTERVAL '21 hours',
  112,
  65,
  47,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 36, "on_time_count": 28, "total_count": 64}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 26, "on_time_count": 18, "total_count": 44}]'::jsonb
);

-- 22:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  22,
  CURRENT_DATE + INTERVAL '22 hours',
  115,
  72,
  43,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 40, "on_time_count": 26, "total_count": 66}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 29, "on_time_count": 16, "total_count": 45}]'::jsonb
);

-- 23:00
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  23,
  CURRENT_DATE + INTERVAL '23 hours',
  118,
  78,
  40,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 43, "on_time_count": 24, "total_count": 67}, {"tag_id": "1", "tag_name": "开会", "overtime_count": 32, "on_time_count": 15, "total_count": 47}]'::jsonb
);

-- 验证插入的数据
SELECT 
  snapshot_date,
  snapshot_hour,
  TO_CHAR(snapshot_time, 'HH24:MI') as time,
  participant_count,
  overtime_count,
  on_time_count,
  CASE 
    WHEN overtime_count > on_time_count THEN '加班多 🔴'
    ELSE '准时多 🟢'
  END as status
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

-- 显示统计信息
SELECT 
  COUNT(*) as total_snapshots,
  MIN(snapshot_hour) as first_hour,
  MAX(snapshot_hour) as last_hour,
  SUM(participant_count) as total_participants,
  AVG(participant_count)::INTEGER as avg_participants
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE;

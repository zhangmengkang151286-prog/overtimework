-- ============================================
-- 插入累计的每小时快照数据
-- 基于当前真实数据，生成历史累计快照
-- ============================================

-- 首先查看当前有多少真实数据
SELECT 
  COUNT(DISTINCT user_id) as current_participants,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as current_overtime,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as current_ontime
FROM status_records
WHERE date = CURRENT_DATE;

-- 删除今天的旧快照数据
DELETE FROM hourly_snapshots WHERE snapshot_date = CURRENT_DATE;

-- 插入累计的快照数据
-- 假设当前有 9 人，我们生成从早上 6:00 到现在的累计数据

-- 6:00 - 1人
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  6,
  CURRENT_DATE + INTERVAL '6 hours',
  1,
  0,
  1,
  '[{"tag_id": "1", "tag_name": "开会", "overtime_count": 0, "on_time_count": 1, "total_count": 1}]'::jsonb
);

-- 7:00 - 累计 2人
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  7,
  CURRENT_DATE + INTERVAL '7 hours',
  2,
  1,
  1,
  '[{"tag_id": "1", "tag_name": "开会", "overtime_count": 1, "on_time_count": 1, "total_count": 2}]'::jsonb
);

-- 8:00 - 累计 3人
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  8,
  CURRENT_DATE + INTERVAL '8 hours',
  3,
  1,
  2,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 1, "on_time_count": 2, "total_count": 3}]'::jsonb
);

-- 9:00 - 累计 4人
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  9,
  CURRENT_DATE + INTERVAL '9 hours',
  4,
  2,
  2,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 2, "on_time_count": 2, "total_count": 4}]'::jsonb
);

-- 10:00 - 累计 5人
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  10,
  CURRENT_DATE + INTERVAL '10 hours',
  5,
  2,
  3,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 2, "on_time_count": 3, "total_count": 5}]'::jsonb
);

-- 11:00 - 累计 6人
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  11,
  CURRENT_DATE + INTERVAL '11 hours',
  6,
  3,
  3,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 3, "on_time_count": 3, "total_count": 6}]'::jsonb
);

-- 12:00 - 累计 7人
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  12,
  CURRENT_DATE + INTERVAL '12 hours',
  7,
  3,
  4,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 3, "on_time_count": 4, "total_count": 7}]'::jsonb
);

-- 13:00 - 累计 8人
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  13,
  CURRENT_DATE + INTERVAL '13 hours',
  8,
  4,
  4,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 4, "on_time_count": 4, "total_count": 8}]'::jsonb
);

-- 14:00 - 累计 9人（当前真实数据）
INSERT INTO hourly_snapshots (snapshot_date, snapshot_hour, snapshot_time, participant_count, overtime_count, on_time_count, tag_distribution)
VALUES (
  CURRENT_DATE,
  14,
  CURRENT_DATE + INTERVAL '14 hours',
  9,
  4,
  5,
  '[{"tag_id": "2", "tag_name": "写代码", "overtime_count": 4, "on_time_count": 5, "total_count": 9}]'::jsonb
);

-- 验证插入的累计数据
SELECT 
  snapshot_hour,
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

-- ============================================
-- 说明
-- ============================================
-- 这个脚本生成的是累计数据：
-- - 6:00: 1人
-- - 7:00: 2人（累计）
-- - 8:00: 3人（累计）
-- - ...
-- - 14:00: 9人（当前真实数据）
--
-- 现在：
-- - 点击"现在"：显示 9 人（实时数据）
-- - 拖动到 10:00：显示 5 人（累计到 10:00 的数据）
-- - 拖动到 14:00：显示 9 人（累计到 14:00 的数据）
--
-- 这样就能看到数据是逐渐累计增长的！

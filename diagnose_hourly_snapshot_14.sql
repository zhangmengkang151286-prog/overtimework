-- 诊断14点快照数据问题

-- ========================================
-- 第1步：检查今天14点的原始提交记录
-- ========================================
SELECT '第1步：检查 status_records 表中今天14点的原始数据' as step;
SELECT 
  date as "日期",
  submitted_at as "提交时间",
  user_id as "用户ID",
  is_overtime as "是否加班",
  tag_id as "标签ID"
FROM status_records
WHERE date = CURRENT_DATE
  AND EXTRACT(HOUR FROM submitted_at AT TIME ZONE 'Asia/Shanghai') = 14
ORDER BY submitted_at DESC;

-- ========================================
-- 第2步：检查今天14点的快照数据
-- ========================================
SELECT '第2步：检查 hourly_snapshots 表中今天14点的快照' as step;
SELECT 
  snapshot_date as "日期",
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  created_at as "快照创建时间"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
  AND snapshot_hour = 14;

-- ========================================
-- 第3步：检查今天所有小时的快照
-- ========================================
SELECT '第3步：检查今天所有小时的快照' as step;
SELECT 
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  created_at as "快照创建时间"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;

-- ========================================
-- 第4步：检查今天所有提交记录的时间分布
-- ========================================
SELECT '第4步：检查今天所有提交记录的时间分布' as step;
SELECT 
  EXTRACT(HOUR FROM submitted_at AT TIME ZONE 'Asia/Shanghai') as "小时",
  COUNT(*) as "提交次数",
  COUNT(DISTINCT user_id) as "参与人数",
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as "加班次数",
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as "准点次数"
FROM status_records
WHERE date = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM submitted_at AT TIME ZONE 'Asia/Shanghai')
ORDER BY "小时";

-- ========================================
-- 第5步：手动生成今天14点的快照
-- ========================================
SELECT '第5步：手动生成今天14点的快照' as step;

-- 删除今天14点的旧快照（如果存在）
DELETE FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
  AND snapshot_hour = 14;

-- 重新生成今天14点的快照
INSERT INTO hourly_snapshots (
  snapshot_date,
  snapshot_hour,
  snapshot_time,
  participant_count,
  overtime_count,
  on_time_count,
  tag_distribution
)
SELECT 
  CURRENT_DATE as snapshot_date,
  14 as snapshot_hour,
  (CURRENT_DATE + INTERVAL '14 hours')::TIMESTAMP as snapshot_time,
  COUNT(DISTINCT sr.user_id) as participant_count,
  SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END)::INTEGER as overtime_count,
  SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END)::INTEGER as on_time_count,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'tag_id', t.id,
        'tag_name', t.name,
        'overtime_count', COALESCE(tag_stats.overtime_count, 0),
        'on_time_count', COALESCE(tag_stats.on_time_count, 0),
        'total_count', COALESCE(tag_stats.total_count, 0)
      )
    )
    FROM tags t
    LEFT JOIN (
      SELECT 
        sr2.tag_id,
        SUM(CASE WHEN sr2.is_overtime THEN 1 ELSE 0 END) as overtime_count,
        SUM(CASE WHEN NOT sr2.is_overtime THEN 1 ELSE 0 END) as on_time_count,
        COUNT(*) as total_count
      FROM status_records sr2
      WHERE sr2.date = CURRENT_DATE
        AND EXTRACT(HOUR FROM sr2.submitted_at AT TIME ZONE 'Asia/Shanghai') <= 14
        AND sr2.tag_id IS NOT NULL
      GROUP BY sr2.tag_id
    ) tag_stats ON t.id = tag_stats.tag_id
    WHERE tag_stats.total_count > 0
  ) as tag_distribution
FROM status_records sr
WHERE sr.date = CURRENT_DATE
  AND EXTRACT(HOUR FROM sr.submitted_at AT TIME ZONE 'Asia/Shanghai') <= 14;

-- ========================================
-- 第6步：验证修复后的14点快照
-- ========================================
SELECT '第6步：验证修复后的14点快照' as step;
SELECT 
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  created_at as "快照创建时间"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
  AND snapshot_hour = 14;

-- ========================================
-- 说明
-- ========================================

/*
这个脚本会：
1. 检查 status_records 表中今天14点的原始提交记录
2. 检查 hourly_snapshots 表中今天14点的快照
3. 检查今天所有小时的快照
4. 检查今天所有提交记录的时间分布
5. 手动重新生成今天14点的快照
6. 验证修复后的快照

可能的问题：
- 快照生成时间不对（GitHub Actions 每小时运行一次）
- 时区问题（快照使用的时区与提交记录不一致）
- 快照生成逻辑有问题（累计计算错误）
*/

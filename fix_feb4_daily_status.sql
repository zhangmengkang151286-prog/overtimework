-- 修复2月4日（昨天）的每日状态数据

-- ========================================
-- 第1步：诊断问题
-- ========================================

-- 1.1 检查 status_records 表中2月4日的原始数据
SELECT '1.1 status_records 中2月4日的原始数据' as step;
SELECT 
  date as "日期",
  COUNT(*) as "提交次数",
  COUNT(DISTINCT user_id) as "参与人数",
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as "加班人数",
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as "准点人数"
FROM status_records
WHERE date = '2024-02-04'
GROUP BY date;

-- 1.2 检查 daily_history 表中2月4日的归档数据
SELECT '1.2 daily_history 中2月4日的归档数据' as step;
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  created_at as "创建时间"
FROM daily_history
WHERE date = '2024-02-04';

-- 1.3 查看 get_daily_status 函数返回的数据
SELECT '1.3 get_daily_status 函数返回的最近7天数据' as step;
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  is_overtime_dominant as "加班占优",
  CASE 
    WHEN is_overtime_dominant THEN '🔴 红点'
    ELSE '🟢 绿点'
  END as "显示状态"
FROM get_daily_status(7)
ORDER BY date DESC;

-- ========================================
-- 第2步：修复数据
-- ========================================

-- 2.1 如果 daily_history 中没有2月4日的数据，从 status_records 中生成
SELECT '2.1 开始修复：从 status_records 生成2月4日的归档数据' as step;

INSERT INTO daily_history (
  date,
  participant_count,
  overtime_count,
  on_time_count,
  tag_distribution
)
SELECT 
  '2024-02-04'::DATE as date,
  COUNT(DISTINCT user_id) as participant_count,
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END)::INTEGER as overtime_count,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)::INTEGER as on_time_count,
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
        sr.tag_id,
        SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END) as overtime_count,
        SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END) as on_time_count,
        COUNT(*) as total_count
      FROM status_records sr
      WHERE sr.date = '2024-02-04'
        AND sr.tag_id IS NOT NULL
      GROUP BY sr.tag_id
    ) tag_stats ON t.id = tag_stats.tag_id
    WHERE tag_stats.total_count > 0
  ) as tag_distribution
FROM status_records
WHERE date = '2024-02-04'
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count,
  tag_distribution = EXCLUDED.tag_distribution;

-- ========================================
-- 第3步：验证修复结果
-- ========================================

SELECT '3.1 验证：daily_history 中2月4日的数据' as step;
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  created_at as "创建时间"
FROM daily_history
WHERE date = '2024-02-04';

SELECT '3.2 验证：get_daily_status 函数返回的最近7天数据' as step;
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  is_overtime_dominant as "加班占优",
  CASE 
    WHEN participant_count = 0 THEN '⚪ 无数据'
    WHEN is_overtime_dominant THEN '🔴 红点 (加班多)'
    ELSE '🟢 绿点 (准点下班 >= 加班)'
  END as "显示状态"
FROM get_daily_status(7)
ORDER BY date DESC;

-- ========================================
-- 说明
-- ========================================

/*
问题原因：
1. daily_history 表中可能缺少2月4日的数据
2. 每日归档任务可能没有正常运行
3. get_daily_status 函数依赖 daily_history 表

解决方案：
1. 从 status_records 表中重新生成2月4日的归档数据
2. 使用 ON CONFLICT 确保如果数据已存在则更新
3. 验证修复后的数据是否正确

后续建议：
1. 检查每日归档的 cron 任务是否正常运行
2. 确保 GitHub Actions 或其他定时任务正常执行
3. 可以手动运行 archive_daily_data() 函数来归档历史数据
*/

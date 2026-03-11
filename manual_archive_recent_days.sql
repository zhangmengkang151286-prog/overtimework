-- 手动归档最近几天的数据到 daily_history 表

-- ========================================
-- 第1步：检查 status_records 中最近7天的原始数据
-- ========================================
SELECT '第1步：检查 status_records 中最近7天的原始数据' as step;
SELECT 
  date as "日期",
  COUNT(*) as "提交次数",
  COUNT(DISTINCT user_id) as "参与人数",
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as "加班人数",
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as "准点人数"
FROM status_records
WHERE date >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY date
ORDER BY date DESC;

-- ========================================
-- 第2步：手动归档最近7天的数据
-- ========================================
SELECT '第2步：开始手动归档最近7天的数据' as step;

-- 为每一天生成归档数据
INSERT INTO daily_history (
  date,
  participant_count,
  overtime_count,
  on_time_count,
  tag_distribution
)
SELECT 
  sr.date,
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
      WHERE sr2.date = sr.date
        AND sr2.tag_id IS NOT NULL
      GROUP BY sr2.tag_id
    ) tag_stats ON t.id = tag_stats.tag_id
    WHERE tag_stats.total_count > 0
  ) as tag_distribution
FROM status_records sr
WHERE sr.date >= CURRENT_DATE - INTERVAL '6 days'
  AND sr.date < CURRENT_DATE  -- 不包括今天
GROUP BY sr.date
ON CONFLICT (date) DO UPDATE SET
  participant_count = EXCLUDED.participant_count,
  overtime_count = EXCLUDED.overtime_count,
  on_time_count = EXCLUDED.on_time_count,
  tag_distribution = EXCLUDED.tag_distribution;

-- ========================================
-- 第3步：验证归档结果
-- ========================================
SELECT '第3步：验证归档结果' as step;
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  jsonb_array_length(COALESCE(tag_distribution, '[]'::jsonb)) as "标签数",
  created_at as "创建时间"
FROM daily_history
WHERE date >= CURRENT_DATE - INTERVAL '6 days'
ORDER BY date DESC;

-- ========================================
-- 第4步：验证 get_daily_status 函数
-- ========================================
SELECT '第4步：验证 get_daily_status 函数返回的数据' as step;
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
这个脚本会：
1. 检查 status_records 表中最近7天的原始数据
2. 将这些数据归档到 daily_history 表
3. 使用 ON CONFLICT 确保如果数据已存在则更新
4. 验证归档结果
5. 验证 get_daily_status 函数是否正确返回数据

注意：
- 这个脚本不会归档今天的数据（因为今天还没结束）
- 如果某天没有任何提交记录，不会创建归档（会显示为0）
- 需要配置自动归档任务，避免以后再次出现这个问题
*/

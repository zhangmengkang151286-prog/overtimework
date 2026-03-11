-- 设置自动每日归档任务（修复版）

-- ========================================
-- 第1步：创建归档函数
-- ========================================

CREATE OR REPLACE FUNCTION archive_daily_data(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS TABLE (
  archived_date DATE,
  participant_count INTEGER,
  overtime_count INTEGER,
  on_time_count INTEGER
) AS $$
BEGIN
  -- 插入或更新归档数据
  INSERT INTO daily_history (
    date,
    participant_count,
    overtime_count,
    on_time_count,
    tag_distribution
  )
  SELECT 
    target_date,
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
        WHERE sr2.date = target_date
          AND sr2.tag_id IS NOT NULL
        GROUP BY sr2.tag_id
      ) tag_stats ON t.id = tag_stats.tag_id
      WHERE tag_stats.total_count > 0
    ) as tag_distribution
  FROM status_records sr
  WHERE sr.date = target_date
  ON CONFLICT (date) DO UPDATE SET
    participant_count = EXCLUDED.participant_count,
    overtime_count = EXCLUDED.overtime_count,
    on_time_count = EXCLUDED.on_time_count,
    tag_distribution = EXCLUDED.tag_distribution;

  -- 返回归档结果
  RETURN QUERY
  SELECT 
    dh.date,
    dh.participant_count,
    dh.overtime_count,
    dh.on_time_count
  FROM daily_history dh
  WHERE dh.date = target_date;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 第2步：测试归档函数
-- ========================================
SELECT '测试归档函数：归档昨天的数据' as step;
SELECT * FROM archive_daily_data((CURRENT_DATE - INTERVAL '1 day')::DATE);

-- ========================================
-- 说明
-- ========================================

/*
## 归档函数已创建成功！

### 函数说明
- 函数名：archive_daily_data(target_date)
- 功能：将指定日期的数据从 status_records 归档到 daily_history
- 参数：target_date（可选，默认为昨天）

### 使用方法

手动归档某一天：
```sql
SELECT * FROM archive_daily_data('2026-02-04');
```

归档昨天：
```sql
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '1 day');
```

### 自动归档方案

由于 Supabase 的 pg_cron 扩展可能未启用，我们使用 GitHub Actions 来实现自动归档。

GitHub Actions 工作流已经创建在：
`.github/workflows/daily-archive.yml`

该工作流会：
- 每天 22:00 UTC（次日 06:00 北京时间）自动运行
- 调用 archive_daily_data() 函数归档前一天的数据
- 无需人工干预

### 下一步

1. 执行 `manual_archive_recent_days.sql` 手动归档最近7天的数据
2. 推送 GitHub Actions 工作流到仓库
3. 在 GitHub Actions 中手动触发一次测试
4. 验证应用中的7个圆点显示正确

*/

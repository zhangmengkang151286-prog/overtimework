-- 设置自动每日归档任务

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
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '1 day');

-- ========================================
-- 第3步：设置 Supabase Cron 任务（如果支持）
-- ========================================

-- 注意：Supabase 的 pg_cron 扩展可能需要在项目设置中启用
-- 如果下面的命令失败，说明你的 Supabase 项目没有启用 pg_cron

-- 尝试创建 cron 任务
DO $$
BEGIN
  -- 检查 pg_cron 扩展是否存在
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- 删除旧的任务（如果存在）
    PERFORM cron.unschedule('daily_archive_task');
    
    -- 创建新的每日归档任务
    -- 每天早上 6:00（北京时间）执行
    -- 注意：Supabase 使用 UTC 时间，所以 6:00 北京时间 = 22:00 UTC（前一天）
    PERFORM cron.schedule(
      'daily_archive_task',
      '0 22 * * *',  -- 每天 22:00 UTC = 次日 06:00 北京时间
      $$SELECT archive_daily_data(CURRENT_DATE);$$
    );
    
    RAISE NOTICE 'Cron 任务创建成功！每天 06:00 北京时间自动归档';
  ELSE
    RAISE NOTICE 'pg_cron 扩展未启用，请使用 GitHub Actions 或其他方式设置定时任务';
  END IF;
END $$;

-- ========================================
-- 第4步：查看已创建的 cron 任务
-- ========================================
SELECT '查看已创建的 cron 任务' as step;
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'daily_archive_task';

-- ========================================
-- 说明和备选方案
-- ========================================

/*
## 自动归档方案

### 方案1：Supabase Cron（推荐，如果可用）
- 上面的脚本已经尝试创建 cron 任务
- 每天早上 6:00 北京时间自动归档前一天的数据
- 无需额外配置

### 方案2：GitHub Actions（备选）
如果 Supabase Cron 不可用，使用 GitHub Actions：

创建文件 `.github/workflows/daily-archive.yml`:

```yaml
name: Daily Archive

on:
  schedule:
    - cron: '0 22 * * *'  # 每天 22:00 UTC = 次日 06:00 北京时间
  workflow_dispatch:  # 允许手动触发

jobs:
  archive:
    runs-on: ubuntu-latest
    steps:
      - name: Archive Daily Data
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL }}/rest/v1/rpc/archive_daily_data" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"target_date": null}'
```

### 方案3：客户端定时（不推荐）
在应用中添加定时任务，但这依赖于应用运行，不可靠。

## 手动归档
如果需要手动归档某一天的数据：

```sql
-- 归档昨天
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '1 day');

-- 归档指定日期
SELECT * FROM archive_daily_data('2024-02-04');

-- 批量归档最近7天
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '7 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '6 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '5 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '4 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '3 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '2 days');
SELECT * FROM archive_daily_data(CURRENT_DATE - INTERVAL '1 day');
```
*/

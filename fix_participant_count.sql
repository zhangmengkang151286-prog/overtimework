-- 修复参与人数计算逻辑
-- 问题：使用 COUNT(DISTINCT user_id) 导致测试账号多次提交时参与人数始终为 1
-- 解决：改为 COUNT(*) 计算所有提交记录数

-- 删除旧的物化视图
DROP MATERIALIZED VIEW IF EXISTS real_time_stats CASCADE;

-- 重新创建物化视图，使用 COUNT(*) 而不是 COUNT(DISTINCT user_id)
CREATE MATERIALIZED VIEW real_time_stats AS
SELECT 
  date,
  COUNT(*) as participant_count,  -- 改为计算所有记录数
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count,
  MAX(submitted_at) as last_updated
FROM status_records
WHERE date = CURRENT_DATE
GROUP BY date;

-- 创建唯一索引以支持并发刷新
CREATE UNIQUE INDEX real_time_stats_date_idx ON real_time_stats (date);

-- 刷新物化视图
REFRESH MATERIALIZED VIEW real_time_stats;

-- 测试查询
SELECT * FROM real_time_stats WHERE date = CURRENT_DATE;

-- 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✓ 参与人数计算逻辑已修复';
  RAISE NOTICE '  - 从 COUNT(DISTINCT user_id) 改为 COUNT(*)';
  RAISE NOTICE '  - 现在每次提交都会累计参与人数';
  RAISE NOTICE '  - 测试账号多次提交会正确累计';
  RAISE NOTICE '';
END $$;

-- ============================================
-- 修复 get_work_date() 函数的时区问题
-- ============================================
-- 问题：get_work_date() 直接对 UTC 时间取小时和日期，
--       没有先转换为北京时间，导致前端和数据库日期不一致
-- 执行位置：Supabase SQL Editor
-- ============================================

-- 1. 修复 get_work_date 函数
CREATE OR REPLACE FUNCTION get_work_date(check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW())
RETURNS DATE AS $$
DECLARE
  beijing_time TIMESTAMP;
BEGIN
  -- 先将 UTC 时间转换为北京时间
  beijing_time := check_time AT TIME ZONE 'Asia/Shanghai';
  
  -- 如果北京时间是凌晨 0:00-5:59，算作前一天的工作日
  IF EXTRACT(HOUR FROM beijing_time) < 6 THEN
    RETURN (beijing_time::DATE - INTERVAL '1 day')::DATE;
  ELSE
    RETURN beijing_time::DATE;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. 验证修复结果
DO $$
DECLARE
  v_utc_now TIMESTAMPTZ := NOW();
  v_beijing_now TIMESTAMP := NOW() AT TIME ZONE 'Asia/Shanghai';
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '时区修复验证';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'UTC 时间: %', v_utc_now;
  RAISE NOTICE '北京时间: %', v_beijing_now;
  RAISE NOTICE '北京时间小时: %', EXTRACT(HOUR FROM v_beijing_now);
  RAISE NOTICE '修复后工作日: %', get_work_date(NOW());
  RAISE NOTICE '============================================';
END $$;

-- 3. 验证实时统计是否能查到数据
SELECT '实时统计' as info, * FROM get_real_time_stats();

-- 4. 查看今天（北京时间）的 status_records
SELECT 
  '状态记录' as info,
  date,
  COUNT(*) as record_count,
  get_work_date(NOW()) as current_work_date,
  CASE WHEN date = get_work_date(NOW()) THEN '匹配' ELSE '不匹配' END as match_status
FROM status_records
WHERE date >= (NOW() AT TIME ZONE 'Asia/Shanghai')::DATE - INTERVAL '1 day'
GROUP BY date
ORDER BY date DESC;

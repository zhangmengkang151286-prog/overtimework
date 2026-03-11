-- 修改 get_daily_status 函数的判断逻辑
-- 变更：准点下班 >= 加班 时显示绿色（之前是 > ）
-- 这样当两者都是 0 时，也会显示绿色

CREATE OR REPLACE FUNCTION get_daily_status(days INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  is_overtime_dominant BOOLEAN,
  participant_count INTEGER,
  overtime_count INTEGER,
  on_time_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dh.date,
    -- 修改：只有当加班人数 > 准点人数时才是加班占主导
    -- 相等时（包括都是0）视为准点占主导（绿色）
    (dh.overtime_count > dh.on_time_count) as is_overtime_dominant,
    dh.participant_count,
    dh.overtime_count,
    dh.on_time_count
  FROM daily_history dh
  WHERE dh.date >= CURRENT_DATE - (days - 1)
    AND dh.date <= CURRENT_DATE
  ORDER BY dh.date ASC;
END;
$$ LANGUAGE plpgsql;

-- 验证修复结果
SELECT 
  date,
  participant_count,
  overtime_count,
  on_time_count,
  is_overtime_dominant,
  CASE 
    WHEN is_overtime_dominant THEN '🔴 红点 (加班多)'
    ELSE '🟢 绿点 (准点下班 >= 加班)'
  END as status_display
FROM get_daily_status(7)
ORDER BY date DESC;

-- 测试边界情况
-- 1. 都是 0 的情况（应该显示绿色）
-- 2. 相等的情况（应该显示绿色）
-- 3. 加班多的情况（应该显示红色）
SELECT 
  '测试用例' as test_case,
  0 as overtime_count,
  0 as on_time_count,
  (0 > 0) as is_overtime_dominant,
  CASE WHEN (0 > 0) THEN '红点' ELSE '绿点' END as result
UNION ALL
SELECT 
  '相等情况',
  10,
  10,
  (10 > 10),
  CASE WHEN (10 > 10) THEN '红点' ELSE '绿点' END
UNION ALL
SELECT 
  '加班多',
  15,
  10,
  (15 > 10),
  CASE WHEN (15 > 10) THEN '红点' ELSE '绿点' END
UNION ALL
SELECT 
  '准点多',
  10,
  15,
  (10 > 15),
  CASE WHEN (10 > 15) THEN '红点' ELSE '绿点' END;

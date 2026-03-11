-- 修复 get_daily_status 函数
-- 确保返回最近 N 天的所有日期，即使某天没有数据
-- 当 participant_count = 0 时，显示绿色圆点（准点下班 >= 加班）

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
  WITH date_series AS (
    -- 生成最近 N 天的日期序列
    SELECT generate_series(
      CURRENT_DATE - (days - 1),
      CURRENT_DATE,
      '1 day'::interval
    )::DATE as date
  )
  SELECT 
    ds.date,
    -- 当加班人数 > 准点人数时才是加班占主导（红色）
    -- 否则（包括相等和都是0）显示绿色
    COALESCE(dh.overtime_count > dh.on_time_count, false) as is_overtime_dominant,
    COALESCE(dh.participant_count, 0) as participant_count,
    COALESCE(dh.overtime_count, 0) as overtime_count,
    COALESCE(dh.on_time_count, 0) as on_time_count
  FROM date_series ds
  LEFT JOIN daily_history dh ON ds.date = dh.date
  ORDER BY ds.date ASC;
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

-- 说明：
-- 1. 使用 generate_series 生成最近 N 天的完整日期序列
-- 2. LEFT JOIN daily_history 确保即使某天没有数据也会返回
-- 3. 使用 COALESCE 将 NULL 值转换为 0
-- 4. 当 overtime_count > on_time_count 时显示红色，否则显示绿色
-- 5. 这样即使某天没有人提交（都是0），也会显示绿色圆点

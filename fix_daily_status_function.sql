-- 修复 get_daily_status 函数
-- 问题：原函数使用 CURRENT_DATE - days，导致返回的天数不正确
-- 修复：改为 CURRENT_DATE - (days - 1)，确保返回正确的天数

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
    (dh.overtime_count > dh.on_time_count) as is_overtime_dominant,
    dh.participant_count,
    dh.overtime_count,
    dh.on_time_count
  FROM daily_history dh
  WHERE dh.date >= CURRENT_DATE - (days - 1)  -- 修复：确保返回正确的天数
    AND dh.date <= CURRENT_DATE                -- 添加：不超过今天
  ORDER BY dh.date ASC;                        -- 修复：改为升序，前端会处理排序
END;
$$ LANGUAGE plpgsql;

-- 验证修复结果
-- 应该返回最近7天的数据（包括今天）
SELECT 
  date,
  is_overtime_dominant,
  participant_count,
  overtime_count,
  on_time_count,
  CASE 
    WHEN is_overtime_dominant THEN '红点 (加班多)'
    ELSE '绿点 (准时下班多)'
  END as status_display
FROM get_daily_status(7)
ORDER BY date DESC;

-- 查看 daily_history 表中的所有数据
SELECT 
  date,
  participant_count,
  overtime_count,
  on_time_count,
  CASE 
    WHEN overtime_count > on_time_count THEN '红点 (加班多)'
    ELSE '绿点 (准时下班多)'
  END as status_display
FROM daily_history
WHERE date >= CURRENT_DATE - 10
ORDER BY date DESC;

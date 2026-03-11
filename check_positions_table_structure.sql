-- 检查 positions 表的结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'positions'
ORDER BY ordinal_position;

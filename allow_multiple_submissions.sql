-- 允许测试账号多次提交 - 累计模式
-- 移除唯一约束，允许同一用户同一天有多条记录

-- 1. 删除现有的唯一约束
ALTER TABLE status_records 
DROP CONSTRAINT IF EXISTS status_records_user_id_date_key;

-- 2. 添加新的索引（用于查询性能，但不强制唯一）
CREATE INDEX IF NOT EXISTS idx_status_records_user_date 
ON status_records(user_id, date);

-- 3. 添加提交时间戳索引（用于排序）
CREATE INDEX IF NOT EXISTS idx_status_records_submitted_at 
ON status_records(submitted_at);

-- 验证：查询测试用户的所有提交记录
SELECT 
  id,
  user_id,
  date,
  is_overtime,
  tag_id,
  overtime_hours,
  submitted_at
FROM status_records
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY submitted_at DESC;

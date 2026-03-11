-- ============================================
-- 修复 user_profiles 表问题
-- ============================================

-- 方案 1: 如果 user_profiles_backup 存在，将其重命名回 user_profiles
-- 注意：执行前请先运行 diagnose_user_profiles_table.sql 确认情况

-- 1.1 如果 user_profiles 表存在但为空，先删除它
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 1.2 将 user_profiles_backup 重命名为 user_profiles
ALTER TABLE IF EXISTS user_profiles_backup RENAME TO user_profiles;

-- 1.3 重新创建索引（如果需要）
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- 1.4 禁用 RLS（根据项目规范，当前使用自定义认证）
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 1.5 删除所有 RLS 策略
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow all inserts to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all selects from user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all updates to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all deletes from user_profiles" ON user_profiles;

-- 验证修复结果
SELECT 
  'user_profiles 表已修复' AS status,
  COUNT(*) AS record_count
FROM user_profiles;

-- 显示表结构
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

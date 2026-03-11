-- ============================================
-- 诊断 user_profiles 表问题
-- ============================================

-- 1. 检查所有与 user 相关的表
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%user%'
ORDER BY table_name;

-- 2. 检查 user_profiles 表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
) AS user_profiles_exists;

-- 3. 检查 user_profiles_backup 表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles_backup'
) AS user_profiles_backup_exists;

-- 4. 如果 user_profiles_backup 存在，查看其结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles_backup'
ORDER BY ordinal_position;

-- 5. 如果 user_profiles_backup 存在，查看数据
SELECT * FROM user_profiles_backup LIMIT 5;

-- 6. 检查 users 表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) AS users_table_exists;

-- 7. 如果 users 表存在，查看其结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

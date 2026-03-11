-- 为测试环境设置 RLS 策略
-- 此脚本创建宽松的 RLS 策略，允许测试账号正常使用所有功能

-- ============================================
-- 1. status_records 表 - 状态提交记录
-- ============================================

-- 删除现有策略
DROP POLICY IF EXISTS "Allow all inserts to status_records" ON status_records;
DROP POLICY IF EXISTS "Allow all selects from status_records" ON status_records;
DROP POLICY IF EXISTS "Allow all updates to status_records" ON status_records;
DROP POLICY IF EXISTS "Allow all deletes from status_records" ON status_records;

-- 创建新策略
CREATE POLICY "Allow all inserts to status_records"
ON status_records FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow all selects from status_records"
ON status_records FOR SELECT TO public USING (true);

CREATE POLICY "Allow all updates to status_records"
ON status_records FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all deletes from status_records"
ON status_records FOR DELETE TO public USING (true);

-- 启用 RLS
ALTER TABLE status_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. user_profiles 表 - 用户资料
-- ============================================

-- 删除现有策略
DROP POLICY IF EXISTS "Allow all inserts to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all selects from user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all updates to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all deletes from user_profiles" ON user_profiles;

-- 创建新策略
CREATE POLICY "Allow all inserts to user_profiles"
ON user_profiles FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow all selects from user_profiles"
ON user_profiles FOR SELECT TO public USING (true);

CREATE POLICY "Allow all updates to user_profiles"
ON user_profiles FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all deletes from user_profiles"
ON user_profiles FOR DELETE TO public USING (true);

-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. tags 表 - 标签
-- ============================================

-- 删除现有策略
DROP POLICY IF EXISTS "Allow all selects from tags" ON tags;
DROP POLICY IF EXISTS "Allow all inserts to tags" ON tags;
DROP POLICY IF EXISTS "Allow all updates to tags" ON tags;

-- 创建新策略（标签通常只需要读取权限）
CREATE POLICY "Allow all selects from tags"
ON tags FOR SELECT TO public USING (true);

CREATE POLICY "Allow all inserts to tags"
ON tags FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow all updates to tags"
ON tags FOR UPDATE TO public USING (true) WITH CHECK (true);

-- 启用 RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 验证策略
-- ============================================

-- 查看所有表的 RLS 策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('status_records', 'user_profiles', 'tags')
ORDER BY tablename, policyname;

-- 查看 RLS 启用状态
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('status_records', 'user_profiles', 'tags');

-- ============================================
-- 说明
-- ============================================

-- 这些是开发/测试环境的宽松策略，允许所有操作
-- 
-- 生产环境建议使用更严格的策略，例如：
--
-- CREATE POLICY "Users can insert their own status"
-- ON status_records FOR INSERT TO authenticated
-- WITH CHECK (auth.uid() = user_id);
--
-- CREATE POLICY "Users can view their own status"
-- ON status_records FOR SELECT TO authenticated
-- USING (auth.uid() = user_id);
--
-- 但在测试阶段，使用宽松策略可以避免权限问题

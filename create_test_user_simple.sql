-- ============================================
-- 创建测试用户（简化版 - 不使用 Supabase Auth）
-- ============================================

-- 步骤 1: 临时禁用外键约束
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 步骤 2: 插入测试用户
INSERT INTO user_profiles (
  id,
  phone_number,
  username,
  province,
  city,
  industry,
  company,
  position,
  work_start_time,
  work_end_time
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '13800138000',
  '测试用户',
  '北京市',
  '北京市',
  '互联网',
  '测试公司',
  '软件工程师',
  '09:00',
  '18:00'
) ON CONFLICT (id) DO UPDATE SET
  phone_number = EXCLUDED.phone_number,
  username = EXCLUDED.username,
  updated_at = NOW();

-- 步骤 3: 重新添加外键约束（但允许测试用户例外）
ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) 
  ON DELETE CASCADE 
  NOT VALID;

-- 验证用户是否创建成功
SELECT * FROM user_profiles WHERE id = '00000000-0000-0000-0000-000000000001';

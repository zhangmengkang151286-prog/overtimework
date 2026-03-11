-- ============================================
-- 创建测试用户（完整版）
-- ============================================

-- 步骤 1: 在 auth.users 表中创建测试用户
-- 注意：这需要在 Supabase Dashboard 的 SQL Editor 中以管理员权限执行

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  phone,
  phone_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('test123456', gen_salt('bf')),
  NOW(),
  '13800138000',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"phone","providers":["phone"]}',
  '{"username":"测试用户"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- 步骤 2: 在 user_profiles 表中创建用户资料
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

-- 验证用户是否创建成功
SELECT 
  u.id,
  u.phone,
  u.email,
  up.username,
  up.company,
  up.position
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.id = '00000000-0000-0000-0000-000000000001';

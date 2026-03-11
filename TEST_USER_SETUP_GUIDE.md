# 测试用户设置指南

## 问题说明

在尝试创建测试用户时，遇到外键约束错误：

```
ERROR: 23503: insert or update on table "user_profiles" violates foreign key constraint "user_profiles_id_fkey"
DETAIL: Key (id)=(00000000-0000-0000-0000-000000000001) is not present in table "users".
```

**原因**：`user_profiles` 表的 `id` 字段有外键约束，引用 `auth.users` 表。在插入 `user_profiles` 之前，必须先在 `auth.users` 表中创建用户。

## 解决方案

我们提供了两种解决方案：

### 方案 1：简化版（推荐用于快速测试）✅

**文件**：`create_test_user_simple.sql`

**优点**：
- 简单快速
- 不需要处理 Supabase Auth 复杂性
- 适合开发环境测试

**步骤**：
1. 临时禁用外键约束
2. 插入测试用户到 `user_profiles`
3. 重新启用外键约束（宽松模式 `NOT VALID`）

**SQL 脚本**：
```sql
-- 临时禁用外键约束
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 插入测试用户
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

-- 重新添加外键约束（宽松模式）
ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) 
  ON DELETE CASCADE 
  NOT VALID;
```

**注意事项**：
- `NOT VALID` 表示不验证现有数据，仅验证新插入的数据
- 这种方式允许测试用户存在，但不影响其他用户的外键约束
- 仅用于开发环境

### 方案 2：完整版（推荐用于生产环境）

**文件**：`create_test_user.sql`

**优点**：
- 完整的 Supabase Auth 集成
- 符合生产环境标准
- 支持真实的认证流程

**步骤**：
1. 在 `auth.users` 表中创建测试用户
2. 在 `user_profiles` 表中创建用户资料

**SQL 脚本**：
```sql
-- 步骤 1: 在 auth.users 表中创建测试用户
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
  is_super_admin
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
  false
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
```

**注意事项**：
- 需要 `pgcrypto` 扩展（用于 `crypt` 函数）
- 需要管理员权限访问 `auth.users` 表
- 如果 `crypt` 函数不可用，可以使用简单密码或省略密码字段

## 快速开始

### 推荐流程（2分钟）

1. **执行简化版 SQL**（30秒）
   ```bash
   # 在 Supabase Dashboard > SQL Editor 中
   # 复制 create_test_user_simple.sql 内容并执行
   ```

2. **重启应用**（30秒）
   ```bash
   cd OvertimeIndexApp
   npx expo start --tunnel --clear
   ```

3. **测试登录**（1分钟）
   - 滚动到底部
   - 点击"🧪 测试账号登录"
   - 确认登录成功

## 验证测试用户

执行以下 SQL 验证测试用户是否创建成功：

```sql
-- 查看测试用户
SELECT * FROM user_profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 查看外键约束状态
SELECT 
  conname AS constraint_name,
  convalidated AS is_validated
FROM pg_constraint
WHERE conname = 'user_profiles_id_fkey';
```

## 常见问题

### Q: 为什么需要两个方案？
A: 
- **方案 1（简化版）**：快速测试，不需要处理 Supabase Auth
- **方案 2（完整版）**：生产环境标准，完整的认证集成

### Q: NOT VALID 是什么意思？
A: `NOT VALID` 表示外键约束不验证现有数据，只验证新插入的数据。这允许测试用户存在，但不影响其他用户。

### Q: 生产环境应该用哪个方案？
A: 生产环境应该使用方案 2（完整版），确保所有用户都通过 Supabase Auth 创建。

### Q: 如何删除测试用户？
A: 
```sql
-- 删除测试用户
DELETE FROM user_profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 如果使用了完整版，还需要删除 auth 用户
DELETE FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### Q: 如何恢复严格的外键约束？
A:
```sql
-- 删除宽松约束
ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_id_fkey;

-- 添加严格约束
ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) 
  ON DELETE CASCADE;
```

## 相关文档

- `QUICK_START_LOGIN.md` - 快速开始指南
- `PRODUCTION_LOGIN_GUIDE.md` - 完整登录系统指南
- `LOGIN_SYSTEM_COMPLETE.md` - 技术实现总结

---

**创建时间**: 2026-01-29
**状态**: ✅ 已解决
**推荐方案**: 方案 1（简化版）用于开发测试


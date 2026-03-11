# 快速开始 - 登录测试

## 🚀 3步快速测试

### 步骤 1: 创建测试用户（1分钟）

**推荐方案：使用简化版脚本**

打开 Supabase Dashboard > SQL Editor，执行 `create_test_user_simple.sql`：

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

**说明**：
- 这个脚本会临时禁用外键约束，插入测试用户，然后重新启用（宽松模式）
- `NOT VALID` 表示不验证现有数据，仅验证新数据
- 这种方式适合开发环境快速测试

<details>
<summary>📋 方案 2：完整版（包含 Auth 用户）</summary>

如果你需要完整的 Supabase Auth 集成，使用 `create_test_user.sql`：

```sql
-- 在 auth.users 表中创建测试用户
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

-- 在 user_profiles 表中创建用户资料
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

</details>

### 步骤 2: 重启应用（30秒）

```bash
cd OvertimeIndexApp
npx expo start --tunnel --clear
```

### 步骤 3: 登录测试（10秒）

1. 应用启动后显示登录界面
2. 滚动到底部
3. 点击 **"🧪 测试账号登录"** 按钮
4. 看到"登录成功"提示
5. 点击"确定"进入主页

## ✅ 验证成功

登录成功后，你应该看到：
- 主页显示实时统计数据
- 顶部显示用户信息
- 可以点击"✍️ 提交今日状态"按钮

## 🎯 测试功能

### 测试准点下班
1. 点击"✍️ 提交今日状态"
2. 选择"准点下班"
3. 选择标签（如"任务完成"）
4. 提交成功

### 测试加班
1. 点击"✍️ 提交今日状态"
2. 选择"加班"
3. 选择标签（如"项目紧急"）
4. 选择加班时长
5. 提交成功

## 🔍 查看数据

在 Supabase SQL Editor 中：

```sql
-- 查看用户信息
SELECT * FROM user_profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 查看提交记录
SELECT * FROM status_records 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY date DESC;
```

## ⚠️ 常见问题

### Q: 外键约束错误 "violates foreign key constraint"
A: 这是因为 `user_profiles` 表引用了 `auth.users` 表。解决方案：
1. 使用完整的 SQL 脚本（包含 auth.users 插入）
2. 或者临时禁用外键约束（不推荐）

### Q: crypt 函数不存在？
A: 如果遇到 `crypt` 函数错误，使用简化版本：
```sql
-- 简化版：仅创建 user_profiles（需要先手动创建 auth 用户）
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

### Q: 看不到测试账号登录按钮？
A: 测试账号按钮仅在开发环境显示。确保应用运行在开发模式。

### Q: 点击登录后报错？
A: 检查：
1. 是否执行了 SQL 创建测试用户
2. 测试用户 ID 是否正确：`00000000-0000-0000-0000-000000000001`
3. Supabase 连接是否正常

### Q: 登录成功但没有跳转？
A: 检查控制台日志，可能是导航问题。尝试重启应用。

### Q: 提交状态失败？
A: 检查：
1. 是否已经提交过今天的状态（每天只能提交一次）
2. 网络连接是否正常
3. Supabase 数据库函数是否正确创建

## 🔄 重置测试

如果需要重新测试提交功能：

```sql
-- 删除今天的提交记录
DELETE FROM status_records 
WHERE user_id = '00000000-0000-0000-0000-000000000001' 
AND date = CURRENT_DATE;
```

## 📚 更多文档

- `PRODUCTION_LOGIN_GUIDE.md` - 完整的登录系统指南
- `LOGIN_SYSTEM_COMPLETE.md` - 技术实现总结
- `TEST_ACCOUNT_GUIDE.md` - 详细的测试指南

---

**总耗时**: 约 2 分钟
**状态**: ✅ 可用


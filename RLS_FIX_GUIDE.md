# RLS 权限错误修复指南

## 问题描述

提交状态时出现错误：
```
ERROR: new row violates row-level security policy for table "status_records"
```

同时还有 Redux 序列化警告：
```
A non-serializable value was detected in the state, in the path: `user.currentUser.createdAt`
```

## 解决方案

### 1. 修复 Redux 序列化警告 ✅

**已自动修复**：更新了 `src/store/index.ts`，添加了以下路径到忽略列表：
- `user.currentUser.createdAt`
- `user.currentUser.updatedAt`
- `user.userStatus.lastSubmission.timestamp`

### 2. 修复 RLS 权限错误

需要在 Supabase 中执行 SQL 脚本来设置正确的 RLS 策略。

#### 方法 1：快速修复（推荐用于测试）

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 允许所有用户插入状态记录（测试环境）
DROP POLICY IF EXISTS "Allow all inserts to status_records" ON status_records;

CREATE POLICY "Allow all inserts to status_records"
ON status_records FOR INSERT TO public WITH CHECK (true);

-- 允许所有用户查询状态记录
DROP POLICY IF EXISTS "Allow all selects from status_records" ON status_records;

CREATE POLICY "Allow all selects from status_records"
ON status_records FOR SELECT TO public USING (true);

-- 启用 RLS
ALTER TABLE status_records ENABLE ROW LEVEL SECURITY;
```

#### 方法 2：完整设置（推荐）

执行 `setup_rls_for_testing.sql` 文件，它会：
1. 为 `status_records` 表设置完整的 CRUD 策略
2. 为 `user_profiles` 表设置完整的 CRUD 策略
3. 为 `tags` 表设置读取策略
4. 验证所有策略是否正确创建

**步骤：**
1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `setup_rls_for_testing.sql` 的内容
4. 粘贴并执行
5. 查看执行结果，确认策略已创建

## 执行步骤

### Step 1: 重启应用（应用 Redux 修复）

```bash
# 清除缓存并重启
npx expo start --tunnel --clear
```

### Step 2: 执行 SQL 脚本

1. 登录 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 点击 "New query"
5. 复制 `setup_rls_for_testing.sql` 的全部内容
6. 粘贴到编辑器
7. 点击 "Run" 执行

### Step 3: 验证修复

1. 在应用中点击 "🧪 测试账号登录"
2. 登录成功后，点击 "✍️ 提交今日状态"
3. 选择 "准时下班" 或 "加班"
4. 选择标签并提交
5. 应该看到 "提交成功" 的提示

### Step 4: 验证数据

在 Supabase SQL Editor 中执行：

```sql
-- 查看提交的记录
SELECT * FROM status_records 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY date DESC;

-- 查看 RLS 策略
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'status_records';
```

## 为什么会出现这个问题？

### RLS (Row Level Security) 是什么？

RLS 是 PostgreSQL 的安全功能，用于控制哪些用户可以访问哪些行数据。

### 问题原因

1. Supabase 默认启用了 RLS
2. 但没有创建允许插入数据的策略
3. 测试账号是本地创建的，不在 `auth.users` 表中
4. 因此无法通过基于 `auth.uid()` 的策略

### 解决方案说明

我们创建了宽松的策略（`WITH CHECK (true)`），允许所有用户操作数据。这适合：
- 开发环境
- 测试环境
- 快速原型

**生产环境应该使用更严格的策略**，例如：

```sql
-- 生产环境策略示例
CREATE POLICY "Users can insert their own status"
ON status_records FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own status"
ON status_records FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

## 常见问题

### Q: 执行 SQL 后还是报错？

A: 尝试以下步骤：
1. 确认 SQL 执行成功（没有错误提示）
2. 重启应用：`npx expo start --clear`
3. 检查 Supabase 项目是否正确
4. 验证 `.env` 文件中的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`

### Q: 如何查看当前的 RLS 策略？

A: 在 SQL Editor 中执行：

```sql
SELECT * FROM pg_policies WHERE tablename = 'status_records';
```

### Q: 如何临时禁用 RLS（不推荐）？

A: 在 SQL Editor 中执行：

```sql
ALTER TABLE status_records DISABLE ROW LEVEL SECURITY;
```

**注意**：这会完全禁用安全检查，仅用于调试。

### Q: 生产环境如何配置 RLS？

A: 参考 `PRODUCTION_LOGIN_GUIDE.md` 中的 RLS 配置章节。

## 相关文件

- ✅ `src/store/index.ts` - Redux 配置（已修复序列化问题）
- 📄 `setup_rls_for_testing.sql` - 完整的 RLS 策略设置
- 📄 `fix_rls_policies.sql` - 快速修复脚本
- 📄 `PRODUCTION_LOGIN_GUIDE.md` - 生产环境配置指南

## 下一步

修复完成后，你应该能够：
1. ✅ 使用测试账号登录
2. ✅ 提交准时下班状态
3. ✅ 提交加班状态
4. ✅ 查看提交的数据
5. ✅ 没有 Redux 序列化警告

如果还有问题，请检查：
- Supabase 连接是否正常
- `.env` 配置是否正确
- SQL 脚本是否执行成功
- 应用是否已重启

---

**状态**：✅ Redux 修复已完成，等待执行 SQL 脚本
**更新时间**：2026-01-30

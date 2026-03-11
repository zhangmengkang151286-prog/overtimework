# 快速修复 RLS 权限错误

## 问题
提交状态时报错：`new row violates row-level security policy for table "status_records"`

## 解决方案（2 步）

### 第 1 步：执行 SQL 脚本

在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL：

```sql
-- 允许插入状态记录
DROP POLICY IF EXISTS "Allow all inserts to status_records" ON status_records;
CREATE POLICY "Allow all inserts to status_records"
ON status_records FOR INSERT TO public WITH CHECK (true);

-- 允许查询状态记录
DROP POLICY IF EXISTS "Allow all selects from status_records" ON status_records;
CREATE POLICY "Allow all selects from status_records"
ON status_records FOR SELECT TO public USING (true);

-- 启用 RLS
ALTER TABLE status_records ENABLE ROW LEVEL SECURITY;
```

### 第 2 步：重启应用

```bash
npx expo start --tunnel --clear
```

## 测试

1. 点击 "🧪 测试账号登录"
2. 点击 "✍️ 提交今日状态"
3. 选择标签并提交
4. 应该成功！✅

## 说明

- ✅ Redux 序列化问题已自动修复
- ⏳ 需要手动执行 SQL 脚本修复 RLS 权限
- 这是测试环境的宽松策略
- 生产环境需要更严格的策略

详细说明见：`RLS_FIX_GUIDE.md`

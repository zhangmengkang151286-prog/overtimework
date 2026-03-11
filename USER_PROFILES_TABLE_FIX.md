# user_profiles 表修复指南

## 问题描述

应用报错：
```
ERROR  Supabase Error: {"code": "PGRST205", "details": null, "hint": "Perhaps you meant the table 'public.user_profiles_backup'", "message": "Could not find the table 'public.user_profiles' in the schema cache"}
```

同时还有 React Hooks 错误：
```
ERROR  [Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.]
```

## 问题原因

1. **数据库表问题**: `user_profiles` 表不存在，可能被重命名为 `user_profiles_backup`
2. **React Hooks 顺序错误**: `posterTypes` 在 `useMemo` 定义之前被 `useCallback` 使用

## 修复步骤

### 步骤 1: 修复 React Hooks 错误 ✅

已修复 `SharePosterScreen.tsx` 中的 Hook 顺序问题：
- 将 `posterTypes` 的 `useMemo` 定义移到 `useCallback` 之前
- 确保所有 Hooks 按正确顺序调用

### 步骤 2: 诊断数据库表问题

在 Supabase SQL Editor 中执行：

```bash
# 文件位置
OvertimeIndexApp/diagnose_user_profiles_table.sql
```

这个脚本会检查：
- 所有与 user 相关的表
- `user_profiles` 表是否存在
- `user_profiles_backup` 表是否存在
- 表结构和数据

### 步骤 3: 修复数据库表

根据诊断结果，在 Supabase SQL Editor 中执行：

```bash
# 文件位置
OvertimeIndexApp/fix_user_profiles_table.sql
```

这个脚本会：
1. 删除空的 `user_profiles` 表（如果存在）
2. 将 `user_profiles_backup` 重命名为 `user_profiles`
3. 重新创建索引
4. 禁用 RLS（根据项目规范）
5. 删除所有 RLS 策略

### 步骤 4: 验证修复

1. 在 Supabase SQL Editor 中执行：
```sql
-- 检查表是否存在
SELECT * FROM user_profiles LIMIT 5;

-- 检查表结构
\d user_profiles
```

2. 重启 Expo 应用：
```bash
# 清除缓存并重启
npx expo start --clear
```

3. 测试分享海报功能

## 预期结果

修复后应该：
1. ✅ 不再出现 "Rendered fewer hooks than expected" 错误
2. ✅ 不再出现 "Could not find the table 'public.user_profiles'" 错误
3. ✅ 分享海报功能正常工作
4. ✅ 用户信息正常显示

## 如果问题仍然存在

### 方案 A: 使用 users 表替代

如果 `user_profiles_backup` 也不存在，但 `users` 表存在，可以修改代码使用 `users` 表：

```typescript
// 在 supabaseService.ts 中
async getUser(userId: string): Promise<User | null> {
  try {
    const {data, error} = await supabase
      .from('users')  // 改为 users
      .select('*')
      .eq('id', userId)
      .single();
    // ...
  }
}
```

### 方案 B: 重新创建 user_profiles 表

如果所有表都不存在，执行完整的数据库初始化：

```bash
# 文件位置
OvertimeIndexApp/supabase_init.sql
```

## 注意事项

1. **备份数据**: 执行 SQL 脚本前，请确保已备份重要数据
2. **RLS 策略**: 项目使用自定义认证，已禁用 RLS
3. **索引**: 修复脚本会重新创建必要的索引
4. **缓存**: 修复后务必清除 Expo 缓存

## 相关文件

- `OvertimeIndexApp/src/screens/SharePosterScreen.tsx` - 已修复 Hooks 错误
- `OvertimeIndexApp/src/services/supabaseService.ts` - 查询 user_profiles 表
- `OvertimeIndexApp/src/services/posterData.ts` - 使用 supabaseService.getUser()
- `OvertimeIndexApp/diagnose_user_profiles_table.sql` - 诊断脚本
- `OvertimeIndexApp/fix_user_profiles_table.sql` - 修复脚本

## 最后更新

2026-02-23

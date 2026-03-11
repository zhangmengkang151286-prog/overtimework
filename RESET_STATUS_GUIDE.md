# 重置今日提交状态指南

## 问题

点击"提交今日状态"按钮后，按钮变灰色显示"✅ 今日状态已提交"，但实际上提交失败了（因为 RLS 权限错误）。

## 原因

应用在提交前就将状态保存到了本地存储，即使提交失败，本地仍然认为今天已经提交过了。

## 解决方案

### 方法 1：长按重置（推荐）✅

1. 在应用中看到 "✅ 今日状态已提交" 提示
2. **长按这个提示 2 秒**
3. 会弹出确认对话框："确定要重置今日提交状态吗？"
4. 点击"确定"
5. 状态重置成功，"✍️ 提交今日状态" 按钮会重新出现

### 方法 2：重启应用并清除缓存

```bash
# 停止应用
# 按 Ctrl+C 停止 Expo

# 清除缓存并重启
npx expo start --tunnel --clear
```

然后在应用中：
1. 退出登录（如果已登录）
2. 重新登录
3. 按钮应该会重新出现

### 方法 3：手动清除本地存储（高级）

如果上述方法都不行，可以在 React Native Debugger 的 Console 中执行：

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 清除用户状态
await AsyncStorage.removeItem('@OvertimeIndexApp:userStatus');
await AsyncStorage.removeItem('@OvertimeIndexApp:lastResetDate');

console.log('状态已清除，请重启应用');
```

## 完整修复流程

### 第 1 步：重置本地状态

使用**方法 1**（长按重置）清除本地的"已提交"状态。

### 第 2 步：修复 RLS 权限

在 Supabase Dashboard 的 SQL Editor 中执行：

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

### 第 3 步：重新提交

1. 在应用中点击 "✍️ 提交今日状态"
2. 选择标签
3. 提交
4. 应该成功！✅

## 验证成功

提交成功后，在 Supabase SQL Editor 中查询：

```sql
SELECT * FROM status_records 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY date DESC
LIMIT 5;
```

应该能看到刚才提交的记录。

## 代码改进

已添加以下功能：

1. ✅ **长按重置功能**：长按"今日状态已提交"提示 2 秒可重置状态
2. ✅ **forceResetTodayStatus 方法**：在 `useUserStatus` Hook 中添加了强制重置方法
3. ✅ **用户友好提示**：显示"(长按2秒可重置)"提示

## 相关文件

- ✅ `src/hooks/useUserStatus.ts` - 添加了 `forceResetTodayStatus` 方法
- ✅ `src/screens/TrendPage.tsx` - 添加了长按重置功能
- 📄 `clear_local_status.js` - 手动清除脚本（备用）
- 📄 `QUICK_FIX_RLS.md` - RLS 权限修复指南
- 📄 `RLS_FIX_GUIDE.md` - 详细的 RLS 修复说明

## 下一步

1. **立即操作**：长按"今日状态已提交"提示 2 秒，重置状态
2. **修复 RLS**：执行 SQL 脚本修复数据库权限
3. **重新提交**：测试状态提交功能
4. **验证数据**：在 Supabase 中查看提交的记录

---

**状态**：✅ 重置功能已添加，可以立即使用
**更新时间**：2026-01-30

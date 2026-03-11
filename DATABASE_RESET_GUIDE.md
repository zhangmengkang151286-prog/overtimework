# 数据库重置完整指南

## 🎯 目标
解决数据库表结构不匹配问题(INTEGER ID vs UUID ID)

## ⚠️ 重要提醒
**执行此操作将删除所有现有数据!** 如果有重要数据,请先备份。

---

## 📋 步骤 1: 配置环境变量

### 1.1 获取 Supabase 凭证
1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目: `mnwtjmsoayqtwmlffobf`
3. 进入 **Settings** > **API**
4. 复制以下信息:
   - **Project URL**: 已配置 ✅
   - **anon public key**: 需要复制 ⚠️

### 1.2 更新 .env 文件
打开 `OvertimeIndexApp/.env`,替换 `SUPABASE_ANON_KEY` 的值:

```env
SUPABASE_URL=https://mnwtjmsoayqtwmlffobf.supabase.co
SUPABASE_ANON_KEY=你的真实anon_key
```

---

## 📋 步骤 2: 执行数据库重置脚本

### 2.1 打开 Supabase SQL Editor
1. 在 Supabase Dashboard 中,点击左侧菜单的 **SQL Editor**
2. 点击 **New query** 创建新查询

### 2.2 执行重置脚本
1. 打开本地文件 `OvertimeIndexApp/supabase_reset_and_init.sql`
2. 复制全部内容
3. 粘贴到 Supabase SQL Editor
4. 点击 **Run** 按钮执行

### 2.3 验证执行结果
执行成功后,你应该看到:
```
✅ 数据库重置并初始化完成！
已创建的表：
  ✓ user_profiles
  ✓ tags
  ✓ status_records
  ✓ daily_history

已创建的函数：
  ✓ get_real_time_stats()
  ✓ get_top_tags()
  ✓ get_daily_status()

已插入 20 个测试标签
```

---

## 📋 步骤 3: 修复应用代码

### 3.1 问题说明
当前代码引用了 `users` 表,但新架构使用 `user_profiles` 表(扩展 Supabase Auth 的 `auth.users`)

### 3.2 需要修改的文件
- `src/services/supabaseService.ts` - 将所有 `users` 表引用改为 `user_profiles`
- `src/services/authService.ts` - 更新用户创建和查询逻辑

**注意**: 这些修改将在下一步自动完成

---

## 📋 步骤 4: 重启应用

### 4.1 清除缓存并重启
```bash
cd OvertimeIndexApp
npx expo start --tunnel --clear
```

### 4.2 验证应用启动
应用应该能够:
- ✅ 成功连接到 Supabase
- ✅ 加载标签列表(20个测试标签)
- ✅ 调用数据库函数(get_real_time_stats, get_top_tags, get_daily_status)
- ✅ 没有数据库错误

---

## 🔍 常见问题

### Q1: 执行 SQL 脚本时报错 "permission denied"
**解决**: 确保你是项目的 Owner 或有足够权限

### Q2: 应用仍然报错 "relation does not exist"
**解决**: 
1. 确认 SQL 脚本执行成功
2. 检查 `.env` 文件中的 URL 是否正确
3. 重启 Expo 并清除缓存

### Q3: 函数调用失败 "function not found"
**解决**: 
1. 在 SQL Editor 中运行: `SELECT * FROM get_real_time_stats();`
2. 如果失败,重新执行 `supabase_reset_and_init.sql`

---

## ✅ 完成检查清单

- [ ] 已更新 `.env` 文件中的 `SUPABASE_ANON_KEY`
- [ ] 已在 Supabase SQL Editor 中执行 `supabase_reset_and_init.sql`
- [ ] 看到成功消息(20个标签已插入)
- [ ] 已修复应用代码(users → user_profiles)
- [ ] 已重启 Expo 并清除缓存
- [ ] 应用启动无数据库错误

---

## 📞 下一步

完成上述步骤后,请告诉我:
1. SQL 脚本执行结果(成功/失败)
2. 应用启动后是否还有错误
3. 如果有错误,请提供完整的错误信息

我会根据你的反馈继续协助解决问题。

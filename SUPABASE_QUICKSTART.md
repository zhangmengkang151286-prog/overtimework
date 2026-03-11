# Supabase 快速开始指南

## 🚀 5 分钟快速集成

### 步骤 1：执行数据库初始化脚本

1. 访问 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目（mnwtjmsoayqtwmlffobf）
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New Query**
5. 复制 `supabase_init.sql` 文件的全部内容
6. 粘贴到 SQL Editor 中
7. 点击 **Run** 执行

**预期结果：**
- 创建 4 个表：users, tags, status_records, daily_history
- 创建 2 个物化视图：real_time_stats, tag_stats
- 创建 5 个函数
- 插入 15 个测试标签
- 配置 RLS 安全策略

### 步骤 2：获取 API 密钥

1. 在 Supabase Dashboard 中，点击左侧的 **Settings**
2. 点击 **API**
3. 找到以下信息：
   - **Project URL**: `https://mnwtjmsoayqtwmlffobf.supabase.co`
   - **anon public key**: 复制这个密钥

### 步骤 3：配置环境变量

编辑 `.env` 文件，替换 ANON_KEY：

```env
SUPABASE_URL=https://mnwtjmsoayqtwmlffobf.supabase.co
SUPABASE_ANON_KEY=你复制的_anon_public_key
```

### 步骤 4：安装 Supabase 客户端

```bash
cd OvertimeIndexApp
npm install @supabase/supabase-js
npm install react-native-url-polyfill
```

### 步骤 5：启用 Realtime（可选但推荐）

1. 在 Supabase Dashboard 中，点击 **Database**
2. 点击 **Replication**
3. 找到以下表并启用 Realtime：
   - ✅ status_records
   - ✅ tags
   - ✅ users

### 步骤 6：测试数据库连接

在 SQL Editor 中运行以下查询测试：

```sql
-- 查看所有标签
SELECT * FROM tags;

-- 测试实时统计函数
SELECT * FROM get_real_time_stats();

-- 查看过去 7 天的状态
SELECT * FROM get_daily_status(7);
```

## 📝 下一步：开始编码

现在你可以开始实施任务了！建议顺序：

### 任务 16.1：创建 Supabase 服务层 ⭐ 从这里开始

创建 `src/services/supabase.ts` 文件来初始化 Supabase 客户端。

我可以帮你完成这个任务，只需告诉我："开始任务 16.1"

### 任务 16.2：实现认证集成

集成 Supabase Auth 进行用户认证。

### 任务 16.3：实现数据 CRUD

迁移现有的数据操作到 Supabase。

### 任务 16.4：实现实时订阅

配置实时数据更新。

## 🔍 验证清单

完成上述步骤后，检查：

- [ ] SQL 脚本执行成功，没有错误
- [ ] 在 Table Editor 中可以看到 4 个表
- [ ] tags 表中有 15 条测试数据
- [ ] 获取到了 SUPABASE_ANON_KEY
- [ ] .env 文件配置正确
- [ ] 安装了 @supabase/supabase-js

## ⚠️ 常见问题

### Q: SQL 脚本执行失败？
A: 检查是否有权限问题。确保使用的是项目所有者账号。

### Q: 找不到 pg_cron 扩展？
A: pg_cron 需要在 Supabase 的付费计划中启用。免费计划可以跳过定时任务部分。

### Q: RLS 策略导致无法访问数据？
A: 开发阶段可以临时禁用 RLS：
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_records DISABLE ROW LEVEL SECURITY;
```
生产环境必须启用 RLS！

## 📞 需要帮助？

如果遇到问题，告诉我：
- "数据库初始化失败"
- "无法获取 API 密钥"
- "开始任务 16.1"（我会帮你创建 Supabase 客户端）

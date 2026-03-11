# Supabase 配置说明

## 🔑 获取 API 密钥

### 步骤 1：登录 Supabase Dashboard

访问：https://supabase.com/dashboard

### 步骤 2：选择你的项目

项目名称：mnwtjmsoayqtwmlffobf

### 步骤 3：获取 API 密钥

1. 点击左侧菜单的 **Settings** (设置图标)
2. 点击 **API**
3. 你会看到以下信息：

```
Project URL
https://mnwtjmsoayqtwmlffobf.supabase.co

API Keys
┌─────────────────────────────────────────┐
│ anon public                             │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
│ [复制这个密钥]                           │
└─────────────────────────────────────────┘

service_role secret
[不要在客户端使用这个密钥]
```

### 步骤 4：更新代码

打开文件：`src/services/supabase.ts`

找到这一行：

```typescript
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud3RqbXNvYXlxdHdtbGZmb2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NjU5NzAsImV4cCI6MjA1MzU0MTk3MH0.placeholder';
```

替换为你从 Dashboard 复制的 `anon public` 密钥：

```typescript
const SUPABASE_ANON_KEY = '你复制的完整密钥';
```

## ✅ 验证配置

### 方法 1：运行测试

```bash
cd OvertimeIndexApp
npm test -- src/services/__tests__/supabase.test.ts
```

如果配置正确，你应该看到测试通过。

### 方法 2：在应用中测试

在任何组件中添加：

```typescript
import {checkConnection} from './services/supabase';
import {supabaseService} from './services/supabaseService';

// 测试连接
const testConnection = async () => {
  const isConnected = await checkConnection();
  console.log('Supabase connected:', isConnected);
  
  // 测试获取标签
  const tags = await supabaseService.getTags();
  console.log('Tags:', tags);
};

testConnection();
```

## 🔒 安全注意事项

### ✅ 可以做的：

- ✅ 在客户端代码中使用 `anon public` 密钥
- ✅ 将 `anon public` 密钥提交到 git（它是公开的）
- ✅ 在 React Native 应用中直接使用

### ❌ 不要做的：

- ❌ 不要在客户端使用 `service_role` 密钥
- ❌ 不要禁用 Row Level Security (RLS)
- ❌ 不要在生产环境中暴露数据库密码

## 🎯 下一步

配置完成后，你可以：

1. **测试连接**：运行测试确保一切正常
2. **开始任务 16.2**：实现 Supabase 认证集成
3. **开始任务 16.3**：迁移现有 API 调用到 Supabase

## 📞 遇到问题？

### 问题：测试失败，显示 "Invalid API key"

**解决方案：**
- 确保复制了完整的 `anon public` 密钥
- 检查密钥中没有多余的空格或换行符
- 确保使用的是 `anon public` 而不是 `service_role`

### 问题：连接超时

**解决方案：**
- 检查网络连接
- 确认 Supabase 项目状态正常
- 检查防火墙设置

### 问题：权限错误 "Row Level Security"

**解决方案：**
- 确保已执行 `supabase_init.sql` 脚本
- 检查 RLS 策略是否正确配置
- 在开发阶段可以临时禁用 RLS（不推荐）

## 📚 相关文档

- [Supabase 文档](https://supabase.com/docs)
- [Supabase JS 客户端](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

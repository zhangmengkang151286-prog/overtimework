# 移除 Supabase SDK 迁移指南

## 📋 迁移概述

将前端从 Supabase SDK 迁移到直接使用 fetch 调用 PostgREST API。

**优点：**
- ✅ 不需要配置 JWT secret
- ✅ 更轻量级，减少依赖
- ✅ 完全控制 API 请求
- ✅ 更容易调试和定制

**缺点：**
- ❌ 失去 Realtime 功能（需要自己实现轮询）
- ❌ 需要手动处理错误和重试
- ❌ 需要重写所有数据库调用代码

---

## 🎯 迁移步骤

### 步骤 1：创建新的 API 服务层

已创建以下文件：

1. **`src/services/postgrestApi.ts`** - PostgREST API 基础封装
   - `get()` - GET 请求
   - `post()` - POST 请求
   - `patch()` - PATCH 请求
   - `del()` - DELETE 请求
   - `rpc()` - RPC 调用（数据库函数）

2. **`src/services/dataService.ts`** - 数据服务层
   - 用户相关：`getUserByPhone()`, `createUser()`, `updateUser()`
   - 标签相关：`getTags()`, `getTopTags()`
   - 状态记录：`submitUserStatus()`, `getUserTodayStatus()`
   - 实时统计：`getRealTimeStats()`, `getDailyStatus()`

### 步骤 2：更新现有服务文件

需要修改以下文件，将 Supabase SDK 调用替换为新的 API：

#### 2.1 `src/services/supabaseService.ts`

**原代码：**
```typescript
import {supabase} from './supabase';

export async function getTags() {
  const {data, error} = await supabase
    .from('tags')
    .select('*')
    .eq('is_active', true)
    .order('usage_count', {ascending: false});
  
  if (error) throw error;
  return data;
}
```

**新代码：**
```typescript
import {dataService} from './dataService';

export async function getTags() {
  return await dataService.getTags();
}
```

#### 2.2 `src/services/enhanced-auth/AuthService.ts`

**原代码：**
```typescript
import {supabase} from '../supabase';

const {data, error} = await supabase
  .from('users')
  .select('*')
  .eq('phone_number', phoneNumber)
  .single();
```

**新代码：**
```typescript
import {dataService} from '../dataService';

const user = await dataService.getUserByPhone(phoneNumber);
```

#### 2.3 `src/services/enhanced-auth/ProfileService.ts`

**原代码：**
```typescript
import {supabase} from '../supabase';

const {data, error} = await supabase
  .from('user_profiles')
  .update(updates)
  .eq('id', userId);
```

**新代码：**
```typescript
import {dataService} from '../dataService';

await dataService.updateUserProfile(userId, updates);
```

### 步骤 3：处理 Realtime 功能

Supabase SDK 的 Realtime 功能需要替换为轮询：

**原代码（`src/services/supabaseRealtimeService.ts`）：**
```typescript
const channel = supabase
  .channel('realtime-stats')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'status_records'
  }, handleChange)
  .subscribe();
```

**新代码（轮询方式）：**
```typescript
import {dataService} from './dataService';

// 每 5 秒轮询一次
const pollInterval = setInterval(async () => {
  try {
    const stats = await dataService.getRealTimeStats();
    // 更新状态
    updateStats(stats);
  } catch (error) {
    console.error('Poll error:', error);
  }
}, 5000);

// 清理
const cleanup = () => {
  clearInterval(pollInterval);
};
```

### 步骤 4：更新环境变量

**`.env` 文件：**
```env
# PostgREST API 地址（不需要 JWT secret）
SUPABASE_URL=http://121.89.95.95/api

# 不再需要 SUPABASE_ANON_KEY
```

### 步骤 5：卸载 Supabase SDK

```bash
cd OvertimeIndexApp
npm uninstall @supabase/supabase-js
```

---

## 📝 需要修改的文件列表

### 核心服务文件（必须修改）

1. ✅ `src/services/postgrestApi.ts` - 已创建
2. ✅ `src/services/dataService.ts` - 已创建
3. ⏳ `src/services/supabaseService.ts` - 需要重写
4. ⏳ `src/services/supabaseRealtimeService.ts` - 需要重写（改为轮询）
5. ⏳ `src/services/supabaseHistoricalService.ts` - 需要重写
6. ⏳ `src/services/offlineQueueService.ts` - 需要更新导入
7. ⏳ `src/services/hourlySnapshotService.ts` - 需要更新
8. ⏳ `src/services/posterData.ts` - 需要更新

### 认证相关文件

9. ⏳ `src/services/enhanced-auth/AuthService.ts` - 需要更新
10. ⏳ `src/services/enhanced-auth/ProfileService.ts` - 需要更新
11. ⏳ `src/services/enhanced-auth/SMSCodeService.ts` - 需要更新
12. ⏳ `src/services/enhanced-auth/OptionsDataService.ts` - 需要更新

### Hooks 文件

13. ⏳ `src/hooks/useUserStatus.ts` - 需要更新
14. ⏳ `src/hooks/useHistoricalData.ts` - 需要更新
15. ⏳ `src/hooks/useAuth.ts` - 需要更新

### 测试文件

16. ⏳ `src/services/__tests__/supabase.test.ts` - 需要重写
17. ⏳ `src/services/__tests__/posterData.test.ts` - 需要更新

---

## 🚀 快速开始

### 方案 A：逐步迁移（推荐）

逐个文件迁移，确保每个文件都能正常工作。

**步骤：**
1. 先迁移 `supabaseService.ts`
2. 测试基本功能（获取标签、提交状态）
3. 再迁移认证相关文件
4. 最后迁移 Realtime 功能

### 方案 B：一次性迁移

一次性修改所有文件，然后统一测试。

**风险：** 如果出现问题，难以定位

---

## 📊 API 对照表

### Supabase SDK vs PostgREST API

| Supabase SDK | PostgREST API |
|--------------|---------------|
| `supabase.from('users').select('*')` | `get('/users')` |
| `supabase.from('users').insert(data)` | `post('/users', data)` |
| `supabase.from('users').update(data).eq('id', id)` | `patch('/users?id=eq.${id}', data)` |
| `supabase.from('users').delete().eq('id', id)` | `del('/users', {id})` |
| `supabase.rpc('function_name', params)` | `rpc('function_name', params)` |

### 查询参数

| Supabase SDK | PostgREST API |
|--------------|---------------|
| `.eq('field', value)` | `?field=eq.${value}` |
| `.gt('field', value)` | `?field=gt.${value}` |
| `.gte('field', value)` | `?field=gte.${value}` |
| `.lt('field', value)` | `?field=lt.${value}` |
| `.lte('field', value)` | `?field=lte.${value}` |
| `.like('field', pattern)` | `?field=like.${pattern}` |
| `.order('field', {ascending: false})` | `?order=field.desc` |
| `.limit(10)` | `?limit=10` |

---

## 🔍 测试清单

迁移完成后，需要测试以下功能：

### 基本功能
- [ ] 获取标签列表
- [ ] 提交用户状态
- [ ] 获取实时统计数据
- [ ] 获取每日状态历史

### 认证功能
- [ ] 手机号登录
- [ ] 短信验证码
- [ ] 用户注册
- [ ] 完善资料

### 数据展示
- [ ] 趋势页面数据加载
- [ ] 我的页面数据加载
- [ ] 标签排行榜
- [ ] 历史数据查询

### 性能测试
- [ ] 首次加载速度
- [ ] 数据刷新速度
- [ ] 离线队列功能
- [ ] 错误处理

---

## ⚠️ 注意事项

### 1. Realtime 功能的替代方案

**选项 A：轮询（推荐）**
- 每 5-10 秒请求一次数据
- 简单可靠
- 适合大多数场景

**选项 B：WebSocket**
- 需要在 ECS 上部署 WebSocket 服务
- 实时性更好
- 实现复杂

**选项 C：Server-Sent Events (SSE)**
- PostgREST 不支持 SSE
- 需要额外的服务

### 2. 错误处理

新的 API 服务已经包含了错误处理：

```typescript
try {
  const data = await dataService.getTags();
} catch (error) {
  // error 已经是友好的错误信息
  console.error(error.message);
}
```

### 3. 离线支持

离线队列功能需要更新，但逻辑保持不变：

```typescript
// 原代码
await supabaseService.submitUserStatus(submission);

// 新代码
await dataService.submitUserStatus(submission);
```

### 4. 类型定义

保持现有的类型定义不变（`src/types/index.ts`），只需要更新服务层的实现。

---

## 🆘 常见问题

### Q1: 迁移后性能会变差吗？

**A:** 不会。直接使用 fetch 调用 API 反而更快，因为：
- 减少了 SDK 的中间层
- 更少的依赖
- 更小的打包体积

### Q2: 如何处理 Realtime 功能？

**A:** 使用轮询替代：
- 对于实时统计数据，每 5 秒轮询一次
- 对于用户状态，提交后立即刷新
- 对于历史数据，进入页面时加载

### Q3: 迁移需要多长时间？

**A:** 
- 逐步迁移：2-3 小时
- 一次性迁移：1 小时（但风险较高）

### Q4: 如果迁移失败怎么办？

**A:** 
1. 保留原有的 `supabase.ts` 文件作为备份
2. 使用 Git 版本控制，随时可以回滚
3. 逐步迁移，每个文件都测试通过后再继续

---

## 📚 相关文档

- `src/services/postgrestApi.ts` - PostgREST API 基础封装
- `src/services/dataService.ts` - 数据服务层
- `PostgREST 官方文档` - https://postgrest.org/

---

**准备好开始迁移了吗？**

建议从 `supabaseService.ts` 开始，这是最核心的服务文件。

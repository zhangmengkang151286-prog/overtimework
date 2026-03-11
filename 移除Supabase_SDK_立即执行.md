# 🚀 移除 Supabase SDK - 立即执行指南

## 当前状态

- ✅ 已创建 `src/services/postgrestApi.ts` - PostgREST API 基础封装
- ✅ 已创建 `src/services/dataService.ts` - 数据服务层
- ⏳ 需要更新现有服务文件

---

## 立即执行（3 个步骤）

### 步骤 1：备份现有文件

```bash
cd OvertimeIndexApp

# 创建备份目录
mkdir -p .backup/services

# 备份核心服务文件
cp src/services/supabase.ts .backup/services/
cp src/services/supabaseService.ts .backup/services/
cp src/services/supabaseRealtimeService.ts .backup/services/
cp src/services/supabaseHistoricalService.ts .backup/services/
```

### 步骤 2：更新 `.env` 文件

```bash
# 编辑 .env 文件
# 将 SUPABASE_ANON_KEY 改为注释（不再需要）

# 修改后的 .env：
# SUPABASE_URL=http://121.89.95.95/api
# # SUPABASE_ANON_KEY=dummy-key  # 不再需要
```

### 步骤 3：测试新的 API 服务

```bash
# 启动开发服务器
npx expo start --clear
```

在手机上测试：
1. 打开 Expo Go
2. 扫描二维码
3. 查看控制台日志

**预期结果：**
- ✅ 不再出现 "Server lacks JWT secret" 错误
- ✅ 能正常加载标签列表
- ✅ 数据正常显示

---

## 🎯 核心文件迁移优先级

### 优先级 1：核心数据服务（必须立即迁移）

#### 1.1 更新 `src/services/supabaseService.ts`

这是最核心的服务文件，所有其他文件都依赖它。

**需要做的修改：**
1. 移除 `import {supabase} from './supabase'`
2. 添加 `import {dataService} from './dataService'`
3. 将所有 Supabase SDK 调用替换为 `dataService` 调用

**示例：**

```typescript
// 原代码
export async function getTags(): Promise<Tag[]> {
  const {data, error} = await supabase
    .from('tags')
    .select('*')
    .eq('is_active', true)
    .order('usage_count', {ascending: false});
  
  if (error) throw handleSupabaseError(error);
  return data || [];
}

// 新代码
export async function getTags(): Promise<Tag[]> {
  return await dataService.getTags();
}
```

#### 1.2 更新 `src/services/supabaseRealtimeService.ts`

将 Realtime 订阅改为轮询。

**需要做的修改：**
1. 移除 Supabase Realtime 相关代码
2. 使用 `setInterval` 实现轮询
3. 每 5 秒调用一次 `dataService.getRealTimeStats()`

**示例：**

```typescript
// 原代码
const channel = supabase
  .channel('realtime-stats')
  .on('postgres_changes', {...}, handleChange)
  .subscribe();

// 新代码
let pollInterval: NodeJS.Timeout | null = null;

export function startRealtimePolling(callback: (data: RealTimeStats) => void) {
  if (pollInterval) {
    clearInterval(pollInterval);
  }

  // 立即执行一次
  fetchAndUpdate(callback);

  // 每 5 秒轮询一次
  pollInterval = setInterval(() => {
    fetchAndUpdate(callback);
  }, 5000);
}

async function fetchAndUpdate(callback: (data: RealTimeStats) => void) {
  try {
    const stats = await dataService.getRealTimeStats();
    callback(stats);
  } catch (error) {
    console.error('Realtime poll error:', error);
  }
}

export function stopRealtimePolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
```

### 优先级 2：认证服务（重要）

#### 2.1 更新 `src/services/enhanced-auth/AuthService.ts`

**需要做的修改：**
1. 移除 `import {supabase} from '../supabase'`
2. 添加 `import {dataService} from '../dataService'`
3. 替换所有数据库调用

**示例：**

```typescript
// 原代码
const {data, error} = await supabase
  .from('users')
  .select('*')
  .eq('phone_number', phoneNumber)
  .single();

// 新代码
const user = await dataService.getUserByPhone(phoneNumber);
```

#### 2.2 更新 `src/services/enhanced-auth/ProfileService.ts`

**需要做的修改：**
1. 移除 `import {supabase} from '../supabase'`
2. 添加 `import {dataService} from '../dataService'`
3. 替换所有数据库调用

### 优先级 3：其他服务（可以稍后迁移）

- `src/services/supabaseHistoricalService.ts`
- `src/services/offlineQueueService.ts`
- `src/services/hourlySnapshotService.ts`
- `src/services/posterData.ts`

---

## 🔧 快速修复脚本

我会为你创建一个自动化脚本，帮助你快速完成迁移。

**脚本功能：**
1. 自动备份现有文件
2. 自动替换导入语句
3. 自动更新 API 调用
4. 生成迁移报告

---

## ✅ 验证迁移成功

### 1. 编译检查

```bash
cd OvertimeIndexApp
npx tsc --noEmit
```

**预期结果：** 没有类型错误

### 2. 启动应用

```bash
npx expo start --clear
```

**预期结果：** 应用正常启动，没有导入错误

### 3. 功能测试

在手机上测试以下功能：

- [ ] 登录/注册
- [ ] 获取标签列表
- [ ] 提交用户状态
- [ ] 查看实时统计
- [ ] 查看历史数据
- [ ] 我的页面数据加载

### 4. 控制台检查

**不应该看到：**
- ❌ "Server lacks JWT secret"
- ❌ Supabase SDK 相关错误
- ❌ 导入错误

**应该看到：**
- ✅ API 请求成功
- ✅ 数据正常加载
- ✅ 没有错误日志

---

## 🆘 如果遇到问题

### 问题 1：导入错误

**错误信息：** `Cannot find module './supabase'`

**解决：** 检查是否所有文件都已更新导入语句

```bash
# 查找所有还在使用 supabase 的文件
grep -r "from './supabase'" src/
```

### 问题 2：API 请求失败

**错误信息：** `Network request failed`

**解决：** 
1. 检查 `.env` 文件中的 `SUPABASE_URL` 是否正确
2. 检查 ECS 上的 PostgREST 是否正常运行
3. 测试 API 连接：

```bash
curl http://121.89.95.95/api/tags
```

### 问题 3：数据格式错误

**错误信息：** `Cannot read property 'xxx' of undefined`

**解决：** 
1. 检查 API 返回的数据格式
2. 更新类型定义
3. 添加数据验证

### 问题 4：Realtime 功能不工作

**原因：** 轮询间隔太长或太短

**解决：** 调整轮询间隔（建议 5-10 秒）

```typescript
// 调整轮询间隔
const POLL_INTERVAL = 5000; // 5 秒
```

---

## 📊 迁移进度跟踪

### 已完成
- [x] 创建 `postgrestApi.ts`
- [x] 创建 `dataService.ts`
- [x] 创建迁移指南

### 待完成
- [ ] 更新 `supabaseService.ts`
- [ ] 更新 `supabaseRealtimeService.ts`
- [ ] 更新 `supabaseHistoricalService.ts`
- [ ] 更新认证服务文件
- [ ] 更新 Hooks 文件
- [ ] 更新测试文件
- [ ] 卸载 Supabase SDK
- [ ] 完整功能测试

---

## 🎉 迁移完成后

### 1. 卸载 Supabase SDK

```bash
cd OvertimeIndexApp
npm uninstall @supabase/supabase-js
```

### 2. 清理备份文件

```bash
# 确认迁移成功后，删除备份
rm -rf .backup/
```

### 3. 更新文档

更新项目文档，说明已经移除 Supabase SDK。

### 4. 提交代码

```bash
git add .
git commit -m "feat: 移除 Supabase SDK，使用 PostgREST API"
git push
```

---

**准备好开始了吗？**

建议先完成优先级 1 的文件（`supabaseService.ts` 和 `supabaseRealtimeService.ts`），测试通过后再继续其他文件。

需要我帮你自动生成这些文件的更新版本吗？

# 🚀 移除 Supabase SDK - 快速总结

## 当前状态

✅ 已创建新的 API 服务层：
- `src/services/postgrestApi.ts` - PostgREST API 基础封装
- `src/services/dataService.ts` - 数据服务层

## 为什么选择方案 B？

**优点：**
- ✅ 不需要配置 JWT secret（避免当前的 JWT 错误）
- ✅ 更轻量级，减少依赖
- ✅ 完全控制 API 请求
- ✅ 更容易调试

**缺点：**
- ❌ 需要重写代码（但我已经帮你创建了基础框架）
- ❌ 失去 Realtime 功能（改用轮询，影响不大）

---

## 🎯 核心改动

### 1. API 调用方式对比

**原代码（Supabase SDK）：**
```typescript
import {supabase} from './supabase';

const {data, error} = await supabase
  .from('tags')
  .select('*')
  .eq('is_active', true);
```

**新代码（PostgREST API）：**
```typescript
import {dataService} from './dataService';

const tags = await dataService.getTags();
```

### 2. Realtime 功能改动

**原代码（Supabase Realtime）：**
```typescript
const channel = supabase
  .channel('realtime-stats')
  .on('postgres_changes', {...}, callback)
  .subscribe();
```

**新代码（轮询）：**
```typescript
import {dataService} from './dataService';

// 每 5 秒轮询一次
setInterval(async () => {
  const stats = await dataService.getRealTimeStats();
  updateUI(stats);
}, 5000);
```

---

## 📋 需要修改的文件（按优先级）

### 优先级 1：核心服务（必须立即修改）

1. **`src/services/supabaseService.ts`**
   - 这是最核心的文件，所有其他文件都依赖它
   - 需要将所有 Supabase SDK 调用替换为 `dataService` 调用
   - 文件很长（约 800 行），但大部分是重复的 CRUD 操作

2. **`src/services/supabaseRealtimeService.ts`**
   - 将 Realtime 订阅改为轮询
   - 每 5 秒调用一次 `dataService.getRealTimeStats()`

### 优先级 2：认证服务（重要）

3. **`src/services/enhanced-auth/AuthService.ts`**
   - 替换用户查询和创建操作

4. **`src/services/enhanced-auth/ProfileService.ts`**
   - 替换用户资料更新操作

5. **`src/services/enhanced-auth/SMSCodeService.ts`**
   - 替换短信验证码相关操作

6. **`src/services/enhanced-auth/OptionsDataService.ts`**
   - 替换选项数据查询操作

### 优先级 3：其他服务（可以稍后）

7. `src/services/supabaseHistoricalService.ts`
8. `src/services/offlineQueueService.ts`
9. `src/services/hourlySnapshotService.ts`
10. `src/services/posterData.ts`

### 优先级 4：Hooks（最后）

11. `src/hooks/useUserStatus.ts`
12. `src/hooks/useHistoricalData.ts`
13. `src/hooks/useAuth.ts`

---

## 🚀 立即执行（3 步）

### 步骤 1：备份和准备

```bash
cd OvertimeIndexApp

# 创建备份
mkdir -p .backup/services
cp src/services/supabase*.ts .backup/services/

# 确认新文件已创建
ls -la src/services/postgrestApi.ts
ls -la src/services/dataService.ts
```

### 步骤 2：更新 .env 文件

```bash
# 编辑 .env 文件
# 注释掉 SUPABASE_ANON_KEY（不再需要）
```

**修改后的 `.env`：**
```env
# PostgREST API 地址
SUPABASE_URL=http://121.89.95.95/api

# 不再需要 JWT secret
# SUPABASE_ANON_KEY=dummy-key
```

### 步骤 3：测试新 API

```bash
# 清除缓存并启动
npx expo start --clear
```

在手机上测试：
- 打开 Expo Go
- 扫描二维码
- 查看控制台日志

**预期结果：**
- ✅ 不再出现 "Server lacks JWT secret" 错误
- ✅ 能正常加载数据（如果你的代码已经使用了 `dataService`）

---

## 💡 我的建议

由于需要修改的文件较多（约 15 个文件），我建议：

### 方案 A：我帮你自动生成所有更新后的文件

**优点：**
- 快速完成迁移（10 分钟内）
- 保证代码一致性
- 减少人为错误

**缺点：**
- 需要仔细测试每个功能

### 方案 B：逐步手动迁移

**优点：**
- 更好地理解代码变化
- 可以逐个测试

**缺点：**
- 耗时较长（2-3 小时）
- 容易遗漏某些文件

---

## 🤔 你想怎么做？

**选项 1：** 我帮你自动生成所有更新后的文件
- 我会创建所有需要修改的文件的新版本
- 你只需要替换原文件并测试

**选项 2：** 我提供详细的修改指南
- 我会为每个文件提供具体的修改步骤
- 你手动修改每个文件

**选项 3：** 先修改核心文件，测试通过后再继续
- 我先帮你修改 `supabaseService.ts` 和 `supabaseRealtimeService.ts`
- 测试通过后再修改其他文件

---

## ⚠️ 重要提示

无论选择哪个方案，都需要：

1. **备份现有代码**
   ```bash
   git add .
   git commit -m "backup: 迁移前备份"
   ```

2. **完整测试所有功能**
   - 登录/注册
   - 提交状态
   - 查看数据
   - 历史记录

3. **保留 Supabase SDK 作为备份**
   - 先不要卸载 `@supabase/supabase-js`
   - 确认迁移成功后再卸载

---

**你想选择哪个方案？** 

告诉我，我会立即开始帮你完成迁移！

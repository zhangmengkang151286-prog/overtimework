# 零延迟快照解决方案

## 问题描述

**用户需求：** 快照必须在整点（如14:00）立即生成，时间轴要能立即显示正确数据，不能有任何延迟。

**当前问题：** GitHub Actions 有固有延迟（1-5分钟），导致14:00的快照可能要到14:05才能生成。

---

## 三种解决方案对比

### 方案1：提前5分钟运行 GitHub Actions ⚠️

**原理：** 修改 cron 时间，在每小时的第55分钟运行，提前生成下一小时的快照

**优点：**
- ✅ 实现简单，只需修改一行配置
- ✅ 不需要额外的基础设施

**缺点：**
- ❌ **逻辑混乱**：13:55生成的快照标记为14:00
- ❌ **数据不准确**：13:55到14:00之间的提交会被遗漏
- ❌ **不符合累计逻辑**：违背了"截止到该小时的累计数据"的设计

**配置：**
```yaml
schedule:
  - cron: '55 * * * *'  # 每小时第55分钟执行
```

**结论：** ❌ **不推荐** - 会导致数据不准确

---

### 方案2：使用 Supabase Cron（数据库内部定时任务）✅ 推荐

**原理：** 使用 Supabase 的 pg_cron 扩展，在数据库内部执行定时任务，延迟仅几毫秒

**优点：**
- ✅ **零延迟**：数据库内部执行，延迟 < 100ms
- ✅ **数据准确**：在整点执行，数据完全准确
- ✅ **可靠性高**：不依赖外部服务，不受网络影响
- ✅ **符合逻辑**：完美符合累计数据的设计

**缺点：**
- ⚠️ 需要在 Supabase Dashboard 中配置
- ⚠️ 需要确保 pg_cron 扩展已启用

**实施步骤：**

#### 步骤1：在 Supabase SQL Editor 执行
```sql
-- 1. 确保 pg_cron 扩展已启用
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 创建每小时快照任务（北京时间）
-- 注意：pg_cron 使用 UTC 时间，所以我们需要在每小时的第0分钟执行
SELECT cron.schedule(
  'hourly-snapshot',           -- 任务名称
  '0 * * * *',                 -- 每小时第0分钟（UTC时间）
  $$ SELECT save_hourly_snapshot(); $$  -- 执行的SQL
);

-- 3. 验证任务已创建
SELECT * FROM cron.job WHERE jobname = 'hourly-snapshot';
```

#### 步骤2：保留 GitHub Actions 作为备份
```yaml
# 保持现有配置不变，作为双重保障
schedule:
  - cron: '0 * * * *'
```

**工作原理：**
```
14:00:00.000 → Supabase Cron 触发 → save_hourly_snapshot()
14:00:00.050 → 快照生成完成
14:00:00.100 → 用户拖动时间轴到14:00 → 立即显示数据 ✅

14:00:30 → GitHub Actions 开始执行（备份）
14:01:00 → GitHub Actions 完成（快照已存在，ON CONFLICT DO UPDATE）
```

**结论：** ✅ **强烈推荐** - 完美解决零延迟问题

---

### 方案3：混合方案（Supabase Cron + 客户端按需生成）🔧

**原理：** 
1. 使用 Supabase Cron 定时生成快照（主要方式）
2. 客户端检测到快照缺失时，主动调用 API 生成（兜底方案）

**优点：**
- ✅ 结合了方案2的零延迟优势
- ✅ 增加了客户端兜底机制
- ✅ 即使定时任务失败，用户也能看到数据

**缺点：**
- ⚠️ 实现复杂度较高
- ⚠️ 需要修改客户端代码

**实施步骤：**

#### 步骤1：启用 Supabase Cron（同方案2）

#### 步骤2：修改客户端代码
```typescript
// src/services/hourlySnapshotService.ts

async getSnapshot(selectedTime: Date, currentData: RealTimeData | null): Promise<HourlySnapshot | null> {
  // ... 现有代码 ...
  
  // 从数据库读取快照
  const {data, error} = await supabase
    .from('hourly_snapshots')
    .select('*')
    .eq('snapshot_date', snapshotDate)
    .eq('snapshot_hour', hour)
    .maybeSingle();

  if (!data && !error) {
    // 快照不存在，尝试生成
    console.log(`[HourlySnapshot] Snapshot missing, generating on-demand...`);
    
    try {
      // 调用 RPC 函数生成快照
      await supabase.rpc('save_hourly_snapshot_at_hour', {
        p_date: snapshotDate,
        p_hour: hour
      });
      
      // 重新读取
      const {data: newData} = await supabase
        .from('hourly_snapshots')
        .select('*')
        .eq('snapshot_date', snapshotDate)
        .eq('snapshot_hour', hour)
        .single();
      
      if (newData) {
        console.log(`[HourlySnapshot] On-demand snapshot generated successfully`);
        return this.convertToSnapshot(newData);
      }
    } catch (err) {
      console.error(`[HourlySnapshot] Failed to generate on-demand snapshot:`, err);
    }
  }
  
  // ... 返回数据或空数据 ...
}
```

**结论：** 🔧 **可选** - 如果需要最高可靠性，可以实施

---

## 推荐方案

### 🎯 **方案2：Supabase Cron（数据库内部定时任务）**

**理由：**
1. ✅ **零延迟**：延迟 < 100ms，用户感知不到
2. ✅ **数据准确**：在整点执行，完全符合累计逻辑
3. ✅ **实施简单**：只需执行一段SQL，无需修改代码
4. ✅ **可靠性高**：数据库内部执行，不受网络影响
5. ✅ **双重保障**：保留 GitHub Actions 作为备份

---

## 立即执行步骤

### 1️⃣ 在 Supabase SQL Editor 执行以下SQL

```sql
-- ============================================
-- 零延迟快照：使用 Supabase Cron
-- ============================================

-- 1. 启用 pg_cron 扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 删除旧的定时任务（如果存在）
SELECT cron.unschedule('hourly-snapshot');

-- 3. 创建新的每小时快照任务
-- 注意：cron 使用 UTC 时间，但函数内部会转换为北京时间
SELECT cron.schedule(
  'hourly-snapshot',           -- 任务名称
  '0 * * * *',                 -- 每小时第0分钟（UTC时间）
  $$ SELECT save_hourly_snapshot(); $$  -- 执行的SQL
);

-- 4. 验证任务已创建
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job 
WHERE jobname = 'hourly-snapshot';

-- 5. 查看任务执行历史（可选）
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hourly-snapshot')
ORDER BY start_time DESC
LIMIT 10;
```

### 2️⃣ 验证配置

执行后应该看到：
```
| jobid | jobname          | schedule    | command                              | active |
|-------|------------------|-------------|--------------------------------------|--------|
| 1     | hourly-snapshot  | 0 * * * *   | SELECT save_hourly_snapshot();       | t      |
```

### 3️⃣ 测试（可选）

手动触发一次，验证是否正常工作：
```sql
-- 手动执行一次
SELECT save_hourly_snapshot();

-- 查看最新快照
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count,
  TO_CHAR(snapshot_time AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as "快照时间（北京）"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour DESC
LIMIT 1;
```

### 4️⃣ 保留 GitHub Actions（备份）

不需要修改 `.github/workflows/hourly-snapshot.yml`，保持现有配置作为备份。

---

## 工作流程

### 正常情况（Supabase Cron）
```
14:00:00.000 → Supabase Cron 触发
14:00:00.050 → save_hourly_snapshot() 执行完成
14:00:00.100 → 用户拖动时间轴 → 立即看到数据 ✅
```

### 备份情况（GitHub Actions）
```
14:00:30 → GitHub Actions 开始执行
14:01:00 → GitHub Actions 调用 API
14:01:05 → 快照已存在（ON CONFLICT DO UPDATE）
```

---

## 监控和维护

### 查看定时任务状态
```sql
-- 查看任务配置
SELECT * FROM cron.job WHERE jobname = 'hourly-snapshot';

-- 查看最近10次执行记录
SELECT 
  start_time AT TIME ZONE 'Asia/Shanghai' as "执行时间（北京）",
  status as "状态",
  return_message as "返回信息"
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hourly-snapshot')
ORDER BY start_time DESC
LIMIT 10;
```

### 如果需要暂停任务
```sql
-- 暂停任务
SELECT cron.unschedule('hourly-snapshot');

-- 重新启动任务
SELECT cron.schedule(
  'hourly-snapshot',
  '0 * * * *',
  $$ SELECT save_hourly_snapshot(); $$
);
```

---

## 总结

✅ **推荐使用方案2：Supabase Cron**

**优势：**
- 零延迟（< 100ms）
- 数据准确
- 实施简单
- 可靠性高

**下一步：**
1. 在 Supabase SQL Editor 执行上述 SQL
2. 验证任务已创建
3. 等待下一个整点，观察快照是否立即生成
4. 保留 GitHub Actions 作为备份

**预期效果：**
- 用户在14:00拖动时间轴，立即看到14:00的数据
- 不再有任何延迟
- 完美符合"零延迟"的要求 ✅

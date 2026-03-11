# 自动每小时快照实现指南

## 概述

实现自动每小时保存数据快照，用于时间轴功能。快照只保存有数据的标签（count > 0），基于时间戳的累计统计。

---

## 方案对比

### 方案1：Supabase Edge Functions + Cron（推荐）✅

**优点**：
- 服务器端执行，可靠性高
- 不依赖客户端在线
- Supabase 原生支持
- 易于监控和调试

**缺点**：
- 需要配置 Edge Function
- 可能有额外费用（取决于调用次数）

### 方案2：客户端定时触发（备用）

**优点**：
- 实现简单
- 无需额外配置

**缺点**：
- 依赖客户端在线
- 可能不准时
- 多个客户端可能重复触发

### 方案3：pg_cron（不可用）❌

**问题**：Supabase 默认不启用 pg_cron 扩展

---

## 推荐实现：Supabase Edge Functions

### 步骤1：更新数据库函数

在 Supabase SQL Editor 中执行：
```sql
-- 文件：OvertimeIndexApp/setup_auto_hourly_snapshots.sql
```

这会更新 `save_hourly_snapshot()` 函数，使用 INNER JOIN 只保存有数据的标签。

### 步骤2：创建 Edge Function

1. 在项目根目录创建 `supabase/functions/hourly-snapshot/index.ts`：

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 创建 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 调用 save_hourly_snapshot() 函数
    const { error } = await supabase.rpc('save_hourly_snapshot')

    if (error) {
      console.error('Error saving hourly snapshot:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Hourly snapshot saved successfully')
    return new Response(
      JSON.stringify({ success: true, message: 'Hourly snapshot saved' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

2. 部署 Edge Function：

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 部署函数
supabase functions deploy hourly-snapshot
```

### 步骤3：设置定时触发

#### 选项A：使用 Supabase Cron Jobs（如果可用）

在 Supabase Dashboard 中：
1. 进入 Database → Cron Jobs
2. 创建新的 Cron Job
3. 设置：
   - Schedule: `0 * * * *`（每小时的第0分钟）
   - Command: 调用 Edge Function

#### 选项B：使用外部定时任务服务

**GitHub Actions**：

创建 `.github/workflows/hourly-snapshot.yml`：

```yaml
name: Hourly Snapshot

on:
  schedule:
    - cron: '0 * * * *'  # 每小时的第0分钟
  workflow_dispatch:  # 允许手动触发

jobs:
  snapshot:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Hourly Snapshot
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            https://your-project.supabase.co/functions/v1/hourly-snapshot
```

**Vercel Cron**：

创建 `api/cron/hourly-snapshot.ts`：

```typescript
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // 验证 Vercel Cron 密钥
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.rpc('save_hourly_snapshot')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}
```

在 `vercel.json` 中配置：

```json
{
  "crons": [{
    "path": "/api/cron/hourly-snapshot",
    "schedule": "0 * * * *"
  }]
}
```

---

## 备用方案：客户端定时触发

如果无法使用服务器端方案，可以在客户端实现：

### 修改 hourlySnapshotService.ts

```typescript
/**
 * 保存当前数据为快照（调用服务器端函数）
 */
private async saveCurrentSnapshot(data: RealTimeData | null) {
  if (!data) return;

  try {
    // 调用 Supabase RPC 保存快照
    const { error } = await supabase.rpc('save_hourly_snapshot');
    
    if (error) {
      console.error('[HourlySnapshot] Failed to save snapshot:', error);
      return;
    }

    console.log('[HourlySnapshot] Snapshot saved successfully');
  } catch (error) {
    console.error('[HourlySnapshot] Error saving snapshot:', error);
  }
}
```

**注意**：这个方案依赖客户端在线，不如服务器端方案可靠。

---

## 监控和调试

### 查看最近的快照

```sql
SELECT 
  snapshot_date,
  snapshot_hour,
  TO_CHAR(snapshot_time, 'YYYY-MM-DD HH24:MI:SS') as time,
  participant_count,
  overtime_count,
  on_time_count,
  jsonb_array_length(tag_distribution) as tag_count
FROM hourly_snapshots
ORDER BY snapshot_time DESC
LIMIT 10;
```

### 检查是否有缺失的快照

```sql
-- 检查今天是否有缺失的小时
WITH expected_hours AS (
  SELECT generate_series(6, 23) as hour
)
SELECT 
  eh.hour,
  CASE 
    WHEN hs.snapshot_hour IS NULL THEN '❌ 缺失'
    ELSE '✅ 存在'
  END as status
FROM expected_hours eh
LEFT JOIN hourly_snapshots hs 
  ON hs.snapshot_date = CURRENT_DATE 
  AND hs.snapshot_hour = eh.hour
ORDER BY eh.hour;
```

### 手动补充缺失的快照

如果发现缺失的快照，可以手动执行：

```sql
SELECT save_hourly_snapshot();
```

---

## 清理旧快照

自动清理7天前的快照：

```sql
-- 手动清理
SELECT cleanup_old_hourly_snapshots();

-- 或设置定时清理（每天凌晨2点）
-- 使用与快照相同的定时任务方案
```

---

## 测试

### 测试快照保存

```sql
-- 1. 手动触发
SELECT save_hourly_snapshot();

-- 2. 验证结果
SELECT * FROM hourly_snapshots 
WHERE snapshot_date = CURRENT_DATE 
ORDER BY snapshot_hour DESC 
LIMIT 1;

-- 3. 检查标签数量（应该只有有数据的标签）
SELECT 
  snapshot_hour,
  jsonb_array_length(tag_distribution) as tag_count,
  tag_distribution
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour DESC
LIMIT 1;
```

### 测试客户端读取

在 App 中测试时间轴功能：
1. 拖动到不同时间点
2. 验证数据正确
3. 确认没有 count=0 的标签

---

## 常见问题

### Q: 快照不准时怎么办？

A: 检查定时任务是否正常运行。可以手动执行 `save_hourly_snapshot()` 补充缺失的快照。

### Q: 快照数据不正确怎么办？

A: 
1. 检查 `status_records` 表的数据是否正确
2. 检查 `submitted_at` 字段是否有值
3. 手动执行 `fix_tag_distribution_in_snapshots.sql` 修复

### Q: 如何修改快照保存的时间范围？

A: 修改 `save_hourly_snapshot()` 函数中的 `v_cutoff_time` 变量。

---

## 相关文件

- `setup_auto_hourly_snapshots.sql` - 更新数据库函数
- `fix_tag_distribution_in_snapshots.sql` - 修复现有快照
- `src/services/hourlySnapshotService.ts` - 客户端快照服务
- `TIMELINE_FEATURE_STATUS.md` - 时间轴功能状态

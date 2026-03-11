# GitHub Actions 每小时快照状态

## 回答你的问题

**问题**: 是只是给今天生成了24小时快照，还是以后每天的都有？我需要以后每天的每个小时都有快照。

**答案**: ✅ **以后每天的每个小时都会自动生成快照**

## GitHub Actions 配置详情

### 1. 工作流文件
- **位置**: `.github/workflows/hourly-snapshot.yml`
- **状态**: ✅ 已配置并运行中

### 2. 执行计划
```yaml
schedule:
  - cron: '0 * * * *'  # 每小时的第0分钟执行（UTC时间）
```

这意味着：
- **每天24小时**，每小时都会执行一次
- **每天都会执行**，不是只执行一天
- **持续运行**，除非你手动停止或删除工作流

### 3. 执行内容
每小时GitHub Actions会：
1. 调用 Supabase RPC 函数 `save_hourly_snapshot()`
2. 该函数会保存当前时刻的数据快照到 `hourly_snapshots` 表
3. 验证快照是否成功保存

### 4. 时区说明
- GitHub Actions 使用 **UTC 时间**
- Supabase 函数会自动转换为 **北京时间（UTC+8）**
- 例如：UTC 00:00 执行 → 保存北京时间 08:00 的快照

## 历史数据

根据你的描述，GitHub Actions 已经运行了好几天，所以：
- ✅ 过去几天的每个小时都应该有快照
- ✅ 今天的每个小时（到目前为止）都应该有快照
- ✅ 未来的每天每小时都会继续生成快照

## 验证快照数据

### 查看最近的快照
在 Supabase SQL Editor 中执行：

```sql
-- 查看最近24小时的快照
SELECT 
  snapshot_date as "日期",
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点",
  created_at as "创建时间"
FROM hourly_snapshots
WHERE snapshot_date >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY snapshot_date DESC, snapshot_hour DESC
LIMIT 24;
```

### 查看今天的所有快照
```sql
-- 应该看到从0点到当前小时的所有快照
SELECT 
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准点"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;
```

### 检查是否有缺失的小时
```sql
-- 检查今天是否有缺失的小时
WITH all_hours AS (
  SELECT generate_series(0, 23) AS hour
),
current_hour AS (
  SELECT EXTRACT(HOUR FROM CURRENT_TIME)::int AS hour
)
SELECT 
  ah.hour as "缺失的小时"
FROM all_hours ah
CROSS JOIN current_hour ch
LEFT JOIN hourly_snapshots hs 
  ON hs.snapshot_date = CURRENT_DATE 
  AND hs.snapshot_hour = ah.hour
WHERE hs.id IS NULL
  AND ah.hour <= ch.hour  -- 只检查已经过去的小时
ORDER BY ah.hour;
```

## 查看 GitHub Actions 运行日志

1. 访问你的 GitHub 仓库
2. 点击顶部的 **"Actions"** 标签
3. 在左侧选择 **"Hourly Snapshot"** 工作流
4. 查看最近的运行记录：
   - ✅ 绿色勾号 = 成功
   - ❌ 红色叉号 = 失败
   - 🟡 黄色圆圈 = 运行中

5. 点击任意一次运行，查看详细日志

## 手动触发（测试用）

如果你想立即测试，可以手动触发：

### 方法1：GitHub 网页界面
1. 进入 Actions → Hourly Snapshot
2. 点击右上角 **"Run workflow"** 按钮
3. 选择分支（通常是 main）
4. 点击 **"Run workflow"**

### 方法2：GitHub CLI
```bash
gh workflow run hourly-snapshot.yml
```

## 补充缺失的快照（如果需要）

如果发现某些小时缺失快照，可以使用脚本手动补充：

```sql
-- 为今天生成所有24小时的快照（包括缺失的）
SELECT * FROM generate_all_hourly_snapshots_for_date(CURRENT_DATE)
ORDER BY hour;

-- 为昨天生成所有24小时的快照
SELECT * FROM generate_all_hourly_snapshots_for_date(CURRENT_DATE - INTERVAL '1 day')
ORDER BY hour;
```

**注意**: 这个脚本会为所有小时生成快照，即使某些小时没有数据（会显示0值）。

## 总结

✅ **GitHub Actions 已经配置好，会持续运行**
- 每小时自动执行
- 每天24小时都会执行
- 未来的每一天都会继续执行
- 不需要手动干预

✅ **历史数据应该已经存在**
- 过去几天的快照应该都已保存
- 可以通过 SQL 查询验证

✅ **应用代码已修复**
- 移除了"加载中"提示
- 正确处理有快照和无快照的情况
- 当前小时显示实时数据，历史小时显示快照数据

## 下一步

1. **重新加载应用**（手机上摇一摇 → Reload）
2. **测试拖动时间轴**，验证：
   - 拖到历史小时 → 显示快照数据
   - 拖到当前小时 → 显示实时数据
   - 无"加载中"提示
3. **查看 GitHub Actions 日志**，确认每小时都在正常执行

如果有任何问题，可以查看 GitHub Actions 的运行日志来诊断。

# GitHub Actions 自动快照设置指南

## 概述

使用 GitHub Actions 每小时自动保存数据快照，完全免费且可靠。

---

## 步骤1：更新数据库函数

在 Supabase SQL Editor 中执行：

```sql
-- 文件：OvertimeIndexApp/setup_auto_hourly_snapshots.sql
```

这会更新 `save_hourly_snapshot()` 函数，使用 INNER JOIN 只保存有数据的标签。

---

## 步骤2：配置 GitHub Secrets

在 GitHub 仓库中设置以下 Secrets：

1. 进入仓库的 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下两个 secrets：

### SUPABASE_URL
- Name: `SUPABASE_URL`
- Value: 你的 Supabase 项目 URL
- 格式：`https://your-project.supabase.co`
- 获取方式：Supabase Dashboard → Settings → API → Project URL

### SUPABASE_ANON_KEY
- Name: `SUPABASE_ANON_KEY`
- Value: 你的 Supabase anon/public key
- 格式：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- 获取方式：Supabase Dashboard → Settings → API → Project API keys → anon public

---

## 步骤3：启用 GitHub Actions

1. 确保 `.github/workflows/hourly-snapshot.yml` 文件已提交到仓库
2. 进入仓库的 **Actions** 标签页
3. 如果看到提示，点击 **I understand my workflows, go ahead and enable them**
4. 找到 **Hourly Snapshot** workflow

---

## 步骤4：测试运行

### 手动触发测试

1. 进入 **Actions** → **Hourly Snapshot**
2. 点击 **Run workflow** → **Run workflow**
3. 等待执行完成（约10秒）
4. 查看执行日志，确认成功

### 验证快照

在 Supabase SQL Editor 中执行：

```sql
SELECT 
  snapshot_hour,
  TO_CHAR(snapshot_time, 'YYYY-MM-DD HH24:MI:SS') as time,
  participant_count,
  overtime_count,
  on_time_count,
  jsonb_array_length(tag_distribution) as tag_count
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour DESC
LIMIT 5;
```

应该能看到刚刚保存的快照。

---

## 工作原理

### 定时执行

```yaml
schedule:
  - cron: '0 * * * *'  # 每小时的第0分钟（UTC时间）
```

**注意**：GitHub Actions 使用 UTC 时间，不是北京时间。

- UTC 0点 = 北京时间 8点
- UTC 12点 = 北京时间 20点

### 执行流程

1. GitHub Actions 每小时触发
2. 调用 Supabase RPC 函数 `save_hourly_snapshot()`
3. 函数保存当前小时的快照
4. 验证快照是否保存成功

---

## 监控和调试

### 查看执行历史

1. 进入 **Actions** → **Hourly Snapshot**
2. 查看所有执行记录
3. 点击任意执行查看详细日志

### 检查失败原因

如果执行失败，查看日志中的错误信息：

**常见问题**：

1. **401 Unauthorized**
   - 检查 `SUPABASE_ANON_KEY` 是否正确
   - 确认 RLS 策略允许匿名访问

2. **404 Not Found**
   - 检查 `SUPABASE_URL` 是否正确
   - 确认函数名称是 `save_hourly_snapshot`

3. **500 Internal Server Error**
   - 查看 Supabase Dashboard → Logs
   - 检查函数是否有语法错误

### 手动补充缺失的快照

如果某个小时的快照失败了，可以手动执行：

```sql
SELECT save_hourly_snapshot();
```

---

## 成本

GitHub Actions 对公共仓库完全免费，对私有仓库每月有 2000 分钟的免费额度。

每次执行约 10 秒，每天 24 次，每月约 720 次 = 120 分钟，远低于免费额度。

---

## 高级配置

### 修改执行时间

如果想改变执行频率，修改 cron 表达式：

```yaml
# 每30分钟执行一次
- cron: '0,30 * * * *'

# 每2小时执行一次
- cron: '0 */2 * * *'

# 只在工作时间执行（UTC 0-14点 = 北京时间 8-22点）
- cron: '0 0-14 * * *'
```

### 添加通知

如果想在失败时收到通知，可以添加：

```yaml
- name: Notify on Failure
  if: failure()
  run: |
    echo "Snapshot failed! Please check the logs."
    # 可以添加发送邮件或 Slack 通知的代码
```

---

## 禁用自动快照

如果需要临时禁用：

1. 进入 **Actions** → **Hourly Snapshot**
2. 点击右上角的 **...** → **Disable workflow**

或者删除 `.github/workflows/hourly-snapshot.yml` 文件。

---

## 相关文件

- `.github/workflows/hourly-snapshot.yml` - GitHub Actions 配置
- `OvertimeIndexApp/setup_auto_hourly_snapshots.sql` - 数据库函数
- `OvertimeIndexApp/AUTO_HOURLY_SNAPSHOT_GUIDE.md` - 完整指南
- `OvertimeIndexApp/TIMELINE_FEATURE_STATUS.md` - 时间轴功能状态

---

## 下一步

1. ✅ 创建 GitHub Actions workflow
2. ⏳ 配置 GitHub Secrets
3. ⏳ 手动测试运行
4. ⏳ 等待下一个整点，验证自动执行
5. ⏳ 检查快照数据是否正确

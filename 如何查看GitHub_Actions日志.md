# 如何查看 GitHub Actions 执行日志

## 方法1：通过 GitHub 网页查看（推荐）

### 步骤1：进入 Actions 页面
1. 打开你的 GitHub 仓库：https://github.com/zhangmengkang151286-prog/overtimework
2. 点击顶部的 **Actions** 标签

### 步骤2：找到你的 Workflow
1. 在左侧列表中找到 **Hourly Snapshot**
2. 点击它

### 步骤3：查看运行记录
1. 你会看到所有的运行记录列表
2. 最新的运行在最上面
3. 每条记录显示：
   - 运行状态（✅ 成功 / ❌ 失败 / 🟡 进行中）
   - 触发方式（手动触发 / 定时触发）
   - 运行时间
   - 运行时长

### 步骤4：查看详细日志
1. 点击任意一条运行记录
2. 你会看到 **save-snapshot** 任务
3. 点击它展开
4. 你会看到两个步骤：
   - **Save Hourly Snapshot** - 保存快照
   - **Verify Snapshot** - 验证快照
5. 点击任意步骤查看详细日志

### 步骤5：查看日志内容
日志会显示：
```
Triggering hourly snapshot at Sat Jan 31 15:30:00 UTC 2026
Snapshot saved successfully
Verifying snapshot...
Latest snapshot: [{"snapshot_hour":23,"participant_count":2,"overtime_count":0,"on_time_count":2}]
```

---

## 方法2：通过 GitHub CLI 查看（命令行）

如果你安装了 GitHub CLI (`gh`)，可以使用命令行查看：

```bash
# 查看最近的运行记录
gh run list --workflow=hourly-snapshot.yml

# 查看特定运行的日志
gh run view <run-id> --log

# 查看最新运行的日志
gh run view --log
```

---

## 📊 日志解读

### 成功的日志示例
```
Run echo "Triggering hourly snapshot at $(date)"
Triggering hourly snapshot at Sat Jan 31 15:30:00 UTC 2026
Snapshot saved successfully

Run echo "Verifying snapshot..."
Verifying snapshot...
Latest snapshot: [{"snapshot_hour":23,"participant_count":2,"overtime_count":0,"on_time_count":2}]
```

**说明**：
- ✅ 快照保存成功
- ✅ 验证成功
- ✅ 显示最新快照数据（23点，2人参与，0人加班，2人准时）

### 失败的日志示例
```
Run echo "Triggering hourly snapshot at $(date)"
Triggering hourly snapshot at Sat Jan 31 15:30:00 UTC 2026
curl: (7) Failed to connect to mnwtjmsoayqtwmlffobf.supabase.co port 443
Error: Process completed with exit code 7.
```

**说明**：
- ❌ 网络连接失败
- ❌ 可能是 Supabase URL 或 API Key 配置错误

---

## 🔍 常见问题

### Q1: 看不到 Actions 标签？
**A**: 确保你已经提交了 `.github/workflows/hourly-snapshot.yml` 文件到仓库。

### Q2: Workflow 没有运行？
**A**: 检查：
1. 是否配置了 GitHub Secrets（SUPABASE_URL 和 SUPABASE_ANON_KEY）
2. 是否手动触发了测试（点击 "Run workflow"）
3. 是否等待了定时触发（每小时的第0分钟）

### Q3: 日志显示 401 错误？
**A**: 说明 API Key 配置错误，检查：
1. SUPABASE_ANON_KEY 是否正确
2. 是否有多余的空格或换行

### Q4: 日志显示 404 错误？
**A**: 说明 URL 配置错误，检查：
1. SUPABASE_URL 是否正确
2. 格式是否为 `https://xxx.supabase.co`（不要有尾部斜杠）

### Q5: 如何查看历史日志？
**A**: 在 Actions 页面，所有的运行记录都会保留，可以随时查看。

---

## 💡 提示

1. **首次运行**：建议手动触发测试，确认配置正确
2. **查看时间**：日志中的时间是 UTC 时间，需要 +8 小时转换为北京时间
3. **保留时间**：GitHub 会保留 90 天的日志记录
4. **实时查看**：运行中的 workflow 可以实时查看日志输出

---

## 🎯 快速验证

执行以下步骤快速验证：

1. **手动触发**：
   - 进入 Actions → Hourly Snapshot
   - 点击 "Run workflow" → "Run workflow"
   - 等待约 10 秒

2. **查看日志**：
   - 点击最新的运行记录
   - 展开 "save-snapshot" 任务
   - 查看两个步骤的日志

3. **验证数据**：
   - 在 Supabase SQL Editor 中执行：
   ```sql
   SELECT 
     snapshot_hour,
     snapshot_time AT TIME ZONE 'Asia/Shanghai' as "北京时间",
     participant_count
   FROM hourly_snapshots
   WHERE snapshot_date = CURRENT_DATE
   ORDER BY snapshot_hour DESC
   LIMIT 3;
   ```

如果看到最新的快照数据，说明 GitHub Actions 运行成功！🎉

# GitHub Actions 快速配置

## ✅ 已完成
- ✅ 执行了 `fix_tag_distribution_in_snapshots.sql`（修复现有数据）
- ✅ 执行了 `setup_auto_hourly_snapshots.sql`（更新函数）
- ✅ 创建了 `.github/workflows/hourly-snapshot.yml`（GitHub Actions 配置）

---

## 📝 下一步：配置 GitHub Secrets

### 步骤1：获取 Supabase 信息

1. 打开 Supabase Dashboard
2. 进入你的项目
3. 点击左侧 **Settings** → **API**
4. 复制以下信息：
   - **Project URL**：`https://xxxxx.supabase.co`
   - **anon public key**：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 步骤2：在 GitHub 添加 Secrets

1. 打开 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**

#### 添加 SUPABASE_URL
- Name: `SUPABASE_URL`
- Secret: 粘贴你的 Project URL（例如：`https://xxxxx.supabase.co`）
- 点击 **Add secret**

#### 添加 SUPABASE_ANON_KEY
- Name: `SUPABASE_ANON_KEY`
- Secret: 粘贴你的 anon public key
- 点击 **Add secret**

---

## 🚀 步骤3：提交代码

```bash
# 添加 GitHub Actions 配置文件
git add .github/workflows/hourly-snapshot.yml

# 提交
git commit -m "Add hourly snapshot automation"

# 推送到 GitHub
git push
```

---

## 🧪 步骤4：测试运行

### 方法1：手动触发（推荐）

1. 进入 GitHub 仓库
2. 点击 **Actions** 标签页
3. 在左侧找到 **Hourly Snapshot** workflow
4. 点击右侧的 **Run workflow** 按钮
5. 点击绿色的 **Run workflow** 确认
6. 等待执行完成（约10秒）
7. 点击执行记录查看详细日志

### 方法2：等待自动执行

GitHub Actions 会在每小时的第0分钟自动执行（UTC时间）。

---

## ✅ 验证结果

### 在 Supabase 中验证

执行以下 SQL 查询：

```sql
SELECT 
  snapshot_hour as "时间",
  TO_CHAR(snapshot_time, 'YYYY-MM-DD HH24:MI:SS') as "快照时间",
  participant_count as "参与人数",
  overtime_count as "加班",
  on_time_count as "准时",
  jsonb_array_length(tag_distribution) as "标签数"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour DESC
LIMIT 5;
```

应该能看到：
- 最新的快照记录
- 标签数量 > 0（只有有数据的标签）
- 参与人数、加班、准时次数正确

### 在 App 中验证

1. 重启 App
2. 拖动时间轴到不同时间点
3. 确认：
   - 数据正确显示
   - 没有 count=0 的标签
   - 时间轴回溯功能正常

---

## 📊 预期行为

### 自动执行时间表（UTC）

| UTC 时间 | 北京时间 | 说明 |
|---------|---------|------|
| 00:00   | 08:00   | 早上8点 |
| 06:00   | 14:00   | 下午2点 |
| 12:00   | 20:00   | 晚上8点 |
| 18:00   | 02:00   | 凌晨2点 |

### 快照数据示例

```
时间 | 参与人数 | 加班 | 准时 | 标签数
-----|---------|------|------|-------
22点 |    1    |  4   |  5   |   3
20点 |    1    |  3   |  4   |   3
18点 |    1    |  3   |  3   |   3
14点 |    1    |  2   |  2   |   3
10点 |    1    |  1   |  1   |   2
8点  |    1    |  0   |  1   |   1
```

---

## 🔧 故障排查

### 问题1：GitHub Actions 执行失败

**检查步骤**：
1. 查看 Actions 日志中的错误信息
2. 确认 Secrets 配置正确
3. 确认 Supabase URL 和 Key 有效

**常见错误**：
- `401 Unauthorized`：检查 `SUPABASE_ANON_KEY`
- `404 Not Found`：检查 `SUPABASE_URL` 和函数名称
- `500 Internal Server Error`：查看 Supabase Logs

### 问题2：快照数据不正确

**检查步骤**：
1. 在 Supabase 中手动执行：`SELECT save_hourly_snapshot();`
2. 查看返回结果
3. 检查 `status_records` 表的数据

### 问题3：App 显示旧数据

**解决方法**：
1. 完全关闭 App
2. 清除 App 缓存
3. 重新启动 App

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. GitHub Actions 执行日志
2. Supabase 错误日志
3. 快照数据查询结果

---

## 🎉 完成！

配置完成后，系统会：
- ✅ 每小时自动保存快照
- ✅ 只保存有数据的标签
- ✅ 基于时间戳的累计统计
- ✅ 支持时间轴回溯功能

现在可以正常使用时间轴功能了！

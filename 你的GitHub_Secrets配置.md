# 你的 GitHub Secrets 配置信息

## ✅ Supabase 信息已获取

根据你提供的信息：

### SUPABASE_URL
```
https://mnwtjmsoayqtwmlffobf.supabase.co
```

### SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud3RqbXNvYXlxdHdtbGZmb2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjEwNzYsImV4cCI6MjA4NTIzNzA3Nn0.NQ--wnC6dck3vSOvWJ2fyuZyGaHDTHGd08yFzpljI9E
```

---

## 📝 在 GitHub 添加 Secrets 的步骤

### 步骤1：打开 GitHub 仓库

1. 访问你的 GitHub 仓库
2. 确保你在正确的仓库页面

### 步骤2：进入 Settings

1. 点击仓库顶部的 **Settings**（设置）标签
2. 如果看不到，说明你没有管理权限

### 步骤3：进入 Secrets 设置

1. 在左侧菜单找到 **Secrets and variables**
2. 点击展开，选择 **Actions**

### 步骤4：添加第一个 Secret

1. 点击 **New repository secret**
2. 填写：
   - **Name**: `SUPABASE_URL`
   - **Secret**: `https://mnwtjmsoayqtwmlffobf.supabase.co`
3. 点击 **Add secret**

### 步骤5：添加第二个 Secret

1. 再次点击 **New repository secret**
2. 填写：
   - **Name**: `SUPABASE_ANON_KEY`
   - **Secret**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud3RqbXNvYXlxdHdtbGZmb2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjEwNzYsImV4cCI6MjA4NTIzNzA3Nn0.NQ--wnC6dck3vSOvWJ2fyuZyGaHDTHGd08yFzpljI9E`
3. 点击 **Add secret**

---

## 🚀 提交代码

配置完 Secrets 后，提交代码：

```bash
# 添加文件
git add .github/workflows/hourly-snapshot.yml

# 提交
git commit -m "Add hourly snapshot automation"

# 推送
git push
```

---

## 🧪 测试运行

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 找到 **Hourly Snapshot** workflow
3. 点击 **Run workflow** 手动触发
4. 查看执行日志

---

## ✅ 验证结果

### 在 Supabase 中验证

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

### 在 App 中验证

1. 重启 App
2. 拖动时间轴
3. 确认数据正确

---

## 🎉 完成！

配置完成后，系统会每小时自动保存快照。

**注意**：为了安全，请不要将这个文件提交到 Git 仓库！

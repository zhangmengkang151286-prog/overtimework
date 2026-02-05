# Git 推送指南

## ✅ 已完成的操作

我已经帮你完成了以下操作：

```bash
git init
git remote add origin https://github.com/zhangmengkang151286-prog/overtimework.git
git add .github/workflows/hourly-snapshot.yml
git commit -m "Add hourly snapshot automation"
git branch -M main
```

## ❌ 推送失败

推送到 GitHub 时遇到网络连接问题：
```
fatal: unable to access 'https://github.com/...'
Failed to connect to github.com port 443
```

---

## 🔧 解决方案

### 方案1：使用 GitHub Desktop（推荐）

1. **下载 GitHub Desktop**
   - 访问：https://desktop.github.com/
   - 下载并安装

2. **添加现有仓库**
   - 打开 GitHub Desktop
   - 点击 File → Add Local Repository
   - 选择你的项目文件夹：`C:\Users\zhangmengkang\Desktop\offwork`

3. **推送到 GitHub**
   - 在 GitHub Desktop 中，点击 "Publish repository"
   - 或者点击 "Push origin"

### 方案2：配置代理（如果你有代理）

如果你有 HTTP 代理，可以配置 Git 使用代理：

```bash
# 设置 HTTP 代理（替换为你的代理地址和端口）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 然后再次尝试推送
git push -u origin main
```

### 方案3：使用 SSH 而不是 HTTPS

1. **生成 SSH 密钥**（如果还没有）
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **添加 SSH 密钥到 GitHub**
   - 复制公钥内容：
     ```bash
     type %USERPROFILE%\.ssh\id_ed25519.pub
     ```
   - 访问 GitHub → Settings → SSH and GPG keys → New SSH key
   - 粘贴公钥

3. **更改远程仓库 URL**
   ```bash
   git remote set-url origin git@github.com:zhangmengkang151286-prog/overtimework.git
   ```

4. **推送**
   ```bash
   git push -u origin main
   ```

### 方案4：手动上传（临时方案）

1. **访问 GitHub 仓库**
   - 打开：https://github.com/zhangmengkang151286-prog/overtimework

2. **创建文件夹**
   - 点击 "Add file" → "Create new file"
   - 在文件名输入：`.github/workflows/hourly-snapshot.yml`
   - GitHub 会自动创建文件夹

3. **复制文件内容**
   - 打开本地文件：`.github/workflows/hourly-snapshot.yml`
   - 复制全部内容
   - 粘贴到 GitHub 的编辑器中

4. **提交**
   - 在底部填写提交信息：`Add hourly snapshot automation`
   - 点击 "Commit new file"

---

## 📝 推送成功后的下一步

推送成功后，继续完成以下步骤：

### 1. 配置 GitHub Secrets

访问：https://github.com/zhangmengkang151286-prog/overtimework/settings/secrets/actions

添加两个 Secrets：

**SUPABASE_URL**
```
https://mnwtjmsoayqtwmlffobf.supabase.co
```

**SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud3RqbXNvYXlxdHdtbGZmb2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjEwNzYsImV4cCI6MjA4NTIzNzA3Nn0.NQ--wnC6dck3vSOvWJ2fyuZyGaHDTHGd08yFzpljI9E
```

### 2. 测试 GitHub Actions

1. 访问：https://github.com/zhangmengkang151286-prog/overtimework/actions
2. 找到 "Hourly Snapshot" workflow
3. 点击 "Run workflow" 手动触发
4. 查看执行日志

### 3. 验证结果

在 Supabase SQL Editor 中执行：

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

---

## 💡 提示

1. **推荐使用 GitHub Desktop**：最简单、最可靠的方式
2. **检查网络**：确保可以访问 github.com
3. **使用代理**：如果公司网络有限制，可能需要配置代理
4. **SSH 方式**：比 HTTPS 更稳定，推荐长期使用

---

## 📞 需要帮助？

如果遇到问题，请告诉我：
1. 你选择了哪个方案
2. 遇到了什么错误
3. 错误的详细信息

我会帮你解决！

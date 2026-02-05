# GitHub Secrets 配置指南（图文详解）

## 第一步：获取 Supabase 信息

### 1.1 打开 Supabase Dashboard

1. 访问：https://supabase.com/dashboard
2. 登录你的账号
3. 选择你的项目（OvertimeIndex 项目）

### 1.2 进入 API 设置页面

1. 点击左侧菜单的 **Settings**（设置）图标（齿轮图标）
2. 在设置菜单中点击 **API**

### 1.3 复制所需信息

你会看到两个重要信息：

#### ① Project URL（项目 URL）
```
位置：Configuration → Project URL
格式：https://xxxxxxxxxxxxx.supabase.co
示例：https://abcdefghijklmn.supabase.co
```
**复制这个 URL**，稍后会用到。

#### ② anon public key（匿名公钥）
```
位置：Project API keys → anon public
格式：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...（很长的字符串）
```
**点击右侧的复制按钮**，复制这个 key。

---

## 第二步：在 GitHub 添加 Secrets

### 2.1 打开 GitHub 仓库

1. 访问你的 GitHub 仓库
2. 确保你在正确的仓库页面

### 2.2 进入 Settings 页面

1. 点击仓库顶部的 **Settings**（设置）标签
2. 如果看不到 Settings，说明你没有仓库的管理权限

### 2.3 进入 Secrets 设置

1. 在左侧菜单中找到 **Secrets and variables**
2. 点击展开，选择 **Actions**
3. 你会看到 "Actions secrets and variables" 页面

### 2.4 添加第一个 Secret：SUPABASE_URL

1. 点击右上角的绿色按钮 **New repository secret**
2. 填写表单：
   ```
   Name: SUPABASE_URL
   Secret: 粘贴你刚才复制的 Project URL
   ```
   例如：`https://abcdefghijklmn.supabase.co`
3. 点击 **Add secret** 按钮

### 2.5 添加第二个 Secret：SUPABASE_ANON_KEY

1. 再次点击 **New repository secret**
2. 填写表单：
   ```
   Name: SUPABASE_ANON_KEY
   Secret: 粘贴你刚才复制的 anon public key
   ```
   例如：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...`
3. 点击 **Add secret** 按钮

### 2.6 验证 Secrets

配置完成后，你应该能看到两个 secrets：
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`

**注意**：出于安全考虑，GitHub 不会显示 secret 的值，只会显示名称。

---

## 第三步：提交代码

### 3.1 检查文件

确保以下文件存在：
```
.github/workflows/hourly-snapshot.yml
```

### 3.2 提交到 GitHub

打开终端，执行以下命令：

```bash
# 1. 添加文件
git add .github/workflows/hourly-snapshot.yml

# 2. 提交
git commit -m "Add hourly snapshot automation"

# 3. 推送到 GitHub
git push
```

如果是第一次推送 `.github` 文件夹，可能需要：
```bash
git add .github
git commit -m "Add GitHub Actions workflow"
git push
```

---

## 第四步：测试 GitHub Actions

### 4.1 进入 Actions 页面

1. 在 GitHub 仓库页面，点击顶部的 **Actions** 标签
2. 如果看到提示需要启用 Actions，点击 **I understand my workflows, go ahead and enable them**

### 4.2 找到 Workflow

在左侧菜单中，你应该能看到：
- **Hourly Snapshot** workflow

### 4.3 手动触发测试

1. 点击 **Hourly Snapshot**
2. 在右侧点击 **Run workflow** 按钮（下拉菜单）
3. 确认分支是 `main` 或 `master`
4. 点击绿色的 **Run workflow** 按钮

### 4.4 查看执行结果

1. 等待几秒钟，页面会自动刷新
2. 你会看到一个新的 workflow run（黄色圆圈表示正在执行）
3. 点击这个 run 查看详细信息
4. 点击 **save-snapshot** job 查看日志

**成功的标志**：
- ✅ 所有步骤都有绿色的勾
- ✅ 日志中显示 "Snapshot saved successfully"
- ✅ 验证步骤显示最新的快照数据

**失败的标志**：
- ❌ 红色的 X
- ❌ 错误信息（查看日志）

---

## 第五步：验证快照数据

### 5.1 在 Supabase 中验证

打开 Supabase SQL Editor，执行：

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

你应该能看到刚才保存的快照。

### 5.2 在 App 中验证

1. 完全关闭 App
2. 重新启动 App
3. 拖动时间轴到不同时间点
4. 确认：
   - ✅ 数据正确显示
   - ✅ 没有 count=0 的标签
   - ✅ 时间轴回溯功能正常

---

## 常见问题

### Q1: 找不到 Settings 标签？
**A**: 你可能没有仓库的管理权限。请联系仓库所有者添加你为管理员。

### Q2: GitHub Actions 执行失败，显示 401 错误？
**A**: 检查 `SUPABASE_ANON_KEY` 是否正确复制。确保复制了完整的 key，没有多余的空格。

### Q3: GitHub Actions 执行失败，显示 404 错误？
**A**: 检查 `SUPABASE_URL` 是否正确。确保 URL 格式正确，以 `https://` 开头。

### Q4: 如何修改已添加的 Secret？
**A**: 
1. 进入 Settings → Secrets and variables → Actions
2. 找到要修改的 secret
3. 点击右侧的 **Update** 按钮
4. 输入新的值
5. 点击 **Update secret**

### Q5: 如何删除 Secret？
**A**: 
1. 进入 Settings → Secrets and variables → Actions
2. 找到要删除的 secret
3. 点击右侧的 **Remove** 按钮
4. 确认删除

---

## 检查清单

配置完成后，请确认：

- [ ] ✅ 已从 Supabase 复制 Project URL
- [ ] ✅ 已从 Supabase 复制 anon public key
- [ ] ✅ 已在 GitHub 添加 `SUPABASE_URL` secret
- [ ] ✅ 已在 GitHub 添加 `SUPABASE_ANON_KEY` secret
- [ ] ✅ 已提交 `.github/workflows/hourly-snapshot.yml` 文件
- [ ] ✅ 已手动触发 GitHub Actions 测试
- [ ] ✅ GitHub Actions 执行成功
- [ ] ✅ 在 Supabase 中验证快照数据
- [ ] ✅ 在 App 中验证时间轴功能

---

## 下一步

配置完成后，系统会：
- ✅ 每小时自动保存快照（UTC 时间）
- ✅ 只保存有数据的标签
- ✅ 支持时间轴回溯功能

你可以：
1. 等待下一个整点，查看是否自动执行
2. 在 GitHub Actions 页面查看执行历史
3. 在 Supabase 中查看快照数据

---

## 需要帮助？

如果遇到问题，请提供：
1. GitHub Actions 执行日志的截图
2. Supabase 中的错误信息
3. 你的 Supabase Project URL（不要提供 key）

我会帮你解决问题！

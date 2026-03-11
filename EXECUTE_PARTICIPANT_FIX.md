# 执行参与人数修复 - 快速指南

## 当前状态

✅ 修复脚本已创建：`fix_participant_count.sql`  
⏳ **待执行**：需要在 Supabase SQL Editor 中运行

## 问题

测试账号每次提交后，今日参与人数始终显示 **1**，没有累计增加。

**原因**：数据库视图使用 `COUNT(DISTINCT user_id)` 只统计不同用户数，测试账号多次提交都是同一个 user_id。

**修复**：改为 `COUNT(*)` 统计所有提交记录数。

## 执行步骤

### 1. 打开 Supabase SQL Editor

1. 登录 Supabase Dashboard
2. 选择你的项目
3. 左侧菜单点击 **SQL Editor**
4. 点击 **New query** 创建新查询

### 2. 复制并执行脚本

复制 `fix_participant_count.sql` 文件的全部内容，粘贴到 SQL Editor，点击 **Run** 执行。

### 3. 验证修复

执行成功后，运行以下查询验证：

```sql
-- 查看当前统计
SELECT * FROM real_time_stats WHERE date = CURRENT_DATE;
```

## 测试

1. 在应用中提交一次状态（加班或准点下班）
2. 等待 **3 秒**（统计数据自动刷新）
3. 观察"今日参与"人数是否增加
4. 再次提交状态
5. 参与人数应该继续累计增加（1 → 2 → 3 ...）

## 预期结果

- ✅ 测试账号每次提交，参与人数 +1
- ✅ 3秒自动刷新显示最新数据
- ✅ 加班/准点对比数据同步更新

## 相关文件

- `fix_participant_count.sql` - 修复脚本（待执行）
- `PARTICIPANT_COUNT_FIX.md` - 详细说明文档

## 完成后

执行成功后，回复"已执行"，我会帮你验证修复效果。

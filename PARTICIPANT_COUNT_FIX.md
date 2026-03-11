# 参与人数累计修复

## 问题

测试账号每次提交状态后，今日参与人数始终显示 1，没有累计增加。

## 原因分析

`real_time_stats` 物化视图使用 `COUNT(DISTINCT user_id)` 来计算参与人数：

```sql
CREATE MATERIALIZED VIEW real_time_stats AS
SELECT 
  date,
  COUNT(DISTINCT user_id) as participant_count,  -- 问题：只计算不同用户数
  ...
FROM status_records
WHERE date = CURRENT_DATE
GROUP BY date;
```

**问题**：
- `COUNT(DISTINCT user_id)` 只计算**不同用户的数量**
- 测试账号（`user_id = '00000000-0000-0000-0000-000000000001'`）多次提交
- 所有提交都是同一个 `user_id`
- 结果：参与人数始终为 1

## 需求

测试账号的每次提交应该代表不同的用户提交，所以：
- 参与人数 = 提交记录的总数
- 不是不同用户的数量

## 解决方案

将 `COUNT(DISTINCT user_id)` 改为 `COUNT(*)`：

```sql
CREATE MATERIALIZED VIEW real_time_stats AS
SELECT 
  date,
  COUNT(*) as participant_count,  -- 修复：计算所有记录数
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as overtime_count,
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as on_time_count,
  MAX(submitted_at) as last_updated
FROM status_records
WHERE date = CURRENT_DATE
GROUP BY date;
```

## 执行步骤

### 1. 在 Supabase SQL Editor 中执行

打开 Supabase Dashboard → SQL Editor → 新建查询

复制并执行 `fix_participant_count.sql` 文件的内容。

### 2. 验证修复

执行以下查询验证：

```sql
-- 查看当前统计
SELECT * FROM real_time_stats WHERE date = CURRENT_DATE;

-- 查看今日所有提交记录
SELECT COUNT(*) as total_records, COUNT(DISTINCT user_id) as unique_users
FROM status_records
WHERE date = CURRENT_DATE;
```

**预期结果**：
- `participant_count` 应该等于 `total_records`
- 测试账号每次提交后，`participant_count` 应该增加 1

### 3. 测试

1. 在应用中提交一次状态
2. 等待 3 秒（自动刷新）
3. 观察参与人数是否增加
4. 再次提交
5. 参与人数应该继续增加

## 影响

### 测试账号

- ✅ 每次提交都会累计参与人数
- ✅ 可以模拟多个用户提交的场景

### 正式用户

- ⚠️ 如果正式用户也可以多次提交（目前已允许），参与人数会累计所有提交
- ⚠️ 如果需要统计"不同用户数"，需要另外的逻辑

## 建议

### 选项 1：当前方案（推荐用于测试）

- 参与人数 = 提交记录总数
- 适合测试场景，每次提交代表一个"参与"

### 选项 2：区分测试和正式用户

如果需要正式环境中统计"不同用户数"，可以：

```sql
CREATE MATERIALIZED VIEW real_time_stats AS
SELECT 
  date,
  -- 如果是测试账号，计算所有记录；否则计算不同用户
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM status_records sr 
      WHERE sr.date = CURRENT_DATE 
      AND sr.user_id = '00000000-0000-0000-0000-000000000001'
    )
    THEN COUNT(*)  -- 测试模式：计算所有记录
    ELSE COUNT(DISTINCT user_id)  -- 正式模式：计算不同用户
  END as participant_count,
  ...
FROM status_records
WHERE date = CURRENT_DATE
GROUP BY date;
```

### 选项 3：添加新字段

保留两个字段：

```sql
CREATE MATERIALIZED VIEW real_time_stats AS
SELECT 
  date,
  COUNT(*) as submission_count,  -- 提交次数
  COUNT(DISTINCT user_id) as unique_user_count,  -- 不同用户数
  ...
FROM status_records
WHERE date = CURRENT_DATE
GROUP BY date;
```

然后在应用中选择显示哪个字段。

## 当前实现

当前使用**选项 1**（最简单）：
- 参与人数 = 提交记录总数
- 适合测试场景
- 如果需要更复杂的逻辑，可以后续调整

## 文件

- `fix_participant_count.sql` - 修复脚本
- `PARTICIPANT_COUNT_FIX.md` - 本文档

## 总结

修复后：
- ✅ 测试账号每次提交都会累计参与人数
- ✅ 3秒自动刷新会显示最新的累计数据
- ✅ 符合"每次提交代表一个参与"的测试需求

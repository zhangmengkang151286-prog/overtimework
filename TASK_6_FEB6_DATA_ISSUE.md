# Task 6: 修复 2月6日 归档数据问题

## 🔍 问题描述

用户反馈：7个圆点中 2月6号的数据感觉不对。

## 📋 诊断步骤

### 第1步：诊断数据问题（2分钟）

在 Supabase SQL Editor 中执行：

**文件：** `OvertimeIndexApp/diagnose_feb6_archive.sql`

这个脚本会显示：
1. **原始数据**（status_records 表）：2月6日实际有多少人提交，多少人加班，多少人准点
2. **归档数据**（daily_history 表）：归档后的数据是什么
3. **每个用户的提交记录**：具体每个用户什么时候提交的，是加班还是准点
4. **是否有重复归档**：检查是否重复归档了多次

**判断问题：**

对比第1步和第2步的结果：

| 情况 | 原因 | 解决方案 |
|------|------|---------|
| 参与人数不一致 | 归档函数计算 `COUNT(DISTINCT user_id)` 有问题 | 重新归档 |
| 加班/准点人数不一致 | 归档函数计算 `is_overtime` 逻辑有问题 | 重新归档 |
| 第4步显示多条记录 | 重复归档了 | 删除重复记录，重新归档 |
| 原始数据本身就不对 | 用户提交的数据有问题 | 检查用户提交逻辑 |

---

### 第2步：检查归档函数（可选，2分钟）

如果怀疑归档函数有问题，执行：

**文件：** `OvertimeIndexApp/check_archive_function.sql`

这个脚本会：
1. 显示 `archive_daily_data()` 函数的完整定义
2. 手动模拟归档逻辑，计算应该得到的结果

**对比结果：**
- 手动计算结果 = 实际归档结果 → 归档函数正常
- 手动计算结果 ≠ 实际归档结果 → 归档函数有 bug

---

### 第3步：修复 2月6日 数据（1分钟）

在 Supabase SQL Editor 中执行：

**文件：** `OvertimeIndexApp/fix_feb6_archive.sql`

这个脚本会：
1. 删除 2月6日 的旧归档数据
2. 重新归档 2月6日 的数据
3. 验证归档结果
4. 对比原始数据和归档数据，确保一致

**预期结果：**

```
数据来源 | 日期       | 参与人数 | 加班人数 | 准点人数
--------|-----------|---------|---------|----------
原始数据 | 2026-02-06 | X       | Y       | Z
归档数据 | 2026-02-06 | X       | Y       | Z
```

两行数据应该完全一致！

---

### 第4步：刷新应用验证（1分钟）

1. 刷新你的应用
2. 查看 7个圆点
3. 点击 2月6日 的圆点，查看详细数据
4. 确认数据是否正确

---

## 🔍 常见问题分析

### 问题1：参与人数计算错误

**症状：**
- 原始数据显示 1 人参与
- 归档数据显示 2 人参与（或其他不一致的数字）

**原因：**
- `COUNT(DISTINCT user_id)` 计算有问题
- 可能有重复的 user_id

**解决方案：**
```sql
-- 检查是否有重复的用户提交
SELECT 
  user_id,
  COUNT(*) as "提交次数"
FROM status_records
WHERE date = '2026-02-06'
GROUP BY user_id
HAVING COUNT(*) > 1;
```

---

### 问题2：加班/准点人数计算错误

**症状：**
- 原始数据显示 1 人加班，1 人准点
- 归档数据显示 2 人加班，0 人准点（或其他不一致的数字）

**原因：**
- `is_overtime` 字段值不正确
- 归档函数的 `FILTER (WHERE is_overtime = true/false)` 逻辑有问题

**解决方案：**
```sql
-- 检查每个用户的 is_overtime 值
SELECT 
  user_id,
  is_overtime,
  TO_CHAR(submitted_at AT TIME ZONE 'Asia/Shanghai', 'HH24:MI:SS') as "提交时间"
FROM status_records
WHERE date = '2026-02-06'
ORDER BY submitted_at;
```

---

### 问题3：重复归档

**症状：**
- `daily_history` 表中 2月6日 有多条记录

**原因：**
- 手动执行了多次 `archive_daily_data('2026-02-06')`
- 归档函数没有检查是否已存在记录

**解决方案：**
```sql
-- 删除所有 2月6日 的归档记录
DELETE FROM daily_history WHERE date = '2026-02-06';

-- 重新归档
SELECT * FROM archive_daily_data('2026-02-06'::DATE);
```

---

### 问题4：时区问题

**症状：**
- 用户在 2月6日 23:50 提交
- 但归档时被计入 2月7日

**原因：**
- `submitted_at` 字段使用 UTC 时间
- 归档时没有正确转换为北京时间

**解决方案：**
检查归档函数是否正确处理时区：
```sql
-- 检查 submitted_at 的时区
SELECT 
  date,
  submitted_at,
  submitted_at AT TIME ZONE 'Asia/Shanghai' as "北京时间"
FROM status_records
WHERE date = '2026-02-06'
ORDER BY submitted_at;
```

---

## 📊 预期数据

根据你之前提供的诊断结果：

```
日期       | 参与人数 | 加班人数 | 准点人数 | 最早提交 | 最晚提交
---------- | -------- | -------- | -------- | -------- | --------
2026-02-06 | 1        | 1        | 1        | 17:02:26 | 17:02:32
```

**分析：**
- 1 个用户参与
- 1 次加班提交（17:02:26）
- 1 次准点提交（17:02:32）

**这看起来不对！** 同一个用户在 6 秒内提交了 2 次？

**可能的问题：**
1. 用户重复提交了（应该只保留最后一次）
2. 数据库约束 `UNIQUE(user_id, date)` 没有生效
3. 是 2 个不同的用户，但 `COUNT(DISTINCT user_id)` 计算错误

---

## 🎯 执行清单

- [ ] 执行 `diagnose_feb6_archive.sql` 诊断问题
- [ ] 分析诊断结果，确定问题原因
- [ ] 执行 `check_archive_function.sql` 检查归档函数（可选）
- [ ] 执行 `fix_feb6_archive.sql` 修复数据
- [ ] 刷新应用，验证 7个圆点显示正确
- [ ] 如果还有问题，提供诊断结果给我

---

## 📝 总结

**可能的问题：**
1. ❌ 用户重复提交（同一用户，同一天，提交了 2 次）
2. ❌ 归档函数计算错误
3. ❌ 数据库约束失效
4. ❌ 时区转换问题

**解决方案：**
1. ✅ 执行诊断脚本，找出具体问题
2. ✅ 删除旧归档数据，重新归档
3. ✅ 验证数据一致性

**下一步：**
- 执行 `diagnose_feb6_archive.sql`
- 把诊断结果发给我
- 我会帮你分析具体问题

---

## 📂 相关文件

1. **诊断脚本：** `OvertimeIndexApp/diagnose_feb6_archive.sql`
2. **修复脚本：** `OvertimeIndexApp/fix_feb6_archive.sql`
3. **函数检查：** `OvertimeIndexApp/check_archive_function.sql`
4. **任务总结：** `OvertimeIndexApp/TASK_6_FEB6_DATA_ISSUE.md`（本文件）


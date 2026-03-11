# 时区修复指南

## 问题说明

当前系统存在时区问题：
- 数据库函数使用 UTC 时间
- 用户在北京时间（UTC+8）
- GitHub Actions 使用 UTC 时间触发

## 解决方案

### 方案概述

1. **数据库函数**：修改为使用北京时间
2. **GitHub Actions**：保持 UTC 触发，但函数内部转换为北京时间
3. **App 显示**：确保显示北京时间

---

## 步骤 1：更新数据库函数

在 Supabase SQL Editor 中执行：

```sql
-- 执行此文件的全部内容
-- OvertimeIndexApp/fix_timezone_to_beijing.sql
```

这会更新 `save_hourly_snapshot()` 函数，使其：
- 使用 `timezone('Asia/Shanghai', NOW())` 获取北京时间
- 所有时间戳都基于北京时间
- `snapshot_hour` 和 `snapshot_time` 的小时数一致

**关键改动**：
```sql
-- 旧代码（错误）
v_beijing_time := NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai';

-- 新代码（正确）
v_beijing_time := timezone('Asia/Shanghai', NOW());
```

---

## 步骤 2：理解 GitHub Actions 触发时间

GitHub Actions 使用 UTC 时间触发，对应的北京时间如下：

| UTC 时间 | 北京时间 | 说明 |
|---------|---------|------|
| 00:00   | 08:00   | 早上 8 点 |
| 01:00   | 09:00   | 早上 9 点 |
| 02:00   | 10:00   | 早上 10 点 |
| 06:00   | 14:00   | 下午 2 点 |
| 08:00   | 16:00   | 下午 4 点 |
| 10:00   | 18:00   | 下午 6 点 |
| 12:00   | 20:00   | 晚上 8 点 |
| 14:00   | 22:00   | 晚上 10 点 |
| 16:00   | 00:00   | 凌晨 0 点（次日）|
| 18:00   | 02:00   | 凌晨 2 点（次日）|
| 22:00   | 06:00   | 早上 6 点（次日）|

**关键点**：
- GitHub Actions 在 UTC 16:00 触发时，函数会保存北京时间 00:00（次日）的快照
- GitHub Actions 在 UTC 22:00 触发时，函数会保存北京时间 06:00（次日）的快照

---

## 步骤 3：验证修复

### 3.1 完整验证

在 Supabase SQL Editor 中执行：

```sql
-- 执行完整验证脚本
-- OvertimeIndexApp/verify_beijing_timezone.sql
```

这个脚本会：
1. 显示当前 UTC 和北京时间
2. 手动触发一次快照
3. 查看最新快照数据
4. 验证时区一致性

**预期结果**：
- 北京时间 = UTC时间 + 8小时
- `snapshot_hour` = `EXTRACT(HOUR FROM snapshot_time)`
- 验证结果显示 "✅ 一致"

### 3.2 检查当前时间

```sql
-- 查看当前 UTC 时间
SELECT NOW() as "UTC时间";

-- 查看当前北京时间
SELECT NOW() AT TIME ZONE 'Asia/Shanghai' as "北京时间";

-- 查看当前北京时间的小时数
SELECT EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Asia/Shanghai'))::INTEGER as "北京时间小时";
```

### 3.3 在 App 中验证

1. 重启 App
2. 查看时间轴
3. 确认显示的时间是北京时间
4. 拖动时间轴，确认数据正确

---

## 步骤 4：GitHub Actions 无需修改

GitHub Actions 配置文件 **不需要修改**，因为：
- GitHub Actions 仍然使用 UTC 时间触发（`cron: '0 * * * *'`）
- 但数据库函数内部会自动转换为北京时间
- 这样可以确保每小时都有快照

---

## 常见问题

### Q1: 为什么不修改 GitHub Actions 的 cron 时间？

**A**: 因为 GitHub Actions 只支持 UTC 时间。如果我们想在北京时间每小时触发，需要在 cron 中减去 8 小时，这样会很复杂。更好的方案是让 GitHub Actions 使用 UTC 触发，但函数内部转换为北京时间。

### Q2: 快照时间会不会错乱？

**A**: 不会。函数会根据北京时间计算 `snapshot_date` 和 `snapshot_hour`，所以：
- UTC 16:00 触发 → 保存为北京时间 2026-02-01 00:00
- UTC 22:00 触发 → 保存为北京时间 2026-02-01 06:00

### Q3: App 中显示的时间是什么时区？

**A**: App 应该显示用户本地时间（北京时间）。确保 App 中的时间处理正确。

### Q4: 如何验证时区是否正确？

**A**: 执行以下查询：

```sql
-- 查看最新快照的时间
SELECT 
  snapshot_hour,
  snapshot_time,
  snapshot_time AT TIME ZONE 'Asia/Shanghai' as beijing_time,
  EXTRACT(HOUR FROM (snapshot_time AT TIME ZONE 'Asia/Shanghai'))::INTEGER as beijing_hour
FROM hourly_snapshots
ORDER BY snapshot_time DESC
LIMIT 1;
```

确认 `beijing_hour` 和 `snapshot_hour` 一致。

---

## 总结

修复后的系统：
- ✅ 数据库函数使用北京时间
- ✅ GitHub Actions 使用 UTC 触发（每小时）
- ✅ 快照数据基于北京时间
- ✅ App 显示北京时间

现在系统会正确处理时区，所有时间都基于北京时间（UTC+8）。

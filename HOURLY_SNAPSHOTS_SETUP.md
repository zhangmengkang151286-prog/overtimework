# 每小时快照功能设置指南

## ⚠️ 重要：pg_cron 扩展问题

你遇到的错误 `ERROR: 3F000: schema "cron" does not exist` 是因为 Supabase 没有启用 `pg_cron` 扩展。

**解决方案：使用不依赖 pg_cron 的版本**

## 快速设置（3步）

### 步骤 1：创建表和函数

在 Supabase SQL Editor 中执行：

```
OvertimeIndexApp/setup_hourly_snapshots_no_cron.sql
```

### 步骤 2：插入测试数据

在 Supabase SQL Editor 中执行：

```
OvertimeIndexApp/insert_hourly_test_snapshots.sql
```

### 步骤 3：验证数据

执行以下 SQL 查看测试数据：

```sql
SELECT 
  snapshot_hour,
  participant_count,
  overtime_count,
  on_time_count
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;
```

你应该能看到从 6:00 到 23:00 的测试数据。

## 在应用中测试

1. 启动应用
2. 拖动时间轴到不同的整点（如 10:00、14:00、18:00）
3. 观察数据变化：
   - 参与人数应该随时间递增
   - 晚上 19:00 后加班人数开始超过准点人数
4. 点击"现在"按钮恢复实时数据

## 工作原理

- **拖动时间轴**：停止自动刷新，显示该小时的快照数据
- **点击"现在"**：恢复自动刷新，显示实时数据
- **当前小时**：始终显示实时数据，不读取快照

## 注意事项

由于不使用 pg_cron，快照不会自动保存。你需要：

1. **测试环境**：使用插入的测试数据即可
2. **生产环境**：需要通过外部定时任务定期调用 `save_hourly_snapshot()` 函数

## 手动保存快照

如果需要手动保存当前小时的快照：

```sql
SELECT save_hourly_snapshot();
```

## 清理旧数据

清理 7 天前的快照：

```sql
SELECT cleanup_old_hourly_snapshots();
```


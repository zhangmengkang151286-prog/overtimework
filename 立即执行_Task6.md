# ⚡ 立即执行 - Task 6

## 📋 3个SQL文件，按顺序执行

### 1️⃣ 修复归档函数
```
文件: fix_archive_function_logic.sql
作用: 修复BUG（只统计最后一次提交）
```

### 2️⃣ 创建10个用户
```
文件: setup_10_normal_users.sql
作用: 删除测试账户，创建真实用户，添加UNIQUE约束
```

### 3️⃣ 生成测试数据
```
文件: generate_test_data_for_10_users.sql
作用: 生成最近7天数据，自动归档，生成快照
```

---

## ✅ 验证

```sql
SELECT date, participant_count, overtime_count, on_time_count
FROM daily_history ORDER BY date DESC;
```

---

## 📱 测试

1. 刷新应用
2. 查看7个圆点
3. 登录：13800000001 - 13800000010

---

## 🎉 完成！

总耗时：5-10分钟

# ⚡ 立即执行 - Task 6 修复

## 🎯 3个SQL文件，按顺序执行

### 第1步：修复归档函数 ⚠️ **必须先执行！**

**文件：** `OvertimeIndexApp/fix_archive_function_logic.sql`

**作用：** 修复归档函数BUG（只统计最后一次提交）

**预期结果：**
```
archived_date | participant_count | overtime_count | on_time_count
2026-02-06    | 1                 | 1              | 0
```

---

### 第2步：创建10个用户

**文件：** `OvertimeIndexApp/setup_10_normal_users.sql`

**作用：**
- 删除测试账户
- 创建10个普通用户
- 添加 UNIQUE 约束

**预期结果：**
```
✅ 10个用户已创建
✅ UNIQUE 约束已添加
```

---

### 第3步：生成测试数据

**文件：** `OvertimeIndexApp/generate_test_data_for_10_users.sql`

**作用：**
- 生成最近7天的数据
- 自动归档
- 生成今天的快照

**预期结果：**
```
✅ 已归档: 2026-01-31
✅ 已归档: 2026-02-01
✅ 已归档: 2026-02-02
✅ 已归档: 2026-02-03
✅ 已归档: 2026-02-04
✅ 已归档: 2026-02-05
✅ 已生成快照: 0-当前小时
```

---

## ✅ 验证

```sql
-- 查看归档数据
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数",
  CASE 
    WHEN overtime_count > on_time_count THEN '🔴 红色'
    WHEN overtime_count < on_time_count THEN '🟢 绿色'
    ELSE '🟡 黄色'
  END as "圆点颜色"
FROM daily_history
ORDER BY date DESC;
```

---

## 📱 测试应用

1. 刷新应用
2. 查看 7个圆点
3. 使用手机号登录：13800000001 - 13800000010
4. 测试提交（每天只能提交一次）

---

## 🎉 完成！

**总耗时：** 约 5-10 分钟

**效果：**
- ✅ 归档函数已修复
- ✅ 10个用户已创建
- ✅ 测试数据已生成
- ✅ 7个圆点显示正确

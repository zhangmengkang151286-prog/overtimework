# 设置10个普通用户 - 完整指南

## 🎯 目标

1. 删除测试账户
2. 创建10个普通用户
3. 确保每个用户每天只能提交一次
4. 生成测试数据

---

## 📋 执行步骤

### 第1步：清理并创建用户（2分钟）

在 Supabase SQL Editor 中执行：

**文件：** `OvertimeIndexApp/setup_10_normal_users.sql`

这个脚本会：
1. ✅ 删除测试账户 `00000000-0000-0000-0000-000000000001`
2. ✅ 清空所有归档数据
3. ✅ 清空所有快照数据
4. ✅ 创建10个普通用户
5. ✅ 添加 `UNIQUE(user_id, date)` 约束

**预期结果：**

```
用户ID | 姓名   | 手机号       | 公司      | 职位
-------|--------|-------------|-----------|-------------
...    | 张三   | 13800000001 | 字节跳动   | 前端工程师
...    | 李四   | 13800000002 | 阿里巴巴   | 后端工程师
...    | 王五   | 13800000003 | 腾讯      | 产品经理
...    | 赵六   | 13800000004 | 蚂蚁金服   | 数据分析师
...    | 钱七   | 13800000005 | 美团      | UI设计师
...    | 孙八   | 13800000006 | 拼多多    | 测试工程师
...    | 周九   | 13800000007 | 网易      | 运营专员
...    | 吴十   | 13800000008 | 字节跳动   | 算法工程师
...    | 郑十一 | 13800000009 | 苏宁      | 项目经理
...    | 陈十二 | 13800000010 | 小米      | 架构师
```

---

### 第2步：生成测试数据（2分钟）

在 Supabase SQL Editor 中执行：

**文件：** `OvertimeIndexApp/generate_test_data_for_10_users.sql`

这个脚本会：
1. ✅ 为每个用户生成最近7天的随机数据
2. ✅ 每个用户每天只有一条记录
3. ✅ 60%概率加班，40%概率准点
4. ✅ 提交时间在 17:00-22:00 之间
5. ✅ 自动归档历史数据
6. ✅ 生成今天的每小时快照

**预期结果：**

```
日期       | 参与人数 | 加班人数 | 准点人数 | 圆点颜色
-----------|---------|---------|---------|----------
2026-02-06 | 10      | 6       | 4       | 🔴 红色
2026-02-05 | 10      | 5       | 5       | 🟡 黄色
2026-02-04 | 10      | 7       | 3       | 🔴 红色
2026-02-03 | 10      | 4       | 6       | 🟢 绿色
2026-02-02 | 10      | 6       | 4       | 🔴 红色
2026-02-01 | 10      | 5       | 5       | 🟡 黄色
2026-01-31 | 10      | 8       | 2       | 🔴 红色
```

---

### 第3步：修复归档函数（1分钟）

**重要！** 在生成测试数据之前，先修复归档函数：

在 Supabase SQL Editor 中执行：

**文件：** `OvertimeIndexApp/fix_archive_function_logic.sql`

这个脚本会修复归档函数，确保只统计每个用户的最后一次提交。

---

### 第4步：验证数据（1分钟）

```sql
-- 查看所有用户
SELECT 
  username as "姓名",
  phone_number as "手机号",
  company as "公司",
  position as "职位"
FROM users
ORDER BY phone_number;

-- 查看最近7天的数据
SELECT 
  date as "日期",
  COUNT(DISTINCT user_id) as "参与人数",
  COUNT(*) FILTER (WHERE is_overtime = true) as "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false) as "准点人数"
FROM status_records
WHERE date >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY date
ORDER BY date DESC;

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

### 第5步：测试应用（5分钟）

#### 5.1 使用手机号登录

使用以下任意手机号登录：
- 13800000001（张三）
- 13800000002（李四）
- 13800000003（王五）
- ... 等等

#### 5.2 测试提交限制

1. 登录后，提交一次状态（加班或准点）
2. 尝试再次提交 → **应该被阻止！**
3. 错误信息：`duplicate key value violates unique constraint "unique_user_date"`

#### 5.3 验证数据显示

1. 查看 7个圆点 → 应该显示最近7天的数据
2. 查看时间轴 → 应该显示今天的每小时数据
3. 查看实时统计 → 应该显示今天的参与人数

---

## 🔒 数据库约束

### UNIQUE 约束

```sql
ALTER TABLE status_records
ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);
```

**作用：**
- 每个用户每天只能有一条记录
- 如果尝试重复提交，数据库会报错
- 应用层需要处理这个错误

### 应用层处理

在应用代码中，应该使用 `UPSERT` 而不是 `INSERT`：

```sql
-- 错误：会导致重复提交报错
INSERT INTO status_records (user_id, date, is_overtime, ...)
VALUES (...);

-- 正确：使用 ON CONFLICT 更新
INSERT INTO status_records (user_id, date, is_overtime, ...)
VALUES (...)
ON CONFLICT (user_id, date)
DO UPDATE SET 
  is_overtime = EXCLUDED.is_overtime,
  submitted_at = EXCLUDED.submitted_at,
  ...;
```

---

## 📊 测试数据特点

### 用户分布

- **10个用户**
- 来自不同公司：字节跳动、阿里巴巴、腾讯、蚂蚁金服、美团、拼多多、网易、小米、苏宁
- 不同职位：前端、后端、产品、数据、设计、测试、运营、算法、项目、架构

### 数据分布

- **最近7天**：每天10个用户都提交
- **加班概率**：60%（符合现实情况）
- **提交时间**：17:00-22:00（下班后提交）
- **每用户每天**：只有一条记录

### 预期结果

- **7个圆点**：显示最近7天的数据，颜色根据加班/准点比例
- **时间轴**：显示今天的每小时累计数据
- **实时统计**：显示今天的参与人数、加班人数、准点人数

---

## 🎯 执行清单

- [ ] 执行 `fix_archive_function_logic.sql` 修复归档函数
- [ ] 执行 `setup_10_normal_users.sql` 创建用户
- [ ] 执行 `generate_test_data_for_10_users.sql` 生成测试数据
- [ ] 验证用户创建成功（10个用户）
- [ ] 验证 UNIQUE 约束已添加
- [ ] 验证测试数据生成成功（最近7天）
- [ ] 验证归档数据正确
- [ ] 刷新应用，查看 7个圆点
- [ ] 使用手机号登录测试
- [ ] 测试重复提交被阻止

---

## 📝 总结

**执行顺序：**
1. ✅ 修复归档函数（`fix_archive_function_logic.sql`）
2. ✅ 创建10个用户（`setup_10_normal_users.sql`）
3. ✅ 生成测试数据（`generate_test_data_for_10_users.sql`）
4. ✅ 验证数据
5. ✅ 测试应用

**关键改进：**
- ✅ 删除了测试账户
- ✅ 创建了10个真实用户
- ✅ 添加了 UNIQUE 约束，每个用户每天只能提交一次
- ✅ 修复了归档函数，只统计最后一次提交
- ✅ 生成了真实的测试数据

**总耗时：** 约 10 分钟

**效果：** 应用现在有真实的用户和数据，可以正常测试所有功能！🚀


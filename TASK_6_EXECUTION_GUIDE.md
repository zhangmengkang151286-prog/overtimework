# Task 6: 完整执行指南 - 修复归档函数并设置10个用户

## 🎯 目标

1. ✅ 修复归档函数BUG（只统计最后一次提交）
2. ✅ 删除测试账户
3. ✅ 创建10个普通用户
4. ✅ 添加 UNIQUE 约束（每用户每天只能提交一次）
5. ✅ 生成测试数据
6. ✅ 验证7个圆点显示正确

---

## 📋 执行步骤（总耗时：约10分钟）

### 第1步：修复归档函数（2分钟）⚠️ **必须先执行！**

**为什么要先修复？**
- 当前归档函数有严重BUG：统计了用户的所有提交记录
- 如果不先修复，生成的测试数据会统计错误

**执行：**

在 Supabase SQL Editor 中执行：
```
OvertimeIndexApp/fix_archive_function_logic.sql
```

**预期结果：**
```
✅ 函数已删除
✅ 新函数已创建
✅ 2月6日数据已重新归档

archived_date | participant_count | overtime_count | on_time_count
2026-02-06    | 1                 | 1              | 0
```

**验证：**
```sql
-- 查看归档函数是否正确
SELECT 
  date as "日期",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数"
FROM daily_history
WHERE date = '2026-02-06';
```

---

### 第2步：创建10个普通用户（2分钟）

**执行：**

在 Supabase SQL Editor 中执行：
```
OvertimeIndexApp/setup_10_normal_users.sql
```

**这个脚本会：**
1. ✅ 删除测试账户 `00000000-0000-0000-0000-000000000001`
2. ✅ 清空所有归档数据（重新开始）
3. ✅ 清空所有快照数据（重新开始）
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

✅ 已添加 UNIQUE 约束：每个用户每天只能提交一次
```

---

### 第3步：生成测试数据（2分钟）

**执行：**

在 Supabase SQL Editor 中执行：
```
OvertimeIndexApp/generate_test_data_for_10_users.sql
```

**这个脚本会：**
1. ✅ 为每个用户生成最近7天的随机数据
2. ✅ 每个用户每天只有一条记录
3. ✅ 60%概率加班，40%概率准点
4. ✅ 提交时间在 17:00-22:00 之间
5. ✅ 自动归档历史数据到 `daily_history`
6. ✅ 生成今天的每小时快照

**预期结果：**
```
日期       | 参与人数 | 加班人数 | 准点人数 | 最早提交 | 最晚提交
-----------|---------|---------|---------|----------|----------
2026-02-06 | 10      | 6       | 4       | 17:xx    | 21:xx
2026-02-05 | 10      | 5       | 5       | 17:xx    | 21:xx
2026-02-04 | 10      | 7       | 3       | 17:xx    | 21:xx
2026-02-03 | 10      | 4       | 6       | 17:xx    | 21:xx
2026-02-02 | 10      | 6       | 4       | 17:xx    | 21:xx
2026-02-01 | 10      | 5       | 5       | 17:xx    | 21:xx
2026-01-31 | 10      | 8       | 2       | 17:xx    | 21:xx

✅ 已归档: 2026-01-31
✅ 已归档: 2026-02-01
✅ 已归档: 2026-02-02
✅ 已归档: 2026-02-03
✅ 已归档: 2026-02-04
✅ 已归档: 2026-02-05

✅ 已生成快照: 0 点
✅ 已生成快照: 1 点
...
✅ 已生成快照: 当前小时
```

---

### 第4步：验证数据（2分钟）

**验证用户：**
```sql
SELECT 
  username as "姓名",
  phone_number as "手机号",
  company as "公司",
  position as "职位"
FROM users
ORDER BY phone_number;
```

**验证原始数据：**
```sql
SELECT 
  date as "日期",
  COUNT(DISTINCT user_id) as "参与人数",
  COUNT(*) FILTER (WHERE is_overtime = true) as "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false) as "准点人数"
FROM status_records
WHERE date >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY date
ORDER BY date DESC;
```

**验证归档数据：**
```sql
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

**验证快照数据：**
```sql
SELECT 
  snapshot_hour as "小时",
  participant_count as "参与人数",
  overtime_count as "加班人数",
  on_time_count as "准点人数"
FROM hourly_snapshots
WHERE snapshot_date = CURRENT_DATE
ORDER BY snapshot_hour;
```

**验证 UNIQUE 约束：**
```sql
SELECT 
  conname as "约束名称",
  pg_get_constraintdef(oid) as "约束定义"
FROM pg_constraint
WHERE conrelid = 'status_records'::regclass
  AND conname = 'unique_user_date';
```

---

### 第5步：测试应用（2分钟）

#### 5.1 刷新应用

1. 在手机上刷新应用
2. 查看 **7个圆点** → 应该显示最近7天的数据
3. 点击每个圆点 → 应该显示详细数据

**预期效果：**
```
⚪ ⚪ 🔴 🟢 🔴 🟡 🔴
(最早)              (今天)
```

#### 5.2 测试登录

使用以下任意手机号登录：
- 13800000001（张三）
- 13800000002（李四）
- 13800000003（王五）
- ... 等等

#### 5.3 测试提交限制

1. 登录后，提交一次状态（加班或准点）
2. 尝试再次提交 → **应该被阻止！**
3. 错误信息：`duplicate key value violates unique constraint "unique_user_date"`

---

## 🔍 关键改进说明

### 1. 归档函数修复

**修复前（错误）：**
```sql
-- 统计所有记录
SELECT COUNT(*) FILTER (WHERE is_overtime = true)
FROM status_records
WHERE date = target_date;
```

**修复后（正确）：**
```sql
-- 先获取每个用户的最后一次提交，再统计
WITH latest_submissions AS (
  SELECT DISTINCT ON (user_id)
    user_id, is_overtime
  FROM status_records
  WHERE date = target_date
  ORDER BY user_id, submitted_at DESC
)
SELECT COUNT(*) FILTER (WHERE is_overtime = true)
FROM latest_submissions;
```

### 2. UNIQUE 约束

**作用：**
- 每个用户每天只能有一条记录
- 防止重复提交
- 数据库层面保证数据完整性

**约束定义：**
```sql
ALTER TABLE status_records
ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);
```

### 3. 测试数据特点

- **10个用户**：来自不同公司和职位
- **最近7天**：每天10个用户都提交
- **加班概率**：60%（符合现实情况）
- **提交时间**：17:00-22:00（下班后提交）
- **每用户每天**：只有一条记录

---

## 📊 数据流向

### 用户提交 → 归档 → 显示

```
1. 用户提交状态
   ↓
2. 写入 status_records 表
   ↓
3. 每天 06:00 自动归档
   ↓
4. archive_daily_data() 函数执行
   ↓ (使用 DISTINCT ON 获取最后一次提交)
5. 写入 daily_history 表
   ↓
6. APP 读取 daily_history
   ↓
7. 显示 7个圆点
```

### 7个圆点的数据来源

**重要：** APP 读取的是 `daily_history` 表，不是 `status_records` 表！

```typescript
// src/components/HistoricalStatusIndicator.tsx
const displayStatus = sortedStatus.slice(-7);  // 显示最近7天

// 数据来源：
// - 从 daily_history 表读取
// - 每天 06:00 自动归档
// - 显示最近7天的数据
```

---

## 🎯 执行清单

- [ ] **第1步**：执行 `fix_archive_function_logic.sql` 修复归档函数
- [ ] **第2步**：执行 `setup_10_normal_users.sql` 创建用户
- [ ] **第3步**：执行 `generate_test_data_for_10_users.sql` 生成测试数据
- [ ] **第4步**：验证所有数据正确
- [ ] **第5步**：刷新应用，测试功能

---

## 📝 总结

**问题根源：**
- ❌ 归档函数统计了用户的所有提交记录
- ❌ 测试账户可以无限次提交
- ❌ 没有真实的用户数据

**解决方案：**
- ✅ 修复归档函数，只统计最后一次提交
- ✅ 添加 UNIQUE 约束，每用户每天只能提交一次
- ✅ 创建10个真实用户
- ✅ 生成真实的测试数据

**执行时间：**
- 总共约 10 分钟
- 一次修复，永久生效

**效果：**
- ✅ 7个圆点显示正确
- ✅ 数据统计准确
- ✅ 防止重复提交
- ✅ 有真实的用户和数据可以测试

**问题已彻底解决！** 🎉

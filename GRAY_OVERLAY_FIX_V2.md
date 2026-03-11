# 灰色遮罩层和屏幕卡住问题 - 完整修复方案

## 当前状态

### ✅ 已完成
1. 自动刷新功能已实现（统计数据3秒，标签数据7秒）
2. 标签占比TOP10已添加
3. 累计提交代码已修改（使用 INSERT 而非 UPSERT）
4. 屏幕卡住问题代码已修复（延迟150ms）

### ⏳ 待完成
1. **需要执行 SQL 脚本**：`allow_multiple_submissions.sql`
2. **需要测试验证**：多次提交和屏幕卡住问题

---

## 第一步：执行 SQL 脚本（必须）

### 在 Supabase SQL Editor 中执行

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制以下 SQL 并执行：

```sql
-- 允许测试账号多次提交 - 累计模式
-- 移除唯一约束，允许同一用户同一天有多条记录

-- 1. 删除现有的唯一约束
ALTER TABLE status_records 
DROP CONSTRAINT IF EXISTS status_records_user_id_date_key;

-- 2. 添加新的索引（用于查询性能，但不强制唯一）
CREATE INDEX IF NOT EXISTS idx_status_records_user_date 
ON status_records(user_id, date);

-- 3. 添加提交时间戳索引（用于排序）
CREATE INDEX IF NOT EXISTS idx_status_records_submitted_at 
ON status_records(submitted_at);
```

4. 点击 **Run** 执行

### 验证 SQL 执行成功

执行以下查询验证：

```sql
-- 查看测试用户的所有提交记录
SELECT 
  id,
  user_id,
  date,
  is_overtime,
  tag_id,
  overtime_hours,
  submitted_at
FROM status_records
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY submitted_at DESC;
```

---

## 第二步：重启应用并测试

### 重启应用

```bash
# 停止当前运行的应用（Ctrl+C）
# 重新启动
npm start
```

### 测试场景 1：累计提交

1. 登录测试账号
2. 提交第一次状态（准点下班）
3. 观察参与人数（应该是 1）
4. **立即提交第二次**状态（加班）
5. 观察参与人数（应该是 2）
6. 继续提交第三次、第四次...
7. 参与人数应该继续累加

**预期结果**：
- ✅ 不再报错 "duplicate key value violates unique constraint"
- ✅ 参与人数按提交次数累加
- ✅ 每次提交都成功

### 测试场景 2：屏幕卡住问题

1. 登录测试账号
2. 提交准点下班
3. 等待提交成功
4. **立即再次提交**准点下班
5. 观察屏幕状态
6. 尝试滑动屏幕

**预期结果**：
- ✅ 选择标签后，Modal完全关闭
- ✅ 没有灰色遮罩层残留
- ✅ 屏幕可以正常滑动
- ✅ 数据正常提交和刷新

---

## 问题排查

### 如果仍然报错 "duplicate key"

说明 SQL 脚本没有执行成功，请：
1. 检查 Supabase SQL Editor 是否有错误提示
2. 确认是否连接到正确的数据库
3. 重新执行 SQL 脚本

### 如果屏幕仍然卡住

1. **立即解决**：重启应用清除残留状态
2. **检查控制台**：查看是否有错误日志
3. **报告问题**：告诉我具体卡在哪个步骤

### 如果参与人数不累加

可能需要修改统计函数（仅测试环境）：

```sql
CREATE OR REPLACE FUNCTION get_real_time_stats()
RETURNS TABLE (
  participant_count BIGINT,
  overtime_count BIGINT,
  on_time_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- 按提交次数统计（累计模式）
    COUNT(*)::BIGINT AS participant_count,
    COUNT(*) FILTER (WHERE is_overtime = true)::BIGINT AS overtime_count,
    COUNT(*) FILTER (WHERE is_overtime = false)::BIGINT AS on_time_count,
    NOW() AS last_updated
  FROM status_records
  WHERE date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
```

---

## 清理测试数据

如果需要清理测试数据重新测试：

```sql
-- 删除测试用户今天的所有提交
DELETE FROM status_records
WHERE user_id = '00000000-0000-0000-0000-000000000001'
  AND date = CURRENT_DATE;
```

---

## 总结

### 核心修复
1. **数据库层面**：删除唯一约束，允许多次提交
2. **代码层面**：使用 INSERT 而非 UPSERT
3. **UI层面**：增加延迟确保 Modal 完全关闭

### 测试账号特性
- 测试账号 ID: `00000000-0000-0000-0000-000000000001`
- 可以无限次提交
- 每次提交都作为新记录
- 参与人数按提交次数累计

### 下一步
1. ⏳ 执行 SQL 脚本
2. ⏳ 重启应用
3. ⏳ 测试多次提交
4. ⏳ 验证屏幕不卡住

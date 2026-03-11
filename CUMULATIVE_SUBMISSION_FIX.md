# 累计提交模式 - 修复文档

## 需求说明

测试账号需要支持**累计提交**，而不是覆盖提交：
- 每次提交都作为一条新记录插入数据库
- 参与人数按提交次数累计，而不是按用户数
- 例如：测试账号提交2次，参与人数应该显示为 2

## 问题分析

### 当前设计问题

1. **数据库约束**：`status_records` 表有唯一约束 `(user_id, date)`
   - 限制：同一用户同一天只能有一条记录
   - 结果：第二次提交会报错或覆盖第一次提交

2. **统计逻辑**：`get_real_time_stats` 函数按用户数统计
   - 使用 `COUNT(DISTINCT user_id)` 统计参与人数
   - 结果：同一用户多次提交只计数一次

## 解决方案

### 步骤 1：修改数据库结构

执行 SQL 脚本 `allow_multiple_submissions.sql`：

```sql
-- 删除唯一约束
ALTER TABLE status_records 
DROP CONSTRAINT IF EXISTS status_records_user_id_date_key;

-- 添加索引（提升查询性能）
CREATE INDEX IF NOT EXISTS idx_status_records_user_date 
ON status_records(user_id, date);

CREATE INDEX IF NOT EXISTS idx_status_records_submitted_at 
ON status_records(submitted_at);
```

### 步骤 2：恢复 INSERT 操作

修改 `supabaseService.ts` 的 `submitUserStatus` 方法：

```typescript
// 使用 INSERT 而不是 UPSERT
const {data, error} = await supabase
  .from('status_records')
  .insert(statusData)
  .select()
  .single();
```

### 步骤 3：修改统计函数（可选）

如果需要按提交次数统计，修改 `get_real_time_stats` 函数：

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

**注意**：如果修改统计函数，会影响所有用户的统计方式。建议仅在测试环境使用。

## 执行步骤

### 1. 在 Supabase SQL Editor 中执行

```sql
-- 复制 allow_multiple_submissions.sql 的内容
-- 粘贴到 Supabase SQL Editor
-- 点击 Run
```

### 2. 重启应用

```bash
# 停止应用
# 重新启动
npm start
```

### 3. 测试

1. 登录测试账号
2. 提交第一次状态（例如：准点下班）
3. 观察参与人数（应该是 1）
4. 提交第二次状态（例如：加班）
5. 观察参与人数（应该是 2）
6. 继续提交，参与人数应该继续累加

## 数据验证

在 Supabase SQL Editor 中查询：

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
  AND date = CURRENT_DATE
ORDER BY submitted_at DESC;

-- 查看今日统计
SELECT * FROM get_real_time_stats();
```

## 注意事项

### 生产环境考虑

1. **普通用户限制**：
   - 前端仍然限制普通用户每天只能提交一次
   - 测试用户特殊处理，允许多次提交

2. **数据清理**：
   - 测试数据可能需要定期清理
   - 建议添加测试数据清理脚本

3. **统计方式**：
   - 如果修改了统计函数，需要考虑对生产数据的影响
   - 建议保持原有统计方式（按用户数），仅在测试环境修改

### 清理测试数据

```sql
-- 删除测试用户今天的所有提交
DELETE FROM status_records
WHERE user_id = '00000000-0000-0000-0000-000000000001'
  AND date = CURRENT_DATE;
```

## 文件清单

### 新增文件
- `allow_multiple_submissions.sql` - 数据库修改脚本
- `CUMULATIVE_SUBMISSION_FIX.md` - 本文档

### 修改文件
- `src/services/supabaseService.ts` - 恢复使用 INSERT

## 完成状态

✅ SQL 脚本已创建
✅ 代码已修改
⏳ 需要执行 SQL 脚本
⏳ 需要测试验证

## 下一步

1. 在 Supabase SQL Editor 中执行 `allow_multiple_submissions.sql`
2. 重启应用
3. 测试多次提交功能
4. 验证参与人数是否累计

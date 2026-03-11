# 测试账号多次提交修复

## 问题描述

测试账号第二次提交时报错：

```
ERROR Supabase Error: {"code": "23505", "details": null, "hint": null, "message": "duplicate key value violates unique constraint \"status_records_user_id_date_key\""}
ERROR Submit user status error: [Error: 数据已存在]
```

## 问题原因

数据库 `status_records` 表有唯一约束：
```sql
UNIQUE (user_id, date)
```

这意味着同一个用户在同一天只能有一条记录。

之前的代码使用 `INSERT` 操作，当记录已存在时会抛出重复键错误。

## 解决方案

将 `INSERT` 改为 `UPSERT`（UPDATE + INSERT）：

### 修改前
```typescript
const {data, error} = await supabase
  .from('status_records')
  .insert(statusData)
  .select()
  .single();
```

### 修改后
```typescript
const {data, error} = await supabase
  .from('status_records')
  .upsert(statusData, {
    onConflict: 'user_id,date',
  })
  .select()
  .single();
```

## UPSERT 行为

- **如果记录不存在**：插入新记录
- **如果记录已存在**（user_id + date 冲突）：更新现有记录

这样测试账号就可以在同一天多次提交，每次提交会更新之前的记录。

## 修改文件

- `OvertimeIndexApp/src/services/supabaseService.ts` - `submitUserStatus` 方法

## 测试步骤

1. 重启应用
2. 登录测试账号
3. 提交第一次状态（准点下班或加班）
4. 再次提交状态（选择不同的标签）
5. 应该成功提交，不再报错

## 数据验证

在 Supabase SQL Editor 中查询：

```sql
SELECT * FROM status_records 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
AND date = CURRENT_DATE;
```

应该只有一条记录，显示最后一次提交的数据。

## 注意事项

- 普通用户：前端逻辑仍然限制每天只能提交一次（按钮会消失）
- 测试用户：前端允许多次提交，后端使用 UPSERT 更新记录
- 数据库约束保持不变，确保数据完整性

## 完成

✅ 测试账号现在可以多次提交状态
✅ 每次提交会更新当天的记录
✅ 不会再出现重复键错误

# 修复趋势图圆点显示问题

## 问题描述

趋势图的7个圆点只显示了有数据的日期（1月29日和1月30日），其他没有人提交数据的日期不显示圆点。

## 期望行为

- 始终显示最近7天的圆点
- 即使某天没有人提交数据（participant_count = 0），也应该显示**绿色圆点**
- 逻辑：准点下班人数 >= 加班人数时显示绿色（包括都是0的情况）

## 解决方案

修改数据库函数 `get_daily_status`，使用 `generate_series` 生成完整的日期序列，然后 LEFT JOIN 实际数据。

## 执行步骤

### 1. 在 Supabase SQL Editor 中执行修复

```sql
-- 复制 fix_daily_status_show_all_days.sql 的内容并执行
```

或者直接在 SQL Editor 中执行：

```sql
CREATE OR REPLACE FUNCTION get_daily_status(days INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  is_overtime_dominant BOOLEAN,
  participant_count INTEGER,
  overtime_count INTEGER,
  on_time_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    -- 生成最近 N 天的日期序列
    SELECT generate_series(
      CURRENT_DATE - (days - 1),
      CURRENT_DATE,
      '1 day'::interval
    )::DATE as date
  )
  SELECT 
    ds.date,
    -- 当加班人数 > 准点人数时才是加班占主导（红色）
    -- 否则（包括相等和都是0）显示绿色
    COALESCE(dh.overtime_count > dh.on_time_count, false) as is_overtime_dominant,
    COALESCE(dh.participant_count, 0) as participant_count,
    COALESCE(dh.overtime_count, 0) as overtime_count,
    COALESCE(dh.on_time_count, 0) as on_time_count
  FROM date_series ds
  LEFT JOIN daily_history dh ON ds.date = dh.date
  ORDER BY ds.date ASC;
END;
$$ LANGUAGE plpgsql;
```

### 2. 验证修复

执行以下查询，应该看到最近7天的所有日期：

```sql
SELECT 
  date,
  participant_count,
  overtime_count,
  on_time_count,
  is_overtime_dominant,
  CASE 
    WHEN is_overtime_dominant THEN '🔴 红点 (加班多)'
    ELSE '🟢 绿点 (准点下班 >= 加班)'
  END as status_display
FROM get_daily_status(7)
ORDER BY date DESC;
```

### 3. 重启应用

```bash
cd OvertimeIndexApp
npx expo start
```

### 4. 测试

在应用中查看趋势页面，应该看到：
- ✅ 显示7个圆点（最近7天）
- ✅ 有数据的日期显示对应颜色（红色或绿色）
- ✅ 没有数据的日期显示绿色圆点
- ✅ 点击圆点可以查看详情

## 技术细节

### 修改前的逻辑

```sql
SELECT 
  dh.date,
  (dh.overtime_count > dh.on_time_count) as is_overtime_dominant,
  ...
FROM daily_history dh
WHERE dh.date >= CURRENT_DATE - days
```

**问题**：只返回 `daily_history` 表中存在的日期，如果某天没有数据就不返回。

### 修改后的逻辑

```sql
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - (days - 1),
    CURRENT_DATE,
    '1 day'::interval
  )::DATE as date
)
SELECT 
  ds.date,
  COALESCE(dh.overtime_count > dh.on_time_count, false) as is_overtime_dominant,
  COALESCE(dh.participant_count, 0) as participant_count,
  ...
FROM date_series ds
LEFT JOIN daily_history dh ON ds.date = dh.date
```

**改进**：
1. 使用 `generate_series` 生成完整的日期序列
2. LEFT JOIN 确保所有日期都返回
3. 使用 COALESCE 将 NULL 转换为 0
4. 当都是0时，`0 > 0 = false`，显示绿色

## 颜色规则

| 条件 | is_overtime_dominant | 圆点颜色 |
|------|---------------------|---------|
| 加班人数 > 准点人数 | true | 🔴 红色 |
| 加班人数 = 准点人数 | false | 🟢 绿色 |
| 加班人数 < 准点人数 | false | 🟢 绿色 |
| 都是 0（没有数据） | false | 🟢 绿色 |
| 今天且没有数据 | - | 🟡 黄色闪烁 (pending) |

## 相关文件

- `fix_daily_status_show_all_days.sql` - 修复 SQL 脚本
- `src/components/HistoricalStatusIndicator.tsx` - 圆点显示组件
- `src/services/supabaseService.ts` - 数据获取服务

# 历史数据显示修复

## 问题描述

用户反馈：历史状态指示器缺少1月30日的数据。

## 问题分析

经过分析，发现问题出在数据库函数 `get_daily_status` 的查询逻辑：

### 原始问题

```sql
-- 原始函数
WHERE dh.date >= CURRENT_DATE - days
ORDER BY dh.date DESC;
```

当 `days = 7` 时：
- 查询条件：`date >= CURRENT_DATE - 7`
- 今天是1月31日，查询的是 `date >= 1月24日`
- 返回数据：1月24、25、26、27、28、29、30、31（8天，包括今天）
- 排序：降序（DESC），所以顺序是 31、30、29、28、27、26、25、24

### 前端处理

前端 `HistoricalStatusIndicator` 组件：
1. 对数据按日期升序排序
2. 取最后7天：`slice(-7)`
3. 显示这7天的数据

但是由于数据库返回了8天的数据，前端取最后7天时，会丢失最早的一天（1月24日），但用户看到的顺序仍然不对。

## 解决方案

### 1. 修复数据库函数

修改 `get_daily_status` 函数的查询逻辑：

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
  SELECT 
    dh.date,
    (dh.overtime_count > dh.on_time_count) as is_overtime_dominant,
    dh.participant_count,
    dh.overtime_count,
    dh.on_time_count
  FROM daily_history dh
  WHERE dh.date >= CURRENT_DATE - (days - 1)  -- 修复：确保返回正确的天数
    AND dh.date <= CURRENT_DATE                -- 添加：不超过今天
  ORDER BY dh.date ASC;                        -- 修复：改为升序
END;
$$ LANGUAGE plpgsql;
```

**关键修改**：
1. `CURRENT_DATE - days` → `CURRENT_DATE - (days - 1)`
   - 确保返回正确的天数（包括今天）
   - 例如：`days = 7` 时，返回最近7天（包括今天）

2. 添加 `AND dh.date <= CURRENT_DATE`
   - 确保不会返回未来的日期

3. `ORDER BY dh.date DESC` → `ORDER BY dh.date ASC`
   - 改为升序排序，前端会处理显示顺序
   - 这样前端的 `slice(-7)` 逻辑更清晰

### 2. 更新测试数据

确保测试数据脚本插入足够的历史数据：

```sql
-- 插入过去10天的数据，确保有足够的数据用于测试
DELETE FROM daily_history WHERE date >= CURRENT_DATE - INTERVAL '10 days';

-- 插入8天前到昨天的数据（8条记录）
-- 这样即使今天没有数据，也能显示完整的7天历史
```

## 执行步骤

### 步骤1：修复数据库函数

在 Supabase SQL Editor 中执行：

```bash
# 执行修复脚本
OvertimeIndexApp/fix_daily_status_function.sql
```

### 步骤2：重新插入测试数据

在 Supabase SQL Editor 中执行：

```bash
# 执行测试数据脚本
OvertimeIndexApp/insert_historical_test_data.sql
```

### 步骤3：验证修复

执行以下 SQL 验证数据：

```sql
-- 1. 查看函数返回的数据
SELECT 
  date,
  is_overtime_dominant,
  participant_count,
  overtime_count,
  on_time_count
FROM get_daily_status(7)
ORDER BY date DESC;

-- 应该看到最近7天的数据（包括今天）
-- 日期从今天往前推7天

-- 2. 查看 daily_history 表中的所有数据
SELECT 
  date,
  participant_count,
  overtime_count,
  on_time_count,
  CASE 
    WHEN overtime_count > on_time_count THEN '红点 (加班多)'
    ELSE '绿点 (准时下班多)'
  END as status_display
FROM daily_history
WHERE date >= CURRENT_DATE - 10
ORDER BY date DESC;
```

### 步骤4：重启应用

重启应用以加载新数据：

```bash
# 在应用中下拉刷新，或重启应用
```

## 预期结果

修复后，历史状态指示器应该显示：

- **今天是1月31日**
- **显示的6个历史点**：1月25、26、27、28、29、30（从左到右）
- **第7个点**：今天（1月31日），显示为黄色闪烁（pending 状态）

如果今天有数据提交，第7个点会变成红色或绿色。

## 注意事项

1. **时区问题**：Supabase 使用 UTC 时区，如果在中国需要注意时区转换
2. **数据完整性**：确保 `daily_history` 表中有足够的历史数据
3. **自动归档**：设置定时任务后，每天23:59会自动归档当天的数据

## 相关文件

- `OvertimeIndexApp/fix_daily_status_function.sql` - 数据库函数修复脚本
- `OvertimeIndexApp/insert_historical_test_data.sql` - 测试数据脚本
- `OvertimeIndexApp/src/components/HistoricalStatusIndicator.tsx` - 前端组件
- `OvertimeIndexApp/src/services/supabaseService.ts` - 数据服务
- `OvertimeIndexApp/DAILY_ARCHIVE_SETUP.md` - 自动归档设置指南

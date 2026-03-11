# 🚀 立即执行：修复趋势图圆点显示

## 快速执行（3步）

### 1️⃣ 打开 Supabase SQL Editor

访问：https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

### 2️⃣ 复制并执行以下 SQL

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
    COALESCE(dh.overtime_count, 0) as overtime_count,
    COALESCE(dh.on_time_count, 0) as on_time_count
  FROM date_series ds
  LEFT JOIN daily_history dh ON ds.date = dh.date
  ORDER BY ds.date ASC;
END;
$$ LANGUAGE plpgsql;
```

点击 **RUN** 按钮执行。

### 3️⃣ 重启应用

```bash
cd OvertimeIndexApp
npx expo start
```

## ✅ 预期结果

修复后，趋势图将显示：
- **7个圆点**（最近7天，包括今天）
- 没有数据的日期显示**绿色圆点**
- 有数据的日期根据实际情况显示红色或绿色
- 今天如果没有数据显示**黄色闪烁**

## 🔍 验证修复

在 SQL Editor 中执行：

```sql
SELECT 
  date,
  participant_count,
  overtime_count,
  on_time_count,
  CASE 
    WHEN is_overtime_dominant THEN '🔴 红点'
    ELSE '🟢 绿点'
  END as 显示颜色
FROM get_daily_status(7)
ORDER BY date DESC;
```

应该看到7行数据，每天一行。

## 📝 修改说明

**之前**：只显示有数据的日期（1月29日、1月30日）

**现在**：显示最近7天的所有日期，没有数据的日期显示绿色（表示准点下班 >= 加班）

## 💡 为什么这样设计？

当某天没有人提交数据时：
- `overtime_count = 0`
- `on_time_count = 0`
- `0 > 0 = false` → 显示绿色
- 含义：没有人加班，默认认为是"准点下班"的好日子 😊

---

**完成后，趋势图将完整显示最近7天的状态！**

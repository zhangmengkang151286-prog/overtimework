# 修复数据库函数错误

## 错误信息
```
Error: Could not find the function public.get_real_time_stats without parameters in the schema cache
```

## 原因
Supabase 数据库中缺少必要的函数。需要在 Supabase 中执行初始化脚本。

---

## 🔧 解决方案

### 方法 1: 在 Supabase Dashboard 执行 SQL（推荐）

#### 步骤 1: 登录 Supabase Dashboard
访问：https://supabase.com/dashboard

#### 步骤 2: 选择你的项目
找到 "OvertimeIndex" 项目并点击进入

#### 步骤 3: 打开 SQL Editor
- 左侧菜单点击 **SQL Editor**
- 点击 **New query**

#### 步骤 4: 复制并执行以下 SQL

```sql
-- 创建获取实时统计数据的函数
CREATE OR REPLACE FUNCTION get_real_time_stats()
RETURNS TABLE (
  participant_count BIGINT,
  overtime_count BIGINT,
  on_time_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- 直接从 status_records 表查询今天的数据
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT user_id)::BIGINT as participant_count,
    SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END)::BIGINT as overtime_count,
    SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)::BIGINT as on_time_count,
    COALESCE(MAX(submitted_at), NOW()) as last_updated
  FROM status_records
  WHERE date = CURRENT_DATE;
  
  -- 如果没有数据，返回默认值
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取 Top N 标签统计的函数
CREATE OR REPLACE FUNCTION get_top_tags(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  tag_id UUID,
  tag_name VARCHAR,
  overtime_count BIGINT,
  on_time_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.tag_id,
    t.name as tag_name,
    SUM(CASE WHEN sr.is_overtime THEN 1 ELSE 0 END)::BIGINT as overtime_count,
    SUM(CASE WHEN NOT sr.is_overtime THEN 1 ELSE 0 END)::BIGINT as on_time_count,
    COUNT(*)::BIGINT as total_count
  FROM status_records sr
  JOIN tags t ON sr.tag_id = t.id
  WHERE sr.date = CURRENT_DATE
  GROUP BY sr.tag_id, t.name
  ORDER BY total_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取过去 N 天状态的函数
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
  WHERE dh.date >= CURRENT_DATE - days
  ORDER BY dh.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 步骤 5: 点击 "Run" 执行

看到 "Success" 就完成了！

---

### 方法 2: 使用完整初始化脚本

如果你还没有初始化数据库，可以执行完整的脚本：

#### 步骤 1: 打开 SQL Editor

#### 步骤 2: 复制整个 `supabase_init.sql` 文件内容

文件位置：`OvertimeIndexApp/supabase_init.sql`

#### 步骤 3: 粘贴到 SQL Editor 并执行

**注意：** 这会创建所有表、索引、函数等。如果已经有数据，请谨慎操作。

---

### 方法 3: 使用 Supabase CLI（高级）

如果你安装了 Supabase CLI：

```bash
# 登录
supabase login

# 链接项目
supabase link --project-ref your-project-ref

# 执行脚本
supabase db push
```

---

## ✅ 验证修复

执行完 SQL 后，在 SQL Editor 中运行：

```sql
-- 测试函数是否存在
SELECT * FROM get_real_time_stats();
```

应该返回类似这样的结果：
```
participant_count | overtime_count | on_time_count | last_updated
------------------+----------------+---------------+-------------
0                 | 0              | 0             | 2026-01-29...
```

---

## 🔄 重启应用

修复完成后：

1. **停止 Expo**（按 Ctrl+C）

2. **清除缓存重启**
   ```bash
   npx expo start --tunnel --clear
   ```

3. **在手机上重新加载**
   - 摇晃手机
   - 选择 "Reload"

---

## 🎯 快速修复（最小 SQL）

如果只想快速修复这个错误，只需执行这个函数：

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
    COUNT(DISTINCT user_id)::BIGINT,
    SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END)::BIGINT,
    SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)::BIGINT,
    COALESCE(MAX(submitted_at), NOW())
  FROM status_records
  WHERE date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 常见问题

### ❓ 问题 1: "permission denied for schema public"

**解决：** 在 SQL 前面加上：
```sql
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
```

### ❓ 问题 2: 函数创建成功但还是报错

**解决：** 清除 Supabase 缓存
```sql
NOTIFY pgrst, 'reload schema';
```

或者在 Supabase Dashboard 中：
- Settings → API → Restart API

### ❓ 问题 3: 表不存在

**解决：** 需要先执行完整的 `supabase_init.sql` 脚本创建所有表。

---

## 总结

**最快的修复方法：**

1. 打开 Supabase Dashboard → SQL Editor
2. 复制上面的 "快速修复" SQL
3. 点击 Run
4. 重启 Expo 应用

完成！应用应该可以正常运行了 🚀

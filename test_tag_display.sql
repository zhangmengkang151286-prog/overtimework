-- 测试标签显示的 SQL 脚本
-- 这个脚本会创建一些测试数据来验证标签显示功能

-- 1. 查看当前的标签数据
SELECT 
  '=== 当前 Top 10 标签 ===' as section;
SELECT * FROM get_top_tags(10);

-- 2. 查看今天的状态记录
SELECT 
  '=== 今天的状态记录 ===' as section;
SELECT 
  sr.id,
  sr.user_id,
  sr.status,
  sr.created_at,
  array_length(sr.tag_ids, 1) as tag_count,
  sr.tag_ids
FROM status_records sr
WHERE DATE(sr.created_at AT TIME ZONE 'Asia/Shanghai') = CURRENT_DATE
ORDER BY sr.created_at DESC
LIMIT 10;

-- 3. 查看标签详情
SELECT 
  '=== 标签详情 ===' as section;
SELECT 
  t.id,
  t.name,
  t.category,
  COUNT(DISTINCT sr.id) as usage_count
FROM tags t
LEFT JOIN status_records sr ON t.id = ANY(sr.tag_ids)
  AND DATE(sr.created_at AT TIME ZONE 'Asia/Shanghai') = CURRENT_DATE
GROUP BY t.id, t.name, t.category
HAVING COUNT(DISTINCT sr.id) > 0
ORDER BY usage_count DESC
LIMIT 20;

-- 4. 检查是否有空的 tag_ids
SELECT 
  '=== 检查空标签 ===' as section;
SELECT 
  COUNT(*) as records_with_empty_tags
FROM status_records sr
WHERE DATE(sr.created_at AT TIME ZONE 'Asia/Shanghai') = CURRENT_DATE
  AND (sr.tag_ids IS NULL OR array_length(sr.tag_ids, 1) = 0);

-- 5. 统计加班和准时的标签分布
SELECT 
  '=== 加班 vs 准时标签分布 ===' as section;
SELECT 
  t.name as tag_name,
  COUNT(CASE WHEN sr.status = 'overtime' THEN 1 END) as overtime_count,
  COUNT(CASE WHEN sr.status = 'ontime' THEN 1 END) as ontime_count,
  COUNT(*) as total_count
FROM status_records sr
CROSS JOIN LATERAL unnest(sr.tag_ids) AS tag_id
JOIN tags t ON t.id = tag_id
WHERE DATE(sr.created_at AT TIME ZONE 'Asia/Shanghai') = CURRENT_DATE
GROUP BY t.id, t.name
ORDER BY total_count DESC
LIMIT 10;

-- 诊断 get_top_tags 函数返回的数据
-- 这个查询会显示 Top 10 标签的详细信息

SELECT * FROM get_top_tags(10);

-- 同时查看原始的 status_records 表数据
SELECT 
  sr.id,
  sr.user_id,
  sr.status,
  sr.created_at,
  sr.tag_ids,
  t.id as tag_id,
  t.name as tag_name
FROM status_records sr
CROSS JOIN LATERAL unnest(sr.tag_ids) AS tag_id_unnest
LEFT JOIN tags t ON t.id = tag_id_unnest
WHERE DATE(sr.created_at AT TIME ZONE 'Asia/Shanghai') = CURRENT_DATE
ORDER BY sr.created_at DESC
LIMIT 20;

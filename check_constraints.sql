-- 查看 status_records 表的约束
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.status_records'::regclass;

-- 查看表结构
\d public.status_records

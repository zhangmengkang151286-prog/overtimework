-- 给 users 表添加性别和出生年份字段
-- 在 Supabase SQL Editor 中执行

-- 第一步：删除旧的 CHECK 约束（如果存在）
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_birth_year_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_gender_check;

-- 第二步：添加性别字段（如果不存在）
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS gender TEXT;

-- 第三步：添加出生年份字段（如果不存在）
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS birth_year INTEGER;

-- 第四步：重新添加 CHECK 约束（出生年份范围 1950~2026）
ALTER TABLE public.users
ADD CONSTRAINT users_gender_check CHECK (gender IN ('male', 'female'));

ALTER TABLE public.users
ADD CONSTRAINT users_birth_year_check CHECK (birth_year >= 1950 AND birth_year <= 2026);

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('gender', 'birth_year');

-- 验证约束
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname IN ('users_gender_check', 'users_birth_year_check');

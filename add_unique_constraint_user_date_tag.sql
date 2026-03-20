-- ============================================
-- 添加唯一约束：同一用户同一天同一标签不能重复
-- ============================================
-- 约束：UNIQUE(user_id, date, tag_id)
-- 效果：
--   - 一个用户一天选3个不同标签 → 3条记录，不冲突 ✅
--   - 同一用户同一天同一标签重复插入 → 数据库报错，被拦住 ✅
-- 前端配合：提交前先查数据库当天是否已有记录，有则不让提交
-- 执行位置：ECS 上通过 psql 执行，或 Supabase SQL Editor
-- ============================================

-- 1. 先清理可能存在的重复数据（同一用户同一天同一标签）
-- 保留最早的一条，删除后续重复的
DELETE FROM status_records
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY user_id, date, tag_id ORDER BY submitted_at ASC) as rn
    FROM status_records
    WHERE tag_id IS NOT NULL
  ) t
  WHERE t.rn > 1
);

-- 2. 添加唯一约束
ALTER TABLE status_records
  ADD CONSTRAINT unique_user_date_tag UNIQUE (user_id, date, tag_id);

-- 3. 验证约束已添加
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'status_records'::regclass
  AND contype = 'u';

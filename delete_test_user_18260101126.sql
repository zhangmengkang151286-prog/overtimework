-- 删除测试用户 18260101126
-- 用于测试注册流程

-- 删除用户记录（会级联删除相关数据）
DELETE FROM public.users 
WHERE phone_number = '18260101126';

-- 验证删除结果
SELECT 
  COUNT(*) as remaining_users,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ 用户已成功删除'
    ELSE '❌ 删除失败，用户仍然存在'
  END as status
FROM public.users 
WHERE phone_number = '18260101126';

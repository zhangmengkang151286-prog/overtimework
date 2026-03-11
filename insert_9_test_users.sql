-- ============================================
-- 插入 8 个测试用户
-- 密码: 12345aaa (SHA256 + 盐值加密)
-- 手机号格式: 符合中国手机号 ^1[3-9]\d{9}$
-- ============================================

-- 密码哈希: SHA256('12345aaa' + 'OvertimeIndexApp_2024_SecureSalt')
-- = cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0

-- 先删除已存在的测试用户（避免冲突）
DELETE FROM public.users WHERE phone_number IN (
  '13100000001', '13200000002', '13300000003',
  '13400000004', '13500000005', '13600000006',
  '13700000007', '13800000008'
);

-- 插入 8 个测试用户
INSERT INTO public.users (
  phone_number,
  password_hash,
  username,
  avatar_url,
  province,
  city,
  industry,
  company,
  position,
  work_start_time,
  work_end_time,
  is_profile_complete,
  is_active,
  password_failed_attempts,
  created_at,
  updated_at
) VALUES
(
  '13100000001',
  'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
  '张三',
  NULL,
  '北京市',
  '北京市',
  '互联网',
  '字节跳动',
  '前端工程师',
  '09:00',
  '18:00',
  true,
  true,
  0,
  NOW(),
  NOW()
),
(
  '13200000002',
  'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
  '李四',
  NULL,
  '上海市',
  '上海市',
  '金融',
  '招商银行',
  '产品经理',
  '08:30',
  '17:30',
  true,
  true,
  0,
  NOW(),
  NOW()
),
(
  '13300000003',
  'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
  '王五',
  NULL,
  '广东省',
  '深圳市',
  '硬件制造',
  '华为技术',
  '嵌入式工程师',
  '09:00',
  '18:30',
  true,
  true,
  0,
  NOW(),
  NOW()
),
(
  '13400000004',
  'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
  '赵六',
  NULL,
  '浙江省',
  '杭州市',
  '电子商务',
  '阿里巴巴',
  'Java开发',
  '10:00',
  '19:00',
  true,
  true,
  0,
  NOW(),
  NOW()
),
(
  '13500000005',
  'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
  '孙七',
  NULL,
  '四川省',
  '成都市',
  '游戏',
  '腾讯天美',
  'Unity开发',
  '10:00',
  '19:00',
  true,
  true,
  0,
  NOW(),
  NOW()
),
(
  '13600000006',
  'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
  '周八',
  NULL,
  '广东省',
  '广州市',
  '教育',
  '网易有道',
  'UI设计师',
  '09:30',
  '18:30',
  true,
  true,
  0,
  NOW(),
  NOW()
),
(
  '13700000007',
  'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
  '吴九',
  NULL,
  '江苏省',
  '南京市',
  '医疗健康',
  '丁香园',
  '后端工程师',
  '08:30',
  '17:30',
  true,
  true,
  0,
  NOW(),
  NOW()
),
(
  '13800000008',
  'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
  '郑十',
  NULL,
  '湖北省',
  '武汉市',
  '物流',
  '京东物流',
  '数据分析师',
  '09:00',
  '18:00',
  true,
  true,
  0,
  NOW(),
  NOW()
);

-- 验证插入结果
SELECT
  phone_number,
  username,
  province,
  city,
  industry,
  company,
  position,
  is_profile_complete,
  CASE WHEN password_hash IS NOT NULL THEN '已设置' ELSE '未设置' END as password_status
FROM public.users
WHERE phone_number IN (
  '13100000001', '13200000002', '13300000003',
  '13400000004', '13500000005', '13600000006',
  '13700000007', '13800000008'
)
ORDER BY phone_number;

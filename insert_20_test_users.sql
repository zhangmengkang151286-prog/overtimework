-- ============================================
-- 插入 20 个测试用户
-- 密码: 12345aaa (SHA256 + 盐值加密)
-- 手机号格式: 符合中国手机号 ^1[3-9]\d{9}$
-- ============================================

-- 密码哈希: SHA256('12345aaa' + 'OvertimeIndexApp_2024_SecureSalt')
-- = cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0

-- 先删除已存在的测试用户（避免冲突）
DELETE FROM public.users WHERE phone_number IN (
  '13900100001', '13900100002', '13900100003', '13900100004', '13900100005',
  '13900100006', '13900100007', '13900100008', '13900100009', '13900100010',
  '13900100011', '13900100012', '13900100013', '13900100014', '13900100015',
  '13900100016', '13900100017', '13900100018', '13900100019', '13900100020'
);

-- 插入 20 个测试用户
INSERT INTO public.users (
  phone_number, password_hash, username, avatar_url,
  province, city, industry, company, position,
  work_start_time, work_end_time,
  is_profile_complete, is_active, password_failed_attempts,
  created_at, updated_at
) VALUES
('13900100001', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '林小明', NULL, '北京市', '北京市', '互联网', '百度', '前端工程师', '09:00', '18:00', true, true, 0, NOW(), NOW()),
('13900100002', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '陈晓红', NULL, '上海市', '上海市', '金融', '中金公司', '风控分析师', '08:30', '17:30', true, true, 0, NOW(), NOW()),
('13900100003', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '黄志强', NULL, '广东省', '深圳市', '互联网', '大疆创新', '嵌入式工程师', '09:00', '18:30', true, true, 0, NOW(), NOW()),
('13900100004', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '刘雨萱', NULL, '浙江省', '杭州市', '电子商务', '网易严选', '产品经理', '09:30', '18:30', true, true, 0, NOW(), NOW()),
('13900100005', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '杨建国', NULL, '四川省', '成都市', '游戏', '完美世界', 'Unity开发', '10:00', '19:00', true, true, 0, NOW(), NOW()),
('13900100006', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '吴佳琪', NULL, '江苏省', '南京市', '教育', '好未来', 'UI设计师', '09:00', '18:00', true, true, 0, NOW(), NOW()),
('13900100007', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '许文博', NULL, '湖北省', '武汉市', '医疗健康', '联影医疗', '后端工程师', '08:30', '17:30', true, true, 0, NOW(), NOW()),
('13900100008', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '何思远', NULL, '重庆市', '重庆市', '物流', '顺丰科技', '数据分析师', '09:00', '18:00', true, true, 0, NOW(), NOW()),
('13900100009', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '郭美玲', NULL, '天津市', '天津市', '互联网', '58同城', '测试工程师', '09:00', '18:00', true, true, 0, NOW(), NOW()),
('13900100010', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '马俊杰', NULL, '福建省', '厦门市', '互联网', '美图公司', 'iOS开发', '09:30', '18:30', true, true, 0, NOW(), NOW()),
('13900100011', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '罗天宇', NULL, '湖南省', '长沙市', '互联网', '芒果TV', '运维工程师', '09:00', '18:00', true, true, 0, NOW(), NOW()),
('13900100012', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '谢雅婷', NULL, '山东省', '济南市', '金融', '海尔金融', '项目经理', '08:30', '17:30', true, true, 0, NOW(), NOW()),
('13900100013', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '韩子轩', NULL, '辽宁省', '大连市', '硬件制造', '英特尔大连', '芯片工程师', '08:00', '17:00', true, true, 0, NOW(), NOW()),
('13900100014', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '冯晓燕', NULL, '陕西省', '西安市', '互联网', '华为西研所', 'Android开发', '09:00', '18:00', true, true, 0, NOW(), NOW()),
('13900100015', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '曹文杰', NULL, '安徽省', '合肥市', '互联网', '科大讯飞', 'AI算法工程师', '09:00', '18:30', true, true, 0, NOW(), NOW()),
('13900100016', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '彭丽华', NULL, '河南省', '郑州市', '物流', '中原物流', '运营专员', '08:30', '17:30', true, true, 0, NOW(), NOW()),
('13900100017', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '蒋浩然', NULL, '广东省', '东莞市', '硬件制造', 'OPPO', '硬件工程师', '09:00', '18:00', true, true, 0, NOW(), NOW()),
('13900100018', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '沈梦瑶', NULL, '江苏省', '苏州市', '互联网', '同程旅行', '全栈工程师', '09:30', '18:30', true, true, 0, NOW(), NOW()),
('13900100019', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '魏国栋', NULL, '河北省', '石家庄市', '教育', '新东方', '课程设计师', '08:30', '17:30', true, true, 0, NOW(), NOW()),
('13900100020', 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0',
 '唐诗韵', NULL, '云南省', '昆明市', '医疗健康', '云南白药', '数据工程师', '09:00', '18:00', true, true, 0, NOW(), NOW());

-- 验证插入结果
SELECT
  phone_number AS "手机号",
  username AS "姓名",
  province AS "省份",
  city AS "城市",
  company AS "公司",
  position AS "职位",
  CASE WHEN password_hash IS NOT NULL THEN '已设置' ELSE '未设置' END AS "密码状态"
FROM public.users
WHERE phone_number LIKE '139001000%'
ORDER BY phone_number;

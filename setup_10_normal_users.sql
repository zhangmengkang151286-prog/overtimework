-- ============================================
-- 清理测试账户并创建10个普通用户
-- ============================================

-- 第1步：删除测试账户的所有数据
DELETE FROM status_records 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

DELETE FROM users 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 第2步：清空所有归档数据（重新开始）
DELETE FROM daily_history;

-- 第3步：清空所有快照数据（重新开始）
DELETE FROM hourly_snapshots;

-- 第4步：创建10个普通用户
INSERT INTO users (id, phone_number, username, province, city, industry, company, position, work_start_time, work_end_time)
VALUES
  (gen_random_uuid(), '13800000001', '张三', '北京市', '北京市', '互联网', '字节跳动', '前端工程师', '09:00', '18:00'),
  (gen_random_uuid(), '13800000002', '李四', '上海市', '上海市', '互联网', '阿里巴巴', '后端工程师', '09:30', '18:30'),
  (gen_random_uuid(), '13800000003', '王五', '广东省', '深圳市', '互联网', '腾讯', '产品经理', '09:00', '18:00'),
  (gen_random_uuid(), '13800000004', '赵六', '浙江省', '杭州市', '金融', '蚂蚁金服', '数据分析师', '09:00', '18:00'),
  (gen_random_uuid(), '13800000005', '钱七', '北京市', '北京市', '互联网', '美团', 'UI设计师', '10:00', '19:00'),
  (gen_random_uuid(), '13800000006', '孙八', '上海市', '上海市', '互联网', '拼多多', '测试工程师', '09:00', '18:00'),
  (gen_random_uuid(), '13800000007', '周九', '广东省', '广州市', '互联网', '网易', '运营专员', '09:30', '18:30'),
  (gen_random_uuid(), '13800000008', '吴十', '四川省', '成都市', '互联网', '字节跳动', '算法工程师', '10:00', '19:00'),
  (gen_random_uuid(), '13800000009', '郑十一', '江苏省', '南京市', '金融', '苏宁', '项目经理', '09:00', '18:00'),
  (gen_random_uuid(), '13800000010', '陈十二', '湖北省', '武汉市', '互联网', '小米', '架构师', '09:30', '18:30');

-- 第5步：验证用户创建成功
SELECT 
  id as "用户ID",
  username as "姓名",
  phone_number as "手机号",
  company as "公司",
  position as "职位"
FROM users
ORDER BY phone_number;

-- 第6步：确保 status_records 表有 UNIQUE 约束
-- 这样每个用户每天只能提交一次
DO $$
BEGIN
  -- 检查约束是否存在
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'unique_user_date'
  ) THEN
    -- 添加唯一约束
    ALTER TABLE status_records
    ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);
    
    RAISE NOTICE '✅ 已添加 UNIQUE 约束：每个用户每天只能提交一次';
  ELSE
    RAISE NOTICE '✅ UNIQUE 约束已存在';
  END IF;
END $$;

-- 第7步：验证约束
SELECT 
  conname as "约束名称",
  contype as "约束类型",
  pg_get_constraintdef(oid) as "约束定义"
FROM pg_constraint
WHERE conrelid = 'status_records'::regclass
  AND conname = 'unique_user_date';

-- ============================================
-- 说明
-- ============================================
-- 
-- 执行完成后：
-- 1. ✅ 测试账户已删除
-- 2. ✅ 所有历史数据已清空
-- 3. ✅ 创建了10个普通用户
-- 4. ✅ 添加了 UNIQUE 约束，每个用户每天只能提交一次
-- 
-- 下一步：
-- - 使用这10个用户的手机号登录应用
-- - 每个用户每天只能提交一次状态
-- - 如果尝试重复提交，会报错：duplicate key value violates unique constraint

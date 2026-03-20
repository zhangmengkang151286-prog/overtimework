-- ============================================
-- 随机创建 100 个测试用户 + 今天的状态提交
-- 已适配 RDS 实际 users 表结构（无 is_active 字段）
-- ============================================

-- 第0步：清理重复数据并创建唯一约束
DO $$
BEGIN
  -- 先删除重复的 status_records（保留最新的一条）
  DELETE FROM status_records a USING status_records b
  WHERE a.id < b.id 
    AND a.user_id = b.user_id 
    AND a.date = b.date;
  
  RAISE NOTICE '✅ 已清理重复的 status_records';

  -- 检查并创建唯一约束
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'status_records_user_date_unique'
  ) THEN
    ALTER TABLE status_records 
    ADD CONSTRAINT status_records_user_date_unique 
    UNIQUE (user_id, date);
    RAISE NOTICE '✅ 已添加 status_records 唯一约束';
  ELSE
    RAISE NOTICE '✅ status_records 唯一约束已存在';
  END IF;
END $$;

-- 第1步：清理旧的测试数据
DELETE FROM status_records WHERE user_id IN (
  SELECT id FROM users WHERE phone_number LIKE '13900200%'
);
DELETE FROM users WHERE phone_number LIKE '13900200%';

-- 第2步：创建 100 个测试用户 + 为每个用户插入今天的状态
DO $$
DECLARE
  i INTEGER;
  v_user_id UUID;
  v_phone TEXT;
  v_username TEXT;
  v_gender TEXT;
  v_birth_year INTEGER;
  v_province TEXT;
  v_city TEXT;
  v_industry TEXT;
  v_position TEXT;
  v_work_start TEXT;
  v_work_end TEXT;
  v_is_overtime BOOLEAN;
  v_tag_id UUID;
  v_overtime_hours INTEGER;
  v_submit_hour INTEGER;
  v_submit_min INTEGER;
  v_submitted_at TIMESTAMPTZ;
  v_tag_category TEXT;

  surnames TEXT[] := ARRAY[
    '赵','钱','孙','李','周','吴','郑','王','冯','陈',
    '褚','卫','蒋','沈','韩','杨','朱','秦','尤','许',
    '何','吕','施','张','孔','曹','严','华','金','魏',
    '陶','姜','戚','谢','邹','喻','柏','水','窦','章',
    '云','苏','潘','葛','奚','范','彭','郎','鲁','韦'
  ];
  given_names TEXT[] := ARRAY[
    '明华','志强','伟杰','芳芳','娜娜','秀英','敏敏','静静','丽丽','刚强',
    '军军','勇勇','杰杰','磊磊','涛涛','鑫鑫','洋洋','峰峰','超超','博文',
    '宇航','浩然','凯旋','翔宇','龙飞','飞鹏','辉煌','斌斌','健康','豪杰',
    '彬彬','昊天','祥瑞','威武','坤坤','毅力','松松','良辰','海波','云天',
    '星辰','月华','雪梅','风云','雨露','霜降','梅花','兰花','竹青','菊香'
  ];
  provinces TEXT[] := ARRAY[
    '北京市','上海市','广东省','浙江省','江苏省',
    '四川省','湖北省','重庆市','天津市','福建省',
    '湖南省','山东省','辽宁省','陕西省','安徽省',
    '河南省','河北省','云南省','广西壮族自治区','贵州省'
  ];
  cities TEXT[] := ARRAY[
    '北京市','上海市','深圳市','杭州市','南京市',
    '成都市','武汉市','重庆市','天津市','厦门市',
    '长沙市','济南市','大连市','西安市','合肥市',
    '郑州市','石家庄市','昆明市','南宁市','贵阳市'
  ];
  industries TEXT[] := ARRAY[
    '互联网','金融','教育','医疗健康','电子商务',
    '游戏','物流','硬件制造','人工智能','新能源',
    '房地产','传媒','咨询','零售','汽车'
  ];
  positions TEXT[] := ARRAY[
    '前端工程师','后端工程师','全栈工程师','iOS开发','Android开发',
    '产品经理','UI设计师','数据分析师','测试工程师','运维工程师',
    'AI算法工程师','项目经理','运营专员','架构师','DBA'
  ];
  work_starts TEXT[] := ARRAY['08:00','08:30','09:00','09:30','10:00'];
  work_ends TEXT[] := ARRAY['17:00','17:30','18:00','18:30','19:00'];
  pwd_hash TEXT := 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0';

BEGIN
  FOR i IN 1..100 LOOP
    -- 生成随机用户数据
    v_phone := '139002' || LPAD(i::TEXT, 5, '0');
    v_username := surnames[1 + floor(random() * array_length(surnames, 1))::int]
               || given_names[1 + floor(random() * array_length(given_names, 1))::int];
    v_gender := CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END;
    v_birth_year := 1975 + floor(random() * 28)::int;
    v_province := provinces[1 + floor(random() * array_length(provinces, 1))::int];
    v_city := cities[1 + floor(random() * array_length(cities, 1))::int];
    v_industry := industries[1 + floor(random() * array_length(industries, 1))::int];
    v_position := positions[1 + floor(random() * array_length(positions, 1))::int];
    v_work_start := work_starts[1 + floor(random() * array_length(work_starts, 1))::int];
    v_work_end := work_ends[1 + floor(random() * array_length(work_ends, 1))::int];

    -- 插入用户（已适配 RDS 实际表结构，无 is_active 字段）
    INSERT INTO users (
      phone_number, password_hash, username, avatar_url,
      province, city, industry, position, gender, birth_year,
      work_start_time, work_end_time,
      is_profile_complete, password_failed_attempts,
      created_at, updated_at
    ) VALUES (
      v_phone, pwd_hash, v_username, NULL,
      v_province, v_city, v_industry, v_position, v_gender, v_birth_year,
      v_work_start::time, v_work_end::time,
      true, 0,
      NOW(), NOW()
    )
    ON CONFLICT (phone_number) DO NOTHING
    RETURNING id INTO v_user_id;

    -- 如果用户已存在（ON CONFLICT），获取已有 id
    IF v_user_id IS NULL THEN
      SELECT id INTO v_user_id FROM users WHERE phone_number = v_phone;
    END IF;

    -- 60% 概率加班，40% 准点
    v_is_overtime := (random() < 0.6);

    -- 根据加班/准点选择对应 category 的标签
    IF v_is_overtime THEN
      v_tag_category := 'overtime';
      v_overtime_hours := 1 + floor(random() * 5)::int;
    ELSE
      v_tag_category := 'ontime';
      v_overtime_hours := NULL;  -- 准点时加班时长为 NULL
    END IF;

    -- 从 tags 表随机选一个对应 category 的标签
    SELECT id INTO v_tag_id
    FROM tags
    WHERE type = 'custom' AND category = v_tag_category
    ORDER BY random()
    LIMIT 1;

    -- 如果没找到对应 category 的标签，退而求其次选任意 custom 标签
    IF v_tag_id IS NULL THEN
      SELECT id INTO v_tag_id FROM tags WHERE type = 'custom' ORDER BY random() LIMIT 1;
    END IF;

    -- 随机提交时间：今天 08:00 ~ 22:00（北京时间）
    v_submit_hour := 8 + floor(random() * 14)::int;
    v_submit_min := floor(random() * 60)::int;
    v_submitted_at := (CURRENT_DATE + make_interval(hours => v_submit_hour, mins => v_submit_min))
                      AT TIME ZONE 'Asia/Shanghai';

    -- 插入今天的状态记录
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
    VALUES (v_user_id, CURRENT_DATE, v_is_overtime, v_tag_id, v_overtime_hours, v_submitted_at)
    ON CONFLICT (user_id, date) DO NOTHING;

    IF i % 10 = 0 THEN
      RAISE NOTICE '已创建 % 个用户...', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ 完成！共创建 100 个测试用户';
END $$;

-- 第3步：验证用户创建结果
SELECT COUNT(*) AS "测试用户总数" FROM users WHERE phone_number LIKE '13900200%';

-- 第4步：验证状态提交结果
SELECT
  COUNT(*) AS "今日状态总数",
  COUNT(*) FILTER (WHERE is_overtime = true) AS "加班人数",
  COUNT(*) FILTER (WHERE is_overtime = false) AS "准点人数",
  TO_CHAR(MIN(submitted_at AT TIME ZONE 'Asia/Shanghai'), 'HH24:MI') AS "最早提交",
  TO_CHAR(MAX(submitted_at AT TIME ZONE 'Asia/Shanghai'), 'HH24:MI') AS "最晚提交"
FROM status_records
WHERE date = CURRENT_DATE
  AND user_id IN (SELECT id FROM users WHERE phone_number LIKE '13900200%');

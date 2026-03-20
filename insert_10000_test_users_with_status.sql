-- 扩展到 10000 个测试用户 + 今天的随机状态提交
-- 已有 100 个用户（13900200001~13900200100），新增 9900 个
-- 每个用户随机 1~3 个标签，适配 UNIQUE(user_id, date, tag_id)
-- 使用 $body$ 命名标签避免终端解析问题

-- 第1步：批量创建 9900 个新用户（编号 101~10000）
DO $body$
DECLARE
  i INTEGER;
  v_phone TEXT;
  v_username TEXT;
  v_gender TEXT;
  v_birth_year INTEGER;
  v_processed INTEGER := 0;
  surnames TEXT[] := ARRAY['赵','钱','孙','李','周','吴','郑','王','冯','陈','褚','卫','蒋','沈','韩','杨','朱','秦','尤','许','何','吕','施','张','孔','曹','严','华','金','魏','陶','姜','戚','谢','邹','喻','柏','水','窦','章','云','苏','潘','葛','奚','范','彭','郎','鲁','韦'];
  given_names TEXT[] := ARRAY['明华','志强','伟杰','芳芳','娜娜','秀英','敏敏','静静','丽丽','刚强','军军','勇勇','杰杰','磊磊','涛涛','鑫鑫','洋洋','峰峰','超超','博文','宇航','浩然','凯旋','翔宇','龙飞','飞鹏','辉煌','斌斌','健康','豪杰','彬彬','昊天','祥瑞','威武','坤坤','毅力','松松','良辰','海波','云天','星辰','月华','雪梅','风云','雨露','霜降','梅花','兰花','竹青','菊香'];
  provinces TEXT[] := ARRAY['北京市','上海市','广东省','浙江省','江苏省','四川省','湖北省','重庆市','天津市','福建省','湖南省','山东省','辽宁省','陕西省','安徽省','河南省','河北省','云南省','广西壮族自治区','贵州省'];
  cities TEXT[] := ARRAY['北京市','上海市','深圳市','杭州市','南京市','成都市','武汉市','重庆市','天津市','厦门市','长沙市','济南市','大连市','西安市','合肥市','郑州市','石家庄市','昆明市','南宁市','贵阳市'];
  industries TEXT[] := ARRAY['互联网','金融','教育','医疗健康','电子商务','游戏','物流','硬件制造','人工智能','新能源','房地产','传媒','咨询','零售','汽车'];
  positions TEXT[] := ARRAY['前端工程师','后端工程师','全栈工程师','iOS开发','Android开发','产品经理','UI设计师','数据分析师','测试工程师','运维工程师','AI算法工程师','项目经理','运营专员','架构师','DBA'];
  work_starts TEXT[] := ARRAY['08:00','08:30','09:00','09:30','10:00'];
  work_ends TEXT[] := ARRAY['17:00','17:30','18:00','18:30','19:00'];
  pwd_hash TEXT := 'cbe2d6a543df75084ba45bd46258770cc6810ed732d6265a0a5ad2bf7d96e7a0';
BEGIN
  FOR i IN 101..10000 LOOP
    v_phone := '139002' || LPAD(i::TEXT, 5, '0');
    v_username := surnames[1 + floor(random() * array_length(surnames, 1))::int] || given_names[1 + floor(random() * array_length(given_names, 1))::int];
    v_gender := CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END;
    v_birth_year := 1975 + floor(random() * 28)::int;
    INSERT INTO users (phone_number, password_hash, username, avatar_url, province, city, industry, position, gender, birth_year, work_start_time, work_end_time, is_profile_complete, password_failed_attempts, created_at, updated_at)
    VALUES (v_phone, pwd_hash, v_username, NULL, provinces[1 + floor(random() * array_length(provinces, 1))::int], cities[1 + floor(random() * array_length(cities, 1))::int], industries[1 + floor(random() * array_length(industries, 1))::int], positions[1 + floor(random() * array_length(positions, 1))::int], v_gender, v_birth_year, work_starts[1 + floor(random() * array_length(work_starts, 1))::int]::time, work_ends[1 + floor(random() * array_length(work_ends, 1))::int]::time, true, 0, NOW(), NOW())
    ON CONFLICT (phone_number) DO NOTHING;
    v_processed := v_processed + 1;
    IF v_processed % 2000 = 0 THEN
      RAISE NOTICE '已创建 % 个新用户...', v_processed;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ 9900 个新用户创建完成，共处理 % 条', v_processed;
END $body$;

-- 第2步：为所有 10000 个测试用户插入今天的随机状态（每人 1~3 个标签）
DO $body$
DECLARE
  v_user RECORD;
  v_is_overtime BOOLEAN;
  v_tag_category TEXT;
  v_tag RECORD;
  v_tag_count INTEGER;
  v_overtime_hours INTEGER;
  v_submit_hour INTEGER;
  v_submit_min INTEGER;
  v_submitted_at TIMESTAMPTZ;
  v_processed INTEGER := 0;
  v_inserted INTEGER := 0;
BEGIN
  FOR v_user IN
    SELECT id FROM users WHERE phone_number LIKE '139002%' ORDER BY phone_number
  LOOP
    v_is_overtime := (random() < 0.6);
    IF v_is_overtime THEN
      v_tag_category := 'overtime';
      v_overtime_hours := 1 + floor(random() * 5)::int;
    ELSE
      v_tag_category := 'ontime';
      v_overtime_hours := NULL;
    END IF;
    v_tag_count := 1 + floor(random() * 3)::int;
    FOR v_tag IN
      SELECT id FROM tags WHERE category = v_tag_category ORDER BY random() LIMIT v_tag_count
    LOOP
      v_submit_hour := 8 + floor(random() * 14)::int;
      v_submit_min := floor(random() * 60)::int;
      v_submitted_at := (CURRENT_DATE + make_interval(hours => v_submit_hour, mins => v_submit_min)) AT TIME ZONE 'Asia/Shanghai';
      INSERT INTO status_records (user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
      VALUES (v_user.id, CURRENT_DATE, v_is_overtime, v_tag.id, v_overtime_hours, v_submitted_at)
      ON CONFLICT (user_id, date, tag_id) DO NOTHING;
      v_inserted := v_inserted + 1;
    END LOOP;
    v_processed := v_processed + 1;
    IF v_processed % 2000 = 0 THEN
      RAISE NOTICE '已处理 % 个用户的状态...', v_processed;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ 状态插入完成，共处理 % 个用户，插入 % 条记录', v_processed, v_inserted;
END $body$;

-- 第3步：验证结果
SELECT COUNT(*) AS "测试用户总数" FROM users WHERE phone_number LIKE '139002%';

SELECT
  COUNT(DISTINCT user_id) AS "今日提交用户数",
  COUNT(*) AS "今日状态记录总数（含多标签）",
  COUNT(*) FILTER (WHERE is_overtime = true) AS "加班记录数",
  COUNT(*) FILTER (WHERE is_overtime = false) AS "准时记录数"
FROM status_records
WHERE date = CURRENT_DATE
  AND user_id IN (SELECT id FROM users WHERE phone_number LIKE '139002%');

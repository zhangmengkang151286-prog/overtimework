-- ============================================
-- 设置真实的测试数据
-- 删除所有历史数据，使用当前登录用户创建今天的多次提交
-- 数据时间不超过当前时间
-- ============================================

-- 1. 删除所有历史数据并创建测试数据
DO $$
DECLARE
  v_current_user_id UUID;
  v_current_time TIMESTAMPTZ;
  v_current_hour INTEGER;
  v_tag_meeting UUID;
  v_tag_coding UUID;
  v_tag_debugging UUID;
  v_submission_count INTEGER := 0;
BEGIN
  -- 删除所有历史数据
  DELETE FROM hourly_snapshots;
  DELETE FROM status_records;
  
  RAISE NOTICE '已删除所有历史数据';
  
  -- 获取当前时间（北京时间）
  v_current_time := NOW() AT TIME ZONE 'Asia/Shanghai';
  v_current_hour := EXTRACT(HOUR FROM v_current_time)::INTEGER;
  
  RAISE NOTICE '当前时间: %, 当前小时: %', v_current_time, v_current_hour;
  
  -- 获取当前登录的测试用户（假设是最近创建的用户）
  SELECT id INTO v_current_user_id 
  FROM public.users 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION '未找到测试用户，请先创建用户';
  END IF;
  
  RAISE NOTICE '使用用户ID: %', v_current_user_id;
  
  -- 获取或创建标签
  SELECT id INTO v_tag_meeting FROM tags WHERE name = '开会' LIMIT 1;
  IF v_tag_meeting IS NULL THEN
    INSERT INTO tags (name, type, is_active) VALUES ('开会', 'custom', true) RETURNING id INTO v_tag_meeting;
  END IF;
  
  SELECT id INTO v_tag_coding FROM tags WHERE name = '写代码' LIMIT 1;
  IF v_tag_coding IS NULL THEN
    INSERT INTO tags (name, type, is_active) VALUES ('写代码', 'custom', true) RETURNING id INTO v_tag_coding;
  END IF;
  
  SELECT id INTO v_tag_debugging FROM tags WHERE name = '调试' LIMIT 1;
  IF v_tag_debugging IS NULL THEN
    INSERT INTO tags (name, type, is_active) VALUES ('调试', 'custom', true) RETURNING id INTO v_tag_debugging;
  END IF;
  
  -- 3. 创建今天的多次提交数据（从早上6点到当前时间）
  -- 只创建不超过当前时间的数据
  
  -- 如果当前时间 >= 7:30，创建 7:30 的提交（准时）
  IF v_current_hour >= 7 OR (v_current_hour = 7 AND EXTRACT(MINUTE FROM v_current_time) >= 30) THEN
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (
      v_current_user_id,
      CURRENT_DATE,
      false,
      v_tag_meeting,
      CURRENT_DATE + INTERVAL '7 hours 30 minutes'
    );
    v_submission_count := v_submission_count + 1;
  END IF;
  
  -- 如果当前时间 >= 9:15，创建 9:15 的提交（加班）
  IF v_current_hour >= 9 OR (v_current_hour = 9 AND EXTRACT(MINUTE FROM v_current_time) >= 15) THEN
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (
      v_current_user_id,
      CURRENT_DATE,
      true,
      v_tag_coding,
      CURRENT_DATE + INTERVAL '9 hours 15 minutes'
    );
    v_submission_count := v_submission_count + 1;
  END IF;
  
  -- 如果当前时间 >= 11:00，创建 11:00 的提交（准时）
  IF v_current_hour >= 11 THEN
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (
      v_current_user_id,
      CURRENT_DATE,
      false,
      v_tag_meeting,
      CURRENT_DATE + INTERVAL '11 hours'
    );
    v_submission_count := v_submission_count + 1;
  END IF;
  
  -- 如果当前时间 >= 13:30，创建 13:30 的提交（加班）
  IF v_current_hour >= 13 OR (v_current_hour = 13 AND EXTRACT(MINUTE FROM v_current_time) >= 30) THEN
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (
      v_current_user_id,
      CURRENT_DATE,
      true,
      v_tag_debugging,
      CURRENT_DATE + INTERVAL '13 hours 30 minutes'
    );
    v_submission_count := v_submission_count + 1;
  END IF;
  
  -- 如果当前时间 >= 15:45，创建 15:45 的提交（准时）
  IF v_current_hour >= 15 OR (v_current_hour = 15 AND EXTRACT(MINUTE FROM v_current_time) >= 45) THEN
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (
      v_current_user_id,
      CURRENT_DATE,
      false,
      v_tag_coding,
      CURRENT_DATE + INTERVAL '15 hours 45 minutes'
    );
    v_submission_count := v_submission_count + 1;
  END IF;
  
  -- 如果当前时间 >= 17:20，创建 17:20 的提交（加班）
  IF v_current_hour >= 17 OR (v_current_hour = 17 AND EXTRACT(MINUTE FROM v_current_time) >= 20) THEN
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (
      v_current_user_id,
      CURRENT_DATE,
      true,
      v_tag_meeting,
      CURRENT_DATE + INTERVAL '17 hours 20 minutes'
    );
    v_submission_count := v_submission_count + 1;
  END IF;
  
  -- 如果当前时间 >= 19:10，创建 19:10 的提交（准时）
  IF v_current_hour >= 19 OR (v_current_hour = 19 AND EXTRACT(MINUTE FROM v_current_time) >= 10) THEN
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (
      v_current_user_id,
      CURRENT_DATE,
      false,
      v_tag_debugging,
      CURRENT_DATE + INTERVAL '19 hours 10 minutes'
    );
    v_submission_count := v_submission_count + 1;
  END IF;
  
  -- 如果当前时间 >= 20:30，创建 20:30 的提交（加班）
  IF v_current_hour >= 20 OR (v_current_hour = 20 AND EXTRACT(MINUTE FROM v_current_time) >= 30) THEN
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (
      v_current_user_id,
      CURRENT_DATE,
      true,
      v_tag_coding,
      CURRENT_DATE + INTERVAL '20 hours 30 minutes'
    );
    v_submission_count := v_submission_count + 1;
  END IF;
  
  -- 如果当前时间 >= 21:45，创建 21:45 的提交（准时）
  IF v_current_hour >= 21 OR (v_current_hour = 21 AND EXTRACT(MINUTE FROM v_current_time) >= 45) THEN
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (
      v_current_user_id,
      CURRENT_DATE,
      false,
      v_tag_meeting,
      CURRENT_DATE + INTERVAL '21 hours 45 minutes'
    );
    v_submission_count := v_submission_count + 1;
  END IF;
  
  RAISE NOTICE '成功创建 % 条提交记录（截止到当前时间）', v_submission_count;
END $$;

-- 4. 验证插入的数据
SELECT 
  TO_CHAR(submitted_at, 'HH24:MI') as time,
  is_overtime,
  (SELECT name FROM tags WHERE id = tag_id) as tag_name
FROM status_records
WHERE date = CURRENT_DATE
ORDER BY submitted_at;

-- 5. 查看累计统计
SELECT 
  '总提交次数' as metric,
  COUNT(*) as value
FROM status_records
WHERE date = CURRENT_DATE
UNION ALL
SELECT 
  '加班次数',
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END)
FROM status_records
WHERE date = CURRENT_DATE
UNION ALL
SELECT 
  '准时次数',
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END)
FROM status_records
WHERE date = CURRENT_DATE;

-- ============================================
-- 说明
-- ============================================
-- 这个脚本会：
-- 1. 删除所有历史数据（包括之前的100多人数据）
-- 2. 使用当前登录的测试用户
-- 3. 创建今天的多次提交（从早上到当前时间）
-- 4. 所有数据时间都不超过当前时间（21:51）
-- 5. 时间轴只能拖动到已有数据的时间点
--
-- 提交时间点：
-- - 7:30 (准时)
-- - 9:15 (加班)
-- - 11:00 (准时)
-- - 13:30 (加班)
-- - 15:45 (准时)
-- - 17:20 (加班)
-- - 19:10 (准时)
-- - 20:30 (加班)
-- - 21:45 (准时) - 只有当前时间 >= 21:45 才会创建
--
-- 注意：只会创建不超过当前时间的提交记录

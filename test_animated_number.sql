-- ============================================
-- 测试数字滚动动画 - 批量插入 status_records
-- ============================================
-- 关键：插入的 date 必须用 get_work_date(NOW())
-- 因为 get_real_time_stats() 查的是 get_work_date(NOW())
-- 而不是 CURRENT_DATE（UTC日期，可能和北京时间差一天）
-- ============================================

-- ==========================================
-- 第1步：诊断日期问题
-- ==========================================

SELECT 
  NOW() as "UTC时间",
  NOW() AT TIME ZONE 'Asia/Shanghai' as "北京时间",
  CURRENT_DATE as "CURRENT_DATE(UTC)",
  get_work_date(NOW()) as "get_work_date(工作日)";

-- 查看今日数据（用 get_work_date）
SELECT 
  COUNT(*) as "今日记录数(work_date)",
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as "加班",
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as "准时"
FROM status_records WHERE date = get_work_date(NOW());

-- 对比：用 CURRENT_DATE 查
SELECT 
  COUNT(*) as "记录数(CURRENT_DATE)",
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as "加班",
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as "准时"
FROM status_records WHERE date = CURRENT_DATE;

-- ==========================================
-- 第2步：清除当前工作日的所有记录
-- ==========================================

DELETE FROM status_records WHERE date = get_work_date(NOW());

-- ==========================================
-- 第3步：批量插入（使用 get_work_date 作为日期）
-- ==========================================

DO $$
DECLARE
  user_ids UUID[];
  tag_ids UUID[];
  i INTEGER;
  random_overtime BOOLEAN;
  random_tag_idx INTEGER;
  work_date DATE;
BEGIN
  work_date := get_work_date(NOW());
  RAISE NOTICE '当前工作日: %', work_date;

  SELECT ARRAY(SELECT id FROM users ORDER BY phone_number) INTO user_ids;
  SELECT ARRAY(SELECT id FROM tags WHERE is_active = true) INTO tag_ids;

  IF array_length(user_ids, 1) IS NULL THEN
    RAISE EXCEPTION '没有找到用户';
  END IF;
  IF array_length(tag_ids, 1) IS NULL THEN
    RAISE EXCEPTION '没有找到标签';
  END IF;

  RAISE NOTICE '找到 % 个用户, % 个标签', array_length(user_ids, 1), array_length(tag_ids, 1);

  FOR i IN 1..LEAST(array_length(user_ids, 1), 15) LOOP
    random_overtime := random() < 0.6;
    random_tag_idx := 1 + floor(random() * array_length(tag_ids, 1))::INTEGER;
    IF random_tag_idx > array_length(tag_ids, 1) THEN
      random_tag_idx := array_length(tag_ids, 1);
    END IF;

    DELETE FROM status_records WHERE user_id = user_ids[i] AND date = work_date;

    INSERT INTO status_records (user_id, date, is_overtime, tag_id, overtime_hours, submitted_at)
    VALUES (
      user_ids[i], work_date, random_overtime, tag_ids[random_tag_idx],
      CASE WHEN random_overtime THEN 1 + floor(random() * 4)::INTEGER ELSE NULL END,
      NOW()
    );
    RAISE NOTICE '用户 %: 加班=%', i, random_overtime;
  END LOOP;

  RAISE NOTICE '✅ 批量插入完成，工作日=%', work_date;
END $$;

-- 验证（用 get_work_date 查询，和 App 一致）
SELECT 
  COUNT(*) as "总参与人数",
  SUM(CASE WHEN is_overtime THEN 1 ELSE 0 END) as "加班人数",
  SUM(CASE WHEN NOT is_overtime THEN 1 ELSE 0 END) as "准时人数"
FROM status_records WHERE date = get_work_date(NOW());

-- 再验证 RPC 函数返回值（App 调用的就是这个）
SELECT * FROM get_real_time_stats();


-- ==========================================
-- 渐进式测试（推荐）
-- 1. 执行第2步清除 → App 显示 0
-- 2. 执行批次A → 0 跳到 5
-- 3. 等几秒，执行批次B → 5 跳到 10
-- 4. 等几秒，执行批次C → 10 跳到 15
-- ==========================================

-- 批次A：前5个用户
/*
DO $$
DECLARE
  user_ids UUID[];
  tag_ids UUID[];
  i INTEGER;
  work_date DATE;
BEGIN
  work_date := get_work_date(NOW());
  SELECT ARRAY(SELECT id FROM users ORDER BY phone_number LIMIT 5) INTO user_ids;
  SELECT ARRAY(SELECT id FROM tags WHERE is_active = true LIMIT 5) INTO tag_ids;
  FOR i IN 1..array_length(user_ids, 1) LOOP
    DELETE FROM status_records WHERE user_id = user_ids[i] AND date = work_date;
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (user_ids[i], work_date, random() < 0.5, tag_ids[1], NOW());
  END LOOP;
  RAISE NOTICE '✅ 批次A完成：5条，工作日=%', work_date;
END $$;
*/

-- 批次B：第6-10个用户
/*
DO $$
DECLARE
  user_ids UUID[];
  tag_ids UUID[];
  i INTEGER;
  work_date DATE;
BEGIN
  work_date := get_work_date(NOW());
  SELECT ARRAY(SELECT id FROM users ORDER BY phone_number OFFSET 5 LIMIT 5) INTO user_ids;
  SELECT ARRAY(SELECT id FROM tags WHERE is_active = true LIMIT 5) INTO tag_ids;
  FOR i IN 1..array_length(user_ids, 1) LOOP
    DELETE FROM status_records WHERE user_id = user_ids[i] AND date = work_date;
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (user_ids[i], work_date, random() < 0.5, tag_ids[1], NOW());
  END LOOP;
  RAISE NOTICE '✅ 批次B完成：5条，工作日=%', work_date;
END $$;
*/

-- 批次C：第11-15个用户
/*
DO $$
DECLARE
  user_ids UUID[];
  tag_ids UUID[];
  i INTEGER;
  work_date DATE;
BEGIN
  work_date := get_work_date(NOW());
  SELECT ARRAY(SELECT id FROM users ORDER BY phone_number OFFSET 10 LIMIT 5) INTO user_ids;
  SELECT ARRAY(SELECT id FROM tags WHERE is_active = true LIMIT 5) INTO tag_ids;
  IF array_length(user_ids, 1) IS NULL THEN
    RAISE NOTICE '没有更多用户';
    RETURN;
  END IF;
  FOR i IN 1..array_length(user_ids, 1) LOOP
    DELETE FROM status_records WHERE user_id = user_ids[i] AND date = work_date;
    INSERT INTO status_records (user_id, date, is_overtime, tag_id, submitted_at)
    VALUES (user_ids[i], work_date, random() < 0.5, tag_ids[1], NOW());
  END LOOP;
  RAISE NOTICE '✅ 批次C完成：% 条，工作日=%', array_length(user_ids, 1), work_date;
END $$;
*/

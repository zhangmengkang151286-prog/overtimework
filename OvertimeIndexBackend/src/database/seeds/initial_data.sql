-- 初始化基础数据

-- 1. 行业数据
INSERT INTO industries (name, display_order) VALUES
('互联网', 1),
('金融', 2),
('教育', 3),
('医疗', 4),
('制造业', 5),
('零售', 6),
('房地产', 7),
('咨询', 8),
('媒体', 9),
('政府机关', 10)
ON CONFLICT (name) DO NOTHING;

-- 2. 职位数据
INSERT INTO positions (name) VALUES
('软件工程师'),
('产品经理'),
('设计师'),
('运营'),
('市场'),
('销售'),
('人力资源'),
('财务'),
('行政'),
('客服')
ON CONFLICT (name) DO NOTHING;

-- 3. 常用标签数据
INSERT INTO tags (name, category, usage_count) VALUES
-- 准时下班相关
('正常下班', 'on_time', 0),
('工作完成', 'on_time', 0),
('效率高', 'on_time', 0),
('任务轻松', 'on_time', 0),
('今日无事', 'on_time', 0),

-- 加班相关
('项目赶工', 'overtime', 0),
('需求变更', 'overtime', 0),
('Bug修复', 'overtime', 0),
('会议太多', 'overtime', 0),
('临时任务', 'overtime', 0),
('人手不足', 'overtime', 0),
('客户要求', 'overtime', 0),
('自愿加班', 'overtime', 0),
('学习提升', 'overtime', 0),
('项目上线', 'overtime', 0)
ON CONFLICT (name) DO NOTHING;

-- 4. 创建默认管理员（密码: admin123）
INSERT INTO admins (username, password_hash, email) VALUES
('admin', '$2b$10$rKvVPZqGQxJ5Z5Z5Z5Z5ZeX5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;

-- 5. 初始化实时缓存键
INSERT INTO realtime_cache (cache_key, cache_value) VALUES
('today_statistics', '{"totalParticipants": 0, "onTimeCount": 0, "overtimeCount": 0}'),
('top_tags', '{"onTimeTags": [], "overtimeTags": []}')
ON CONFLICT (cache_key) DO UPDATE SET cache_value = EXCLUDED.cache_value;

-- 完成
SELECT 'Initial data seeded successfully' AS message;

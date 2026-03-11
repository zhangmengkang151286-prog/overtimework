-- ============================================
-- 替换准时下班标签（删除旧的，插入新的89个）
-- 常用20个 usage_count 较高，其他按分类递减
-- ============================================

-- 第一步：清理 status_records 中对旧标签的引用（解除外键约束）
UPDATE status_records
SET tag_id = NULL
WHERE tag_id IN (
  SELECT id FROM tags WHERE name IN (
    '任务完成', '效率高', '提前规划', '团队协作好', '没有会议',
    '工作顺利', '今日无事', '领导支持', '流程规范', '工具好用'
  )
);

-- 第二步：删除旧的准时下班标签
DELETE FROM tags WHERE name IN (
  '任务完成', '效率高', '提前规划', '团队协作好', '没有会议',
  '工作顺利', '今日无事', '领导支持', '流程规范', '工具好用'
);

-- 第二步：插入新标签
-- 常用标签（前20个，usage_count 100-81）
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('吃夜宵', 'custom', true, 100),
  ('点外卖', 'custom', true, 99),
  ('自做饭', 'custom', true, 98),
  ('便利店', 'custom', true, 97),
  ('奶茶', 'custom', true, 96),
  ('刷短视频', 'custom', true, 95),
  ('追剧', 'custom', true, 94),
  ('听播客', 'custom', true, 93),
  ('听音乐', 'custom', true, 92),
  ('开黑', 'custom', true, 91),
  ('手游', 'custom', true, 90),
  ('夜跑', 'custom', true, 89),
  ('健身', 'custom', true, 88),
  ('散步', 'custom', true, 87),
  ('洗澡', 'custom', true, 86),
  ('回家路', 'custom', true, 85),
  ('收拾屋', 'custom', true, 84),
  ('遛狗', 'custom', true, 83),
  ('撸猫', 'custom', true, 82),
  ('小聚', 'custom', true, 81)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 吃喝类（usage_count 40-27）
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('做晚饭', 'custom', true, 40),
  ('吃家常', 'custom', true, 39),
  ('轻食', 'custom', true, 38),
  ('水果', 'custom', true, 37),
  ('咖啡', 'custom', true, 36),
  ('喝茶', 'custom', true, 35),
  ('小酌', 'custom', true, 34),
  ('加餐', 'custom', true, 33),
  ('火锅', 'custom', true, 32),
  ('烧烤', 'custom', true, 31),
  ('路边摊', 'custom', true, 30),
  ('零食', 'custom', true, 29),
  ('夜饮', 'custom', true, 28),
  ('甜点', 'custom', true, 27)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 数字娱乐类（usage_count 26-14）
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('直播', 'custom', true, 26),
  ('综艺', 'custom', true, 25),
  ('社交', 'custom', true, 24),
  ('冲浪', 'custom', true, 23),
  ('回放', 'custom', true, 22),
  ('论坛', 'custom', true, 21),
  ('看新闻', 'custom', true, 20),
  ('白噪音', 'custom', true, 19),
  ('电台', 'custom', true, 18),
  ('纪录片', 'custom', true, 17),
  ('追番', 'custom', true, 16),
  ('电影', 'custom', true, 15),
  ('看照片', 'custom', true, 14)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 游戏类（usage_count 13-4）
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('单机', 'custom', true, 13),
  ('主机', 'custom', true, 12),
  ('桌游', 'custom', true, 11),
  ('棋类', 'custom', true, 10),
  ('日常本', 'custom', true, 9),
  ('刷副本', 'custom', true, 8),
  ('排位', 'custom', true, 7),
  ('剧情', 'custom', true, 6),
  ('小游戏', 'custom', true, 5),
  ('看比赛', 'custom', true, 4)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 运动健康类（usage_count 13-4）
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('拉伸', 'custom', true, 13),
  ('瑜伽', 'custom', true, 12),
  ('有氧', 'custom', true, 11),
  ('力训', 'custom', true, 10),
  ('跳绳', 'custom', true, 9),
  ('拉筋', 'custom', true, 8),
  ('放松', 'custom', true, 7),
  ('恢复', 'custom', true, 6),
  ('夜骑', 'custom', true, 5),
  ('快走', 'custom', true, 4)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 生活事务类（usage_count 13-4）
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('洗衣', 'custom', true, 13),
  ('晾衣', 'custom', true, 12),
  ('打扫', 'custom', true, 11),
  ('倒垃圾', 'custom', true, 10),
  ('买菜', 'custom', true, 9),
  ('收纳', 'custom', true, 8),
  ('修东西', 'custom', true, 7),
  ('拿快递', 'custom', true, 6),
  ('列清单', 'custom', true, 5),
  ('准备明天', 'custom', true, 4)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 陪伴社交类（usage_count 13-3）
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('陪家人', 'custom', true, 13),
  ('带娃', 'custom', true, 12),
  ('接娃', 'custom', true, 11),
  ('家聊', 'custom', true, 10),
  ('视频聊', 'custom', true, 9),
  ('语音聊', 'custom', true, 8),
  ('聊天', 'custom', true, 7),
  ('聚餐', 'custom', true, 6),
  ('夜聊', 'custom', true, 5),
  ('联机', 'custom', true, 4),
  ('陪宠物', 'custom', true, 3)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 验证插入结果
SELECT COUNT(*) as total_ontime_tags FROM tags WHERE type = 'custom' AND is_active = true;

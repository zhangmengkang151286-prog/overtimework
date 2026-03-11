-- ============================================
-- 更新准时下班标签（删除旧的，插入新的，带 subcategory 分组）
-- ============================================

-- 确保 subcategory 字段存在
ALTER TABLE tags ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50) DEFAULT NULL;

-- 第一步：清理 status_records 中对旧 ontime 标签的引用
UPDATE status_records
SET tag_id = NULL
WHERE tag_id IN (
  SELECT id FROM tags WHERE category = 'ontime' AND type = 'custom'
);

-- 第二步：删除旧的 ontime 标签
DELETE FROM tags WHERE category = 'ontime' AND type = 'custom';

-- 第三步：插入新的准时下班标签

-- 常用（前20个，usage_count 100-81）
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('回家吃饭', 'custom', 'ontime', '常用', true, 100),
  ('做晚饭', 'custom', 'ontime', '常用', true, 99),
  ('点外卖', 'custom', 'ontime', '常用', true, 98),
  ('躺着', 'custom', 'ontime', '常用', true, 97),
  ('刷手机', 'custom', 'ontime', '常用', true, 96),
  ('追剧', 'custom', 'ontime', '常用', true, 95),
  ('看电影', 'custom', 'ontime', '常用', true, 94),
  ('陪家人', 'custom', 'ontime', '常用', true, 93),
  ('陪孩子', 'custom', 'ontime', '常用', true, 92),
  ('陪对象', 'custom', 'ontime', '常用', true, 91),
  ('洗澡', 'custom', 'ontime', '常用', true, 90),
  ('泡脚', 'custom', 'ontime', '常用', true, 89),
  ('散步', 'custom', 'ontime', '常用', true, 88),
  ('夜跑', 'custom', 'ontime', '常用', true, 87),
  ('健身', 'custom', 'ontime', '常用', true, 86),
  ('逛超市', 'custom', 'ontime', '常用', true, 85),
  ('回消息', 'custom', 'ontime', '常用', true, 84),
  ('回电话', 'custom', 'ontime', '常用', true, 83),
  ('放松一下', 'custom', 'ontime', '常用', true, 82),
  ('缓一缓', 'custom', 'ontime', '常用', true, 81)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 吃饭/温饱类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('买菜', 'custom', 'ontime', '吃饭/温饱', true, 40),
  ('下馆子', 'custom', 'ontime', '吃饭/温饱', true, 39),
  ('打包回家', 'custom', 'ontime', '吃饭/温饱', true, 38),
  ('吃夜宵', 'custom', 'ontime', '吃饭/温饱', true, 37),
  ('随便吃', 'custom', 'ontime', '吃饭/温饱', true, 36),
  ('凑合吃', 'custom', 'ontime', '吃饭/温饱', true, 35),
  ('做零食', 'custom', 'ontime', '吃饭/温饱', true, 34),
  ('煲汤', 'custom', 'ontime', '吃饭/温饱', true, 33),
  ('泡面', 'custom', 'ontime', '吃饭/温饱', true, 32),
  ('喝饮料', 'custom', 'ontime', '吃饭/温饱', true, 31),
  ('咖啡', 'custom', 'ontime', '吃饭/温饱', true, 30),
  ('奶茶', 'custom', 'ontime', '吃饭/温饱', true, 29),
  ('烘焙', 'custom', 'ontime', '吃饭/温饱', true, 28),
  ('试新店', 'custom', 'ontime', '吃饭/温饱', true, 27)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 家务/生活琐事
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('收拾屋子', 'custom', 'ontime', '家务/生活琐事', true, 40),
  ('洗衣服', 'custom', 'ontime', '家务/生活琐事', true, 39),
  ('晾衣服', 'custom', 'ontime', '家务/生活琐事', true, 38),
  ('拖地', 'custom', 'ontime', '家务/生活琐事', true, 37),
  ('洗碗', 'custom', 'ontime', '家务/生活琐事', true, 36),
  ('倒垃圾', 'custom', 'ontime', '家务/生活琐事', true, 35),
  ('整理房间', 'custom', 'ontime', '家务/生活琐事', true, 34),
  ('收快递', 'custom', 'ontime', '家务/生活琐事', true, 33),
  ('拆快递', 'custom', 'ontime', '家务/生活琐事', true, 32),
  ('整理桌面', 'custom', 'ontime', '家务/生活琐事', true, 31),
  ('换床单', 'custom', 'ontime', '家务/生活琐事', true, 30),
  ('收衣服', 'custom', 'ontime', '家务/生活琐事', true, 29),
  ('养植物', 'custom', 'ontime', '家务/生活琐事', true, 28),
  ('浇花', 'custom', 'ontime', '家务/生活琐事', true, 27),
  ('清冰箱', 'custom', 'ontime', '家务/生活琐事', true, 26)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;


-- 休息/放空类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('发呆', 'custom', 'ontime', '休息/放空', true, 40),
  ('刷视频', 'custom', 'ontime', '休息/放空', true, 39),
  ('看直播', 'custom', 'ontime', '休息/放空', true, 38),
  ('听音乐', 'custom', 'ontime', '休息/放空', true, 37),
  ('小睡', 'custom', 'ontime', '休息/放空', true, 36),
  ('早睡', 'custom', 'ontime', '休息/放空', true, 35),
  ('啥也不干', 'custom', 'ontime', '休息/放空', true, 34),
  ('午睡', 'custom', 'ontime', '休息/放空', true, 33),
  ('翻手机', 'custom', 'ontime', '休息/放空', true, 32),
  ('发朋友圈', 'custom', 'ontime', '休息/放空', true, 31),
  ('刷微博', 'custom', 'ontime', '休息/放空', true, 30),
  ('刷小红书', 'custom', 'ontime', '休息/放空', true, 29),
  ('刷抖音', 'custom', 'ontime', '休息/放空', true, 28),
  ('刷B站', 'custom', 'ontime', '休息/放空', true, 27)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 娱乐/消遣类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('打游戏', 'custom', 'ontime', '娱乐/消遣', true, 40),
  ('玩手游', 'custom', 'ontime', '娱乐/消遣', true, 39),
  ('看综艺', 'custom', 'ontime', '娱乐/消遣', true, 38),
  ('追网剧', 'custom', 'ontime', '娱乐/消遣', true, 37),
  ('追动漫', 'custom', 'ontime', '娱乐/消遣', true, 36),
  ('看短视频', 'custom', 'ontime', '娱乐/消遣', true, 35),
  ('刷社交', 'custom', 'ontime', '娱乐/消遣', true, 34),
  ('刷段子', 'custom', 'ontime', '娱乐/消遣', true, 33),
  ('玩桌游', 'custom', 'ontime', '娱乐/消遣', true, 32),
  ('K歌', 'custom', 'ontime', '娱乐/消遣', true, 31),
  ('听歌单', 'custom', 'ontime', '娱乐/消遣', true, 30),
  ('玩游戏机', 'custom', 'ontime', '娱乐/消遣', true, 29),
  ('玩VR', 'custom', 'ontime', '娱乐/消遣', true, 28)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 学习/提升类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('看书', 'custom', 'ontime', '学习/提升', true, 40),
  ('随便看书', 'custom', 'ontime', '学习/提升', true, 39),
  ('学点东西', 'custom', 'ontime', '学习/提升', true, 38),
  ('看课程', 'custom', 'ontime', '学习/提升', true, 37),
  ('听播客', 'custom', 'ontime', '学习/提升', true, 36),
  ('刷知识', 'custom', 'ontime', '学习/提升', true, 35),
  ('学技能', 'custom', 'ontime', '学习/提升', true, 34),
  ('练外语', 'custom', 'ontime', '学习/提升', true, 33),
  ('做笔记', 'custom', 'ontime', '学习/提升', true, 32),
  ('写文章', 'custom', 'ontime', '学习/提升', true, 31),
  ('看讲座', 'custom', 'ontime', '学习/提升', true, 30),
  ('写日记', 'custom', 'ontime', '学习/提升', true, 29)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 运动/身体活动类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('拉伸', 'custom', 'ontime', '运动/身体活动', true, 38),
  ('瑜伽', 'custom', 'ontime', '运动/身体活动', true, 37),
  ('跳操', 'custom', 'ontime', '运动/身体活动', true, 36),
  ('骑车', 'custom', 'ontime', '运动/身体活动', true, 35),
  ('游泳', 'custom', 'ontime', '运动/身体活动', true, 34),
  ('打球', 'custom', 'ontime', '运动/身体活动', true, 33),
  ('慢跑', 'custom', 'ontime', '运动/身体活动', true, 32),
  ('练舞', 'custom', 'ontime', '运动/身体活动', true, 31),
  ('跳绳', 'custom', 'ontime', '运动/身体活动', true, 30)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 社交/陪伴类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('陪父母', 'custom', 'ontime', '社交/陪伴', true, 40),
  ('和朋友聊', 'custom', 'ontime', '社交/陪伴', true, 39),
  ('朋友聚', 'custom', 'ontime', '社交/陪伴', true, 38),
  ('打电话', 'custom', 'ontime', '社交/陪伴', true, 37),
  ('视频聊天', 'custom', 'ontime', '社交/陪伴', true, 36),
  ('约饭', 'custom', 'ontime', '社交/陪伴', true, 35),
  ('逛街', 'custom', 'ontime', '社交/陪伴', true, 34),
  ('线上聚会', 'custom', 'ontime', '社交/陪伴', true, 33),
  ('约运动', 'custom', 'ontime', '社交/陪伴', true, 32)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 自我照顾类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('护肤', 'custom', 'ontime', '自我照顾', true, 40),
  ('敷面膜', 'custom', 'ontime', '自我照顾', true, 39),
  ('按摩', 'custom', 'ontime', '自我照顾', true, 38),
  ('放松身体', 'custom', 'ontime', '自我照顾', true, 37),
  ('早点休息', 'custom', 'ontime', '自我照顾', true, 36),
  ('做头发', 'custom', 'ontime', '自我照顾', true, 35),
  ('做美甲', 'custom', 'ontime', '自我照顾', true, 34),
  ('修指甲', 'custom', 'ontime', '自我照顾', true, 33),
  ('理发', 'custom', 'ontime', '自我照顾', true, 32),
  ('调香氛', 'custom', 'ontime', '自我照顾', true, 31)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 消费/外出类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('逛商场', 'custom', 'ontime', '消费/外出', true, 40),
  ('随便逛', 'custom', 'ontime', '消费/外出', true, 39),
  ('取快递', 'custom', 'ontime', '消费/外出', true, 37),
  ('买东西', 'custom', 'ontime', '消费/外出', true, 36),
  ('逛书店', 'custom', 'ontime', '消费/外出', true, 35),
  ('买衣服', 'custom', 'ontime', '消费/外出', true, 34),
  ('买鞋', 'custom', 'ontime', '消费/外出', true, 33),
  ('买配件', 'custom', 'ontime', '消费/外出', true, 32),
  ('买零食', 'custom', 'ontime', '消费/外出', true, 31),
  ('买饮品', 'custom', 'ontime', '消费/外出', true, 30),
  ('出街散心', 'custom', 'ontime', '消费/外出', true, 29)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 情绪/内心类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('想事情', 'custom', 'ontime', '情绪/内心', true, 40),
  ('整理思路', 'custom', 'ontime', '情绪/内心', true, 39),
  ('自我消化', 'custom', 'ontime', '情绪/内心', true, 38),
  ('回顾一天', 'custom', 'ontime', '情绪/内心', true, 37),
  ('计划明天', 'custom', 'ontime', '情绪/内心', true, 36),
  ('沉思', 'custom', 'ontime', '情绪/内心', true, 34),
  ('放空', 'custom', 'ontime', '情绪/内心', true, 33),
  ('静坐', 'custom', 'ontime', '情绪/内心', true, 32)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 个人事务/零碎安排类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('安排事情', 'custom', 'ontime', '个人事务/零碎安排', true, 40),
  ('做计划', 'custom', 'ontime', '个人事务/零碎安排', true, 39),
  ('记点事', 'custom', 'ontime', '个人事务/零碎安排', true, 38),
  ('处理私事', 'custom', 'ontime', '个人事务/零碎安排', true, 37),
  ('回短信', 'custom', 'ontime', '个人事务/零碎安排', true, 36),
  ('回邮件', 'custom', 'ontime', '个人事务/零碎安排', true, 35),
  ('整理资料', 'custom', 'ontime', '个人事务/零碎安排', true, 34),
  ('约见面', 'custom', 'ontime', '个人事务/零碎安排', true, 33),
  ('准备材料', 'custom', 'ontime', '个人事务/零碎安排', true, 32)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 夜间/延伸行为类
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('深夜刷手机', 'custom', 'ontime', '夜间/延伸行为', true, 40),
  ('熬夜', 'custom', 'ontime', '夜间/延伸行为', true, 39),
  ('不想睡', 'custom', 'ontime', '夜间/延伸行为', true, 38),
  ('夜宵时间', 'custom', 'ontime', '夜间/延伸行为', true, 37),
  ('看夜景', 'custom', 'ontime', '夜间/延伸行为', true, 36),
  ('听夜晚音乐', 'custom', 'ontime', '夜间/延伸行为', true, 35),
  ('发夜间朋友圈', 'custom', 'ontime', '夜间/延伸行为', true, 34),
  ('夜间散步', 'custom', 'ontime', '夜间/延伸行为', true, 33)
ON CONFLICT (name) DO UPDATE SET
  category = 'ontime', subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count, is_active = true;

-- 验证结果
SELECT category, subcategory, COUNT(*) as count
FROM tags
WHERE type = 'custom' AND is_active = true
GROUP BY category, subcategory
ORDER BY category, subcategory;

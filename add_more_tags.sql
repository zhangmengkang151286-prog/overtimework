-- ============================================
-- 添加更多内置标签
-- ============================================

-- 加班原因标签 (custom 类型)
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  -- 已有的保留
  ('项目紧急', 'custom', true, 100),
  ('需求变更', 'custom', true, 90),
  ('线上故障', 'custom', true, 85),
  ('自愿加班', 'custom', true, 80),
  ('领导要求', 'custom', true, 75),
  
  -- 新增加班原因
  ('项目上线', 'custom', true, 70),
  ('赶进度', 'custom', true, 65),
  ('开会太多', 'custom', true, 60),
  ('Bug修复', 'custom', true, 55),
  ('客户需求', 'custom', true, 50),
  ('测试不通过', 'custom', true, 45),
  ('代码审查', 'custom', true, 40),
  ('文档编写', 'custom', true, 35),
  ('技术攻关', 'custom', true, 30),
  ('版本发布', 'custom', true, 25),
  ('紧急需求', 'custom', true, 20),
  ('系统维护', 'custom', true, 15),
  ('培训学习', 'custom', true, 10),
  ('团队建设', 'custom', true, 5)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 准时下班原因标签 (custom 类型)
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('任务完成', 'custom', true, 95),
  ('效率高', 'custom', true, 90),
  ('提前规划', 'custom', true, 85),
  ('团队协作好', 'custom', true, 80),
  ('没有会议', 'custom', true, 75),
  ('工作顺利', 'custom', true, 70),
  ('今日无事', 'custom', true, 65),
  ('领导支持', 'custom', true, 60),
  ('流程规范', 'custom', true, 55),
  ('工具好用', 'custom', true, 50)
ON CONFLICT (name) DO NOTHING;

-- 更多行业标签
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('互联网', 'industry', true, 100),
  ('金融', 'industry', true, 90),
  ('教育', 'industry', true, 80),
  ('制造业', 'industry', true, 70),
  ('医疗', 'industry', true, 60),
  ('电商', 'industry', true, 55),
  ('游戏', 'industry', true, 50),
  ('咨询', 'industry', true, 45),
  ('房地产', 'industry', true, 40),
  ('物流', 'industry', true, 35),
  ('零售', 'industry', true, 30),
  ('广告', 'industry', true, 25),
  ('传媒', 'industry', true, 20)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 更多公司标签
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('字节跳动', 'company', true, 100),
  ('阿里巴巴', 'company', true, 95),
  ('腾讯', 'company', true, 90),
  ('华为', 'company', true, 85),
  ('百度', 'company', true, 80),
  ('美团', 'company', true, 75),
  ('京东', 'company', true, 70),
  ('拼多多', 'company', true, 65),
  ('小米', 'company', true, 60),
  ('网易', 'company', true, 55),
  ('滴滴', 'company', true, 50),
  ('快手', 'company', true, 45),
  ('B站', 'company', true, 40)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 更多职位标签
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('软件工程师', 'position', true, 100),
  ('产品经理', 'position', true, 90),
  ('设计师', 'position', true, 80),
  ('运营', 'position', true, 70),
  ('测试工程师', 'position', true, 60),
  ('前端工程师', 'position', true, 55),
  ('后端工程师', 'position', true, 50),
  ('算法工程师', 'position', true, 45),
  ('数据分析师', 'position', true, 40),
  ('项目经理', 'position', true, 35),
  ('架构师', 'position', true, 30),
  ('运维工程师', 'position', true, 25)
ON CONFLICT (name) DO UPDATE SET usage_count = EXCLUDED.usage_count;

-- 显示统计
SELECT 
  type,
  COUNT(*) as count,
  SUM(usage_count) as total_usage
FROM tags
WHERE is_active = true
GROUP BY type
ORDER BY type;

SELECT COUNT(*) as total_active_tags FROM tags WHERE is_active = true;

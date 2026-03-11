-- ============================================
-- 插入测试标签数据
-- ============================================

-- 临时禁用 RLS 以确保可以插入
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;

-- 清空现有标签(如果有)
TRUNCATE TABLE tags CASCADE;

-- 插入测试标签
INSERT INTO tags (name, type, is_active, usage_count) VALUES
  ('互联网', 'industry', true, 0),
  ('金融', 'industry', true, 0),
  ('教育', 'industry', true, 0),
  ('制造业', 'industry', true, 0),
  ('医疗', 'industry', true, 0),
  ('字节跳动', 'company', true, 0),
  ('阿里巴巴', 'company', true, 0),
  ('腾讯', 'company', true, 0),
  ('华为', 'company', true, 0),
  ('百度', 'company', true, 0),
  ('软件工程师', 'position', true, 0),
  ('产品经理', 'position', true, 0),
  ('设计师', 'position', true, 0),
  ('运营', 'position', true, 0),
  ('测试工程师', 'position', true, 0),
  ('项目紧急', 'custom', true, 0),
  ('需求变更', 'custom', true, 0),
  ('线上故障', 'custom', true, 0),
  ('自愿加班', 'custom', true, 0),
  ('领导要求', 'custom', true, 0);

-- 重新启用 RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 验证插入结果
SELECT COUNT(*) as total_tags FROM tags;
SELECT type, COUNT(*) as count FROM tags GROUP BY type ORDER BY type;

-- 显示所有标签
SELECT id, name, type, is_active FROM tags ORDER BY type, name;

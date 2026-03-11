-- 更新 tags 表中的行业数据
-- 行业数据存储在 tags 表中，type='industry'
-- 行业不需要 subcategory 分组，直接扁平显示
-- 注意：旧行业标签被 status_records 引用，不能直接删除
-- 策略：将旧行业标签设为不活跃，插入新的行业标签

-- 步骤1: 将现有行业标签设为不活跃（保留数据，不破坏外键）
UPDATE tags SET is_active = false WHERE type = 'industry';

-- 步骤2: 插入17个新行业
INSERT INTO tags (name, type, is_active, usage_count) VALUES
('互联网、软件与信息技术', 'industry', true, 0),
('电子、半导体与智能硬件', 'industry', true, 0),
('金融、银行、保险与投资', 'industry', true, 0),
('房地产、建筑与装饰工程', 'industry', true, 0),
('制造业与工业自动化', 'industry', true, 0),
('汽车、航空与交通设备', 'industry', true, 0),
('能源、环保与化学化工', 'industry', true, 0),
('现代物流、快递与即时配送', 'industry', true, 0),
('电子商务与直播经济', 'industry', true, 0),
('消费品、零售与贸易', 'industry', true, 0),
('医疗、生物与医药', 'industry', true, 0),
('教育、科研与培训', 'industry', true, 0),
('文化、传媒与娱乐体育', 'industry', true, 0),
('餐饮、旅游与生活服务', 'industry', true, 0),
('法律、咨询与专业服务', 'industry', true, 0),
('政府、公共事业与社会组织', 'industry', true, 0),
('农林牧渔与现代农业', 'industry', true, 0);

-- 步骤3: 验证结果（只显示活跃的行业）
SELECT name AS "行业名称" FROM tags WHERE type = 'industry' AND is_active = true ORDER BY id;

-- 显示总数
SELECT COUNT(*) AS "行业总数" FROM tags WHERE type = 'industry' AND is_active = true;

-- 更新职位列表 - 简化版（不使用 category 字段）
-- 执行前请先备份数据库

-- 1. 清空现有职位数据（保留表结构）
TRUNCATE TABLE positions RESTART IDENTITY CASCADE;

-- 2. 插入新的职位数据（按行业分类，使用注释标注）

-- 1. 农业、林业、渔业和牧业
INSERT INTO positions (name, is_active) VALUES
('农业经理', true),
('农艺师', true),
('农场工人', true),
('畜牧师', true),
('渔业专家', true),
('水产养殖专家', true),
('园艺师', true),
('农业机械操作员', true),
('林业经理', true),
('森林工程师', true),
('草地管理专家', true),
('生态学家', true),
('农业技术员', true),
('兽医', true),
('农产品加工厂经理', true),
('种植技术员', true),
('土壤科学家', true),
('作物科学家', true),
('农产品营销经理', true),
('农场销售经理', true),
('农业研究员', true);

-- 2. 采矿业
INSERT INTO positions (name, is_active) VALUES
('采矿工程师', true),
('矿山安全工程师', true),
('地质学家', true),
('矿山设计工程师', true),
('采矿操作员', true),
('矿石分析师', true),
('资源勘探员', true),
('采矿设备操作员', true),
('冶炼工人', true),
('矿产资源管理', true),
('矿山管理人员', true),
('矿产开采顾问', true),
('矿石运输员', true),
('地质勘探员', true),
('矿井维保工程师', true);

-- 3. 制造业
INSERT INTO positions (name, is_active) VALUES
('生产经理', true),
('车间经理', true),
('生产工人', true),
('产品设计师', true),
('质量控制工程师', true),
('采购经理', true),
('生产计划员', true),
('工艺工程师', true),
('设备维护工程师', true),
('精密仪器工程师', true),
('机械设计工程师', true),
('电气工程师', true),
('自动化工程师', true),
('生产操作员', true),
('装配工人', true),
('仓库管理员', true),
('生产调度员', true),
('工厂安全经理', true),
('环境健康与安全（EHS）专家', true);

-- 4. 电力、燃气和水务
INSERT INTO positions (name, is_active) VALUES
('电力工程师', true),
('电力调度员', true),
('电力设备操作员', true),
('燃气工程师', true),
('水务工程师', true),
('能源项目经理', true),
('电力系统分析师', true),
('风能工程师', true),
('太阳能工程师', true),
('水力发电工程师', true),
('电力设备销售员', true),
('配电网工程师', true),
('水务公司经理', true),
('电力公司总经理', true),
('电气检测员', true),
('水质检测员', true);

-- 5. 建筑业
INSERT INTO positions (name, is_active) VALUES
('建筑工程师', true),
('土木工程师', true),
('结构工程师', true),
('建筑项目经理', true),
('建筑设计师', true),
('施工经理', true),
('安全工程师', true),
('现场施工员', true),
('预算员', true),
('施工协调员', true),
('室内设计师', true),
('建筑工人', true),
('施工材料采购员', true),
('景观设计师', true),
('城市规划师', true),
('建筑设备工程师', true),
('建筑测试员', true),
('项目成本控制员', true),
('项目风险经理', true);

-- 6. 交通运输业
INSERT INTO positions (name, is_active) VALUES
('航空飞行员', true),
('航空调度员', true),
('铁路列车司机', true),
('公路运输经理', true),
('卡车司机', true),
('航运经理', true),
('船员', true),
('物流经理', true),
('货运代理', true),
('交通管理人员', true),
('航运调度员', true),
('航运保险专员', true),
('公共交通运营商', true),
('物流分析师', true),
('运输协调员', true),
('货运司机', true),
('出租车司机', true),
('航运公司总经理', true),
('航运代理商', true);

-- 7. 信息技术和通信
INSERT INTO positions (name, is_active) VALUES
('软件开发工程师', true),
('前端开发工程师', true),
('后端开发工程师', true),
('全栈开发工程师', true),
('数据科学家', true),
('人工智能工程师', true),
('机器学习工程师', true),
('IT项目经理', true),
('系统分析师', true),
('网络安全专家', true),
('数据库管理员', true),
('网络工程师', true),
('云计算工程师', true),
('移动应用开发工程师', true),
('UI/UX设计师', true),
('DevOps工程师', true),
('数据工程师', true),
('技术支持专家', true),
('IT顾问', true),
('电信工程师', true),
('网站开发工程师', true),
('网络管理员', true),
('技术文档编写员', true),
('信息架构师', true);

-- 8. 金融行业
INSERT INTO positions (name, is_active) VALUES
('金融分析师', true),
('财务经理', true),
('投资银行家', true),
('资产管理顾问', true),
('金融顾问', true),
('股票交易员', true),
('银行职员', true),
('投资经理', true),
('保险经纪人', true),
('保险精算师', true),
('风险管理专家', true),
('财务会计', true),
('财务审计师', true),
('税务顾问', true),
('资本市场分析师', true),
('财务控制员', true),
('基金经理', true),
('合规专员', true),
('债务重组专家', true);

-- 9. 教育行业
INSERT INTO positions (name, is_active) VALUES
('小学教师', true),
('中学教师', true),
('大学教授', true),
('学科主任', true),
('课程开发者', true),
('教育顾问', true),
('教育技术专家', true),
('学术研究员', true),
('校长', true),
('辅导员', true),
('教育项目经理', true),
('教育培训师', true),
('职业指导顾问', true),
('教育行政人员', true),
('在线课程设计师', true),
('学习发展专家', true),
('教育资源管理员', true),
('教育咨询顾问', true),
('特殊教育教师', true),
('语言学专家', true),
('学科测试评估员', true);

-- 10. 医疗卫生
INSERT INTO positions (name, is_active) VALUES
('医生（各科室）', true),
('护士', true),
('药剂师', true),
('临床研究员', true),
('医疗设备技术员', true),
('生物医药工程师', true),
('公共卫生专家', true),
('牙医', true),
('牙科技术员', true),
('康复治疗师', true),
('营养师', true),
('医疗翻译', true),
('心理医生', true),
('精神科医生', true),
('急救医务人员', true),
('医疗顾问', true),
('医学影像师', true),
('检验师', true),
('住院医师', true),
('外科医生', true),
('麻醉师', true),
('医学研究员', true),
('老年医学专家', true),
('生物统计学家', true);

-- 11. 零售业
INSERT INTO positions (name, is_active) VALUES
('销售经理', true),
('区域经理', true),
('店长', true),
('零售助理', true),
('客户服务代表', true),
('零售采购员', true),
('商品陈列员', true),
('仓库管理员', true),
('收银员', true),
('营销经理', true),
('品牌经理', true),
('零售分析师', true),
('电商运营经理', true),
('产品经理', true),
('市场研究员', true),
('客户关系管理（CRM）专员', true),
('物流专员', true),
('电商客服', true);

-- 12. 旅游与酒店业
INSERT INTO positions (name, is_active) VALUES
('酒店经理', true),
('前台接待员', true),
('房务员', true),
('餐饮经理', true),
('餐厅服务员', true),
('旅游顾问', true),
('导游', true),
('旅游市场经理', true),
('航班调度员', true),
('旅游产品经理', true),
('客房清洁员', true),
('旅游信息员', true),
('会议与活动策划经理', true),
('旅游策划师', true),
('旅行社负责人', true);

-- 13. 娱乐与媒体
INSERT INTO positions (name, is_active) VALUES
('演员', true),
('导演', true),
('编剧', true),
('制片人', true),
('摄影师', true),
('影视编辑', true),
('音响师', true),
('视觉设计师', true),
('特效设计师', true),
('游戏开发人员', true),
('媒体策划', true),
('记者', true);

-- 其他
INSERT INTO positions (name, is_active) VALUES
('其他', true);

-- 3. 验证插入结果
SELECT COUNT(*) AS "职位总数" FROM positions WHERE is_active = true;

-- 显示前20个职位
SELECT id, name, is_active, created_at 
FROM positions 
WHERE is_active = true 
ORDER BY id 
LIMIT 20;

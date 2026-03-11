-- 更新 tags 表中的职位数据
-- 注意: 职位数据存储在 tags 表中,type='position'
-- 职位不需要分类显示,直接扁平列表

-- 步骤1: 删除现有的职位标签
DELETE FROM tags WHERE type = 'position';

-- 步骤2: 插入职位数据（不使用 subcategory 分组）

-- 1. 互联网、软件与信息技术
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('架构师', 'position', '互联网、软件与信息技术', true, 0),
('后端开发', 'position', '互联网、软件与信息技术', true, 0),
('前端开发', 'position', '互联网、软件与信息技术', true, 0),
('测试工程师', 'position', '互联网、软件与信息技术', true, 0),
('运维工程师', 'position', '互联网、软件与信息技术', true, 0),
('算法工程师', 'position', '互联网、软件与信息技术', true, 0),
('数据分析师', 'position', '互联网、软件与信息技术', true, 0),
('产品经理', 'position', '互联网、软件与信息技术', true, 0),
('UI/UX设计师', 'position', '互联网、软件与信息技术', true, 0),
('网络安全专家', 'position', '互联网、软件与信息技术', true, 0),
('数据库管理员(DBA)', 'position', '互联网、软件与信息技术', true, 0),
('技术支持', 'position', '互联网、软件与信息技术', true, 0),
('项目经理(PMO)', 'position', '互联网、软件与信息技术', true, 0),
('系统集成工程师', 'position', '互联网、软件与信息技术', true, 0);

-- 2. 电子、半导体与智能硬件
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('芯片设计', 'position', '电子、半导体与智能硬件', true, 0),
('晶圆工艺工程师', 'position', '电子、半导体与智能硬件', true, 0),
('PCB设计', 'position', '电子、半导体与智能硬件', true, 0),
('嵌入式开发', 'position', '电子、半导体与智能硬件', true, 0),
('FPGA工程师', 'position', '电子、半导体与智能硬件', true, 0),
('射频工程师', 'position', '电子、半导体与智能硬件', true, 0),
('封装测试', 'position', '电子、半导体与智能硬件', true, 0),
('电路设计', 'position', '电子、半导体与智能硬件', true, 0),
('模具设计', 'position', '电子、半导体与智能硬件', true, 0),
('光电工程师', 'position', '电子、半导体与智能硬件', true, 0),
('自动化控制', 'position', '电子、半导体与智能硬件', true, 0),
('硬件测试', 'position', '电子、半导体与智能硬件', true, 0),
('工艺员', 'position', '电子、半导体与智能硬件', true, 0);

-- 3. 金融、银行、保险与投资
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('客户经理', 'position', '金融、银行、保险与投资', true, 0),
('信贷审批', 'position', '金融、银行、保险与投资', true, 0),
('风险控制', 'position', '金融、银行、保险与投资', true, 0),
('理财顾问', 'position', '金融、银行、保险与投资', true, 0),
('基金经理', 'position', '金融、银行、保险与投资', true, 0),
('证券分析师', 'position', '金融、银行、保险与投资', true, 0),
('精算师', 'position', '金融、银行、保险与投资', true, 0),
('投资银行家(IBD)', 'position', '金融、银行、保险与投资', true, 0),
('交易员', 'position', '金融、银行、保险与投资', true, 0),
('合规稽核', 'position', '金融、银行、保险与投资', true, 0),
('柜员', 'position', '金融、银行、保险与投资', true, 0),
('保险经纪人', 'position', '金融、银行、保险与投资', true, 0),
('理赔专员', 'position', '金融、银行、保险与投资', true, 0);

-- 4. 房地产、建筑与装饰工程
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('建筑师', 'position', '房地产、建筑与装饰工程', true, 0),
('结构工程师', 'position', '房地产、建筑与装饰工程', true, 0),
('土建工程师', 'position', '房地产、建筑与装饰工程', true, 0),
('造价师', 'position', '房地产、建筑与装饰工程', true, 0),
('工程监理', 'position', '房地产、建筑与装饰工程', true, 0),
('室内设计师', 'position', '房地产、建筑与装饰工程', true, 0),
('景观园林设计', 'position', '房地产、建筑与装饰工程', true, 0),
('项目经理', 'position', '房地产、建筑与装饰工程', true, 0),
('置业顾问', 'position', '房地产、建筑与装饰工程', true, 0),
('物业经理', 'position', '房地产、建筑与装饰工程', true, 0),
('暖通工程师', 'position', '房地产、建筑与装饰工程', true, 0),
('施工员', 'position', '房地产、建筑与装饰工程', true, 0),
('资料员', 'position', '房地产、建筑与装饰工程', true, 0);

-- 5. 制造业与工业自动化
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('机械工程师', 'position', '制造业与工业自动化', true, 0),
('工艺工程师(PE)', 'position', '制造业与工业自动化', true, 0),
('电气工程师', 'position', '制造业与工业自动化', true, 0),
('质量工程师(QE/QC)', 'position', '制造业与工业自动化', true, 0),
('生产班组长', 'position', '制造业与工业自动化', true, 0),
('精益生产', 'position', '制造业与工业自动化', true, 0),
('设备维护', 'position', '制造业与工业自动化', true, 0),
('材料研发', 'position', '制造业与工业自动化', true, 0),
('工业设计', 'position', '制造业与工业自动化', true, 0),
('数控编程', 'position', '制造业与工业自动化', true, 0),
('模具工', 'position', '制造业与工业自动化', true, 0),
('生产计划(PMC)', 'position', '制造业与工业自动化', true, 0);

-- 6. 汽车、航空与交通设备
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('汽车研发', 'position', '汽车、航空与交通设备', true, 0),
('三电系统研发', 'position', '汽车、航空与交通设备', true, 0),
('自动驾驶算法', 'position', '汽车、航空与交通设备', true, 0),
('试制工程师', 'position', '汽车、航空与交通设备', true, 0),
('整车测试', 'position', '汽车、航空与交通设备', true, 0),
('机务维修', 'position', '汽车、航空与交通设备', true, 0),
('机长/乘务员', 'position', '汽车、航空与交通设备', true, 0),
('轨道交通调度', 'position', '汽车、航空与交通设备', true, 0),
('售后技术顾问', 'position', '汽车、航空与交通设备', true, 0),
('二手车评估师', 'position', '汽车、航空与交通设备', true, 0),
('装配工艺', 'position', '汽车、航空与交通设备', true, 0);

-- 7. 能源、环保与化学化工
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('电气电力工程师', 'position', '能源、环保与化学化工', true, 0),
('新能源研发（光/风/氢）', 'position', '能源、环保与化学化工', true, 0),
('石油钻探', 'position', '能源、环保与化学化工', true, 0),
('化学分析', 'position', '能源、环保与化学化工', true, 0),
('环境评价师', 'position', '能源、环保与化学化工', true, 0),
('水处理工程师', 'position', '能源、环保与化学化工', true, 0),
('安全工程师(EHS)', 'position', '能源、环保与化学化工', true, 0),
('固废处理', 'position', '能源、环保与化学化工', true, 0),
('选矿工程师', 'position', '能源、环保与化学化工', true, 0),
('化工工艺', 'position', '能源、环保与化学化工', true, 0);

-- 8. 现代物流、快递与即时配送
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('快递员', 'position', '现代物流、快递与即时配送', true, 0),
('外卖骑手', 'position', '现代物流、快递与即时配送', true, 0),
('同城配送员', 'position', '现代物流、快递与即时配送', true, 0),
('货运司机', 'position', '现代物流、快递与即时配送', true, 0),
('网约车司机', 'position', '现代物流、快递与即时配送', true, 0),
('代驾', 'position', '现代物流、快递与即时配送', true, 0),
('物流调度', 'position', '现代物流、快递与即时配送', true, 0),
('仓库管理员', 'position', '现代物流、快递与即时配送', true, 0),
('分拣员', 'position', '现代物流、快递与即时配送', true, 0),
('叉车司机', 'position', '现代物流、快递与即时配送', true, 0),
('物流规划师', 'position', '现代物流、快递与即时配送', true, 0),
('供应链经理', 'position', '现代物流、快递与即时配送', true, 0),
('站点负责人', 'position', '现代物流、快递与即时配送', true, 0),
('报关员', 'position', '现代物流、快递与即时配送', true, 0);

-- 9. 电子商务与直播经济
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('电商运营', 'position', '电子商务与直播经济', true, 0),
('直播主播', 'position', '电子商务与直播经济', true, 0),
('助播', 'position', '电子商务与直播经济', true, 0),
('场控', 'position', '电子商务与直播经济', true, 0),
('短视频剪辑', 'position', '电子商务与直播经济', true, 0),
('文案策划', 'position', '电子商务与直播经济', true, 0),
('选品师', 'position', '电子商务与直播经济', true, 0),
('视觉设计', 'position', '电子商务与直播经济', true, 0),
('店铺美工', 'position', '电子商务与直播经济', true, 0),
('跨境平台运营', 'position', '电子商务与直播经济', true, 0),
('客服主管', 'position', '电子商务与直播经济', true, 0),
('私域运营', 'position', '电子商务与直播经济', true, 0);

-- 10. 消费品、零售与贸易
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('采购经理', 'position', '消费品、零售与贸易', true, 0),
('外贸业务员', 'position', '消费品、零售与贸易', true, 0),
('店长', 'position', '消费品、零售与贸易', true, 0),
('陈列师(VMD)', 'position', '消费品、零售与贸易', true, 0),
('督导', 'position', '消费品、零售与贸易', true, 0),
('渠道开发', 'position', '消费品、零售与贸易', true, 0),
('市场营销', 'position', '消费品、零售与贸易', true, 0),
('品牌公关', 'position', '消费品、零售与贸易', true, 0),
('招商专员', 'position', '消费品、零售与贸易', true, 0),
('区域经理', 'position', '消费品、零售与贸易', true, 0),
('奢侈品鉴定师', 'position', '消费品、零售与贸易', true, 0);

-- 11. 医疗、生物与医药
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('医生', 'position', '医疗、生物与医药', true, 0),
('护士', 'position', '医疗、生物与医药', true, 0),
('药剂师', 'position', '医疗、生物与医药', true, 0),
('临床监查员(CRA)', 'position', '医疗、生物与医药', true, 0),
('医学经理', 'position', '医疗、生物与医药', true, 0),
('医药代表', 'position', '医疗、生物与医药', true, 0),
('生物实验员', 'position', '医疗、生物与医药', true, 0),
('医学影像技师', 'position', '医疗、生物与医药', true, 0),
('医疗器械研发', 'position', '医疗、生物与医药', true, 0),
('营养师', 'position', '医疗、生物与医药', true, 0),
('康复理疗师', 'position', '医疗、生物与医药', true, 0),
('牙科医生', 'position', '医疗、生物与医药', true, 0);

-- 12. 教育、科研与培训
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('教师', 'position', '教育、科研与培训', true, 0),
('课程顾问', 'position', '教育、科研与培训', true, 0),
('班主任', 'position', '教育、科研与培训', true, 0),
('教研员', 'position', '教育、科研与培训', true, 0),
('科研助理', 'position', '教育、科研与培训', true, 0),
('实验室技术员', 'position', '教育、科研与培训', true, 0),
('职业培训师', 'position', '教育、科研与培训', true, 0),
('翻译', 'position', '教育、科研与培训', true, 0),
('课程研发', 'position', '教育、科研与培训', true, 0),
('校长/园长', 'position', '教育、科研与培训', true, 0),
('助教', 'position', '教育、科研与培训', true, 0);

-- 13. 文化、传媒与娱乐体育
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('记者', 'position', '文化、传媒与娱乐体育', true, 0),
('编辑', 'position', '文化、传媒与娱乐体育', true, 0),
('新媒体运营', 'position', '文化、传媒与娱乐体育', true, 0),
('导演', 'position', '文化、传媒与娱乐体育', true, 0),
('摄影师', 'position', '文化、传媒与娱乐体育', true, 0),
('艺人经纪人', 'position', '文化、传媒与娱乐体育', true, 0),
('动画设计', 'position', '文化、传媒与娱乐体育', true, 0),
('游戏策划', 'position', '文化、传媒与娱乐体育', true, 0),
('健身教练', 'position', '文化、传媒与娱乐体育', true, 0),
('活动策划', 'position', '文化、传媒与娱乐体育', true, 0),
('配音演员', 'position', '文化、传媒与娱乐体育', true, 0),
('模特', 'position', '文化、传媒与娱乐体育', true, 0);

-- 14. 餐饮、旅游与生活服务
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('厨师', 'position', '餐饮、旅游与生活服务', true, 0),
('面点师', 'position', '餐饮、旅游与生活服务', true, 0),
('餐厅经理', 'position', '餐饮、旅游与生活服务', true, 0),
('酒店管理', 'position', '餐饮、旅游与生活服务', true, 0),
('导游', 'position', '餐饮、旅游与生活服务', true, 0),
('计调', 'position', '餐饮、旅游与生活服务', true, 0),
('美容美发师', 'position', '餐饮、旅游与生活服务', true, 0),
('育儿嫂/家政', 'position', '餐饮、旅游与生活服务', true, 0),
('宠物美容师', 'position', '餐饮、旅游与生活服务', true, 0),
('私人助理', 'position', '餐饮、旅游与生活服务', true, 0),
('婚礼策划', 'position', '餐饮、旅游与生活服务', true, 0);

-- 15. 法律、咨询与专业服务
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('律师', 'position', '法律、咨询与专业服务', true, 0),
('法务专员', 'position', '法律、咨询与专业服务', true, 0),
('会计师', 'position', '法律、咨询与专业服务', true, 0),
('审计师', 'position', '法律、咨询与专业服务', true, 0),
('税务师', 'position', '法律、咨询与专业服务', true, 0),
('人力资源咨询', 'position', '法律、咨询与专业服务', true, 0),
('猎头顾问', 'position', '法律、咨询与专业服务', true, 0),
('管理咨询顾问', 'position', '法律、咨询与专业服务', true, 0),
('专利代理人', 'position', '法律、咨询与专业服务', true, 0),
('公证员', 'position', '法律、咨询与专业服务', true, 0);

-- 16. 政府、公共事业与社会组织
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('公务员', 'position', '政府、公共事业与社会组织', true, 0),
('行政办事员', 'position', '政府、公共事业与社会组织', true, 0),
('社工', 'position', '政府、公共事业与社会组织', true, 0),
('志愿者协调员', 'position', '政府、公共事业与社会组织', true, 0),
('城市规划师', 'position', '政府、公共事业与社会组织', true, 0),
('消防员', 'position', '政府、公共事业与社会组织', true, 0),
('警察', 'position', '政府、公共事业与社会组织', true, 0),
('城管执法', 'position', '政府、公共事业与社会组织', true, 0),
('社区管理员', 'position', '政府、公共事业与社会组织', true, 0);

-- 17. 综合职能 (横向通用类)
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('人力资源(HR)', 'position', '综合职能 (横向通用类)', true, 0),
('财务/出纳', 'position', '综合职能 (横向通用类)', true, 0),
('行政', 'position', '综合职能 (横向通用类)', true, 0),
('前台', 'position', '综合职能 (横向通用类)', true, 0),
('秘书', 'position', '综合职能 (横向通用类)', true, 0),
('总经理助理', 'position', '综合职能 (横向通用类)', true, 0),
('公关', 'position', '综合职能 (横向通用类)', true, 0),
('后勤', 'position', '综合职能 (横向通用类)', true, 0),
('采购', 'position', '综合职能 (横向通用类)', true, 0),
('信息技术支持(IT Desktop)', 'position', '综合职能 (横向通用类)', true, 0);

-- 18. 农林牧渔与现代农业
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('农业技术员', 'position', '农林牧渔与现代农业', true, 0),
('育种工程师', 'position', '农林牧渔与现代农业', true, 0),
('兽医', 'position', '农林牧渔与现代农业', true, 0),
('园艺师', 'position', '农林牧渔与现代农业', true, 0),
('林业调查员', 'position', '农林牧渔与现代农业', true, 0),
('农业无人机飞手', 'position', '农林牧渔与现代农业', true, 0),
('养殖场长', 'position', '农林牧渔与现代农业', true, 0),
('农产品电商经理', 'position', '农林牧渔与现代农业', true, 0);

-- 其他（放在最后）
INSERT INTO tags (name, type, subcategory, is_active, usage_count) VALUES
('其他', 'position', '其他', true, 0);

-- 步骤4: 验证结果
SELECT 
  subcategory AS "行业分类",
  COUNT(*) AS "职位数量"
FROM tags
WHERE type = 'position' AND is_active = true
GROUP BY subcategory
ORDER BY 
  CASE 
    WHEN subcategory = '其他' THEN 1
    ELSE 0
  END,
  subcategory;

-- 显示总数
SELECT COUNT(*) AS "职位总数" FROM tags WHERE type = 'position' AND is_active = true;

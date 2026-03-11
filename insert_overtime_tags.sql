-- ============================================
-- 删除旧的 overtime 标签，插入新的加班标签（带分类 subcategory）
-- 常用20个 + 其他搜索标签（按分类）
-- ============================================

-- 第零步：给 tags 表添加 subcategory 字段（如果不存在）
ALTER TABLE tags ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50) DEFAULT NULL;

-- 第一步：清理 status_records 中对旧 overtime 标签的引用
UPDATE status_records
SET tag_id = NULL
WHERE tag_id IN (
  SELECT id FROM tags WHERE category = 'overtime' AND type = 'custom'
);

-- 第二步：删除旧的 overtime 标签
DELETE FROM tags WHERE category = 'overtime' AND type = 'custom';

-- 第三步：插入常用加班标签（前20个，subcategory = '常用'）
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('写文档', 'custom', 'overtime', '常用', true, 100),
  ('改内容', 'custom', 'overtime', '常用', true, 99),
  ('回消息', 'custom', 'overtime', '常用', true, 98),
  ('跟进度', 'custom', 'overtime', '常用', true, 97),
  ('处理事务', 'custom', 'overtime', '常用', true, 96),
  ('填系统', 'custom', 'overtime', '常用', true, 95),
  ('对需求', 'custom', 'overtime', '常用', true, 94),
  ('协调事', 'custom', 'overtime', '常用', true, 93),
  ('查问题', 'custom', 'overtime', '常用', true, 92),
  ('修问题', 'custom', 'overtime', '常用', true, 91),
  ('对数据', 'custom', 'overtime', '常用', true, 90),
  ('做报表', 'custom', 'overtime', '常用', true, 89),
  ('整资料', 'custom', 'overtime', '常用', true, 88),
  ('跑流程', 'custom', 'overtime', '常用', true, 87),
  ('开会议', 'custom', 'overtime', '常用', true, 86),
  ('跟客户', 'custom', 'overtime', '常用', true, 85),
  ('处理异常', 'custom', 'overtime', '常用', true, 84),
  ('临时处理', 'custom', 'overtime', '常用', true, 83),
  ('收尾事', 'custom', 'overtime', '常用', true, 82),
  ('写记录', 'custom', 'overtime', '常用', true, 81)
ON CONFLICT (name) DO UPDATE SET
  category = 'overtime',
  subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count,
  is_active = true;

-- 技术 / IT / 数字化
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('写代码', 'custom', 'overtime', '技术/IT/数字化', true, 40),
  ('改代码', 'custom', 'overtime', '技术/IT/数字化', true, 39),
  ('看日志', 'custom', 'overtime', '技术/IT/数字化', true, 38),
  ('查日志', 'custom', 'overtime', '技术/IT/数字化', true, 37),
  ('分析日志', 'custom', 'overtime', '技术/IT/数字化', true, 36),
  ('跑程序', 'custom', 'overtime', '技术/IT/数字化', true, 35),
  ('调接口', 'custom', 'overtime', '技术/IT/数字化', true, 34),
  ('联调', 'custom', 'overtime', '技术/IT/数字化', true, 33),
  ('部署', 'custom', 'overtime', '技术/IT/数字化', true, 32),
  ('上线', 'custom', 'overtime', '技术/IT/数字化', true, 31),
  ('回滚', 'custom', 'overtime', '技术/IT/数字化', true, 30),
  ('发版本', 'custom', 'overtime', '技术/IT/数字化', true, 29),
  ('打包', 'custom', 'overtime', '技术/IT/数字化', true, 28),
  ('改配置', 'custom', 'overtime', '技术/IT/数字化', true, 27),
  ('配环境', 'custom', 'overtime', '技术/IT/数字化', true, 26),
  ('启服务', 'custom', 'overtime', '技术/IT/数字化', true, 25),
  ('重启服务', 'custom', 'overtime', '技术/IT/数字化', true, 24),
  ('值守系统', 'custom', 'overtime', '技术/IT/数字化', true, 23),
  ('看告警', 'custom', 'overtime', '技术/IT/数字化', true, 22),
  ('处理告警', 'custom', 'overtime', '技术/IT/数字化', true, 21),
  ('排查故障', 'custom', 'overtime', '技术/IT/数字化', true, 20),
  ('修复故障', 'custom', 'overtime', '技术/IT/数字化', true, 19),
  ('性能调优', 'custom', 'overtime', '技术/IT/数字化', true, 18),
  ('压测', 'custom', 'overtime', '技术/IT/数字化', true, 17),
  ('数据迁移', 'custom', 'overtime', '技术/IT/数字化', true, 16),
  ('跑脚本', 'custom', 'overtime', '技术/IT/数字化', true, 15),
  ('写脚本', 'custom', 'overtime', '技术/IT/数字化', true, 14),
  ('技术评审', 'custom', 'overtime', '技术/IT/数字化', true, 13),
  ('代码评审', 'custom', 'overtime', '技术/IT/数字化', true, 12),
  ('复盘问题', 'custom', 'overtime', '技术/IT/数字化', true, 11),
  ('安全检查', 'custom', 'overtime', '技术/IT/数字化', true, 10),
  ('修漏洞', 'custom', 'overtime', '技术/IT/数字化', true, 9),
  ('权限调整', 'custom', 'overtime', '技术/IT/数字化', true, 8),
  ('监控数据', 'custom', 'overtime', '技术/IT/数字化', true, 7)
ON CONFLICT (name) DO UPDATE SET
  category = 'overtime',
  subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count,
  is_active = true;


-- 数据 / 财务 / 分析
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('拉数据', 'custom', 'overtime', '数据/财务/分析', true, 40),
  ('清数据', 'custom', 'overtime', '数据/财务/分析', true, 39),
  ('整数据', 'custom', 'overtime', '数据/财务/分析', true, 38),
  ('算指标', 'custom', 'overtime', '数据/财务/分析', true, 37),
  ('查异常', 'custom', 'overtime', '数据/财务/分析', true, 36),
  ('修数据', 'custom', 'overtime', '数据/财务/分析', true, 35),
  ('补数据', 'custom', 'overtime', '数据/财务/分析', true, 34),
  ('做分析', 'custom', 'overtime', '数据/财务/分析', true, 33),
  ('改报表', 'custom', 'overtime', '数据/财务/分析', true, 32),
  ('核数字', 'custom', 'overtime', '数据/财务/分析', true, 31),
  ('对账', 'custom', 'overtime', '数据/财务/分析', true, 30),
  ('核账', 'custom', 'overtime', '数据/财务/分析', true, 29),
  ('查差异', 'custom', 'overtime', '数据/财务/分析', true, 28),
  ('算成本', 'custom', 'overtime', '数据/财务/分析', true, 27),
  ('算预算', 'custom', 'overtime', '数据/财务/分析', true, 26),
  ('调预算', 'custom', 'overtime', '数据/财务/分析', true, 25),
  ('算绩效', 'custom', 'overtime', '数据/财务/分析', true, 24),
  ('查流水', 'custom', 'overtime', '数据/财务/分析', true, 23),
  ('整台账', 'custom', 'overtime', '数据/财务/分析', true, 22),
  ('拉明细', 'custom', 'overtime', '数据/财务/分析', true, 21),
  ('对明细', 'custom', 'overtime', '数据/财务/分析', true, 20),
  ('统一口径', 'custom', 'overtime', '数据/财务/分析', true, 19),
  ('出结论', 'custom', 'overtime', '数据/财务/分析', true, 18)
ON CONFLICT (name) DO UPDATE SET
  category = 'overtime',
  subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count,
  is_active = true;

-- 项目 / 管理 / 协作
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('推事项', 'custom', 'overtime', '项目/管理/协作', true, 40),
  ('对方案', 'custom', 'overtime', '项目/管理/协作', true, 39),
  ('改方案', 'custom', 'overtime', '项目/管理/协作', true, 38),
  ('写计划', 'custom', 'overtime', '项目/管理/协作', true, 37),
  ('改计划', 'custom', 'overtime', '项目/管理/协作', true, 36),
  ('对排期', 'custom', 'overtime', '项目/管理/协作', true, 35),
  ('调排期', 'custom', 'overtime', '项目/管理/协作', true, 34),
  ('拉会议', 'custom', 'overtime', '项目/管理/协作', true, 33),
  ('写纪要', 'custom', 'overtime', '项目/管理/协作', true, 32),
  ('确认需求', 'custom', 'overtime', '项目/管理/协作', true, 31),
  ('对反馈', 'custom', 'overtime', '项目/管理/协作', true, 30),
  ('回反馈', 'custom', 'overtime', '项目/管理/协作', true, 29),
  ('向上汇报', 'custom', 'overtime', '项目/管理/协作', true, 28),
  ('拉共识', 'custom', 'overtime', '项目/管理/协作', true, 27),
  ('推决策', 'custom', 'overtime', '项目/管理/协作', true, 26),
  ('确认事项', 'custom', 'overtime', '项目/管理/协作', true, 25),
  ('跟结果', 'custom', 'overtime', '项目/管理/协作', true, 24),
  ('处理冲突', 'custom', 'overtime', '项目/管理/协作', true, 23),
  ('对优先级', 'custom', 'overtime', '项目/管理/协作', true, 22),
  ('盯风险', 'custom', 'overtime', '项目/管理/协作', true, 21),
  ('做复盘', 'custom', 'overtime', '项目/管理/协作', true, 20)
ON CONFLICT (name) DO UPDATE SET
  category = 'overtime',
  subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count,
  is_active = true;

-- 生产 / 运维 / 工程 / 制造
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('盯现场', 'custom', 'overtime', '生产/运维/工程/制造', true, 40),
  ('巡检', 'custom', 'overtime', '生产/运维/工程/制造', true, 39),
  ('值班', 'custom', 'overtime', '生产/运维/工程/制造', true, 38),
  ('排查', 'custom', 'overtime', '生产/运维/工程/制造', true, 37),
  ('修设备', 'custom', 'overtime', '生产/运维/工程/制造', true, 36),
  ('维护', 'custom', 'overtime', '生产/运维/工程/制造', true, 35),
  ('调试', 'custom', 'overtime', '生产/运维/工程/制造', true, 34),
  ('复测', 'custom', 'overtime', '生产/运维/工程/制造', true, 33),
  ('补工序', 'custom', 'overtime', '生产/运维/工程/制造', true, 32),
  ('对工序', 'custom', 'overtime', '生产/运维/工程/制造', true, 31),
  ('清点', 'custom', 'overtime', '生产/运维/工程/制造', true, 30),
  ('盘点', 'custom', 'overtime', '生产/运维/工程/制造', true, 29),
  ('处理故障', 'custom', 'overtime', '生产/运维/工程/制造', true, 28),
  ('查原因', 'custom', 'overtime', '生产/运维/工程/制造', true, 27),
  ('写报告', 'custom', 'overtime', '生产/运维/工程/制造', true, 26),
  ('安排维修', 'custom', 'overtime', '生产/运维/工程/制造', true, 25),
  ('交接班', 'custom', 'overtime', '生产/运维/工程/制造', true, 24),
  ('做交接', 'custom', 'overtime', '生产/运维/工程/制造', true, 23),
  ('验收', 'custom', 'overtime', '生产/运维/工程/制造', true, 22),
  ('返工', 'custom', 'overtime', '生产/运维/工程/制造', true, 21),
  ('整改', 'custom', 'overtime', '生产/运维/工程/制造', true, 20),
  ('应急处理', 'custom', 'overtime', '生产/运维/工程/制造', true, 19),
  ('稳定运行', 'custom', 'overtime', '生产/运维/工程/制造', true, 18),
  ('做预案', 'custom', 'overtime', '生产/运维/工程/制造', true, 17)
ON CONFLICT (name) DO UPDATE SET
  category = 'overtime',
  subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count,
  is_active = true;

-- 销售 / 服务 / 客户
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('接待', 'custom', 'overtime', '销售/服务/客户', true, 40),
  ('对客户', 'custom', 'overtime', '销售/服务/客户', true, 39),
  ('回电话', 'custom', 'overtime', '销售/服务/客户', true, 38),
  ('接电话', 'custom', 'overtime', '销售/服务/客户', true, 37),
  ('处理订单', 'custom', 'overtime', '销售/服务/客户', true, 36),
  ('补订单', 'custom', 'overtime', '销售/服务/客户', true, 35),
  ('对价格', 'custom', 'overtime', '销售/服务/客户', true, 34),
  ('报价', 'custom', 'overtime', '销售/服务/客户', true, 33),
  ('改报价', 'custom', 'overtime', '销售/服务/客户', true, 32),
  ('签合同', 'custom', 'overtime', '销售/服务/客户', true, 31),
  ('跟合同', 'custom', 'overtime', '销售/服务/客户', true, 30),
  ('对条款', 'custom', 'overtime', '销售/服务/客户', true, 29),
  ('收款', 'custom', 'overtime', '销售/服务/客户', true, 28),
  ('对账款', 'custom', 'overtime', '销售/服务/客户', true, 27),
  ('跟回款', 'custom', 'overtime', '销售/服务/客户', true, 26),
  ('发货', 'custom', 'overtime', '销售/服务/客户', true, 25),
  ('跟物流', 'custom', 'overtime', '销售/服务/客户', true, 24),
  ('处理售后', 'custom', 'overtime', '销售/服务/客户', true, 23),
  ('回访', 'custom', 'overtime', '销售/服务/客户', true, 22),
  ('处理投诉', 'custom', 'overtime', '销售/服务/客户', true, 21),
  ('安抚客户', 'custom', 'overtime', '销售/服务/客户', true, 20),
  ('理货', 'custom', 'overtime', '销售/服务/客户', true, 19),
  ('上架', 'custom', 'overtime', '销售/服务/客户', true, 18),
  ('下架', 'custom', 'overtime', '销售/服务/客户', true, 17)
ON CONFLICT (name) DO UPDATE SET
  category = 'overtime',
  subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count,
  is_active = true;

-- 行政 / 内部支持
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('写通知', 'custom', 'overtime', '行政/内部支持', true, 30),
  ('发通知', 'custom', 'overtime', '行政/内部支持', true, 29),
  ('走审批', 'custom', 'overtime', '行政/内部支持', true, 28),
  ('准备材料', 'custom', 'overtime', '行政/内部支持', true, 27),
  ('建档', 'custom', 'overtime', '行政/内部支持', true, 26),
  ('归档', 'custom', 'overtime', '行政/内部支持', true, 25),
  ('录信息', 'custom', 'overtime', '行政/内部支持', true, 24),
  ('对单据', 'custom', 'overtime', '行政/内部支持', true, 23),
  ('核资料', 'custom', 'overtime', '行政/内部支持', true, 22),
  ('补记录', 'custom', 'overtime', '行政/内部支持', true, 21),
  ('打印', 'custom', 'overtime', '行政/内部支持', true, 20),
  ('盖章', 'custom', 'overtime', '行政/内部支持', true, 19),
  ('安排事务', 'custom', 'overtime', '行政/内部支持', true, 18),
  ('协调事务', 'custom', 'overtime', '行政/内部支持', true, 17),
  ('临时顶岗', 'custom', 'overtime', '行政/内部支持', true, 16)
ON CONFLICT (name) DO UPDATE SET
  category = 'overtime',
  subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count,
  is_active = true;

-- 应急 / 异常 / 非计划
INSERT INTO tags (name, type, category, subcategory, is_active, usage_count) VALUES
  ('紧急处理', 'custom', 'overtime', '应急/异常/非计划', true, 30),
  ('补救', 'custom', 'overtime', '应急/异常/非计划', true, 28),
  ('重做', 'custom', 'overtime', '应急/异常/非计划', true, 26),
  ('善后', 'custom', 'overtime', '应急/异常/非计划', true, 24),
  ('对风险', 'custom', 'overtime', '应急/异常/非计划', true, 22),
  ('稳状态', 'custom', 'overtime', '应急/异常/非计划', true, 20),
  ('补说明', 'custom', 'overtime', '应急/异常/非计划', true, 18),
  ('再确认', 'custom', 'overtime', '应急/异常/非计划', true, 16)
ON CONFLICT (name) DO UPDATE SET
  category = 'overtime',
  subcategory = EXCLUDED.subcategory,
  usage_count = EXCLUDED.usage_count,
  is_active = true;

-- 同时给准时下班标签也加上 subcategory（按原来的分类）
UPDATE tags SET subcategory = '常用' WHERE category = 'ontime' AND type = 'custom' AND usage_count >= 81;
UPDATE tags SET subcategory = '吃喝' WHERE category = 'ontime' AND type = 'custom' AND name IN ('做晚饭','吃家常','轻食','水果','咖啡','喝茶','小酌','加餐','火锅','烧烤','路边摊','零食','夜饮','甜点');
UPDATE tags SET subcategory = '数字娱乐' WHERE category = 'ontime' AND type = 'custom' AND name IN ('直播','综艺','社交','冲浪','回放','论坛','看新闻','白噪音','电台','纪录片','追番','电影','看照片');
UPDATE tags SET subcategory = '游戏' WHERE category = 'ontime' AND type = 'custom' AND name IN ('单机','主机','桌游','棋类','日常本','刷副本','排位','剧情','小游戏','看比赛');
UPDATE tags SET subcategory = '运动健康' WHERE category = 'ontime' AND type = 'custom' AND name IN ('拉伸','瑜伽','有氧','力训','跳绳','拉筋','放松','恢复','夜骑','快走');
UPDATE tags SET subcategory = '生活事务' WHERE category = 'ontime' AND type = 'custom' AND name IN ('洗衣','晾衣','打扫','倒垃圾','买菜','收纳','修东西','拿快递','列清单','准备明天');
UPDATE tags SET subcategory = '陪伴社交' WHERE category = 'ontime' AND type = 'custom' AND name IN ('陪家人','带娃','接娃','家聊','视频聊','语音聊','聊天','聚餐','夜聊','联机','陪宠物');

-- 验证结果
SELECT category, subcategory, COUNT(*) as count
FROM tags
WHERE type = 'custom' AND is_active = true
GROUP BY category, subcategory
ORDER BY category, subcategory;

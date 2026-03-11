# 数据库结构总览

## 📊 数据表统计

你的加班指数 APP 目前使用了 **4 张核心数据表** + **2 个物化视图**

---

## 🗄️ 核心数据表（4张）

### 1. **users** - 用户表
存储用户基本信息和工作信息

**字段：**
- `id` - UUID 主键
- `phone_number` - 手机号（唯一）
- `wechat_id` - 微信ID（唯一）
- `avatar` - 头像
- `username` - 用户名
- `province` - 省份
- `city` - 城市
- `industry` - 行业
- `company` - 公司
- `position` - 职位
- `work_start_time` - 上班时间
- `work_end_time` - 下班时间
- `created_at` - 创建时间
- `updated_at` - 更新时间

**索引：**
- 手机号索引
- 微信ID索引
- 公司索引
- 行业索引

---

### 2. **tags** - 标签表
存储行业、公司、职位等标签

**字段：**
- `id` - UUID 主键
- `name` - 标签名称（唯一）
- `type` - 标签类型（industry/company/position/custom）
- `is_active` - 是否激活
- `usage_count` - 使用次数
- `created_at` - 创建时间

**索引：**
- 类型索引
- 名称索引
- 使用次数索引（降序）

---

### 3. **status_records** - 状态记录表
存储用户每日的加班/准点状态

**字段：**
- `id` - UUID 主键
- `user_id` - 用户ID（外键 → users）
- `date` - 日期
- `is_overtime` - 是否加班
- `tag_id` - 标签ID（外键 → tags）
- `overtime_hours` - 加班小时数（1-12）
- `submitted_at` - 提交时间

**约束：**
- `UNIQUE(user_id, date)` - 每个用户每天只能有一条记录

**索引：**
- 日期索引
- 用户+日期复合索引
- 标签索引

---

### 4. **daily_history** - 每日历史表
存储每天的汇总统计数据

**字段：**
- `id` - UUID 主键
- `date` - 日期（唯一）
- `participant_count` - 参与人数
- `overtime_count` - 加班人数
- `on_time_count` - 准点下班人数
- `tag_distribution` - 标签分布（JSONB）
- `created_at` - 创建时间

**索引：**
- 日期索引（降序）

---

## 📈 物化视图（2个）

### 1. **real_time_stats** - 实时统计视图
当天的实时统计数据（从 status_records 聚合）

**字段：**
- `date` - 日期
- `participant_count` - 参与人数
- `overtime_count` - 加班人数
- `on_time_count` - 准点下班人数
- `last_updated` - 最后更新时间

**刷新频率：** 每 30 秒（通过 pg_cron）

---

### 2. **tag_stats** - 标签统计视图
当天各标签的统计数据

**字段：**
- `date` - 日期
- `tag_id` - 标签ID
- `tag_name` - 标签名称
- `overtime_count` - 加班人数
- `on_time_count` - 准点下班人数
- `total_count` - 总人数

**刷新频率：** 每 30 秒（通过 pg_cron）

---

## 🔗 表关系图

```
users (用户表)
  ↓ 1:N
status_records (状态记录表)
  ↓ N:1
tags (标签表)

status_records
  ↓ 聚合
daily_history (每日历史表)

status_records
  ↓ 实时聚合
real_time_stats (物化视图)
tag_stats (物化视图)
```

---

## 📊 数据流向

### 用户提交流程
```
1. 用户提交状态
   ↓
2. 写入 status_records 表
   ↓
3. 触发物化视图刷新
   ↓
4. real_time_stats 和 tag_stats 更新
   ↓
5. 前端读取实时数据
```

### 每日归档流程
```
1. 每天 00:00 触发 archive_daily_data()
   ↓
2. 从 status_records 聚合昨天的数据
   ↓
3. 写入 daily_history 表
   ↓
4. 历史数据永久保存
```

---

## 💾 存储估算

### 单条记录大小
- **users**: ~500 bytes
- **tags**: ~200 bytes
- **status_records**: ~150 bytes
- **daily_history**: ~500 bytes（含 JSONB）

### 容量估算（1000 用户，1年）
```
users:           1,000 × 500 bytes = 0.5 MB
tags:            100 × 200 bytes = 0.02 MB
status_records:  1,000 × 365 × 150 bytes = 54.75 MB
daily_history:   365 × 500 bytes = 0.18 MB

总计: ~55 MB / 年
```

### 10,000 用户，1年
```
总计: ~550 MB / 年
```

**结论：** 数据库设计非常高效，即使 10,000 用户使用 1 年，也只需要约 550 MB 存储空间。

---

## 🎯 设计优势

### 1. **简洁高效**
- 只有 4 张核心表，结构清晰
- 避免过度设计，易于维护

### 2. **性能优化**
- 物化视图缓存实时统计，避免重复计算
- 合理的索引设计，查询速度快
- JSONB 存储标签分布，灵活且高效

### 3. **数据完整性**
- 外键约束保证数据一致性
- UNIQUE 约束防止重复提交
- CHECK 约束验证数据有效性

### 4. **可扩展性**
- 标签系统支持自定义扩展
- JSONB 字段支持灵活的数据结构
- 物化视图可以根据需要添加更多维度

---

## 🔧 数据库函数（5个）

1. **refresh_real_time_stats()** - 刷新物化视图
2. **get_real_time_stats()** - 获取实时统计
3. **get_top_tags()** - 获取 Top N 标签
4. **get_daily_status()** - 获取每日状态
5. **archive_daily_data()** - 每日数据归档

---

## 📝 总结

你的数据库设计非常专业和高效：

✅ **表数量适中**：4 张核心表 + 2 个物化视图
✅ **结构清晰**：职责分明，易于理解
✅ **性能优秀**：合理使用索引和物化视图
✅ **扩展性强**：支持未来功能扩展
✅ **存储高效**：即使大量用户也不会占用太多空间

这是一个**生产级别的数据库设计**，完全可以支撑一个严肃的数据应用！

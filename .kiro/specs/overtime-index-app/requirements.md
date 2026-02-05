# 需求文档

## 介绍

打工人加班指数是一个跨平台移动应用，旨在通过冷静的数据展示方式呈现全国范围内加班与准时下班的实时统计信息。该应用以数据驱动的方式帮助用户了解当前的工作状态趋势，避免情绪化的展示方式。

## 术语表

- **OvertimeIndexApp**: 打工人加班指数移动应用系统
- **TrendPage**: 趋势页面，应用的默认首页，展示群体数据
- **UserStatusSelector**: 用户状态选择器，允许用户选择准时下班或加班状态
- **TagSelector**: 标签选择器，用于选择行业、公司等分类标签
- **TimeAxis**: 时间轴控件，用于查看历史数据
- **DataVisualization**: 数据可视化组件，包括对抗条和网格图
- **RealTimeData**: 实时数据，每3秒刷新一次的统计信息
- **UserRegistration**: 用户注册系统，支持手机号和微信注册

## 需求

### 需求 1

**用户故事:** 作为用户，我希望能够在移动设备上查看实时的加班统计数据，以便了解当前的工作状态趋势。

#### 验收标准

1. WHEN 用户启动应用 THEN OvertimeIndexApp SHALL 在iOS和Android平台上正常运行
2. WHEN 应用启动 THEN OvertimeIndexApp SHALL 默认显示TrendPage作为首页
3. WHEN 用户查看趋势页面 THEN OvertimeIndexApp SHALL 以冷静的数据展示方式呈现统计信息
4. WHEN 数据更新 THEN OvertimeIndexApp SHALL 每3秒刷新一次RealTimeData
5. WHEN 用户切换设备方向 THEN OvertimeIndexApp SHALL 保持界面布局的适配性

### 需求 2

**用户故事:** 作为用户，我希望能够看到实时更新的时间和参与人数，以便了解当前数据的时效性。

#### 验收标准

1. WHEN 趋势页面显示 THEN TrendPage SHALL 在第一行左侧显示格式为"YYYY/MM/DD HH:mm:ss"的实时时间
2. WHEN 时间显示 THEN TrendPage SHALL 每秒刷新一次时间显示
3. WHEN 显示参与人数 THEN TrendPage SHALL 在第二行显示"今日参与记录人数"及具体数值
4. WHEN 参与人数更新 THEN TrendPage SHALL 每3秒刷新一次参与人数数据
5. WHEN 数据刷新 THEN TrendPage SHALL 使用滚动增加效果展示数值变化

### 需求 3

**用户故事:** 作为用户，我希望能够通过主题切换和菜单功能来个性化我的使用体验，以便根据不同需求查看数据。

#### 验收标准

1. WHEN 用户查看第一行右侧 THEN TrendPage SHALL 显示白天/夜晚主题切换按钮
2. WHEN 用户点击主题切换按钮 THEN OvertimeIndexApp SHALL 在白天和夜晚主题间切换
3. WHEN 用户查看第一行右侧 THEN TrendPage SHALL 显示菜单按钮
4. WHEN 用户点击菜单按钮 THEN TrendPage SHALL 展开包含公司维度、行业维度、城市维度、历史数据、个人维度、设置的菜单选项
5. WHEN 用户选择菜单选项 THEN OvertimeIndexApp SHALL 导航到相应的功能页面

### 需求 4

**用户故事:** 作为用户，我希望能够查看过去几天的统计状态和实时对比数据，以便了解趋势变化。

#### 验收标准

1. WHEN 显示历史状态 THEN TrendPage SHALL 在第三行显示过去6天的统计状态
2. WHEN 显示状态指示器 THEN TrendPage SHALL 使用浅红色圆点表示加班人数大于准时下班人数的日期
3. WHEN 显示状态指示器 THEN TrendPage SHALL 使用浅绿色圆点表示准时下班人数大于加班人数的日期
4. WHEN 显示状态指示器 THEN TrendPage SHALL 使用闪烁的浅黄色圆点表示当天未出结果的状态
5. WHEN 显示对抗条 THEN DataVisualization SHALL 在第四行显示左侧浅绿色、右侧浅红色的细横条，交界处根据实时人数比例移动

### 需求 5

**用户故事:** 作为用户，我希望能够通过可视化网格图查看详细的数据分布，以便更直观地理解统计信息。

#### 验收标准

1. WHEN 显示数据网格 THEN DataVisualization SHALL 使用类似GitHub贡献图的小方框铺满底部区域
2. WHEN 分配颜色 THEN DataVisualization SHALL 使用红色系表示加班，蓝色系表示准时下班
3. WHEN 计算占比 THEN DataVisualization SHALL 根据实时人数占比分配小方格数量
4. WHEN 数据更新 THEN DataVisualization SHALL 每3秒刷新一次面积和人数
5. WHEN 面积变化 THEN DataVisualization SHALL 使用平滑缓慢的变形效果，避免跳变

### 需求 6

**用户故事:** 作为用户，我希望能够查看历史数据并与当前数据对比，以便分析时间趋势。

#### 验收标准

1. WHEN 显示时间轴 THEN TimeAxis SHALL 在底部显示从00:00到"现在"的横向时间轴
2. WHEN 用户拖动时间轴 THEN TimeAxis SHALL 允许上下拖动并展示对应时间点的历史数据
3. WHEN 设置时间刻度 THEN TimeAxis SHALL 每15分钟设置一个刻度
4. WHEN 用户点击"现在" THEN TimeAxis SHALL 回到当前实时状态
5. WHEN 查看历史数据 THEN OvertimeIndexApp SHALL 根据时间轴位置更新所有数据可视化组件

### 需求 7

**用户故事:** 作为用户，我希望能够提交我的工作状态，以便为整体统计数据做出贡献。

#### 验收标准

1. WHEN 用户首次使用 THEN UserStatusSelector SHALL 显示准点下班/加班选择选项
2. WHEN 用户选择准点下班 THEN UserStatusSelector SHALL 弹出标签选择界面
3. WHEN 用户选择加班 THEN UserStatusSelector SHALL 弹出标签选择和加班时长选择界面
4. WHEN 用户完成选择 THEN UserStatusSelector SHALL 隐藏选择器直到次日
5. WHEN 选择加班时长 THEN UserStatusSelector SHALL 提供1-6小时的滑动选择器

### 需求 8

**用户故事:** 作为新用户，我希望能够通过简便的方式注册账户，以便开始使用应用功能。

#### 验收标准

1. WHEN 新用户访问应用 THEN UserRegistration SHALL 显示包含LOGO和登录/注册按钮的界面
2. WHEN 用户选择注册 THEN UserRegistration SHALL 支持手机号注册和微信快捷注册
3. WHEN 使用微信注册 THEN UserRegistration SHALL 获取微信用户名和头像信息
4. WHEN 完善用户信息 THEN UserRegistration SHALL 要求用户提供头像、用户名、省份城市、行业、公司、职位、标准上下班时间
5. WHEN 选择行业公司职位 THEN UserRegistration SHALL 提供带搜索功能的选择界面

### 需求 9

**用户故事:** 作为用户，我希望能够搜索和选择合适的标签，以便准确描述我的工作状态。

#### 验收标准

1. WHEN 显示标签选择 THEN TagSelector SHALL 提供搜索框功能
2. WHEN 初始显示 THEN TagSelector SHALL 默认显示前20个常用标签
3. WHEN 用户搜索 THEN TagSelector SHALL 根据输入内容过滤标签列表
4. WHEN 显示网格数据 THEN DataVisualization SHALL 仅显示占比Top10的标签，其余合并为"其他"类别
5. WHEN 合并其他类别 THEN DataVisualization SHALL 分别显示加班的其他(浅红色)和准时下班的其他(浅绿色)

### 需求 10

**用户故事:** 作为用户，我希望能够修改我的个人信息，以便保持数据的准确性。

#### 验收标准

1. WHEN 用户访问设置 THEN OvertimeIndexApp SHALL 允许修改注册时填写的所有个人信息
2. WHEN 修改信息 THEN OvertimeIndexApp SHALL 提供与注册时相同的搜索和选择功能
3. WHEN 保存修改 THEN OvertimeIndexApp SHALL 验证信息完整性后更新用户数据
4. WHEN 信息更新 THEN OvertimeIndexApp SHALL 立即反映在相关的数据统计中
5. WHEN 定位获取 THEN OvertimeIndexApp SHALL 支持通过定位自动获取省份城市信息
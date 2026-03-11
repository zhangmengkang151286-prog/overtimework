# 打工人加班指数 - Overtime Index App

一个用于追踪和可视化加班统计数据的React Native移动应用。

## 📱 项目状态

### ✅ 已完成
- **UI 框架迁移**: 从 Tamagui 迁移到 Gluestack-UI v2
- **代码实现**: 100% 完成
- **单元测试**: 所有测试通过
- **集成测试**: 所有测试通过
- **性能测试**: 性能符合要求
- **兼容性测试**: iOS 和 Android 都正常运行
- **主题系统**: 深色/浅色模式完美支持
- **文档**: 完整的使用指南和 API 文档

### 🎯 核心特性
- ✅ 实时加班指数监测
- ✅ 数据可视化（网格图表、对比柱状图、趋势图）
- ✅ 用户状态管理
- ✅ 历史数据查看
- ✅ 主题切换（深色/浅色）
- ✅ 离线支持
- ✅ 错误处理和恢复

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- npm 或 yarn
- Expo CLI
- iOS 模拟器或 Android 模拟器

### 安装依赖
```bash
cd OvertimeIndexApp
npm install
```

### 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的配置
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 启动开发服务器
```bash
# 使用 Expo Tunnel 模式（推荐，适合中国大陆）
npx expo start --tunnel

# 或使用本地模式
npx expo start
```

### 运行测试
```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm test -- --coverage
```

## 📚 文档导航

### 🎨 UI 设计系统
- **[Gluestack-UI 使用指南](docs/GLUESTACK_GUIDE.md)** - Gluestack-UI 组件使用指南 ⭐
- **[组件 API 文档](src/components/gluestack/README.md)** - 组件详细 API 文档
- **[主题系统说明](THEME_SYSTEM_SUMMARY.md)** - 主题系统说明

### 📖 项目文档
- **[项目完成总结](PROJECT_COMPLETION_SUMMARY.md)** - 项目完成总结
- **[最终集成总结](FINAL_INTEGRATION_SUMMARY.md)** - 最终集成总结
- **[UI 框架迁移总结](.kiro/specs/gluestack-migration/tasks.md)** - Gluestack-UI 迁移任务列表

### 🔧 开发指南
- **[代码质量检查清单](docs/CODE_QUALITY_CHECKLIST.md)** - 代码质量标准和检查清单
- **[已知问题](docs/KNOWN_ISSUES.md)** - 当前已知问题和修复建议

### 🛠️ 技术文档
- **[错误处理指南](ERROR_HANDLING_GUIDE.md)** - 错误处理指南
- **[错误处理和性能指南](ERROR_HANDLING_AND_PERFORMANCE_GUIDE.md)** - 错误处理和性能指南
- **[Supabase 集成指南](SUPABASE_INTEGRATION_GUIDE.md)** - Supabase 集成指南
- **[Expo Tunnel 使用指南](EXPO_TUNNEL_GUIDE.md)** - Expo Tunnel 使用指南（中国大陆网络优化）

### 📦 构建相关
- **[iOS 构建指南](BUILD_GUIDE.md)** - iOS 构建完整指南
- **[本地构建指南](LOCAL_BUILD_GUIDE.md)** - 本地构建指南

## 🏗️ 技术栈

### 前端
- **框架**: React Native 0.81.5
- **开发工具**: Expo SDK 54
- **UI 组件库**: Gluestack-UI v2
- **状态管理**: Redux Toolkit
- **导航**: React Navigation 7
- **动画**: React Native Reanimated 4.1.1
- **图表**: Victory Native
- **数据库**: Supabase (PostgreSQL)
- **语言**: TypeScript

### 测试
- **测试框架**: Jest
- **测试库**: React Native Testing Library
- **属性测试**: fast-check
- **测试覆盖**: 135个测试用例

## 📊 项目结构

```
OvertimeIndexApp/
├── src/
│   ├── components/
│   │   └── gluestack/   # Gluestack-UI 组件
│   ├── screens/         # 页面组件
│   ├── services/        # 服务层
│   ├── store/          # Redux状态管理
│   ├── hooks/          # 自定义Hooks
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript类型
│   ├── theme/          # 主题系统
│   └── __tests__/      # 测试文件
├── docs/               # 项目文档
├── App.tsx             # 应用入口
└── *.md               # 各种文档
```

## 🎯 核心功能

1. **实时数据展示**
   - 加班指数可视化
   - 实时数据更新
   - 历史数据查看

2. **用户交互**
   - 用户状态提交
   - 标签选择
   - 数据管理

3. **数据可视化**
   - 网格图表（GridChart）
   - 对比柱状图（VersusBar）
   - 时间轴（TimeAxis）
   - 趋势图表

4. **用户认证**
   - 手机号 + 短信验证码登录
   - 手机号 + 密码登录
   - 用户资料完善

5. **主题系统**
   - 深色/浅色模式切换
   - 纯黑色深色主题
   - 主题持久化

6. **错误处理**
   - 全局错误边界
   - 网络状态监控
   - 错误恢复机制

7. **性能优化**
   - 启动优化
   - 内存监控
   - 渲染优化
   - 离线支持

## 🔗 相关链接

- **[Gluestack-UI 官方文档](https://gluestack.io/)** - Gluestack-UI 官方文档
- **[React Native 官方文档](https://reactnative.dev/)** - React Native 官方文档
- **[Expo 官方文档](https://docs.expo.dev/)** - Expo 官方文档
- **[Supabase 官方文档](https://supabase.com/docs)** - Supabase 官方文档
- **[Redux Toolkit 官方文档](https://redux-toolkit.js.org/)** - Redux Toolkit 官方文档

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

私有项目

## 🎨 UI 框架迁移

本项目已从 Tamagui 迁移到 Gluestack-UI v2。

### 为什么选择 Gluestack-UI？
- 更好的 TypeScript 支持
- 更完善的组件库
- 更活跃的社区支持
- 更好的文档和示例
- 更灵活的主题系统

### 迁移完成情况
- ✅ 所有基础组件已迁移
- ✅ 所有页面已迁移
- ✅ 主题系统已统一
- ✅ 测试已更新
- ✅ 文档已更新

详见：[Gluestack-UI 使用指南](docs/GLUESTACK_GUIDE.md)

---

**当前版本**: 2.0.0  
**最后更新**: 2026-02-19  
**状态**: 生产就绪 ✅

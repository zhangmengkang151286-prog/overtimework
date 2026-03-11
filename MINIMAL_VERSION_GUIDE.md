# 最小化版本使用指南

## 为什么需要最小化版本？

当前完整版本在真机上崩溃，可能是因为：
1. 某些原生模块不兼容
2. 复杂的状态管理导致初始化失败
3. 网络API调用失败

最小化版本移除了所有复杂依赖，只保留基本UI，用于：
- 验证应用能否在真机上运行
- 排查是哪个模块导致崩溃
- 提供一个可用的基础版本

## 如何使用最小化版本

### 方法1：临时替换（推荐）

1. **备份当前App.tsx**
```bash
cd OvertimeIndexApp
copy App.tsx App.full.tsx
```

2. **使用最小化版本**
```bash
copy App.minimal.tsx App.tsx
```

3. **重新构建**
```bash
eas build --platform ios --profile preview
```

4. **测试**
安装新构建的应用，看是否能正常运行

5. **恢复完整版本**（如果需要）
```bash
copy App.full.tsx App.tsx
```

### 方法2：创建新的构建配置

在 `eas.json` 中添加最小化版本的配置：

```json
{
  "build": {
    "minimal": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      },
      "env": {
        "APP_VARIANT": "minimal"
      }
    }
  }
}
```

然后构建：
```bash
eas build --platform ios --profile minimal
```

## 最小化版本包含什么？

✅ **包含：**
- 基本的React Native组件
- 简单的UI展示
- 项目状态说明
- 功能列表展示

❌ **不包含：**
- Redux状态管理
- React Navigation导航
- 网络API调用
- 复杂的动画
- 原生模块（Reanimated、SQLite等）
- 实时数据服务

## 逐步排查问题

如果最小化版本能运行，说明问题出在被移除的功能上。可以逐步添加功能来定位问题：

### 第1步：添加导航
```typescript
import {NavigationContainer} from '@react-navigation/native';
// 测试导航是否工作
```

### 第2步：添加Redux
```typescript
import {Provider} from 'react-redux';
import {store} from './src/store';
// 测试状态管理是否工作
```

### 第3步：添加动画
```typescript
import Animated from 'react-native-reanimated';
// 测试Reanimated是否工作
```

### 第4步：添加网络请求
```typescript
// 测试API调用是否工作
```

## 如果最小化版本也崩溃

如果连最小化版本都崩溃，可能是：

1. **构建配置问题**
   - 检查 `app.json` 配置
   - 检查 `eas.json` 配置

2. **Expo SDK版本问题**
   - 尝试降级Expo SDK版本

3. **iOS版本兼容性**
   - 检查你的iPhone iOS版本
   - 可能需要调整最低支持版本

## 建议的解决路径

### 短期方案
1. 使用最小化版本作为基础
2. 逐步添加功能
3. 找出导致崩溃的具体模块

### 中期方案
1. 开发后端API
2. 使用模拟数据测试UI
3. 等待原生模块更新

### 长期方案
1. 考虑使用更稳定的替代库
2. 或者等待Expo SDK更新
3. 或者迁移到纯React Native（不使用Expo）

## 需要帮助？

如果最小化版本能运行，请告诉我，我可以帮你逐步添加功能，找出问题所在。

如果最小化版本也崩溃，请提供：
1. 构建日志
2. 崩溃日志（如果有）
3. iPhone的iOS版本

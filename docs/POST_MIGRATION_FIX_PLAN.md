# Gluestack-UI 迁移后修复计划

**日期**: 2026-02-19  
**优先级**: 高  
**预计时间**: 2-3 天

---

## 概述

虽然 gluestack-ui 迁移已完成，所有功能正常工作，但测试套件中有 84 个测试失败。这些失败主要是由于测试环境配置问题，而非功能问题。本文档提供详细的修复计划。

---

## 问题分类

### 1. React Native Mock 问题 (60+ 测试)

**错误信息**:
```
Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'DevMenu' could not be found
```

**影响的文件**:
- `SetPasswordScreen.gluestack.test.tsx`
- `PasswordRecoveryScreen.gluestack.test.tsx`
- `DataManagementScreen.gluestack.test.tsx`
- 其他屏幕测试

**根本原因**:
Jest 测试环境中，React Native 的 native 模块（特别是 DevMenu）没有被正确 mock。

**解决方案**:

#### 步骤 1: 改进 jest.setup.js

```javascript
// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Mock React Native modules
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));

// Mock DevMenu
jest.mock('react-native/Libraries/Utilities/DevMenu', () => ({
  show: jest.fn(),
  reload: jest.fn(),
}));

// Mock TurboModuleRegistry
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: jest.fn(),
  getEnforcing: jest.fn(() => ({
    show: jest.fn(),
    reload: jest.fn(),
  })),
}));

// Mock NativeModules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
      DevMenu: {
        show: jest.fn(),
        reload: jest.fn(),
      },
    },
    Platform: {
      ...RN.Platform,
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
  };
});
```

#### 步骤 2: 更新测试文件

移除测试文件中的重复 mock：

```typescript
// 删除这些重复的 mock
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});
```

---

### 2. 导航依赖问题 (10+ 测试)

**错误信息**:
```
Cannot find module '@react-navigation/native-stack'
```

**影响的文件**:
- `navigation.gluestack.test.tsx`

**根本原因**:
测试环境中缺少 `@react-navigation/native-stack` 的 mock。

**解决方案**:

#### 步骤 1: 安装缺失的依赖

```bash
npm install --save-dev @react-navigation/native-stack
```

#### 步骤 2: 添加导航 mock

在 `jest.setup.js` 中添加：

```javascript
// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: 'Navigator',
    Screen: 'Screen',
  })),
}));
```

---

### 3. 快照不匹配 (5 个快照)

**错误信息**:
```
5 snapshots failed from 1 test suite
```

**根本原因**:
gluestack-ui 组件的渲染输出与 Tamagui 不同。

**解决方案**:

#### 步骤 1: 更新快照

```bash
npm test -- -u
```

#### 步骤 2: 审查快照变化

```bash
git diff src/__tests__/**/__snapshots__
```

确保变化是预期的（UI 框架变化导致的）。

---

### 4. TypeScript 类型错误 (47 个错误)

**主要问题**:

1. **命名不一致**: `ontimeCount` vs `onTimeCount`
2. **Redux state 类型不匹配**
3. **旧的测试文件引用不存在的模块**

**解决方案**:

#### 问题 1: 统一命名

```typescript
// 在所有文件中统一使用 onTimeCount
interface VersusBarProps {
  overtimeCount: number;
  onTimeCount: number; // 统一使用驼峰命名
}
```

需要修改的文件：
- `src/components/gluestack/VersusBar.tsx`
- `src/__tests__/compatibility/screen-size-compatibility.test.tsx`
- 所有使用该组件的地方

#### 问题 2: 修复 Redux 类型

```typescript
// 确保测试中的 mock state 与实际 state 类型匹配
const mockStore = configureStore({
  reducer: {
    data: dataReducer,
    ui: uiReducer,
    user: userReducer,
  },
  preloadedState: {
    data: {
      realTimeData: null,
      historicalData: [],
      historicalDataCache: {},
      currentViewData: null,
      isLoading: false,
      error: null,
      selectedTime: '',
      isViewingHistory: false,
      tags: [],
    },
    // ... 其他 state
  },
});
```

#### 问题 3: 清理旧代码

删除或修复引用不存在模块的测试：
- `wechat-autofill.property.test.ts` (引用 WeChatAuthData)
- `wechat-binding-display.property.test.ts` (引用 WeChatBinding)

---

## 修复优先级

### 高优先级（立即修复）

1. **React Native Mock 问题** - 影响最多测试
2. **导航依赖问题** - 阻止集成测试运行

### 中优先级（本周内修复）

3. **TypeScript 类型错误** - 影响代码质量
4. **命名统一** - 提高代码一致性

### 低优先级（下周修复）

5. **快照更新** - 不影响功能
6. **清理旧代码** - 代码清理

---

## 修复步骤

### 第 1 天: 修复测试环境

1. **上午**: 改进 jest.setup.js
   - 添加 DevMenu mock
   - 添加 TurboModuleRegistry mock
   - 添加导航 mock

2. **下午**: 清理测试文件
   - 移除重复的 mock
   - 运行测试验证

**预期结果**: 60+ 测试从失败变为通过

### 第 2 天: 修复类型错误

1. **上午**: 统一命名
   - 修改 VersusBar 组件
   - 更新所有使用处
   - 修复测试

2. **下午**: 修复 Redux 类型
   - 更新测试中的 mock state
   - 修复类型定义

**预期结果**: TypeScript 错误减少到 < 10 个

### 第 3 天: 清理和验证

1. **上午**: 更新快照
   - 运行 `npm test -- -u`
   - 审查变化

2. **下午**: 最终验证
   - 运行完整测试套件
   - 确认所有测试通过
   - 更新文档

**预期结果**: 100% 测试通过

---

## 验证清单

完成修复后，确认以下项目：

- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] TypeScript 编译无错误
- [ ] ESLint 检查通过
- [ ] 快照已更新
- [ ] 文档已更新
- [ ] 代码已提交

---

## 风险评估

### 低风险

- 测试环境修复不会影响生产代码
- 命名统一是简单的重构
- 快照更新是预期的变化

### 注意事项

- 确保 mock 不会隐藏真实问题
- 命名统一时要全局搜索替换
- 快照更新前要审查变化

---

## 成功标准

修复完成后应达到：

- ✅ 测试通过率 > 95%
- ✅ TypeScript 错误 < 5 个
- ✅ 所有核心功能测试通过
- ✅ 文档更新完整

---

## 后续优化

修复完成后，可以考虑：

1. **提高测试覆盖率**
   - 添加更多边缘案例测试
   - 添加端到端测试

2. **性能优化**
   - 测量打包体积
   - 优化加载时间

3. **代码质量**
   - 运行 ESLint 并修复警告
   - 添加更多类型注解

---

**创建时间**: 2026-02-19  
**预计完成**: 2026-02-22  
**负责人**: 开发团队

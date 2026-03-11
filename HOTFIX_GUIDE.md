# 紧急修复指南

## 已修复的问题

1. **App.tsx** - 添加了try-catch错误捕获
2. **VersusBar.tsx** - 添加了默认参数和错误处理

## 重新构建步骤

### 1. 确保代码已保存
所有修改已经应用到代码中。

### 2. 重新构建应用
```bash
cd OvertimeIndexApp
eas build --platform ios --profile preview
```

### 3. 等待构建完成
- 构建时间：约10-20分钟
- 可以在 https://expo.dev 查看进度

### 4. 重新安装到iPhone
构建完成后，访问新的构建链接并安装。

## 如果还是报错

### 查看详细错误信息
1. 打开应用
2. 如果出现错误，截图错误信息
3. 查看是否有具体的错误描述

### 可能的其他问题

#### 问题1：网络API调用失败
**症状：** 应用启动后立即崩溃  
**原因：** 尝试连接不存在的后端API  
**解决：** 需要修改API配置使用模拟数据

#### 问题2：原生模块问题
**症状：** 特定功能报错  
**原因：** 某些原生模块未正确链接  
**解决：** 需要检查具体是哪个模块

#### 问题3：数据初始化问题
**症状：** 白屏或加载失败  
**原因：** Redux store初始化失败  
**解决：** 需要添加更多初始化保护

## 临时解决方案：使用模拟数据

如果API问题导致崩溃，可以修改为使用本地模拟数据：

### 修改 src/services/api.ts
```typescript
// 在文件顶部添加
const USE_MOCK_DATA = true;

// 在每个API调用中添加检查
export const getRealTimeData = async () => {
  if (USE_MOCK_DATA) {
    return {
      timestamp: new Date(),
      participantCount: 1234,
      overtimeCount: 567,
      onTimeCount: 667,
      tagDistribution: [],
      dailyStatus: [],
    };
  }
  // 原有的API调用...
};
```

## 调试技巧

### 1. 查看控制台日志
在Expo Go或开发构建中，可以看到console.log输出。

### 2. 使用React Native Debugger
```bash
npx react-devtools
```

### 3. 检查网络请求
使用Charles或Proxyman查看网络请求。

## 需要更多帮助？

如果问题持续存在：
1. 截图完整的错误信息
2. 查看构建日志
3. 检查是否有特定的错误模式

修复后记得重新构建！

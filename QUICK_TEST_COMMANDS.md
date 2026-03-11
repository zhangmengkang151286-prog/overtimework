# 快速测试命令

## 🚀 测试流程

按顺序测试每个版本，找出导致崩溃的模块。

### 测试版本1 - Redux
```bash
cd OvertimeIndexApp
copy App.test1-redux.tsx App.tsx
eas build --platform ios --profile preview
```
等待构建完成 → 安装到iPhone → 测试

### 测试版本2 - Navigation
```bash
copy App.test2-navigation.tsx App.tsx
eas build --platform ios --profile preview
```
等待构建完成 → 安装到iPhone → 测试

### 测试版本3 - Reanimated
```bash
copy App.test3-reanimated.tsx App.tsx
eas build --platform ios --profile preview
```
等待构建完成 → 安装到iPhone → 测试

### 测试版本4 - Victory
```bash
copy App.test4-victory.tsx App.tsx
eas build --platform ios --profile preview
```
等待构建完成 → 安装到iPhone → 测试

### 测试版本5 - SQLite
```bash
copy App.test5-sqlite.tsx App.tsx
eas build --platform ios --profile preview
```
等待构建完成 → 安装到iPhone → 测试

## 📝 记录结果

每次测试后记录：
- ✅ 正常运行 → 继续下一个版本
- ❌ 崩溃 → 找到问题模块，停止测试

## 🔄 恢复版本

### 恢复到最小版本
```bash
copy App.minimal.tsx App.tsx
```

### 恢复到完整版本
```bash
copy App.full.tsx App.tsx
```

## 💡 提示

1. **每次只测试一个版本**
   - 不要跳过步骤
   - 确保记录每个版本的结果

2. **构建时间**
   - 每次构建约10-20分钟
   - 可以在 https://expo.dev 查看进度

3. **如果某个版本崩溃**
   - 记录是哪个版本
   - 告诉我结果
   - 我会帮你解决问题

4. **如果所有版本都正常**
   - 说明核心模块都没问题
   - 问题在业务逻辑中
   - 需要进一步调试

## 🎯 预期结果

最可能的情况：
- 版本1-2正常 ✅
- 版本3崩溃 ❌ (Reanimated是最常见的问题)

如果是这样，我们需要：
1. 检查Reanimated配置
2. 降级或升级版本
3. 或者使用替代方案

准备好了吗？从版本1开始测试！

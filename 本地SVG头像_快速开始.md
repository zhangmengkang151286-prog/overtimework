# 本地 SVG 头像 - 快速开始

## 当前状态

✅ 已完成配置，现在可以使用本地 SVG 文件作为头像
✅ 临时使用数字占位符（1-20）显示头像

## 快速开始

### 步骤 1：安装依赖

```bash
cd OvertimeIndexApp
npm install --save-dev react-native-svg-transformer
```

### 步骤 2：准备 SVG 文件

1. 创建头像目录：
```bash
mkdir -p assets/avatars
```

2. 将你的 20 个 SVG 头像文件放到 `assets/avatars/` 目录，命名为：
   - `avatar_01.svg`
   - `avatar_02.svg`
   - `avatar_03.svg`
   - ...
   - `avatar_20.svg`

### 步骤 3：更新配置文件

打开 `src/data/builtInAvatars.tsx`，找到这部分代码：

```typescript
// TODO: 将你的 SVG 文件放到 assets/avatars/ 目录后，取消下面的注释
// import Avatar01 from '../../assets/avatars/avatar_01.svg';
// import Avatar02 from '../../assets/avatars/avatar_02.svg';
// ...
```

**取消注释**并导入你的 SVG 文件。

然后找到 `BUILT_IN_AVATARS` 数组，替换为：

```typescript
export const BUILT_IN_AVATARS: BuiltInAvatar[] = [
  {id: 'avatar_01', label: '阳光男孩', component: Avatar01},
  {id: 'avatar_02', label: '商务精英', component: Avatar02},
  {id: 'avatar_03', label: '运动达人', component: Avatar03},
  // ... 继续添加其他头像
  {id: 'avatar_20', label: '程序媛', component: Avatar20},
];
```

### 步骤 4：清除缓存并重启

```bash
npx expo start --clear
```

## SVG 文件要求

### 推荐规格
- **尺寸**：100x100 或 200x200 像素
- **格式**：SVG（矢量图）
- **文件大小**：每个文件 < 10KB
- **viewBox**：`viewBox="0 0 100 100"` 或类似正方形比例

### SVG 示例

`assets/avatars/avatar_01.svg`：
```xml
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <circle cx="50" cy="50" r="50" fill="#667eea"/>
  
  <!-- 脸 -->
  <circle cx="50" cy="45" r="20" fill="#FFDAB9"/>
  
  <!-- 头发 -->
  <path d="M30 45 Q30 20 50 18 Q70 20 70 45" fill="#2C3E50"/>
  
  <!-- 眼睛 -->
  <circle cx="42" cy="43" r="2" fill="#2C3E50"/>
  <circle cx="58" cy="43" r="2" fill="#2C3E50"/>
  
  <!-- 嘴巴 -->
  <path d="M43 52 Q50 56 57 52" fill="none" stroke="#2C3E50" stroke-width="1.5"/>
  
  <!-- 衣服 -->
  <path d="M30 70 Q30 65 50 65 Q70 65 70 70 L70 100 L30 100 Z" fill="#3498DB"/>
</svg>
```

## 优化 SVG 文件

使用 [SVGOMG](https://jakearchibald.github.io/svgomg/) 在线工具优化 SVG：
1. 上传你的 SVG 文件
2. 调整优化选项
3. 下载优化后的文件

或使用命令行工具：
```bash
npm install -g svgo
svgo assets/avatars/*.svg
```

## 当前占位符

在你添加真实 SVG 文件之前，系统使用数字占位符（1-20）：
- 紫色圆形背景
- 白色数字
- 可以正常选择和使用

## 测试

1. 启动应用
2. 进入注册流程或设置页面
3. 查看头像选择器
4. 选择不同的头像
5. 确认头像在各个页面正确显示

## 故障排除

### 问题：SVG 不显示
**解决方案**：
1. 确认已安装 `react-native-svg-transformer`
2. 确认 `metro.config.js` 已更新
3. 清除缓存：`npx expo start --clear`
4. 重启 Metro bundler

### 问题：TypeScript 报错
**解决方案**：
1. 确认 `src/types/svg.d.ts` 文件存在
2. 重启 VS Code 或 TypeScript 服务器
3. 运行 `npx tsc --noEmit` 检查类型错误

### 问题：SVG 显示异常
**解决方案**：
1. 检查 SVG 文件的 `viewBox` 属性
2. 使用 SVGO 优化 SVG
3. 确认 SVG 不包含不支持的特性（如滤镜、动画）

## 获取 SVG 头像资源

推荐网站：
- https://userpics.craftwork.design/ - 现代扁平化头像
- https://www.flaticon.com/ - 免费图标和头像
- https://www.iconfinder.com/ - 高质量图标
- https://undraw.co/ - 开源插画
- https://www.humaaans.com/ - 可定制的人物插画

## 下一步

1. 准备 20 个 SVG 头像文件
2. 放到 `assets/avatars/` 目录
3. 更新 `builtInAvatars.tsx` 导入语句
4. 清除缓存并测试

---
**更新时间**: 2026-02-22  
**状态**: ✅ 配置完成，等待添加 SVG 文件

# 使用本地 SVG 头像文件指南

## 步骤 1：准备 SVG 文件

将你的 SVG 头像文件放到项目中：

```
OvertimeIndexApp/
  assets/
    avatars/
      avatar_01.svg
      avatar_02.svg
      avatar_03.svg
      ...
      avatar_20.svg
```

## 步骤 2：安装依赖

React Native 需要使用 `react-native-svg-transformer` 来导入 SVG 文件：

```bash
cd OvertimeIndexApp
npm install --save-dev react-native-svg-transformer
```

## 步骤 3：配置 Metro

修改 `metro.config.js`：

```javascript
const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 添加 SVG 支持
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = config;
```

## 步骤 4：添加 TypeScript 类型声明

创建 `src/types/svg.d.ts`：

```typescript
declare module '*.svg' {
  import React from 'react';
  import {SvgProps} from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
```

## 步骤 5：更新头像配置文件

修改 `src/data/builtInAvatars.tsx`：

```typescript
/**
 * 系统内置头像数据 - 使用本地 SVG 文件
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';

// 导入所有 SVG 头像文件
import Avatar01 from '../../assets/avatars/avatar_01.svg';
import Avatar02 from '../../assets/avatars/avatar_02.svg';
import Avatar03 from '../../assets/avatars/avatar_03.svg';
import Avatar04 from '../../assets/avatars/avatar_04.svg';
import Avatar05 from '../../assets/avatars/avatar_05.svg';
import Avatar06 from '../../assets/avatars/avatar_06.svg';
import Avatar07 from '../../assets/avatars/avatar_07.svg';
import Avatar08 from '../../assets/avatars/avatar_08.svg';
import Avatar09 from '../../assets/avatars/avatar_09.svg';
import Avatar10 from '../../assets/avatars/avatar_10.svg';
import Avatar11 from '../../assets/avatars/avatar_11.svg';
import Avatar12 from '../../assets/avatars/avatar_12.svg';
import Avatar13 from '../../assets/avatars/avatar_13.svg';
import Avatar14 from '../../assets/avatars/avatar_14.svg';
import Avatar15 from '../../assets/avatars/avatar_15.svg';
import Avatar16 from '../../assets/avatars/avatar_16.svg';
import Avatar17 from '../../assets/avatars/avatar_17.svg';
import Avatar18 from '../../assets/avatars/avatar_18.svg';
import Avatar19 from '../../assets/avatars/avatar_19.svg';
import Avatar20 from '../../assets/avatars/avatar_20.svg';

export interface BuiltInAvatar {
  id: string;
  label: string;
  component: React.FC<any>; // SVG 组件
}

/** 20 个内置头像配置 */
export const BUILT_IN_AVATARS: BuiltInAvatar[] = [
  {id: 'avatar_01', label: '头像 1', component: Avatar01},
  {id: 'avatar_02', label: '头像 2', component: Avatar02},
  {id: 'avatar_03', label: '头像 3', component: Avatar03},
  {id: 'avatar_04', label: '头像 4', component: Avatar04},
  {id: 'avatar_05', label: '头像 5', component: Avatar05},
  {id: 'avatar_06', label: '头像 6', component: Avatar06},
  {id: 'avatar_07', label: '头像 7', component: Avatar07},
  {id: 'avatar_08', label: '头像 8', component: Avatar08},
  {id: 'avatar_09', label: '头像 9', component: Avatar09},
  {id: 'avatar_10', label: '头像 10', component: Avatar10},
  {id: 'avatar_11', label: '头像 11', component: Avatar11},
  {id: 'avatar_12', label: '头像 12', component: Avatar12},
  {id: 'avatar_13', label: '头像 13', component: Avatar13},
  {id: 'avatar_14', label: '头像 14', component: Avatar14},
  {id: 'avatar_15', label: '头像 15', component: Avatar15},
  {id: 'avatar_16', label: '头像 16', component: Avatar16},
  {id: 'avatar_17', label: '头像 17', component: Avatar17},
  {id: 'avatar_18', label: '头像 18', component: Avatar18},
  {id: 'avatar_19', label: '头像 19', component: Avatar19},
  {id: 'avatar_20', label: '头像 20', component: Avatar20},
];

/** 根据 avatarId 获取头像配置 */
export function getAvatarById(avatarId: string): BuiltInAvatar | undefined {
  return BUILT_IN_AVATARS.find(a => a.id === avatarId);
}

/**
 * Avatar 组件 - 根据 avatarId 渲染头像
 * 用法: <Avatar avatarId={user.avatar} size={44} />
 */
interface AvatarProps {
  avatarId?: string | null;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({avatarId, size = 44}) => {
  const config = avatarId ? getAvatarById(avatarId) : undefined;
  const avatar = config || BUILT_IN_AVATARS[0];
  const SvgComponent = avatar.component;

  return (
    <View
      style={[
        styles.container,
        {width: size, height: size, borderRadius: size / 2},
      ]}>
      <SvgComponent width={size} height={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
```

## 步骤 6：更新 AvatarPicker 组件

`src/components/AvatarPicker.tsx` 保持不变，它会自动使用新的 SVG 组件。

## 步骤 7：清除缓存并重启

```bash
cd OvertimeIndexApp
npx expo start --clear
```

## SVG 文件要求

### 1. 文件命名
- 使用 `avatar_01.svg` 到 `avatar_20.svg` 的命名格式
- 文件名必须与配置中的 `id` 对应

### 2. SVG 尺寸
- 建议使用 `viewBox="0 0 100 100"` 或类似的正方形比例
- 组件会自动缩放到指定的 `size`

### 3. SVG 优化
建议使用 [SVGO](https://github.com/svg/svgo) 优化 SVG 文件：
```bash
npm install -g svgo
svgo avatar_01.svg
```

### 4. 颜色
- 可以在 SVG 中使用固定颜色
- 也可以使用 `currentColor` 让颜色可控

## 示例 SVG 文件

`assets/avatars/avatar_01.svg`：
```xml
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景圆 -->
  <circle cx="50" cy="50" r="50" fill="#667eea"/>
  
  <!-- 脸部 -->
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

## 优势

1. **灵活性高** - 可以使用任何设计工具创建的 SVG
2. **易于更新** - 直接替换 SVG 文件即可
3. **矢量图形** - 任意缩放不失真
4. **性能好** - 本地文件，无需网络请求
5. **可定制** - 可以轻松修改颜色、样式等

## 注意事项

1. **文件大小** - 每个 SVG 文件建议小于 10KB
2. **复杂度** - 避免过于复杂的路径，影响渲染性能
3. **兼容性** - 某些 SVG 特性在 React Native 中不支持（如滤镜、动画）
4. **命名规范** - 文件名必须符合 JavaScript 变量命名规则

## 故障排除

### 问题 1：SVG 不显示
- 检查文件路径是否正确
- 确认 Metro 配置已更新
- 清除缓存：`npx expo start --clear`

### 问题 2：TypeScript 报错
- 确认 `src/types/svg.d.ts` 文件已创建
- 重启 TypeScript 服务器

### 问题 3：SVG 显示异常
- 检查 SVG 文件是否有效
- 使用 SVGO 优化 SVG
- 确认 `viewBox` 设置正确

---
**更新时间**: 2026-02-22  
**状态**: ✅ 配置指南完成

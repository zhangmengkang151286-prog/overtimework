/**
 * 默认头像组件 - Reddit Snoo 风格的打工人卡通头像
 * 平面化设计，纯 React Native 绘制，无需额外依赖
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {
  Circle,
  Rect,
  Ellipse,
  Path,
  G,
} from 'react-native-svg';

interface DefaultAvatarProps {
  size?: number;
}

export const DefaultAvatar: React.FC<DefaultAvatarProps> = ({size = 44}) => {
  // 按比例缩放（基准 100x100）
  const scale = size / 100;

  return (
    <View style={[styles.container, {width: size, height: size, borderRadius: size / 2}]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* 背景圆 */}
        <Circle cx="50" cy="50" r="50" fill="#1A1A2E" />

        {/* 身体（衬衫） */}
        <Path
          d="M25 85 Q25 68 50 65 Q75 68 75 85 L75 100 L25 100 Z"
          fill="#E7E9EA"
        />
        {/* 领带 */}
        <Path
          d="M47 65 L50 78 L53 65 Z"
          fill="#EF4444"
        />
        <Rect x="48" y="78" width="4" height="8" rx="1" fill="#EF4444" />

        {/* 头部 */}
        <Circle cx="50" cy="40" r="22" fill="#F5D0A9" />

        {/* 头发 */}
        <Path
          d="M28 38 Q28 18 50 18 Q72 18 72 38 Q70 28 50 26 Q30 28 28 38 Z"
          fill="#2D2D2D"
        />

        {/* 眼睛 - 左 */}
        <Circle cx="41" cy="40" r="3" fill="#2D2D2D" />
        {/* 眼睛高光 - 左 */}
        <Circle cx="42" cy="39" r="1" fill="#FFFFFF" />

        {/* 眼睛 - 右 */}
        <Circle cx="59" cy="40" r="3" fill="#2D2D2D" />
        {/* 眼睛高光 - 右 */}
        <Circle cx="60" cy="39" r="1" fill="#FFFFFF" />

        {/* 嘴巴 - 微笑 */}
        <Path
          d="M44 48 Q50 53 56 48"
          fill="none"
          stroke="#2D2D2D"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* 眼镜框 - 左 */}
        <Circle cx="41" cy="40" r="7" fill="none" stroke="#555" strokeWidth="1.5" />
        {/* 眼镜框 - 右 */}
        <Circle cx="59" cy="40" r="7" fill="none" stroke="#555" strokeWidth="1.5" />
        {/* 眼镜桥 */}
        <Path d="M48 40 L52 40" fill="none" stroke="#555" strokeWidth="1.5" />

        {/* 耳朵 - 左 */}
        <Ellipse cx="28" cy="40" rx="3" ry="5" fill="#F5D0A9" />
        {/* 耳朵 - 右 */}
        <Ellipse cx="72" cy="40" rx="3" ry="5" fill="#F5D0A9" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
  },
});

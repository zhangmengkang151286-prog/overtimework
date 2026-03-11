/**
 * 海报底部圆点指示器组件
 * 
 * 功能：
 * - 显示位置指示器（圆点）
 * - 支持点击圆点跳转到对应海报
 * 
 * 注意：保存/分享按钮已移至 SharePosterScreen 顶部导航栏
 */

import React from 'react';
import {View, StyleSheet, Pressable} from 'react-native';

// 导入主题
import {useThemeToggle} from '../../hooks/useThemeToggle';
import {posterSpacing} from '../../theme/posterTheme';
import {colors} from '../../theme/colors';

/**
 * PosterControls 组件属性
 */
export interface PosterControlsProps {
  /** 当前海报索引 */
  currentIndex: number;
  /** 海报总数 */
  totalCount: number;
  /** 保存按钮点击回调（保留接口兼容性） */
  onSave: () => void;
  /** 分享按钮点击回调（保留接口兼容性） */
  onShare: () => void;
  /** 索引变化回调 */
  onIndexChange: (index: number) => void;
  /** 加载状态 */
  loading: boolean;
}

/**
 * 海报底部圆点指示器组件
 */
export const PosterControls: React.FC<PosterControlsProps> = React.memo(
  ({currentIndex, totalCount, onIndexChange}) => {
    const {isDark} = useThemeToggle();
    const themeColors = isDark ? colors.dark : colors.light;

    return (
      <View style={styles.container}>
        <View style={styles.dotsContainer}>
          {Array.from({length: totalCount}).map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <Pressable
                key={index}
                onPress={() => onIndexChange(index)}
                style={({pressed}) => [
                  styles.dot,
                  {
                    backgroundColor: isActive
                      ? themeColors.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.3)'
                      : 'rgba(0, 0, 0, 0.2)',
                    opacity: pressed ? 0.6 : 1,
                    transform: [{scale: isActive ? 1.2 : 1}],
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.currentIndex === nextProps.currentIndex &&
      prevProps.totalCount === nextProps.totalCount
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: posterSpacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: posterSpacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

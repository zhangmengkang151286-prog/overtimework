/**
 * 回到顶部浮动按钮（ScrollToTopButton）
 * 当瀑布流列表滚动位置不在顶部时展示，点击后平滑滚动至顶部
 *
 * Requirements: 4.12, 4.13
 * - 4.12: 列表不在顶部时在流页面右下角展示"回到顶部"浮动按钮
 * - 4.13: 点击后将瀑布流列表平滑滚动至顶部
 */

import React, {useEffect, useRef} from 'react';
import {StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {useTheme} from '../../hooks/useTheme';

interface ScrollToTopButtonProps {
  /** 点击后触发：平滑滚动至列表顶部 */
  onPress: () => void;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = React.memo(({onPress}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // 入场动画：缩放弹入
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.wrapper, {transform: [{scale: scaleAnim}]}]}>
      <TouchableOpacity
        style={[styles.button, {backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border}]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel="回到顶部"
        accessibilityRole="button">
        <Text style={{fontSize: 16, color: theme.colors.text}}>↑</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

ScrollToTopButton.displayName = 'ScrollToTopButton';

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
    bottom: 70,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

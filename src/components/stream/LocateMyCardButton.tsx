/**
 * 定位到我按钮（LocateMyCardButton）
 * 浮动按钮，点击后滚动定位到当前用户的下班卡片并高亮 2 秒
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 * - 12.1: 当前用户当日已产生 ClockOutEvent 且应计下班时刻已到达时展示
 * - 12.2: 未产生事件或时刻未到达时隐藏
 * - 12.3: 点击后滚动定位到卡片并高亮 2 秒
 * - 12.4: 高亮结束后恢复普通样式
 * - 12.5: 隐身模式下仍展示按钮，定位到本人设备上的隐身卡片
 */

import React, {useEffect, useRef} from 'react';
import {StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {useTheme} from '../../hooks/useTheme';
import {typography} from '../../theme/typography';

interface LocateMyCardButtonProps {
  /** 点击后触发：滚动定位到当前用户的下班卡片 */
  onPress: () => void;
}

export const LocateMyCardButton: React.FC<LocateMyCardButtonProps> = React.memo(({onPress}) => {
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
        style={[styles.button, {backgroundColor: theme.colors.text}]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel="定位到我的卡片"
        accessibilityRole="button">
        <Text style={[styles.text, {color: theme.colors.background}]}>📍 定位到我</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

LocateMyCardButton.displayName = 'LocateMyCardButton';

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
    // 位于 ScrollToTopButton（bottom: 70）上方，避免重叠
    bottom: 120,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
});

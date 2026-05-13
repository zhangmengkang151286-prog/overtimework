/**
 * 新动态提示条（NewCardsBanner）
 * "有 N 条新动态"提示条，点击后将暂存的新卡片插入列表顶部并自动滚动至顶部
 *
 * Requirements: 4.3, 4.4, 4.5
 * - 4.4: 列表不在顶部时暂存新增卡片并展示"有 N 条新动态"提示条
 * - 4.5: 点击提示条后将暂存卡片插入列表顶部并自动滚动至顶部
 */

import React, {useEffect, useRef} from 'react';
import {StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {useTheme} from '../../hooks/useTheme';
import {typography} from '../../theme/typography';

interface NewCardsBannerProps {
  /** 暂存的新动态数量 */
  count: number;
  /** 点击后触发：插入暂存卡片并滚动到顶部 */
  onPress: () => void;
}

export const NewCardsBanner: React.FC<NewCardsBannerProps> = React.memo(({count, onPress}) => {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(-40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // 入场动画：从上方滑入
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{transform: [{translateY: slideAnim}], opacity: opacityAnim}}>
      <TouchableOpacity
        style={[styles.banner, {backgroundColor: theme.colors.text}]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel={`有${count}条新动态，点击查看`}
        accessibilityRole="button">
        <Text style={[styles.text, {color: theme.colors.background}]}>
          有 {count} 条新动态
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

NewCardsBanner.displayName = 'NewCardsBanner';

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  text: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
});

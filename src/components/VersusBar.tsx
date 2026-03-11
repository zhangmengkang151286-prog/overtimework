import React, {useEffect} from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {Box, HStack, Text, VStack} from '@gluestack-ui/themed';
import {AnimatedNumber} from './AnimatedNumber';

/**
 * VersusBar - 对抗条组件（gluestack-ui 迁移版本）
 * 显示加班与准时下班的实时比例对比
 *
 * 使用 gluestack-ui 组件：
 * - HStack: 水平布局容器
 * - Box: 进度条容器
 * - Text: 文本显示
 * - VStack: 垂直布局（包含进度条和标签）
 *
 * 使用 gluestack-ui tokens：
 * - 颜色: $error500 (加班红色), $success500 (准时绿色)
 * - 间距: $2, $3
 * - 圆角: $md
 *
 * 参照 gluestack-ui Progress 组件风格
 * 验证需求: 6.1, 6.5
 */

interface VersusBarProps {
  overtimeCount: number;
  onTimeCount: number;
  showLabels?: boolean;
  height?: number;
  animationDuration?: number;
  /** 是否遮挡具体数字 */
  blurNumbers?: boolean;
}

export const VersusBar: React.FC<VersusBarProps> = ({
  overtimeCount = 0,
  onTimeCount = 0,
  showLabels = true,
  height = 8,
  animationDuration = 300,
  blurNumbers = false,
}) => {
  const onTimeRatio = useSharedValue(0.5);

  // 计算准时下班的比例 (0-1)
  useEffect(() => {
    try {
      const total = overtimeCount + onTimeCount;
      const ratio = total > 0 ? onTimeCount / total : 0.5;

      onTimeRatio.value = withTiming(ratio, {
        duration: animationDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // 平滑动画
      });
    } catch (error) {
      console.error('VersusBar animation error:', error);
    }
  }, [overtimeCount, onTimeCount, animationDuration]);

  // 准时下班部分的动画样式
  const onTimeAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${onTimeRatio.value * 100}%`,
    };
  });

  return (
    <VStack space="xs" w="$full">
      {/* 数字标签 - 放到进度条上面 */}
      {showLabels && (
        <HStack justifyContent="space-between" w="$full">
          <HStack alignItems="center" space="xs">
            <Text
              size="sm"
              color="$white"
              sx={{_dark: {color: '$white'}}}>
              准时下班{' '}
            </Text>
            <AnimatedNumber
              value={onTimeCount}
              blur={blurNumbers}
              duration={600}
              style={{fontSize: 14, color: '#FFFFFF'}}
              useLocaleString={false}
            />
          </HStack>
          <HStack alignItems="center" space="xs">
            <Text
              size="sm"
              color="$white"
              sx={{_dark: {color: '$white'}}}>
              加班{' '}
            </Text>
            <AnimatedNumber
              value={overtimeCount}
              blur={blurNumbers}
              duration={600}
              style={{fontSize: 14, color: '#FFFFFF'}}
              useLocaleString={false}
            />
          </HStack>
        </HStack>
      )}

      {/* 进度条主体 - 使用 gluestack-ui 的 HStack 和 Box */}
      <HStack
        h={height}
        borderRadius="$md"
        overflow="hidden"
        w="$full"
        bg="$backgroundLight100"
        sx={{
          _dark: {
            bg: '$backgroundDark900',
          },
        }}>
        {/* 准时下班部分（左侧）- 使用 gluestack-ui 的 $success500 token */}
        <Animated.View style={[onTimeAnimatedStyle, {height: '100%'}]}>
          <Box
            h="$full"
            w="$full"
            bg="$success500"
            sx={{
              _dark: {
                bg: '$success400',
              },
            }}
          />
        </Animated.View>
        {/* 加班部分（右侧）- 使用 gluestack-ui 的 $error500 token */}
        <Box
          flex={1}
          h="$full"
          bg="$error500"
          sx={{
            _dark: {
              bg: '$error400',
            },
          }}
        />
      </HStack>
    </VStack>
  );
};

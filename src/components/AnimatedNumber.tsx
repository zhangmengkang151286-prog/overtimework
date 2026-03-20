/**
 * AnimatedNumber - 股票风格数字滚轮动画
 *
 * 每一位数字像老虎机一样垂直滚动到目标数字
 * 参考 nof1.ai 股票数字变化效果
 *
 * 使用 Reanimated withTiming 在 UI 线程驱动滚动，零延迟
 */

import React, {useEffect, useMemo, useRef} from 'react';
import {View, Text, TextStyle, StyleSheet} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {duration, easing} from '../theme/animations';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  useLocaleString?: boolean;
  blur?: boolean;
  blurText?: string;
}

/** 单个数字滚轮 — 0~9 垂直排列，通过 translateY 滚动 */
const DigitRoller: React.FC<{
  digit: number;
  digitHeight: number;
  animDuration: number;
  textStyle: TextStyle;
}> = ({digit, digitHeight, animDuration, textStyle}) => {
  const translateY = useSharedValue(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const targetY = -digit * digitHeight;

    if (isFirstRender.current) {
      // 首次挂载：从比目标位置高 3 个数字的地方开始滚（模拟股票滚轮启动效果）
      isFirstRender.current = false;
      translateY.value = targetY + 3 * digitHeight;
    }

    translateY.value = withTiming(targetY, {
      duration: animDuration,
      easing: easing.smooth,
    });
  }, [digit, digitHeight, animDuration, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  return (
    <View style={{height: digitHeight, overflow: 'hidden'}}>
      <ReAnimated.View style={animStyle}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <View key={n} style={{height: digitHeight, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={textStyle}>{n}</Text>
          </View>
        ))}
      </ReAnimated.View>
    </View>
  );
};

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration: animDuration = 600,
  style,
  useLocaleString = true,
  blur = false,
  blurText = '***',
}) => {
  const fontSize = style?.fontSize ?? 36;
  const digitHeight = Math.ceil(fontSize * 1.3);

  const textStyle: TextStyle = useMemo(() => ({
    ...style,
    textAlign: 'center' as const,
    lineHeight: digitHeight,
    height: digitHeight,
  }), [style, digitHeight]);

  // 把数字拆成字符数组
  const chars = useMemo(() => {
    const str = useLocaleString ? value.toLocaleString() : String(value);
    return str.split('');
  }, [value, useLocaleString]);

  if (blur) {
    return <Text style={style}>{blurText}</Text>;
  }

  return (
    <View style={styles.container}>
      {chars.map((char, index) => {
        const num = parseInt(char, 10);
        if (isNaN(num)) {
          // 逗号、小数点等非数字字符
          return (
            <Text key={`sep-${index}`} style={textStyle}>
              {char}
            </Text>
          );
        }
        return (
          <DigitRoller
            key={`d-${index}`}
            digit={num}
            digitHeight={digitHeight}
            animDuration={animDuration}
            textStyle={textStyle}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

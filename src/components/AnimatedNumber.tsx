import React, {useEffect, useRef, useMemo} from 'react';
import {View, Text, TextStyle, StyleSheet, Animated} from 'react-native';

/**
 * AnimatedNumber - 股票风格数字滚轮动画
 *
 * 每一位数字像老虎机一样垂直滚动到目标数字
 * 参考 nof1.ai 股票数字变化效果
 */

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
  duration: number;
  textStyle: TextStyle;
}> = ({digit, digitHeight, duration, textStyle}) => {
  // 关键：初始值设为 0（显示数字 0 的位置），这样首次渲染就会有滚动动画
  const animValue = useRef(new Animated.Value(0)).current;
  const prevDigitRef = useRef<number | null>(null);

  useEffect(() => {
    const targetY = -digit * digitHeight;

    if (prevDigitRef.current === null) {
      // 首次挂载：从随机偏上的位置滚入（模拟股票滚轮启动效果）
      // 从比目标位置高 3 个数字的地方开始滚
      const startY = targetY + 3 * digitHeight;
      animValue.setValue(startY);
    }

    prevDigitRef.current = digit;

    Animated.timing(animValue, {
      toValue: targetY,
      duration,
      useNativeDriver: true,
    }).start();
  }, [digit, digitHeight, duration, animValue]);

  return (
    <View style={{height: digitHeight, overflow: 'hidden'}}>
      <Animated.View style={{transform: [{translateY: animValue}]}}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <View key={n} style={{height: digitHeight, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={textStyle}>{n}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 600,
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

  // 记录上一次的字符数量，用于稳定 key
  const prevLengthRef = useRef(chars.length);
  useEffect(() => {
    prevLengthRef.current = chars.length;
  }, [chars.length]);

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
            duration={duration}
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

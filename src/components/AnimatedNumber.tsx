/**
 * AnimatedNumber - 数字滚轮动画（性能优化版）
 *
 * 优化点：
 * 1. 固定最大槽位数（右对齐），位数变化时不销毁/重建 DigitRoller
 * 2. 去掉首次挂载的"从高处滚下来"效果，首次直接到位
 * 3. DigitRoller 用 React.memo 包裹，digit 不变时不重渲染
 * 4. 逗号分隔符作为静态 Text，不参与动画
 */

import React, {useEffect, useMemo} from 'react';
import {View, Text, TextStyle, StyleSheet} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {easing} from '../theme/animations';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  useLocaleString?: boolean;
  blur?: boolean;
  blurText?: string;
  /** 最大位数（不含逗号），默认 6，决定固定槽位数 */
  maxDigits?: number;
}

/** 单个数字滚轮 — 0~9 垂直排列，通过 translateY 滚动到目标数字 */
const DigitRoller: React.FC<{
  digit: number;
  digitHeight: number;
  animDuration: number;
  textStyle: TextStyle;
  /** 首次是否跳过动画直接到位 */
  immediate: boolean;
}> = React.memo(({digit, digitHeight, animDuration, textStyle, immediate}) => {
  const translateY = useSharedValue(-digit * digitHeight);

  useEffect(() => {
    const targetY = -digit * digitHeight;
    if (immediate) {
      // 首次直接到位，不播放动画
      translateY.value = targetY;
    } else {
      translateY.value = withTiming(targetY, {
        duration: animDuration,
        easing: easing.smooth,
      });
    }
  }, [digit, digitHeight, animDuration, immediate, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  return (
    <View style={{height: digitHeight, overflow: 'hidden'}}>
      <ReAnimated.View style={animStyle}>
        {DIGITS.map(n => (
          <View key={n} style={{height: digitHeight, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={textStyle}>{n}</Text>
          </View>
        ))}
      </ReAnimated.View>
    </View>
  );
});
DigitRoller.displayName = 'DigitRoller';

// 静态数字数组，避免每次渲染创建
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * 将数字拆成固定长度的槽位数组（右对齐）
 * 例如 maxDigits=6, value=1234 → [null, null, ',', 1, 2, 3, 4]
 * null 表示该槽位隐藏（opacity=0 的 0）
 *
 * 使用 useLocaleString 时在适当位置插入逗号
 */
function buildSlots(
  value: number,
  maxDigits: number,
  useLocaleString: boolean,
): Array<{type: 'digit'; digit: number; visible: boolean} | {type: 'sep'; char: string}> {
  // 纯数字字符串（不含逗号）
  const rawStr = String(Math.abs(Math.floor(value)));
  const digits = rawStr.split('').map(Number);

  // 补齐到 maxDigits 位（左侧填充不可见的 0）
  const padded: Array<{digit: number; visible: boolean}> = [];
  for (let i = 0; i < maxDigits - digits.length; i++) {
    padded.push({digit: 0, visible: false});
  }
  for (const d of digits) {
    padded.push({digit: d, visible: true});
  }

  // 如果不需要逗号，直接返回
  if (!useLocaleString) {
    return padded.map(p => ({type: 'digit' as const, ...p}));
  }

  // 从右往左每 3 位插入逗号
  const result: Array<{type: 'digit'; digit: number; visible: boolean} | {type: 'sep'; char: string}> = [];
  // 先计算实际数字的起始位置（跳过前导不可见位）
  const actualStart = maxDigits - digits.length;

  for (let i = 0; i < padded.length; i++) {
    // 在实际数字部分，从右数每 3 位前插入逗号
    const posFromRight = padded.length - 1 - i;
    const actualDigitIndex = i - actualStart;
    if (
      actualDigitIndex > 0 &&
      posFromRight >= 0 &&
      posFromRight % 3 === 2 &&
      i > actualStart
    ) {
      // 只在可见数字之间插入逗号
      result.push({type: 'sep', char: ','});
    }
    result.push({type: 'digit', ...padded[i]});
  }

  return result;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = React.memo(({
  value,
  duration: animDuration = 600,
  style,
  useLocaleString = true,
  blur = false,
  blurText = '***',
  maxDigits = 6,
}) => {
  const fontSize = style?.fontSize ?? 36;
  const digitHeight = Math.ceil(fontSize * 1.3);
  // 首次渲染标记：用 ref 追踪是否是第一次有效值
  const isFirstRef = React.useRef(true);
  const prevValueRef = React.useRef(value);

  // 判断是否首次（从 0 变到实际值，或组件刚挂载）
  const isImmediate = isFirstRef.current;
  if (isFirstRef.current && value !== 0) {
    isFirstRef.current = false;
  }
  // 如果值没变，也不需要动画
  const skipAnim = prevValueRef.current === value;
  prevValueRef.current = value;

  const textStyle: TextStyle = useMemo(() => ({
    ...style,
    textAlign: 'center' as const,
    lineHeight: digitHeight,
    height: digitHeight,
  }), [style, digitHeight]);

  // 构建固定槽位
  const slots = useMemo(
    () => buildSlots(value, maxDigits, useLocaleString),
    [value, maxDigits, useLocaleString],
  );

  if (blur) {
    return <Text style={style}>{blurText}</Text>;
  }

  return (
    <View style={styles.container}>
      {slots.map((slot, index) => {
        if (slot.type === 'sep') {
          return (
            <Text key={`sep-${index}`} style={[textStyle, {opacity: 1}]}>
              {slot.char}
            </Text>
          );
        }
        return (
          <View
            key={`slot-${index}`}
            style={
              slot.visible
                ? undefined
                : {width: 0, overflow: 'hidden', opacity: 0}
            }>
            <DigitRoller
              digit={slot.digit}
              digitHeight={digitHeight}
              animDuration={animDuration}
              textStyle={textStyle}
              immediate={isImmediate || skipAnim}
            />
          </View>
        );
      })}
    </View>
  );
});
AnimatedNumber.displayName = 'AnimatedNumber';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

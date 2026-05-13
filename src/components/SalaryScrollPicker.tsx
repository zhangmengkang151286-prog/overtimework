/**
 * 月薪横向滚动选择器（刻度尺风格）
 * 范围 1K-500K，步进 1K
 * 选中项居中高亮，两侧渐隐效果
 * 使用 react-native-gesture-handler 的 ScrollView 避免与侧边栏手势冲突
 */

import React, {useRef, useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '../hooks/useTheme';
import {typography} from '../theme/typography';

interface SalaryScrollPickerProps {
  /** 当前值（单位：千元，1-500） */
  value: number;
  /** 值变化回调 */
  onChange: (valueInK: number) => void;
}

// 每个刻度项的宽度
const ITEM_WIDTH = 48;
const MIN_VALUE = 1;
const MAX_VALUE = 500;
const TOTAL_ITEMS = MAX_VALUE - MIN_VALUE + 1;

export const SalaryScrollPicker: React.FC<SalaryScrollPickerProps> = ({
  value,
  onChange,
}) => {
  const theme = useTheme();
  const tc = theme.colors;
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  // 滚动过程中实时显示的值
  const [displayValue, setDisplayValue] = useState(value);

  // 计算左右 padding 使第一个和最后一个元素能居中
  const sidePadding = containerWidth / 2 - ITEM_WIDTH / 2;

  // 初始化滚动到当前值
  useEffect(() => {
    if (containerWidth > 0 && value >= MIN_VALUE && value <= MAX_VALUE) {
      const offset = (value - MIN_VALUE) * ITEM_WIDTH;
      setTimeout(() => {
        scrollRef.current?.scrollTo({x: offset, animated: false});
      }, 50);
    }
  }, [containerWidth]);

  // 滚动过程中实时更新显示值
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / ITEM_WIDTH);
      const clampedIndex = Math.max(0, Math.min(index, TOTAL_ITEMS - 1));
      const currentValue = clampedIndex + MIN_VALUE;
      setDisplayValue(currentValue);
    },
    [],
  );

  // 滚动结束时计算选中值（不手动对齐，依赖 snapToInterval）
  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / ITEM_WIDTH);
      const clampedIndex = Math.max(0, Math.min(index, TOTAL_ITEMS - 1));
      const newValue = clampedIndex + MIN_VALUE;
      if (newValue !== value) {
        onChange(newValue);
      }
    },
    [value, onChange],
  );

  // 生成刻度项
  const renderTicks = () => {
    const ticks = [];
    for (let i = MIN_VALUE; i <= MAX_VALUE; i++) {
      const isSelected = i === value;
      const isMajorTick = i % 5 === 0;

      ticks.push(
        <View key={i} style={[styles.item, {width: ITEM_WIDTH}]}>
          <View
            style={[
              styles.tick,
              isMajorTick ? styles.majorTick : styles.minorTick,
              {
                backgroundColor: isSelected
                  ? tc.text
                  : isMajorTick
                    ? tc.textTertiary
                    : tc.border,
              },
            ]}
          />
          {isMajorTick && (
            <Text
              style={[
                styles.tickLabel,
                {color: isSelected ? tc.text : tc.textTertiary},
                isSelected && styles.tickLabelSelected,
              ]}
            >
              {i}K
            </Text>
          )}
        </View>,
      );
    }
    return ticks;
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* 当前选中值显示（滚动时实时更新） */}
      <Text style={[styles.valueText, {color: tc.text}]}>
        {(displayValue * 1000).toLocaleString()} 元/月
      </Text>

      {/* 滚动区域 */}
      <View style={styles.scrollContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{paddingHorizontal: sidePadding}}
          nestedScrollEnabled
        >
          {renderTicks()}
        </ScrollView>

        {/* 中心指示线 */}
        <View style={[styles.centerIndicator, {backgroundColor: tc.text}]} pointerEvents="none" />

        {/* 左侧渐隐 */}
        <LinearGradient
          colors={[tc.background || '#000', 'transparent']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.fadeLeft}
          pointerEvents="none"
        />

        {/* 右侧渐隐 */}
        <LinearGradient
          colors={['transparent', tc.background || '#000']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.fadeRight}
          pointerEvents="none"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  valueText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    fontFamily: typography.fontFamily.monospace,
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollContainer: {
    height: 60,
    position: 'relative',
  },
  item: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  tick: {
    width: 2,
    borderRadius: 1,
  },
  majorTick: {
    height: 20,
  },
  minorTick: {
    height: 10,
  },
  tickLabel: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: typography.fontFamily.monospace,
  },
  tickLabelSelected: {
    fontWeight: '700',
  },
  centerIndicator: {
    position: 'absolute',
    top: 4,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 28,
    borderRadius: 1,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
  },
});

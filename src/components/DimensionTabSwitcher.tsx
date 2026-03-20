import React, {useCallback, useRef, useState} from 'react';
import {StyleSheet, TouchableOpacity, View, LayoutChangeEvent} from 'react-native';
import ReAnimated, {
  useAnimatedStyle,
  SharedValue,
  useSharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import {DimensionTab} from '../types';
import {typography} from '../theme/typography';

/**
 * DimensionTabSwitcher - 胶囊样式维度 Tab 切换器
 *
 * 所有视觉动画（胶囊位置、文字颜色、文字字重）都由同一个
 * scrollProgress SharedValue 驱动，在 UI 线程计算，
 * 无论是手指滑动还是点击 Tab 都完美同步、零延迟。
 *
 * activeTab prop 仅用于 accessibility state，不参与视觉渲染。
 */

interface DimensionTabSwitcherProps {
  activeTab: DimensionTab;
  onTabChange: (tab: DimensionTab) => void;
  theme: 'light' | 'dark';
  /** 滑动进度 0~4（SharedValue），唯一的动画数据源 */
  scrollProgress: SharedValue<number>;
}

const TABS: {key: DimensionTab; label: string}[] = [
  {key: 'tag', label: '标签'},
  {key: 'industry', label: '行业'},
  {key: 'position', label: '职位'},
  {key: 'province', label: '省份'},
  {key: 'age', label: '年龄'},
];

/**
 * AnimatedTabLabel - 单个 Tab 文字
 * 颜色和字重完全由 scrollProgress 在 UI 线程驱动
 */
const AnimatedTabLabel: React.FC<{
  label: string;
  index: number;
  progress: SharedValue<number>;
  isDark: boolean;
}> = React.memo(({label, index, progress, isDark}) => {
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = isDark ? '#737373' : '#A3A3A3';

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const dist = Math.abs(progress.value - index);
    const t = Math.min(dist, 1);
    const color = interpolateColor(t, [0, 1], [activeColor, inactiveColor]);
    const fontWeight = t < 0.5 ? '600' : '400';
    return {
      color,
      fontWeight: fontWeight as '600' | '400',
    };
  });

  return (
    <ReAnimated.Text style={[styles.tabText, animatedStyle]}>
      {label}
    </ReAnimated.Text>
  );
});

AnimatedTabLabel.displayName = 'AnimatedTabLabel';

export const DimensionTabSwitcher: React.FC<DimensionTabSwitcherProps> = ({
  activeTab,
  onTabChange,
  theme,
  scrollProgress,
}) => {
  const isDark = theme === 'dark';

  // 每个 Tab 的布局信息，存入 SharedValue 供 UI 线程使用
  const tabXValues = useSharedValue<number[]>([0, 0, 0, 0, 0]);
  const tabWValues = useSharedValue<number[]>([56, 56, 56, 56, 56]);
  const [layoutReady, setLayoutReady] = useState(false);
  const layoutCount = useRef(0);
  const layoutCache = useRef<Record<string, {x: number; width: number}>>({});

  // Tab 布局回调
  const handleTabLayout = useCallback(
    (key: string, event: LayoutChangeEvent) => {
      const {x, width} = event.nativeEvent.layout;
      layoutCache.current[key] = {x, width};
      layoutCount.current++;
      if (layoutCount.current >= TABS.length) {
        const xs = TABS.map(t => layoutCache.current[t.key]?.x ?? 0);
        const ws = TABS.map(t => layoutCache.current[t.key]?.width ?? 56);
        tabXValues.value = xs;
        tabWValues.value = ws;
        setLayoutReady(true);
      }
    },
    [tabXValues, tabWValues],
  );

  // 胶囊动画样式 - 完全在 UI 线程计算
  const pillStyle = useAnimatedStyle(() => {
    'worklet';
    const p = scrollProgress.value;
    const xs = tabXValues.value;
    const ws = tabWValues.value;
    const lo = Math.max(0, Math.min(Math.floor(p), xs.length - 1));
    const hi = Math.min(lo + 1, xs.length - 1);
    const frac = p - lo;
    const x = xs[lo] + (xs[hi] - xs[lo]) * frac;
    const w = ws[lo] + (ws[hi] - ws[lo]) * frac;
    return {
      transform: [{translateX: x}],
      width: w,
    };
  });

  const handleTabPress = useCallback(
    (tab: DimensionTab) => {
      if (tab !== activeTab) {
        onTabChange(tab);
      }
    },
    [activeTab, onTabChange],
  );

  const pillBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {/* 滑动胶囊背景 */}
        {layoutReady && (
          <ReAnimated.View
            style={[styles.pill, {backgroundColor: pillBg}, pillStyle]}
          />
        )}

        {/* Tab 按钮 */}
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handleTabPress(tab.key)}
            onLayout={e => handleTabLayout(tab.key, e)}
            activeOpacity={0.7}
            accessibilityLabel={`切换到${tab.label}维度`}
            accessibilityState={{selected: tab.key === activeTab}}
            style={styles.tab}
          >
            <AnimatedTabLabel
              label={tab.label}
              index={index}
              progress={scrollProgress}
              isDark={isDark}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  track: {
    flexDirection: 'row',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 16,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  tabText: {
    fontSize: typography.fontSize.base,
  },
});

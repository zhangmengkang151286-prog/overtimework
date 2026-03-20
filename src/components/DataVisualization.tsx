import React, {forwardRef, useState, useCallback, useRef} from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView as RNScrollView,
} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolateColor,
} from 'react-native-reanimated';
import {VersusBar} from './VersusBar';
import {GridChart, GridChartRef} from './GridChart';
import {RadialJitterChart} from './RadialJitterChart';
import {PositionVersusBarList} from './PositionVersusBarList';
import {PopulationPyramid} from './PopulationPyramid';
import {ChinaMapChart, getHeatColor} from './ChinaMapChart';
import {DimensionLegend} from './DimensionLegend';
import {TagDistribution, DimensionTab, DimensionStatsMap} from '../types';
import {typography} from '../theme/typography';

/**
 * DataVisualization - 数据可视化主组件
 * 使用 Reanimated useAnimatedScrollHandler + useAnimatedStyle
 * Tab 文字颜色和下划线位置全部在 UI 线程计算，零延迟
 */

interface DataVisualizationProps {
  overtimeCount: number;
  onTimeCount: number;
  tagDistribution: TagDistribution[];
  theme?: 'light' | 'dark';
  animationDuration?: number;
  blurData?: boolean;
  dimensionStats?: DimensionStatsMap;
  onDimensionTabChange?: (tab: DimensionTab) => void;
  tagPageFooter?: React.ReactNode;
}

export interface DataVisualizationRef {
  clearGridSelection: () => void;
}

type TabItem = {key: DimensionTab; title: string};

const TABS: TabItem[] = [
  {key: 'tag', title: '标签'},
  {key: 'industry', title: '行业'},
  {key: 'position', title: '职位'},
  {key: 'province', title: '省份'},
  {key: 'age', title: '年龄'},
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_COUNT = TABS.length;
// 统一图表区域高度：正方形画布，所有维度图表在此区域内居中/对齐
const CHART_AREA_HEIGHT = SCREEN_WIDTH - 32;

/** 单个 Tab 文字，颜色由 scrollProgress 在 UI 线程驱动 */
const AnimatedTabLabel: React.FC<{
  label: string;
  index: number;
  progress: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}> = React.memo(({label, index, progress, activeColor, inactiveColor}) => {
  const animStyle = useAnimatedStyle(() => {
    'worklet';
    const dist = Math.abs(progress.value - index);
    const t = Math.min(dist, 1);
    const color = interpolateColor(t, [0, 1], [activeColor, inactiveColor]);
    const fontWeight = t < 0.5 ? '600' : '400';
    return {color, fontWeight: fontWeight as '600' | '400'};
  });
  return (
    <Animated.Text style={[styles.tabText, animStyle]}>
      {label}
    </Animated.Text>
  );
});
AnimatedTabLabel.displayName = 'AnimatedTabLabel';

export const DataVisualization = forwardRef<
  DataVisualizationRef,
  DataVisualizationProps
>(
  (
    {
      overtimeCount,
      onTimeCount,
      tagDistribution,
      theme = 'light',
      animationDuration = 1000,
      blurData = false,
      dimensionStats,
      onDimensionTabChange,
      tagPageFooter,
    },
    ref,
  ) => {
    const gridChartRef = useRef<GridChartRef>(null);
    const scrollRef = useRef<RNScrollView>(null);
    const secondaryTextColor = theme === 'dark' ? '#cccccc' : '#666666';
    const isDark = theme === 'dark';

    const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
    const tabWidth = containerWidth / TAB_COUNT;

    // Reanimated SharedValue: 滚动进度 0~4
    const scrollProgress = useSharedValue(0);

    // UI 线程滚动处理器
    const scrollHandler = useAnimatedScrollHandler({
      onScroll: (event) => {
        'worklet';
        if (containerWidth > 0) {
          scrollProgress.value = event.contentOffset.x / containerWidth;
        }
      },
    });

    // 下划线动画样式 - UI 线程驱动
    const underlineStyle = useAnimatedStyle(() => {
      'worklet';
      const tw = containerWidth / TAB_COUNT;
      return {
        transform: [{translateX: scrollProgress.value * tw}],
      };
    });

    const activeColor = isDark ? '#FFFFFF' : '#000000';
    const inactiveColor = isDark ? '#737373' : '#A3A3A3';

    // 省份 Tab index = 3，圆点和渐变图例的 opacity 跟手插值
    const PROVINCE_INDEX = 3;
    const dotLegendStyle = useAnimatedStyle(() => {
      'worklet';
      // 距离省份 Tab 越近，圆点越透明
      const dist = Math.abs(scrollProgress.value - PROVINCE_INDEX);
      const opacity = Math.min(dist, 1); // 0~1: 0=在省份页, 1=远离省份页
      return {opacity};
    });
    const gradientLegendStyle = useAnimatedStyle(() => {
      'worklet';
      // 距离省份 Tab 越近，渐变越显现
      const dist = Math.abs(scrollProgress.value - PROVINCE_INDEX);
      const opacity = 1 - Math.min(dist, 1); // 1=在省份页, 0=远离省份页
      return {opacity};
    });

    React.useImperativeHandle(ref, () => ({
      clearGridSelection: () => {
        gridChartRef.current?.clearSelection();
      },
    }));

    const handleTabPress = useCallback(
      (index: number) => {
        (scrollRef.current as any)?.scrollTo({
          x: index * containerWidth,
          animated: true,
        });
        onDimensionTabChange?.(TABS[index].key);
      },
      [containerWidth, onDimensionTabChange],
    );

    const handleScrollEnd = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / containerWidth);
        if (newIndex >= 0 && newIndex < TAB_COUNT) {
          onDimensionTabChange?.(TABS[newIndex].key);
        }
      },
      [containerWidth, onDimensionTabChange],
    );

    return (
      <View style={styles.container}>
        {/* 对抗条 */}
        <View style={styles.section}>
          <VersusBar
            overtimeCount={overtimeCount}
            onTimeCount={onTimeCount}
            animationDuration={animationDuration}
            blurNumbers={false}
          />
        </View>

        {/* Tab 栏 */}
        <View
          style={styles.tabBar}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          {TABS.map((tab, index) => (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(index)}
              style={({pressed}) => [
                styles.tab,
                {width: tabWidth, opacity: pressed ? 0.7 : 1},
              ]}
            >
              <AnimatedTabLabel
                label={tab.title}
                index={index}
                progress={scrollProgress}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
              />
            </Pressable>
          ))}
          {/* 下划线 - Reanimated 驱动，UI 线程实时跟手 */}
          <Animated.View
            style={[
              styles.underline,
              {
                width: tabWidth * 0.5,
                marginLeft: tabWidth * 0.25,
                backgroundColor: isDark ? '#FFFFFF' : '#000000',
              },
              underlineStyle,
            ]}
          />
        </View>

        {/* 横向滚动页面 */}
        <Animated.ScrollView
          ref={scrollRef as any}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={scrollHandler}
          scrollEventThrottle={1}
          onMomentumScrollEnd={handleScrollEnd}
          style={styles.pager}
          nestedScrollEnabled
        >
          {TABS.map((tab) => (
            <View key={tab.key} style={{width: containerWidth, flex: 1}}>
              {blurData && tab.key !== 'tag' ? (
                /* 未提交且非标签页：直接用 minHeight 居中显示 *** */
                <View style={styles.lockedContainer}>
                  <Text style={styles.lockedText}>***</Text>
                </View>
              ) : (
                <RNScrollView
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  contentContainerStyle={styles.pageContent}
                >
                  {renderTabContent(
                    tab, gridChartRef, tagDistribution,
                    overtimeCount, onTimeCount, theme,
                    animationDuration, blurData, dimensionStats,
                    secondaryTextColor, tagPageFooter,
                  )}
                </RNScrollView>
              )}
            </View>
          ))}
        </Animated.ScrollView>

        {/* 固定底部图例 - 圆点和渐变叠加，opacity 跟手插值过渡 */}
        {!blurData && (
          <View style={styles.legendWrapper}>
            {/* 圆点图例：非省份页显示 */}
            <Animated.View style={[styles.legendLayer, dotLegendStyle]}>
              <DimensionLegend theme={theme} />
            </Animated.View>
            {/* 渐变图例：省份页显示 */}
            <Animated.View style={[styles.legendLayer, gradientLegendStyle]}>
              <DimensionLegend
                theme={theme}
                variant="gradient"
                getGradientColor={getHeatColor}
              />
            </Animated.View>
          </View>
        )}
      </View>
    );
  },
);

DataVisualization.displayName = 'DataVisualization';

// 渲染每个 Tab 的内容
function renderTabContent(
  tab: TabItem,
  gridChartRef: React.RefObject<GridChartRef | null>,
  tagDistribution: TagDistribution[],
  overtimeCount: number,
  onTimeCount: number,
  theme: 'light' | 'dark',
  animationDuration: number,
  blurData: boolean,
  dimensionStats: DimensionStatsMap | undefined,
  secondaryTextColor: string,
  tagPageFooter?: React.ReactNode,
) {

  switch (tab.key) {
    case 'tag':
      // 未提交时：纯黑背景，只显示提交按钮和解锁提示
      if (blurData) {
        return (
          <View style={styles.lockedContainer}>
            {tagPageFooter}
          </View>
        );
      }
      return (
        <View style={{minHeight: CHART_AREA_HEIGHT}}>
          <GridChart
            ref={gridChartRef}
            tagDistribution={tagDistribution}
            overtimeCount={overtimeCount}
            onTimeCount={onTimeCount}
            theme={theme}
            animationDuration={animationDuration}
            blurLegend={false}
            showBlurOverlay={false}
          />
          {tagPageFooter}
        </View>
      );

    case 'industry':
      // 未提交时：纯黑背景，只显示 ***
      if (blurData) {
        return <View style={styles.lockedContainer}><Text style={styles.lockedText}>***</Text></View>;
      }
      return (dimensionStats?.industry?.length ?? 0) > 0 ? (
        <View style={{minHeight: CHART_AREA_HEIGHT}}>
          <RadialJitterChart data={dimensionStats!.industry} theme={theme} blurData={false} />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text size="sm" color={secondaryTextColor}>该时段暂无行业数据</Text>
        </View>
      );

    case 'position':
      // 未提交时：纯黑背景，只显示 ***
      if (blurData) {
        return <View style={styles.lockedContainer}><Text style={styles.lockedText}>***</Text></View>;
      }
      return (dimensionStats?.position?.length ?? 0) > 0 ? (
        <View style={{height: CHART_AREA_HEIGHT}}>
          <RNScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            style={{flex: 1}}
          >
            <PositionVersusBarList data={dimensionStats!.position} theme={theme} blurData={false} />
          </RNScrollView>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text size="sm" color={secondaryTextColor}>该时段暂无职位数据</Text>
        </View>
      );

    case 'province':
      // 未提交时：纯黑背景，只显示 ***
      if (blurData) {
        return <View style={styles.lockedContainer}><Text style={styles.lockedText}>***</Text></View>;
      }
      return (dimensionStats?.province?.length ?? 0) > 0 ? (
        <View style={{minHeight: CHART_AREA_HEIGHT, justifyContent: 'center'}}>
          <ChinaMapChart data={dimensionStats!.province} theme={theme} blurData={false} />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text size="sm" color={secondaryTextColor}>该时段暂无省份数据</Text>
        </View>
      );

    case 'age':
      // 未提交时：纯黑背景，只显示 ***
      if (blurData) {
        return <View style={styles.lockedContainer}><Text style={styles.lockedText}>***</Text></View>;
      }
      return (dimensionStats?.age?.length ?? 0) > 0 ? (
        <View style={{height: CHART_AREA_HEIGHT}}>
          <PopulationPyramid data={dimensionStats!.age} theme={theme} blurData={false} />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text size="sm" color={secondaryTextColor}>该时段暂无年龄数据</Text>
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {flex: 1},
  section: {marginBottom: 8},
  tabBar: {flexDirection: 'row', position: 'relative', marginBottom: 8},
  tab: {height: 36, justifyContent: 'center', alignItems: 'center'},
  tabText: {fontSize: typography.fontSize.base},
  underline: {position: 'absolute', bottom: 0, left: 0, height: 2, borderRadius: 1},
  pager: {flex: 1},
  pageContent: {paddingBottom: 16, flexGrow: 0},
  emptyContainer: {alignItems: 'center', paddingVertical: 32},
  // 未提交状态：纯黑背景容器，用固定 minHeight 保证垂直居中
  lockedContainer: {
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  lockedText: {
    color: '#555555',
    fontSize: typography.fontSize['5xl'],
    letterSpacing: 8,
    // 补偿 letterSpacing 在最后一个字符后的额外间距，使文字视觉居中
    paddingLeft: 8,
  },
  // 图例叠加容器
  legendWrapper: {
    position: 'relative',
    height: 32,
  },
  // 图例层：绝对定位叠加
  legendLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

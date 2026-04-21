import React, {forwardRef, useState, useCallback, useRef, useImperativeHandle} from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView as RNScrollView,
  TouchableOpacity,
  Modal,
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
import {TagDistribution, DimensionTab, DimensionStatsMap, DimensionItem} from '../types';
import {typography} from '../theme/typography';
import {getTheme} from '../theme';

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
  cityData?: Record<string, DimensionItem[]>; // 省份全称 → 地级市数据映射
  onDrilldown?: (provinceFullName: string) => void; // 下钻时按需加载城市数据
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

/** 各维度的说明文案 */
const dimensionDescriptions: Record<DimensionTab, {title: string; message: string}> = {
  tag: {title: '标签说明', message: '展示本轮所有用户提交的下班标签分布，显示前100占比标签，方块数量越多代表选择该标签的人越多'},
  industry: {title: '行业说明', message: '展示不同行业的加班与准时下班人数对比，显示前10占比行业，气泡数量代表该行业参与人数'},
  position: {title: '职位说明', message: '展示不同职位的加班与准时下班人数对比，横向条形图直观对比各职位情况'},
  province: {title: '省份说明', message: '展示各省份的加班指数热力图，颜色越偏红代表该省加班比例越高'},
  age: {title: '年龄说明', message: '展示不同年龄段的加班与准时下班人数分布，左侧为准时下班，右侧为加班'},
};

/**
 * 维度说明弹窗 — 独立组件，内部管理 visible state
 * 避免 setState 触发父组件（DataVisualization）重渲染导致延迟
 */
export interface DimensionInfoModalRef {
  show: (tabKey: DimensionTab) => void;
}

const DimensionInfoModal = React.memo(
  forwardRef<DimensionInfoModalRef, {theme: 'light' | 'dark'}>(({theme}, ref) => {
    const [visible, setVisible] = useState(false);
    const [tabKey, setTabKey] = useState<DimensionTab>('tag');
    const isDark = theme === 'dark';

    useImperativeHandle(ref, () => ({
      show: (key: DimensionTab) => {
        setTabKey(key);
        setVisible(true);
      },
    }), []);

    const handleClose = useCallback(() => setVisible(false), []);

    const modalBg = getTheme(theme).colors.background;
    const textColor = getTheme(theme).colors.text;
    const secondaryColor = getTheme(theme).colors.textSecondary;
    const closeBg = getTheme(theme).colors.backgroundTertiary;

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
          <View style={[styles.modalContent, {backgroundColor: modalBg}]}>
            <Text style={[styles.modalTitle, {color: textColor}]}>
              {dimensionDescriptions[tabKey].title}
            </Text>
            <Text style={[styles.modalMessage, {color: secondaryColor}]}>
              {dimensionDescriptions[tabKey].message}
            </Text>
            <TouchableOpacity style={[styles.modalCloseButton, {backgroundColor: closeBg}]} onPress={handleClose}>
              <Text style={[styles.modalCloseText, {color: textColor}]}>关闭</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }),
);
DimensionInfoModal.displayName = 'DimensionInfoModal';

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
      cityData,
      onDrilldown,
      onDimensionTabChange,
      tagPageFooter,
    },
    ref,
  ) => {
    const gridChartRef = useRef<GridChartRef>(null);
    const scrollRef = useRef<RNScrollView>(null);
    const secondaryTextColor = getTheme(theme).colors.textSecondary;
    const isDark = theme === 'dark';
    const tc = getTheme(theme).colors;

    const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
    const [tabBarWidth, setTabBarWidth] = useState(SCREEN_WIDTH);
    const tabWidth = tabBarWidth / TAB_COUNT;

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
      const tw = tabBarWidth / TAB_COUNT;
      return {
        transform: [{translateX: scrollProgress.value * tw}],
      };
    });

    const activeColor = tc.text;
    const inactiveColor = tc.textTertiary;

    // 当前选中的 Tab index（用于 ! 按钮说明）
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    // 维度说明弹窗 ref — 独立组件，避免 setState 触发父组件重渲染
    const infoModalRef = useRef<DimensionInfoModalRef>(null);
    const handleInfoPress = useCallback(() => {
      infoModalRef.current?.show(TABS[activeTabIndex].key);
    }, [activeTabIndex]);

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
        setActiveTabIndex(index);
        onDimensionTabChange?.(TABS[index].key);
      },
      [containerWidth, onDimensionTabChange],
    );

    const handleScrollEnd = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / containerWidth);
        if (newIndex >= 0 && newIndex < TAB_COUNT) {
          setActiveTabIndex(newIndex);
          onDimensionTabChange?.(TABS[newIndex].key);
        }
      },
      [containerWidth, onDimensionTabChange],
    );

    return (
      <View style={styles.container} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
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
          style={styles.tabBarWrapper}
        >
          <View
            style={styles.tabBar}
            onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
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
                  backgroundColor: tc.text,
                },
                underlineStyle,
              ]}
            />
          </View>
          {/* 维度说明 ! 按钮 */}
          <Pressable
            onPress={handleInfoPress}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            style={({pressed}) => [styles.infoButton, {opacity: pressed ? 0.4 : 1}]}
            accessibilityLabel="查看当前维度说明"
          >
            <View style={[styles.infoBadge, {borderColor: tc.textTertiary}]}>
              <Text style={[styles.infoText, {color: tc.textTertiary}]}>!</Text>
            </View>
          </Pressable>
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
                <View style={[styles.lockedContainer, {backgroundColor: tc.background}]}>
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
                    secondaryTextColor, tagPageFooter, cityData,
                    onDrilldown,
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

        {/* 维度说明弹窗 — 独立组件，零延迟 */}
        <DimensionInfoModal ref={infoModalRef} theme={theme} />
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
  cityData?: Record<string, DimensionItem[]>,
  onDrilldown?: (provinceFullName: string) => void,
) {
  const tc = getTheme(theme).colors;

  switch (tab.key) {
    case 'tag':
      // 未提交时：纯黑背景，只显示提交按钮和解锁提示
      if (blurData) {
        return (
          <View style={[styles.lockedContainer, {backgroundColor: tc.background}]}>
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
      // 未提交时显示 ***
      if (blurData) {
        return <View style={[styles.lockedContainer, {backgroundColor: tc.background}]}><Text style={styles.lockedText}>***</Text></View>;
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
      // 未提交时显示 ***
      if (blurData) {
        return <View style={[styles.lockedContainer, {backgroundColor: tc.background}]}><Text style={styles.lockedText}>***</Text></View>;
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
      // 未提交时显示 ***
      if (blurData) {
        return <View style={[styles.lockedContainer, {backgroundColor: tc.background}]}><Text style={styles.lockedText}>***</Text></View>;
      }
      return (dimensionStats?.province?.length ?? 0) > 0 ? (
        <View style={{minHeight: CHART_AREA_HEIGHT, justifyContent: 'center'}}>
          <ChinaMapChart data={dimensionStats!.province} cityData={cityData} theme={theme} blurData={false} onDrilldown={onDrilldown} />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text size="sm" color={secondaryTextColor}>该时段暂无省份数据</Text>
        </View>
      );

    case 'age':
      // 未提交时显示 ***
      if (blurData) {
        return <View style={[styles.lockedContainer, {backgroundColor: tc.background}]}><Text style={styles.lockedText}>***</Text></View>;
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
  tabBarWrapper: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  tabBar: {flexDirection: 'row', position: 'relative', flex: 1},
  tab: {height: 36, justifyContent: 'center', alignItems: 'center'},
  tabText: {fontSize: typography.fontSize.base},
  underline: {position: 'absolute', bottom: 0, left: 0, height: 2, borderRadius: 1},
  infoButton: {paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center'},
  infoBadge: {width: 14, height: 14, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  infoText: {fontSize: 9, fontWeight: '600', lineHeight: 12},
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
  // 说明弹窗样式 — 与 HistoricalStatusIndicator 弹窗一致
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: typography.fontSize.form,
    fontWeight: '600',
  },
});

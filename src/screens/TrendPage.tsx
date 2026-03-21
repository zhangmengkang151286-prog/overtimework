import React, {useEffect, useState, useRef, useMemo, useCallback} from 'react';
import {StatusBar, Pressable as RNPressable, View, Dimensions, StyleSheet, ScrollView as RNScrollView, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity} from 'react-native';
import {customAlert} from '../components/CustomAlert';
import {SafeAreaView} from 'react-native-safe-area-context';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import {duration, easing} from '../theme/animations';
import {typography} from '../theme/typography';
import {
  Box,
  Text,
  VStack,
  HStack,
  Progress,
  ProgressFilledTrack,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import {useAppSelector, useAppDispatch} from '../hooks/redux';
import {setTags} from '../store/slices/dataSlice';
import {useUserStatus} from '../hooks/useUserStatus';
import {useRealTimeData} from '../hooks/useRealTimeData';
import {useTheme} from '../hooks/useTheme';
import {useWorkdayCountdown} from '../hooks/useWorkdayCountdown';
import {
  HistoricalStatusIndicator,
  DataVisualization,
  AnimatedNumber,
} from '../components';
import {SearchableSelector} from '../components/SearchableSelector';
import {greenScale, redScale} from '../theme/colors';
import {Avatar} from '../data/builtInAvatars';
import {GestureDrawer} from '../components/GestureDrawer';
import {DataVisualizationRef} from '../components/DataVisualization';
import {supabaseService} from '../services/supabaseService';
import {UserStatusSubmission, Tag, DimensionStatsMap, DimensionTab} from '../types';
import {SettingsScreen} from './SettingsScreen';
import {MyPage} from './MyPage';

/**
 * 底部标签文字组件 - 颜色由 Reanimated SharedValue 在 UI 线程驱动，零延迟
 * index: 0=趋势, 1=我的
 */
const AnimatedTabText: React.FC<{
  label: string;
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  activeColor: string;
  inactiveColor: string;
}> = React.memo(({label, index, progress, activeColor, inactiveColor}) => {
  const animStyle = useAnimatedStyle(() => {
    'worklet';
    // progress 0=趋势页, 1=我的页
    const dist = Math.abs(progress.value - index);
    const t = Math.min(dist, 1);
    const color = interpolateColor(t, [0, 1], [activeColor, inactiveColor]);
    return {color};
  });
  return (
    <ReAnimated.Text style={[tabTextStyles.heading, animStyle]}>
      {label}
    </ReAnimated.Text>
  );
});
AnimatedTabText.displayName = 'AnimatedTabText';

const tabTextStyles = StyleSheet.create({
  heading: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
  },
});

/**
 * 实时时钟组件 - 独立组件避免每秒重渲染整个 TrendPage
 */
const RealtimeClock: React.FC<{color: string}> = React.memo(({color}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const y = currentTime.getFullYear();
    const m = currentTime.getMonth() + 1;
    const d = currentTime.getDate();
    const w = weekDays[currentTime.getDay()];
    const hh = currentTime.getHours().toString().padStart(2, '0');
    const mm = currentTime.getMinutes().toString().padStart(2, '0');
    const ss = currentTime.getSeconds().toString().padStart(2, '0');
    return `${y}/${m}/${d} ${w} ${hh}:${mm}:${ss}`;
  }, [currentTime]);

  return (
    <Text size="xs" color={color} style={{fontFamily: 'monospace', fontVariant: ['tabular-nums']}}>
      {formattedTime}
    </Text>
  );
});
RealtimeClock.displayName = 'RealtimeClock';

/**
 * 趋势页面 - 应用的默认首页
 * 展示实时加班统计数据和历史趋势
 * 支持"趋势"/"我的"标签切换
 * 需求: 1.1, 1.2, 1.3, 1.4, 2.1-2.3, 3.1-3.3, 4.1-4.4, 6.1-6.5, 7.1-7.5
 */
interface TrendPageProps {
  navigation?: any;
}

const TrendPage: React.FC<TrendPageProps> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  // 标签切换状态 - 需求: 1.1, 1.2, 1.3
  const [activeTab, setActiveTab] = useState<'trend' | 'my'>('trend');

  // 页面滑动切换动画
  const {width: SCREEN_WIDTH} = Dimensions.get('window');
  // 标签文字大小动画：趋势从1开始（选中），我的从0.85开始（未选中）
  // 使用 Reanimated SharedValue，在 UI 线程驱动缩放
  const trendScaleVal = useSharedValue(1);
  const myScaleVal = useSharedValue(0.85);
  const activeTabRef = useRef<'trend' | 'my'>('trend');
  // 水平分页 ScrollView 的 ref
  const horizontalScrollRef = useRef<RNScrollView>(null);

  // Reanimated SharedValue: 标签滚动进度 0=趋势, 1=我的
  // 用于在 UI 线程驱动文字颜色，零延迟
  const tabScrollProgress = useSharedValue(0);

  // 标签颜色（根据主题）
  const tabActiveColor = theme.colors.text;
  const tabInactiveColor = theme.colors.textTertiary;

  // 标签文字缩放动画
  const animateTabScale = useCallback((tab: 'trend' | 'my') => {
    const timingConfig = {duration: duration.normal, easing: easing.easeOut};
    trendScaleVal.value = withTiming(tab === 'trend' ? 1 : 0.85, timingConfig);
    myScaleVal.value = withTiming(tab === 'my' ? 1 : 0.85, timingConfig);
  }, [trendScaleVal, myScaleVal]);

  // Reanimated 动画样式
  const trendScaleStyle = useAnimatedStyle(() => ({
    transform: [{scale: trendScaleVal.value}],
  }));
  const myScaleStyle = useAnimatedStyle(() => ({
    transform: [{scale: myScaleVal.value}],
  }));

  // 切换标签（点击标签头时调用）
  const animateToTab = useCallback((tab: 'trend' | 'my') => {
    if (tab === activeTabRef.current) return;
    activeTabRef.current = tab;
    setActiveTab(tab);
    animateTabScale(tab);
    // 立即更新颜色进度（点击时零延迟变色）
    tabScrollProgress.value = tab === 'trend' ? 0 : 1;
    horizontalScrollRef.current?.scrollTo({
      x: tab === 'trend' ? 0 : SCREEN_WIDTH,
      animated: true,
    });
  }, [SCREEN_WIDTH, animateTabScale, tabScrollProgress]);

  // 水平 ScrollView 滚动时实时更新 tabScrollProgress（驱动文字颜色）
  const handleHorizontalScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    // 进度 0~1：0=趋势页, 1=我的页
    tabScrollProgress.value = Math.max(0, Math.min(1, offsetX / SCREEN_WIDTH));
  }, [SCREEN_WIDTH, tabScrollProgress]);

  // 水平 ScrollView 滚动结束时同步标签状态（用于非视觉逻辑）
  const handleHorizontalScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    const newTab = page === 0 ? 'trend' : 'my';
    if (newTab !== activeTabRef.current) {
      activeTabRef.current = newTab;
      setActiveTab(newTab);
      animateTabScale(newTab);
    }
  }, [SCREEN_WIDTH, animateTabScale]);

  const realTimeData = useAppSelector((state: any) => state.data.realTimeData);

  const isViewingHistory = useAppSelector(
    (state: any) => state.data.isViewingHistory,
  );
  const tags = useAppSelector((state: any) => state.data.tags);
  const currentUser = useAppSelector((state: any) => state.user.currentUser);

  // 直接在趋势页上选择状态，跳过弹框第一步
  // selectedOvertimeStatus: null=未选择, true=加班, false=准时
  const [selectedOvertimeStatus, setSelectedOvertimeStatus] = useState<boolean | null>(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  // 加班时长选择状态
  const [showHoursSelector, setShowHoursSelector] = useState(false);
  const [selectedHours, setSelectedHours] = useState<number>(1);
  const pendingTagsRef = useRef<Tag[]>([]);

  // 设置抽屉显示状态
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const handleDrawerClose = useCallback(() => setShowSettingsDrawer(false), []);
  const handleDrawerOpen = useCallback(() => setShowSettingsDrawer(true), []);

  // MyPage 刷新触发器，提交状态后递增以通知日历刷新
  const [myPageRefreshTrigger, setMyPageRefreshTrigger] = useState(0);

  // DataVisualization ref 用于清除网格选中
  const dataVisualizationRef = useRef<DataVisualizationRef>(null);

  // 使用用户状态Hook
  const {
    userStatus,
    isSubmitting,
    submitUserStatus,
    shouldShowSelector,
  } = useUserStatus();

  // 是否需要遮挡数据（未提交今日状态时遮挡）
  const shouldBlurData = !userStatus.hasSubmittedToday;

  // 使用实时数据Hook（启动数据刷新和每日重置服务）
  const {networkStatus, refresh} = useRealTimeData();

  // 使用工作日倒计时Hook
  const countdown = useWorkdayCountdown(theme.isDark);

  // 标签加载状态
  const [loadingTags, setLoadingTags] = useState(false);

  // 预加载标签缓存（避免选择状态后等待网络请求）
  const tagCacheRef = useRef<{ontime: Tag[]; overtime: Tag[]}>({ontime: [], overtime: []});

  // 分离的数据状态（用于不同刷新频率）
  const [statsData, setStatsData] = useState<{
    participantCount: number;
    overtimeCount: number;
    onTimeCount: number;
  } | null>(null);

  const [tagData, setTagData] = useState<{
    tagDistribution: any[];
    dailyStatus: any[];
  } | null>(null);

  // 多维度统计数据状态 (Requirements: 6.1)
  const [dimensionStats, setDimensionStats] = useState<DimensionStatsMap | undefined>(undefined);

  // DataVisualization 内部当前选中的维度 Tab（用 ref 避免触发重渲染）
  const activeDimensionTabRef = useRef<DimensionTab>('tag');
  const handleDimensionTabChange = useCallback((tab: DimensionTab) => {
    activeDimensionTabRef.current = tab;
  }, []);

  /**
   * 统一的颜色分配函数
   * 为标签数组分配红色系（加班）和绿色系（准时）颜色
   * 使用 Robinhood 风格 20 级渐变色阶
   */
  const assignColorsToTags = useCallback((tags: any[]) => {
    
    // 准时下班颜色（绿色系，Robinhood #00C805，色相122°，20个色阶从亮到暗）
    const onTimeColors = [...greenScale].reverse();

    // 加班颜色（红色系，Robinhood #FF5000，色相19°，20个色阶从亮到暗）
    const overtimeColors = [...redScale].reverse();

    // 分别为加班和准时标签计数，用于颜色索引
    let overtimeIndex = 0;
    let onTimeIndex = 0;

    // 先标记每个标签的类型
    const taggedTags = tags.map(tag => ({
      ...tag,
      isOvertime: !!(tag.isOvertime || (tag.overtimeCount && tag.onTimeCount && tag.overtimeCount > tag.onTimeCount)),
    }));

    // 排序：准时标签在前（绿色居上），加班标签在后（红色居下）
    const sortedTags = [
      ...taggedTags.filter(t => !t.isOvertime),
      ...taggedTags.filter(t => t.isOvertime),
    ];

    // 按顺序分配颜色
    const result = sortedTags.map(tag => {
      let color: string;
      if (tag.isOvertime) {
        color = overtimeColors[overtimeIndex % overtimeColors.length];
        overtimeIndex++;
      } else {
        color = onTimeColors[onTimeIndex % onTimeColors.length];
        onTimeIndex++;
      }
      return { ...tag, color };
    });

    return result;
  }, []);

  // 使用实时数据
  const displayData = useMemo(() => {
    const baseData = {
      participantCount:
        statsData?.participantCount ?? realTimeData?.participantCount ?? 0,
      overtimeCount:
        statsData?.overtimeCount ?? realTimeData?.overtimeCount ?? 0,
      onTimeCount: statsData?.onTimeCount ?? realTimeData?.onTimeCount ?? 0,
      tagDistribution:
        tagData?.tagDistribution || realTimeData?.tagDistribution || [],
      dailyStatus: tagData?.dailyStatus || realTimeData?.dailyStatus || [],
    };

    // 为所有标签分配颜色
    if (baseData.tagDistribution && baseData.tagDistribution.length > 0) {
      baseData.tagDistribution = assignColorsToTags(baseData.tagDistribution);
    }

    return baseData;
  }, [statsData, tagData, realTimeData, assignColorsToTags]);

  /**
   * 获取统计数据（参与人数、加班/准点对比）
   * 提取为独立函数，方便在提交后立即调用
   */
  const fetchStats = useCallback(async () => {
    try {
      const stats = await supabaseService.getRealTimeStats();
      setStatsData(prev => {
        if (
          prev &&
          prev.participantCount === stats.participantCount &&
          prev.overtimeCount === stats.overtimeCount &&
          prev.onTimeCount === stats.onTimeCount
        ) {
          return prev;
        }
        return {
          participantCount: stats.participantCount,
          overtimeCount: stats.overtimeCount,
          onTimeCount: stats.onTimeCount,
        };
      });
    } catch (error) {
      console.error('[TrendPage] fetchStats 失败:', error);
    }
  }, []);

  /**
   * 获取标签分布和每日状态数据
   * 提取为独立函数，方便在提交后立即调用
   */
  const fetchTagData = useCallback(async () => {
    try {
      const [topTags, dailyStatus] = await Promise.all([
        supabaseService.getTopTags(20),
        supabaseService.getDailyStatus(7),
      ]);

      const validTags = topTags.filter(tag => tag.totalCount > 0).slice(0, 20);
      const tagDistribution = validTags.map(tag => ({
        tagId: tag.tagId,
        tagName: tag.tagName,
        count: tag.totalCount,
        isOvertime: tag.overtimeCount > tag.onTimeCount,
        overtimeCount: tag.overtimeCount,
        onTimeCount: tag.onTimeCount,
        color: '', // 颜色在 displayData 中统一分配
      }));

      setTagData({tagDistribution, dailyStatus});
    } catch (error) {
      console.error('Failed to fetch tag data:', error);
    }
  }, []);

  /**
   * 获取多维度统计数据（行业、职位、省份、年龄）
   * 与 fetchTagData 使用相同的轮询频率
   * Requirements: 6.1
   */
  const fetchDimensionStats = useCallback(async () => {
    try {
      const stats = await supabaseService.getDimensionStats();
      setDimensionStats(stats);
    } catch (error) {
      console.error('[TrendPage] fetchDimensionStats 失败:', error);
    }
  }, []);

  // 解构出布尔值，避免 networkStatus 对象引用变化导致定时器反复重置
  const isConnected = networkStatus.isConnected;

  /**
   * 初始加载数据 - 无条件执行一次，不依赖 isConnected
   */
  useEffect(() => {
    fetchStats();
    fetchTagData();
    fetchDimensionStats();
  }, [fetchStats, fetchTagData, fetchDimensionStats]);

  /**
   * 轮询实时数据（替代 Supabase Realtime）
   * 每 30 秒轮询一次，保持数据更新
   * realTimeDataService 已有自己的 3 秒轮询，这里只做低频补充刷新
   * 包含多维度统计数据，与标签分布使用相同频率 (Requirements: 6.1)
   */
  useEffect(() => {
    if (isViewingHistory) return;

    // 定时轮询：每 30 秒刷新一次（realTimeDataService 已有 3 秒高频轮询）
    const pollInterval = setInterval(() => {
      fetchStats();
      fetchTagData();
      fetchDimensionStats();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isViewingHistory, fetchStats, fetchTagData, fetchDimensionStats]);

  /**
   * 导航到设置页面
   */
  const handleNavigateToSettings = () => {
    setShowSettingsDrawer(true);
  };

  /**
   * 加载标签数据（按分类过滤：ontime 或 overtime）
   * 优先使用预加载缓存，搜索时才发网络请求
   * 验证需求: 7.2, 9.1-9.3
   */
  const loadTags = useCallback(async (search?: string, category?: string) => {
    // 无搜索关键词时，优先用缓存（同步返回，零延迟）
    if (!search && category && tagCacheRef.current[category as 'ontime' | 'overtime']?.length > 0) {
      dispatch(setTags(tagCacheRef.current[category as 'ontime' | 'overtime']));
      return;
    }

    setLoadingTags(true);
    try {
      const fetchedTags = await supabaseService.getTags('custom', search, undefined, category);
      dispatch(setTags(fetchedTags));
      // 无搜索时更新缓存
      if (!search && category) {
        tagCacheRef.current[category as 'ontime' | 'overtime'] = fetchedTags;
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoadingTags(false);
    }
  }, [dispatch]);

  /**
   * 预加载两类标签（组件挂载时执行，后台静默加载）
   */
  useEffect(() => {
    const preloadTags = async () => {
      try {
        const [ontimeTags, overtimeTags] = await Promise.all([
          supabaseService.getTags('custom', undefined, undefined, 'ontime'),
          supabaseService.getTags('custom', undefined, undefined, 'overtime'),
        ]);
        tagCacheRef.current = {ontime: ontimeTags, overtime: overtimeTags};
      } catch (error) {
        // 标签预加载失败不影响主流程
      }
    };
    preloadTags();
  }, []);

  /**
   * 点击"准时下班"或"加班"按钮，打开对应标签选择器
   */
  const handleStatusButtonPress = useCallback((isOvertime: boolean) => {
    setSelectedOvertimeStatus(isOvertime);
    // 加载对应分类的标签
    loadTags(undefined, isOvertime ? 'overtime' : 'ontime');
    setShowTagSelector(true);
  }, [loadTags]);

  /**
   * 标签选择完成后的处理
   */
  const handleTagSubmit = useCallback((selectedTags: Tag[]) => {
    if (selectedTags.length === 0) return;
    
    pendingTagsRef.current = selectedTags;
    setShowTagSelector(false);
    
    if (selectedOvertimeStatus) {
      // 加班：需要选择时长
      setSelectedHours(1);
      setShowHoursSelector(true);
    } else {
      // 准时下班：直接提交
      const submission: UserStatusSubmission = {
        isOvertime: false,
        tagId: selectedTags[0].id,
        extraTagIds: selectedTags.slice(1).map(t => t.id),
        timestamp: new Date(),
      };
      submitStatusAndRefresh(submission);
    }
  }, [selectedOvertimeStatus]);

  /**
   * 确认加班时长并提交
   */
  const handleHoursConfirm = useCallback(() => {
    const tags = pendingTagsRef.current;
    
    setShowHoursSelector(false);
    
    const submission: UserStatusSubmission = {
      isOvertime: true,
      tagId: tags.length > 0 ? tags[0].id : undefined,
      extraTagIds: tags.length > 1 ? tags.slice(1).map(t => t.id) : undefined,
      overtimeHours: selectedHours,
      timestamp: new Date(),
    };
    submitStatusAndRefresh(submission);
  }, [selectedHours]);

  /**
   * 提交状态并刷新数据
   */
  const submitStatusAndRefresh = useCallback((submission: UserStatusSubmission) => {
    // 重置状态
    setSelectedOvertimeStatus(null);
    pendingTagsRef.current = [];

    // 立即显示成功提示
    customAlert('提交成功', '您的工作状态已记录');

    // 异步提交，数据写入成功后再触发 MyPage 刷新
    submitUserStatus(submission).then(success => {
      if (!success) {
        customAlert('提交失败', '请检查网络连接后重试');
      } else {
        // 数据已写入数据库，此时触发 MyPage 日历/趋势/标签占比刷新
        setMyPageRefreshTrigger(prev => prev + 1);
        Promise.all([fetchStats(), fetchTagData(), fetchDimensionStats(), refresh()]).catch(
          err => console.warn('[TrendPage] 后台刷新数据失败:', err),
        );
      }
    });
  }, [submitUserStatus, fetchStats, fetchTagData, fetchDimensionStats, refresh]);

  /**
   * 取消标签选择
   */
  const handleTagSelectorClose = useCallback(() => {
    setShowTagSelector(false);
    setSelectedOvertimeStatus(null);
  }, []);

  /**
   * 跳过标签选择
   * 准时下班：直接提交（无标签）
   * 加班：跳到时长选择步骤
   */
  const handleSkipTag = useCallback(() => {
    pendingTagsRef.current = [];
    setShowTagSelector(false);

    if (selectedOvertimeStatus === true) {
      // 加班：仍需选择时长
      setSelectedHours(1);
      setShowHoursSelector(true);
    } else {
      // 准时下班：直接提交无标签记录
      const submission: UserStatusSubmission = {
        isOvertime: false,
        tagId: undefined,
        timestamp: new Date(),
      };
      submitStatusAndRefresh(submission);
    }
  }, [selectedOvertimeStatus, submitStatusAndRefresh]);

  /**
   * 取消时长选择
   */
  const handleHoursSelectorClose = useCallback(() => {
    setShowHoursSelector(false);
    setSelectedOvertimeStatus(null);
    pendingTagsRef.current = [];
  }, []);

  /**
   * 初始加载标签（不再提前加载，改为选择状态后按分类加载）
   */

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background}}>
    <SafeAreaView
      style={{flex: 1, backgroundColor: theme.colors.background}}
      edges={['top']}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <VStack flex={1} bg={theme.colors.background}>
        {/* 固定头部：标签切换区域 */}
        <Box px="$4" pt="$4" pb="$2">
            {/* 第一行: 用户头像 + 标签切换（居中）*/}
            {/* 需求: 1.1, 1.2, 1.3, 1.4 */}
            <HStack justifyContent="space-between" alignItems="center">
              {/* 左侧：用户头像 */}
              <RNPressable
                onPress={handleNavigateToSettings}
                accessibilityLabel="进入设置">
                <Avatar avatarId={currentUser?.avatar} size={36} />
              </RNPressable>

              {/* 中间：标签切换（绝对居中）*/}
              <Box position="absolute" left={0} right={0} alignItems="center">
                <HStack space="md" alignItems="center">
                  <RNPressable
                    onPress={() => animateToTab('trend')}
                    accessibilityLabel="切换到趋势页面"
                    accessibilityState={{selected: activeTab === 'trend'}}
                  >
                    <ReAnimated.View style={trendScaleStyle}>
                      <AnimatedTabText
                        label="趋势"
                        index={0}
                        progress={tabScrollProgress}
                        activeColor={tabActiveColor}
                        inactiveColor={tabInactiveColor}
                      />
                    </ReAnimated.View>
                  </RNPressable>
                  <RNPressable
                    onPress={() => animateToTab('my')}
                    accessibilityLabel="切换到我的页面"
                    accessibilityState={{selected: activeTab === 'my'}}
                  >
                    <ReAnimated.View style={myScaleStyle}>
                      <AnimatedTabText
                        label="我的"
                        index={1}
                        progress={tabScrollProgress}
                        activeColor={tabActiveColor}
                        inactiveColor={tabInactiveColor}
                      />
                    </ReAnimated.View>
                  </RNPressable>
                </HStack>
              </Box>

              {/* 右侧：占位（保持布局平衡）*/}
              <Box w="$10" />
            </HStack>
        </Box>

        {/* 标签下方分隔线 */}
        <View style={{height: StyleSheet.hairlineWidth, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', marginHorizontal: 16}} />

        {/* 内容区域 - 水平分页 ScrollView 切换 */}
        <RNScrollView
          ref={horizontalScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={handleHorizontalScroll}
          onMomentumScrollEnd={handleHorizontalScrollEnd}
          scrollEventThrottle={16}
          style={{flex: 1}}
        >
            {/* 趋势页内容 */}
            <View style={{width: SCREEN_WIDTH, flex: 1}}>
          <Box flex={1} p="$4">
            {/* 第二行: 参与人数 */}
            <VStack style={{marginBottom: 4.1}}>
              {/* 倒计时 + 问号说明 + 日期时间 */}
              <HStack justifyContent="space-between" alignItems="center" mb="$2">
                <HStack alignItems="center" space="xs">
                  <Text
                    size="xs"
                    fontWeight="$medium"
                    color={countdown.textColor}>
                    距离本轮结束剩余{countdown.remainingHours}小时
                  </Text>
                  <TouchableOpacity
                    onPress={() => customAlert('统计周期说明', '统计周期：今日06:00 - 次日05:59')}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                    activeOpacity={0.6}>
                    <View style={{width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: theme.colors.textSecondary, alignItems: 'center', justifyContent: 'center'}}>
                      <Text style={{fontSize: typography.fontSize.micro, color: theme.colors.textSecondary, fontWeight: '600', lineHeight: 12}}>!</Text>
                    </View>
                  </TouchableOpacity>
                </HStack>
                <RealtimeClock color={theme.colors.textSecondary} />
              </HStack>

              {/* 进度条 */}
              <HStack alignItems="center" mb="$2" space="sm">
                <Progress
                  value={countdown.remainingPercent}
                  size="xs"
                  flex={1}
                  h={4}
                  bg={theme.isDark ? '$gray700' : '$gray300'}>
                  <ProgressFilledTrack
                    bg={theme.isDark ? '$white' : '$black'}
                  />
                </Progress>
                <Text
                  size="xs"
                  fontWeight="$semibold"
                  color={theme.colors.textSecondary}
                  minWidth={40}
                  textAlign="right">
                  {countdown.remainingPercent}%
                </Text>
              </HStack>

              {/* 参与人数 - 居中显示，未提交时显示*** */}
              <VStack alignItems="center" style={{marginTop: 3.2}}>
                <Text size="xs" color={theme.colors.textSecondary} mb="$1">
                  本轮累计参与人数
                </Text>
                <AnimatedNumber
                  value={displayData?.participantCount || 0}
                  blur={false}
                  duration={800}
                  style={{
                    fontSize: typography.fontSize['6xl'],
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    fontFamily: 'monospace',
                  }}
                />
              </VStack>
            </VStack>

            {/* 第三行: 历史状态指示器 */}
            <Box style={{marginBottom: 5.0}}>
              <HistoricalStatusIndicator
                dailyStatus={displayData?.dailyStatus || []}
                theme={theme.isDark ? 'dark' : 'light'}
              />
            </Box>

            {/* 数据可视化组件 - flex:1 占据剩余空间，内部各标签页独立滚动 */}
            <Box flex={1}>

              <DataVisualization
                  ref={dataVisualizationRef}
                  overtimeCount={displayData?.overtimeCount || 0}
                  onTimeCount={displayData?.onTimeCount || 0}
                  tagDistribution={displayData?.tagDistribution || []}
                  theme={theme.isDark ? 'dark' : 'light'}
                  animationDuration={1000}
                  blurData={shouldBlurData}
                  dimensionStats={dimensionStats}
                  onDimensionTabChange={handleDimensionTabChange}
                  tagPageFooter={
                    <>
                      {shouldShowSelector && (
                        <VStack mt="$6" alignItems="center" space="md">
                          <Text
                            style={{
                              fontSize: typography.fontSize.xl,
                              fontWeight: typography.fontWeight.semibold,
                              color: theme.colors.textSecondary,
                            }}>
                            今天你是？
                          </Text>
                          <HStack w="80%" space="md" mt="$2">
                            <Button
                              variant="solid"
                              bg="$white"
                              size="lg"
                              flex={1}
                              onPress={() => handleStatusButtonPress(false)}
                              accessibilityLabel="准时下班">
                              <ButtonText color="$black" textAlign="center" w="100%">准时下班</ButtonText>
                            </Button>
                            <Button
                              variant="solid"
                              bg="$white"
                              size="lg"
                              flex={1}
                              onPress={() => handleStatusButtonPress(true)}
                              accessibilityLabel="加班">
                              <ButtonText color="$black" textAlign="center" w="100%">加班</ButtonText>
                            </Button>
                          </HStack>
                          <Text
                            size="sm"
                            color="#888888"
                            mt="$3"
                            textAlign="center">
                            提交今日下班状态，解锁更多趋势数据
                          </Text>
                        </VStack>
                      )}

                    </>
                  }
                />
            </Box>

            {/* 网络状态指示器 */}
            {!networkStatus.isConnected && (
              <Box
                mt="$3"
                p="$3"
                borderRadius="$sm"
                bg={theme.colors.error + '20'}
                alignItems="center">
                <Text size="sm" fontWeight="$medium" color={theme.colors.error}>
                  ⚠️ 网络连接已断开，显示缓存数据
                </Text>
              </Box>
            )}
          </Box>
            </View>

            {/* 我的页面内容 */}
            <View style={{width: SCREEN_WIDTH, flex: 1}}>
          {currentUser?.id ? (
            <MyPage theme={theme} userId={currentUser.id} refreshTrigger={myPageRefreshTrigger} />
          ) : (
            <Box flex={1} alignItems="center" justifyContent="center">
              <Text size="sm" color={theme.colors.textSecondary}>
                请先登录以查看个人数据
              </Text>
            </Box>
          )}
            </View>
        </RNScrollView>

        {/* 标签选择器 — 直接从趋势页打开，无需中间弹框 */}
        <SearchableSelector
          visible={showTagSelector}
          title={selectedOvertimeStatus ? '选择加班原因' : '选择下班标签'}
          type="position"
          items={tags}
          multiSelect={true}
          maxSelect={3}
          onSubmit={handleTagSubmit}
          onSkip={handleSkipTag}
          onClose={handleTagSelectorClose}
          loading={loadingTags || isSubmitting}
          onSearch={
            selectedOvertimeStatus !== null
              ? (query?: string) => loadTags(query, selectedOvertimeStatus ? 'overtime' : 'ontime')
              : undefined
          }
          placeholder={selectedOvertimeStatus === false ? '下班后要去？' : '今晚加班是因为？'}
        />

        {/* 加班时长选择器 — 简单的底部弹出面板 */}
        {showHoursSelector && (
          <View style={trendStyles.hoursOverlay}>
            <RNPressable
              style={StyleSheet.absoluteFill}
              onPress={handleHoursSelectorClose}
            />
            <View style={trendStyles.hoursPanel}>
              <Text style={trendStyles.hoursTitle}>预计加班时长</Text>
              <View style={trendStyles.hoursRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                  <RNPressable
                    key={h}
                    onPress={() => setSelectedHours(h)}
                    style={[
                      trendStyles.hourChip,
                      selectedHours === h && trendStyles.hourChipSelected,
                    ]}>
                    <Text style={[
                      trendStyles.hourChipText,
                      selectedHours === h && trendStyles.hourChipTextSelected,
                    ]}>
                      {h}h
                    </Text>
                  </RNPressable>
                ))}
              </View>
              <RNPressable
                style={trendStyles.hoursConfirmButton}
                onPress={handleHoursConfirm}>
                <Text style={trendStyles.hoursConfirmText}>确认提交</Text>
              </RNPressable>
            </View>
          </View>
        )}

      </VStack>
    </SafeAreaView>

    {/* 设置抽屉 - 放在 SafeAreaView 外面，确保全屏覆盖 */}
    <GestureDrawer
      isOpen={showSettingsDrawer}
      onClose={handleDrawerClose}
      onOpen={handleDrawerOpen}
    >
      <SettingsScreen onClose={handleDrawerClose} />
    </GestureDrawer>
    </View>
  );
};

/**
 * 加班时长选择器样式
 */
const trendStyles = StyleSheet.create({
  hoursOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  hoursPanel: {
    width: 280,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
  },
  hoursTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: '#E8EAED',
    textAlign: 'center',
    marginBottom: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  hourChip: {
    width: 52,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#18181B',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourChipSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#27272A',
  },
  hourChipText: {
    fontSize: typography.fontSize.base,
    color: '#888',
    fontFamily: 'monospace',
  },
  hourChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hoursConfirmButton: {
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  hoursConfirmText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: '#000000',
  },
});

export default TrendPage;

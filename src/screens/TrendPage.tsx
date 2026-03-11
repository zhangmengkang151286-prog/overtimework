import React, {useEffect, useState, useRef, useMemo, useCallback, Suspense} from 'react';
import {Alert, Animated, StatusBar, Pressable as RNPressable, View, Dimensions, StyleSheet, ScrollView as RNScrollView, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Box,
  Text,
  ScrollView,
  VStack,
  HStack,
  Heading,
  Pressable,
  Progress,
  ProgressFilledTrack,
} from '@gluestack-ui/themed';
import {useAppSelector, useAppDispatch} from '../hooks/redux';
import {setTags} from '../store/slices/dataSlice';
import {useUserStatus} from '../hooks/useUserStatus';
import {useRealTimeData} from '../hooks/useRealTimeData';
import {useTheme} from '../hooks/useTheme';
import {useWorkdayCountdown} from '../hooks/useWorkdayCountdown';
import {hourlySnapshotService} from '../services/hourlySnapshotService';
import {
  HistoricalStatusIndicator,
  DataVisualization,
  UserStatusSelector,
  AnimatedNumber,
} from '../components';
import {Avatar} from '../data/builtInAvatars';
import {GestureDrawer} from '../components/GestureDrawer';
import {DataVisualizationRef} from '../components/DataVisualization';
import {supabaseService} from '../services/supabaseService';
import {UserStatusSubmission, Tag} from '../types';
import {SettingsScreen} from './SettingsScreen';
import {MyPage} from './MyPage';

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
  const trendScale = useRef(new Animated.Value(1)).current;
  const myScale = useRef(new Animated.Value(0.85)).current;
  const activeTabRef = useRef<'trend' | 'my'>('trend');
  // 水平分页 ScrollView 的 ref
  const horizontalScrollRef = useRef<RNScrollView>(null);

  // 标签文字缩放动画
  const animateTabScale = useCallback((tab: 'trend' | 'my') => {
    Animated.parallel([
      Animated.timing(trendScale, {
        toValue: tab === 'trend' ? 1 : 0.85,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(myScale, {
        toValue: tab === 'my' ? 1 : 0.85,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [trendScale, myScale]);

  // 切换标签（点击标签头时调用）
  const animateToTab = useCallback((tab: 'trend' | 'my') => {
    if (tab === activeTabRef.current) return;
    activeTabRef.current = tab;
    setActiveTab(tab);
    animateTabScale(tab);
    horizontalScrollRef.current?.scrollTo({
      x: tab === 'trend' ? 0 : SCREEN_WIDTH,
      animated: true,
    });
  }, [SCREEN_WIDTH, animateTabScale]);

  // 水平 ScrollView 滚动结束时同步标签状态
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

  // 🔍 调试：打印当前主题颜色
  useEffect(() => {
    console.log('=== 主题调试信息 ===');
    console.log('主题模式:', theme.isDark ? 'dark' : 'light');
    console.log('背景色:', theme.colors.background);
    console.log('主色:', theme.colors.primary);
    console.log('文本色:', theme.colors.text);
    console.log('成功色:', theme.colors.success);
    console.log('==================');
  }, [theme]);

  const realTimeData = useAppSelector((state: any) => state.data.realTimeData);
  const isViewingHistory = useAppSelector(
    (state: any) => state.data.isViewingHistory,
  );
  const tags = useAppSelector((state: any) => state.data.tags);
  const currentUser = useAppSelector((state: any) => state.user.currentUser);

  // 手动控制状态选择器显示
  const [showStatusSelector, setShowStatusSelector] = useState(false);

  // 设置抽屉显示状态
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

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

  // 实时时钟（每秒更新）
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 格式化当前时间为 "2026/3/8 星期日 20:00:00"
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

  /**
   * 统一的颜色分配函数
   * 为标签数组分配红色系（加班）和绿色系（准时）颜色
   */
  const assignColorsToTags = useCallback((tags: any[]) => {
    
    // 准时下班颜色（绿色系，低饱和度，从浅到深，20个色阶）
    const onTimeColors = [
      'hsl(140, 45%, 55%)',
      'hsl(141, 44%, 53%)',
      'hsl(142, 42%, 50%)',
      'hsl(139, 41%, 48%)',
      'hsl(138, 40%, 46%)',
      'hsl(143, 39%, 44%)',
      'hsl(145, 38%, 42%)',
      'hsl(140, 37%, 40%)',
      'hsl(140, 36%, 38%)',
      'hsl(142, 35%, 36%)',
      'hsl(143, 34%, 34%)',
      'hsl(139, 33%, 32%)',
      'hsl(138, 32%, 30%)',
      'hsl(141, 31%, 29%)',
      'hsl(145, 30%, 27%)',
      'hsl(140, 29%, 26%)',
      'hsl(140, 28%, 24%)',
      'hsl(143, 27%, 23%)',
      'hsl(142, 26%, 21%)',
      'hsl(140, 25%, 19%)',
    ];

    // 加班颜色（红色系，低饱和度，从浅到深，20个色阶）
    const overtimeColors = [
      'hsl(0, 50%, 58%)',
      'hsl(3, 49%, 56%)',
      'hsl(5, 47%, 53%)',
      'hsl(1, 46%, 51%)',
      'hsl(358, 44%, 48%)',
      'hsl(2, 43%, 46%)',
      'hsl(3, 41%, 44%)',
      'hsl(0, 40%, 42%)',
      'hsl(0, 38%, 40%)',
      'hsl(4, 37%, 38%)',
      'hsl(5, 35%, 36%)',
      'hsl(1, 34%, 34%)',
      'hsl(358, 32%, 32%)',
      'hsl(2, 31%, 30%)',
      'hsl(3, 30%, 28%)',
      'hsl(0, 29%, 27%)',
      'hsl(0, 28%, 25%)',
      'hsl(4, 27%, 24%)',
      'hsl(5, 26%, 22%)',
      'hsl(0, 25%, 20%)',
    ];

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
    console.log('[TrendPage] displayData 计算 - statsData:', JSON.stringify(statsData), 'realTimeData participantCount:', realTimeData?.participantCount);
    const baseData = {
      // 使用 ?? 替代 ||，避免 0 被当作 falsy 值跳过
      participantCount:
        statsData?.participantCount ?? realTimeData?.participantCount ?? 0,
      overtimeCount:
        statsData?.overtimeCount ?? realTimeData?.overtimeCount ?? 0,
      onTimeCount: statsData?.onTimeCount ?? realTimeData?.onTimeCount ?? 0,
      tagDistribution:
        tagData?.tagDistribution || realTimeData?.tagDistribution || [],
      dailyStatus: tagData?.dailyStatus || realTimeData?.dailyStatus || [],
      timestamp: new Date(),
    };

    // 为所有标签分配颜色
    if (baseData.tagDistribution && baseData.tagDistribution.length > 0) {
      baseData.tagDistribution = assignColorsToTags(baseData.tagDistribution);
    }

    return baseData;
  }, [statsData, tagData, realTimeData, assignColorsToTags]);

  /**
   * 启动每小时快照服务
   */
  useEffect(() => {
    hourlySnapshotService.startHourlySnapshot(() => realTimeData);

    return () => {
      hourlySnapshotService.stopHourlySnapshot();
    };
  }, [realTimeData]);

  /**
   * 获取统计数据（参与人数、加班/准点对比）
   * 提取为独立函数，方便在提交后立即调用
   */
  const fetchStats = useCallback(async () => {
    try {
      console.log('[TrendPage] fetchStats 被调用');
      const stats = await supabaseService.getRealTimeStats();
      console.log('[TrendPage] RPC 返回:', JSON.stringify(stats));
      // 只在值真正变化时才更新 state，避免不必要的重渲染
      setStatsData(prev => {
        if (
          prev &&
          prev.participantCount === stats.participantCount &&
          prev.overtimeCount === stats.overtimeCount &&
          prev.onTimeCount === stats.onTimeCount
        ) {
          console.log('[TrendPage] 数据未变化，跳过更新');
          return prev;
        }
        console.log('[TrendPage] 更新 statsData:', stats.participantCount, stats.overtimeCount, stats.onTimeCount);
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

  // 解构出布尔值，避免 networkStatus 对象引用变化导致定时器反复重置
  const isConnected = networkStatus.isConnected;

  /**
   * 初始加载数据 - 无条件执行一次，不依赖 isConnected
   * 避免 NetInfo 初始化延迟导致数据永远不加载
   */
  useEffect(() => {
    console.log('[TrendPage] 初始加载 useEffect 执行');
    fetchStats();
    fetchTagData();
  }, [fetchStats, fetchTagData]);

  /**
   * 轮询实时数据（替代 Supabase Realtime）
   * 每 30 秒轮询一次，保持数据更新
   */
  useEffect(() => {
    if (isViewingHistory) return;

    // 定时轮询：每 3 秒刷新一次
    const pollInterval = setInterval(() => {
      console.log('[TrendPage] 轮询触发，刷新数据');
      fetchStats();
      fetchTagData();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isViewingHistory, fetchStats, fetchTagData]);

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
  const loadTags = async (search?: string, category?: string) => {
    // 无搜索关键词时，优先用缓存
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
  };

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
        console.log('[TrendPage] 标签预加载完成:', ontimeTags.length, '准时 /', overtimeTags.length, '加班');
      } catch (error) {
        console.error('[TrendPage] 标签预加载失败:', error);
      }
    };
    preloadTags();
  }, []);

  /**
   * 处理用户状态提交
   * 验证需求: 7.4
   */
  const handleStatusSelect = async (submission: UserStatusSubmission) => {
    console.log('[TrendPage] handleStatusSelect - Start');

    // 立即关闭选择器
    setShowStatusSelector(false);

    console.log('[TrendPage] Submitting user status...');
    // 提交状态（不需要延迟，因为已经不使用 Modal 了）
    const success = await submitUserStatus(submission);

    if (success) {
      console.log('[TrendPage] Submission successful');
      Alert.alert('提交成功', '您的工作状态已记录');
      // 提交成功后立即刷新所有数据（不等待定时器）
      console.log('[TrendPage] Immediately refreshing all data after submission...');
      setMyPageRefreshTrigger(prev => prev + 1);
      await Promise.all([fetchStats(), fetchTagData(), refresh()]);
      console.log('[TrendPage] Refresh complete');
    } else {
      console.log('[TrendPage] Submission failed');
      Alert.alert('提交失败', '请检查网络连接后重试');
    }

    console.log('[TrendPage] handleStatusSelect - End');
  };

  /**
   * 初始加载标签（不再提前加载，改为选择状态后按分类加载）
   */

  return (
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
              <Pressable
                onPress={handleNavigateToSettings}
                accessibilityLabel="进入设置">
                <Avatar avatarId={currentUser?.avatar} size={36} />
              </Pressable>

              {/* 中间：标签切换（绝对居中）*/}
              <Box position="absolute" left={0} right={0} alignItems="center">
                <HStack space="md" alignItems="center">
                  <RNPressable
                    onPress={() => animateToTab('trend')}
                    accessibilityLabel="切换到趋势页面"
                    accessibilityState={{selected: activeTab === 'trend'}}
                  >
                    <Animated.View style={{transform: [{scale: trendScale}]}}>
                      <Heading
                        size="2xl"
                        color={activeTab === 'trend' ? theme.colors.text : theme.colors.textTertiary}
                      >
                        趋势
                      </Heading>
                    </Animated.View>
                  </RNPressable>
                  <RNPressable
                    onPress={() => animateToTab('my')}
                    accessibilityLabel="切换到我的页面"
                    accessibilityState={{selected: activeTab === 'my'}}
                  >
                    <Animated.View style={{transform: [{scale: myScale}]}}>
                      <Heading
                        size="2xl"
                        color={activeTab === 'my' ? theme.colors.text : theme.colors.textTertiary}
                      >
                        我的
                      </Heading>
                    </Animated.View>
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
          onMomentumScrollEnd={handleHorizontalScrollEnd}
          scrollEventThrottle={16}
          style={{flex: 1}}
        >
            {/* 趋势页内容 */}
            <View style={{width: SCREEN_WIDTH, flex: 1}}>
        <ScrollView>
          <Box p="$4">
            {/* 第二行: 参与人数 */}
            <VStack mb="$2">
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
                    onPress={() => Alert.alert('统计周期说明', '统计周期：今日06:00 - 次日05:59')}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                    activeOpacity={0.6}>
                    <View style={{width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: theme.colors.textSecondary, alignItems: 'center', justifyContent: 'center'}}>
                      <Text style={{fontSize: 8.5, color: theme.colors.textSecondary, fontWeight: '600', lineHeight: 12}}>?</Text>
                    </View>
                  </TouchableOpacity>
                </HStack>
                <Text size="xs" color={theme.colors.textSecondary} style={{fontFamily: 'monospace', fontVariant: ['tabular-nums']}}>
                  {formattedTime}
                </Text>
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
              <VStack alignItems="center" mt="$1">
                <Text size="xs" color={theme.colors.textSecondary} mb="$1">
                  本轮累计参与人数
                </Text>
                <AnimatedNumber
                  value={displayData?.participantCount || 0}
                  blur={shouldBlurData}
                  duration={800}
                  style={{
                    fontSize: 36,
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    fontFamily: 'monospace',
                  }}
                />
              </VStack>
            </VStack>

            {/* 第三行: 历史状态指示器 */}
            <Box mb="$3">
              <HistoricalStatusIndicator
                dailyStatus={displayData?.dailyStatus || []}
                theme={theme.isDark ? 'dark' : 'light'}
              />
            </Box>

            {/* 数据可视化组件 */}
            <Box w="$full">
              {displayData.participantCount === 0 &&
                displayData.overtimeCount === 0 &&
                displayData.onTimeCount === 0 && (
                  <Box
                    p="$2"
                    mb="$1"
                    alignItems="center">
                    <Text size="xs" color={theme.colors.textSecondary}>
                      该时段暂无数据
                    </Text>
                  </Box>
                )}
              <DataVisualization
                  ref={dataVisualizationRef}
                  overtimeCount={displayData?.overtimeCount || 0}
                  onTimeCount={displayData?.onTimeCount || 0}
                  tagDistribution={displayData?.tagDistribution || []}
                  theme={theme.isDark ? 'dark' : 'light'}
                  animationDuration={1000}
                  blurData={shouldBlurData}
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

            {/* 提交今日状态按钮 - 与登录按钮风格一致 */}
            {shouldShowSelector && (
              <Box mt="$4" alignItems="center">
                <RNPressable
                  onPress={() => setShowStatusSelector(true)}
                  accessibilityLabel="提交今日工作状态"
                  style={({pressed}) => ({
                    width: '70%',
                    backgroundColor: pressed
                      ? 'rgba(255,255,255,0.85)'
                      : '#FFFFFF',
                    borderRadius: 6,
                    height: 48,
                    justifyContent: 'center' as const,
                    alignItems: 'center' as const,
                  })}>
                  <Text size="md" color="$black" fontWeight="$medium">
                    提交今日状态
                  </Text>
                </RNPressable>
                {/* 提示词：提交后解锁趋势数据 */}
                <Text
                  size="xs"
                  color={theme.colors.textSecondary}
                  mt="$2"
                  textAlign="center">
                  解锁趋势数据
                </Text>
              </Box>
            )}

            {/* 已提交状态提示 - 与提交按钮大小一致，灰色表示不可点击 */}
            {userStatus.hasSubmittedToday && (
              <Box mt="$4" alignItems="center">
                <View
                  style={{
                    width: '70%',
                    backgroundColor: '#1A1A1A',
                    borderRadius: 6,
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text size="md" color="#555555" fontWeight="$medium">
                    本轮状态已提交
                  </Text>
                </View>
              </Box>
            )}
          </Box>
        </ScrollView>
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

        {/* 用户状态选择器 - 手动控制显示 */}
        <Suspense fallback={null}>
        <UserStatusSelector
          visible={showStatusSelector}
          onStatusSelect={handleStatusSelect}
          availableTags={tags}
          onLoadTags={loadTags}
          loading={loadingTags || isSubmitting}
          theme={theme.isDark ? 'dark' : 'light'}
          onCancel={() => {
            console.log('[TrendPage] User cancelled status selection');
            setShowStatusSelector(false);
          }}
        />
        </Suspense>

        {/* 设置抽屉 - 手势驱动，从左侧滑出 */}
        <GestureDrawer
          isOpen={showSettingsDrawer}
          onClose={() => setShowSettingsDrawer(false)}
          onOpen={() => setShowSettingsDrawer(true)}
        >
          <SettingsScreen onClose={() => setShowSettingsDrawer(false)} />
        </GestureDrawer>
      </VStack>
    </SafeAreaView>
  );
};

export default TrendPage;

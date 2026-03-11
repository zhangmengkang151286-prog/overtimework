/**
 * 分享海报主屏幕
 * 
 * 功能：
 * - 显示4种类型的海报（趋势界面、下班日历、加班趋势、标签占比）
 * - 支持左右滑动切换海报
 * - 提供保存到本地和分享功能
 * - 显示加载状态和错误提示
 * 
 * 验证需求: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1-2.5, 11.1-11.5, 12.1-12.5
 */

import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
  View,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text as RNText,
} from 'react-native';
import {Box, Text, Pressable} from '@gluestack-ui/themed';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

// 导入组件
import {PosterCarousel} from '../components/poster/PosterCarousel';
import {PosterControls} from '../components/poster/PosterControls';
import {TrendPoster} from '../components/poster/TrendPoster';
import {CalendarPoster} from '../components/poster/CalendarPoster';
import {OvertimeTrendPoster} from '../components/poster/OvertimeTrendPoster';
import {TagProportionPoster} from '../components/poster/TagProportionPoster';

// 导入类型
import {PosterType, PosterData} from '../types/poster';

// 导入服务
import {posterGeneratorService} from '../services/posterGenerator';
import {posterDataService} from '../services/posterData';

// 导入主题
import {useThemeToggle} from '../hooks/useThemeToggle';
import {colors} from '../theme/colors';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

/**
 * 分享海报屏幕组件
 */
export const SharePosterScreen: React.FC = () => {
  const navigation = useNavigation();
  const {isDark} = useThemeToggle();
  
  // 获取当前主题的颜色
  const themeColors = isDark ? colors.dark : colors.light;
  
  // 获取用户信息
  const currentUser = useSelector((state: any) => state?.user?.currentUser);

  // 状态管理
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posterData, setPosterData] = useState<PosterData | null>(null);
  
  // 各个海报的具体数据
  const [trendData, setTrendData] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [overtimeTrendData, setOvertimeTrendData] = useState<any>(null);
  const [tagProportionData, setTagProportionData] = useState<any>(null);

  // 海报引用（用于截图）
  const posterRefs = useRef<Array<View | null>>([null, null, null, null]);

  /**
   * 加载海报数据
   */
  const loadPosterData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取用户信息
      const userId = currentUser?.id;
      if (!userId) {
        throw new Error('用户未登录，请先登录');
      }

      // 获取用户基本信息
      const userInfo = await posterDataService.getUserInfo(userId);

      // 设置基础海报数据
      const baseData: PosterData = {
        user: userInfo,
        date: new Date().toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        appLogo: '', // TODO: 添加 APP LOGO
        appName: '下班指数',
      };

      setPosterData(baseData);

      // 加载趋势界面数据
      await loadTrendData();

      // 加载日历数据（当前月份）
      const now = new Date();
      await loadCalendarData(now.getFullYear(), now.getMonth() + 1);

      // 加载加班趋势数据（默认按月）
      await loadOvertimeTrendData('month');

      // 加载标签占比数据（当前月份）
      await loadTagProportionData(now.getFullYear(), now.getMonth() + 1);

    } catch (err) {
      console.error('加载海报数据失败:', err);
      const errorMessage = err instanceof Error ? err.message : '数据加载失败，请重试';
      setError(errorMessage);
      
      // 显示错误提示
      Alert.alert(
        '加载失败',
        errorMessage,
        [
          {text: '取消', style: 'cancel'},
          {text: '重试', onPress: loadPosterData},
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载趋势界面数据
   */
  const loadTrendData = async () => {
    try {
      const data = await posterDataService.getTrendData();
      setTrendData(data);
    } catch (err) {
      console.error('加载趋势数据失败:', err);
      // 设置空数据，避免阻塞其他海报
      setTrendData({
        participants: 0,
        onTimeCount: 0,
        overtimeCount: 0,
        timeline: [],
        tagDistribution: [],
      });
    }
  };

  /**
   * 加载日历数据
   */
  const loadCalendarData = async (year: number, month: number) => {
    try {
      const userId = currentUser?.id;
      if (!userId) return;

      const data = await posterDataService.getCalendarData(userId, year, month);
      setCalendarData(data);
    } catch (err) {
      console.error('加载日历数据失败:', err);
      // 设置空数据
      setCalendarData({
        year,
        month,
        days: [],
      });
    }
  };

  /**
   * 加载加班趋势数据
   */
  const loadOvertimeTrendData = async (dimension: 'day' | 'week' | 'month') => {
    try {
      const userId = currentUser?.id;
      if (!userId) return;

      const data = await posterDataService.getOvertimeTrendData(userId, dimension);
      setOvertimeTrendData(data);
    } catch (err) {
      console.error('加载加班趋势数据失败:', err);
      // 设置空数据
      setOvertimeTrendData({
        dimension,
        dataPoints: [],
      });
    }
  };

  /**
   * 加载标签占比数据
   */
  const loadTagProportionData = async (year: number, month: number) => {
    try {
      const userId = currentUser?.id;
      if (!userId) return;

      const data = await posterDataService.getTagProportionData(userId, year, month);
      setTagProportionData(data);
    } catch (err) {
      console.error('加载标签占比数据失败:', err);
      // 设置空数据
      setTagProportionData({
        year,
        month,
        tags: [],
      });
    }
  };

  /**
   * 组件挂载时加载数据
   */
  useEffect(() => {
    loadPosterData();
  }, []);

  /**
   * 处理海报切换
   */
  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
  };

  /**
   * 缓存海报类型数组（避免重复创建）- 必须在 useCallback 之前定义
   */
  const posterTypes: PosterType[] = useMemo(() => [
    PosterType.TREND,
    PosterType.CALENDAR,
    PosterType.OVERTIME_TREND,
    PosterType.TAG_PROPORTION,
  ], []);

  /**
   * 处理保存到本地（使用 useCallback 缓存）
   */
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      
      // 获取当前海报的引用
      const currentPosterRef = posterRefs.current[currentIndex];
      if (!currentPosterRef) {
        Alert.alert(
          '错误',
          '海报引用无效，请重试',
          [
            {text: '确定', style: 'default'},
          ],
        );
        return;
      }

      // 获取当前海报类型
      const currentType = posterTypes[currentIndex];

      // 生成并保存海报
      await posterGeneratorService.generateAndSave(
        {current: currentPosterRef},
        currentType,
      );
      
    } catch (err) {
      console.error('保存失败:', err);
      
      // 如果不是权限错误，显示重试选项
      if (err instanceof Error && !err.message.includes('权限')) {
        Alert.alert(
          '保存失败',
          '无法保存海报，是否重试？',
          [
            {text: '取消', style: 'cancel'},
            {text: '重试', onPress: handleSave},
          ],
        );
      }
    } finally {
      setSaving(false);
    }
  }, [currentIndex, posterTypes]);

  /**
   * 处理分享（使用 useCallback 缓存）
   */
  const handleShare = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      
      // 获取当前海报的引用
      const currentPosterRef = posterRefs.current[currentIndex];
      if (!currentPosterRef) {
        Alert.alert(
          '错误',
          '海报引用无效，请重试',
          [
            {text: '确定', style: 'default'},
          ],
        );
        return;
      }

      // 获取当前海报类型
      const currentType = posterTypes[currentIndex];

      // 生成并分享海报
      await posterGeneratorService.generateAndShare(
        {current: currentPosterRef},
        currentType,
      );
      
    } catch (err) {
      console.error('分享失败:', err);
      
      // 如果不是用户取消分享，显示重试选项
      if (err instanceof Error && !err.message.includes('cancelled')) {
        Alert.alert(
          '分享失败',
          '无法分享海报，是否重试？',
          [
            {text: '取消', style: 'cancel'},
            {text: '重试', onPress: handleShare},
          ],
        );
      }
    } finally {
      setSaving(false);
    }
  }, [currentIndex, posterTypes]);

  /**
   * 处理返回
   */
  const handleBack = () => {
    navigation.goBack();
  };

  /**
   * 缓存默认数据对象（避免重复创建）- 必须在条件渲染之前定义
   */
  const defaultTrendData = useMemo(() => ({
    participants: 0,
    onTimeCount: 0,
    overtimeCount: 0,
    timeline: [],
    tagDistribution: [],
  }), []);

  const defaultCalendarData = useMemo(() => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    days: [],
  }), []);

  const defaultOvertimeTrendData = useMemo(() => ({
    dimension: 'month' as const,
    dataPoints: [],
  }), []);

  const defaultTagProportionData = useMemo(() => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    tags: [],
  }), []);

  /**
   * 缓存回调函数（避免子组件重渲染）- 必须在条件渲染之前定义
   */
  const handleCalendarYearMonthChange = useCallback(async (year: number, month: number) => {
    await loadCalendarData(year, month);
  }, [currentUser?.id]);

  const handleOvertimeDimensionChange = useCallback(async (dimension: string) => {
    await loadOvertimeTrendData(dimension as 'day' | 'week' | 'month');
  }, [currentUser?.id]);

  const handleTagYearMonthChange = useCallback(async (year: number, month: number) => {
    await loadTagProportionData(year, month);
  }, [currentUser?.id]);

  /**
   * 渲染海报列表（使用 useMemo 缓存）- 必须在条件渲染之前定义
   */
  const posters = useMemo(() => {
    if (!posterData) return [];

    return [
      // 趋势界面海报
      <TrendPoster
        key="trend"
        ref={(ref) => {
          posterRefs.current[0] = ref;
        }}
        data={trendData || defaultTrendData}
        user={posterData.user}
        date={posterData.date}
      />,
      
      // 下班日历海报
      <CalendarPoster
        key="calendar"
        ref={(ref) => {
          posterRefs.current[1] = ref;
        }}
        data={calendarData || defaultCalendarData}
        user={posterData.user}
        onYearMonthChange={handleCalendarYearMonthChange}
      />,
      
      // 加班趋势海报
      <OvertimeTrendPoster
        key="overtime-trend"
        ref={(ref) => {
          posterRefs.current[2] = ref;
        }}
        data={overtimeTrendData || defaultOvertimeTrendData}
        user={posterData.user}
        onDimensionChange={handleOvertimeDimensionChange}
      />,
      
      // 标签占比海报
      <TagProportionPoster
        key="tag-proportion"
        ref={(ref) => {
          posterRefs.current[3] = ref;
        }}
        data={tagProportionData || defaultTagProportionData}
        user={posterData.user}
        onYearMonthChange={handleTagYearMonthChange}
      />,
    ];
  }, [
    posterData,
    trendData,
    calendarData,
    overtimeTrendData,
    tagProportionData,
    defaultTrendData,
    defaultCalendarData,
    defaultOvertimeTrendData,
    defaultTagProportionData,
    handleCalendarYearMonthChange,
    handleOvertimeDimensionChange,
    handleTagYearMonthChange,
  ]);

  /**
   * 渲染加载状态
   */
  if (loading && !posterData) {
    return (
      <Box
        flex={1}
        backgroundColor="#000000"
        justifyContent="center"
        alignItems="center">
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text
          color="$textDark400"
          marginTop="$4"
          fontSize="$sm">
          加载中...
        </Text>
      </Box>
    );
  }

  /**
   * 渲染错误状态
   */
  if (error) {
    return (
      <Box
        flex={1}
        backgroundColor="#000000"
        justifyContent="center"
        alignItems="center"
        padding="$6">
        <Text
          color={themeColors.error}
          fontSize="$lg"
          fontWeight="$semibold"
          marginBottom="$4">
          {error}
        </Text>
        <Pressable onPress={loadPosterData}>
          <Box
            paddingHorizontal="$6"
            paddingVertical="$3"
            backgroundColor={themeColors.primary}
            borderRadius="$lg">
            <Text
              color="#FFFFFF"
              fontWeight="$semibold">
              重试
            </Text>
          </Box>
        </Pressable>
      </Box>
    );
  }

  return (
    <Box
      flex={1}
      backgroundColor="#000000">
      {/* 顶部导航栏 - 和个人资料编辑界面的取消/保存风格完全一致 */}
      <View style={{paddingTop: Platform.OS === 'ios' ? 50 : 16, backgroundColor: '#000'}}>
        <View style={screenStyles.header}>
          <Pressable onPress={handleBack} style={screenStyles.headerBtn}>
            <RNText style={screenStyles.headerBtnText}>返回</RNText>
          </Pressable>
          <View style={{flexDirection: 'row', gap: 20}}>
            <Pressable onPress={handleSave} disabled={saving} style={[screenStyles.headerBtn, {opacity: saving ? 0.4 : 1}]}>
              <RNText style={screenStyles.headerBtnText}>保存</RNText>
            </Pressable>
            <Pressable onPress={handleShare} disabled={saving} style={[screenStyles.headerBtn, {opacity: saving ? 0.4 : 1}]}>
              <RNText style={screenStyles.headerBtnText}>分享</RNText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 海报滑动容器 - 尽量占满剩余空间 */}
      <Box flex={1}>
        {posters.length > 0 && (
          <PosterCarousel
            posters={posters}
            currentIndex={currentIndex}
            onIndexChange={handleIndexChange}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT * 0.85}
          />
        )}
      </Box>

      {/* 底部圆点指示器 */}
      <PosterControls
        currentIndex={currentIndex}
        totalCount={posters.length}
        onSave={handleSave}
        onShare={handleShare}
        onIndexChange={handleIndexChange}
        loading={loading}
      />
    </Box>
  );
};

/**
 * 导航栏样式 - 和 SettingsScreen 编辑个人信息的 modalStyles 保持一致
 */
const screenStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2F3336',
    backgroundColor: '#000',
  },
  headerBtn: {
    padding: 4,
    minWidth: 50,
  },
  headerBtnText: {
    color: '#E7E9EA',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default SharePosterScreen;

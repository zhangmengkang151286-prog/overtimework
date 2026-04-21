/**
 * 我的页面 - 展示用户个人加班/准时历史
 * 包含月历视图和长期趋势图
 * 需求: 7.1, 7.2, 7.3
 */

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {StyleSheet, View, Text, ScrollView, ActivityIndicator} from 'react-native';
import {typography} from '../theme/typography';

import {CalendarView} from '../components/CalendarView';
import {LongTermTrendChart} from '../components/LongTermTrendChart';
import {TagProportionSection} from '../components/TagProportionSection';
import {supabaseService} from '../services/supabaseService';
import {getHolidaysForMonth} from '../data/holidays';
import {aggregateTrendData} from '../utils/trendDataUtils';
import {PersonalStatusRecord, TrendDimension, HolidayInfo} from '../types/my-page';
import {Theme} from '../theme';
import {getCache, setCache, cacheKey} from '../services/apiCache';

interface MyPageProps {
  theme: Theme;
  userId: string;
  /** 外部触发刷新的计数器，每次变化时重新加载数据 */
  refreshTrigger?: number;
}

/**
 * MyPage 我的页面主组件
 * 组合 CalendarView 和 LongTermTrendChart
 * 需求: 7.1, 7.2, 7.3
 */
export const MyPage: React.FC<MyPageProps> = ({theme, userId, refreshTrigger}) => {
  const isDark = theme.isDark;

  // 日历状态
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1);

  // 趋势图状态
  const [trendDimension, setTrendDimension] = useState<TrendDimension>('day');

  // 数据状态
  const [monthlyRecords, setMonthlyRecords] = useState<PersonalStatusRecord[]>([]);
  const [trendRecords, setTrendRecords] = useState<PersonalStatusRecord[]>([]);
  const [holidays, setHolidays] = useState<HolidayInfo[]>([]);

  // 加载状态（仅首次无缓存时显示 loading）
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);

  // 错误状态（仅首次无缓存且网络失败时显示）
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);

  /**
   * 加载月历数据（SWR 策略）
   * 1. 先从缓存读取并立即显示
   * 2. 后台请求最新数据，成功后更新界面和缓存
   * 3. 网络失败时静默降级，用户无感知
   */
  const loadCalendarData = useCallback(async () => {
    if (!userId) return;

    const key = cacheKey('calendar', userId, calendarYear, calendarMonth);

    // 1. 先读缓存
    const cached = await getCache<PersonalStatusRecord[]>(key);
    if (cached) {
      setMonthlyRecords(cached);
    } else {
      // 无缓存时才显示 loading
      setCalendarLoading(true);
    }
    setCalendarError(null);

    // 2. 后台请求最新数据
    try {
      const records = await supabaseService.getUserMonthlyRecords(
        userId,
        calendarYear,
        calendarMonth,
      );
      setMonthlyRecords(records);
      setCache(key, records);
    } catch (error) {
      console.error('加载月历数据失败:', error);
      // 有缓存时静默降级，无缓存时才提示错误
      if (!cached) {
        setCalendarError('数据加载失败，请稍后重试');
      }
    } finally {
      setCalendarLoading(false);
    }
  }, [userId, calendarYear, calendarMonth, refreshTrigger]);

  /**
   * 加载趋势图数据（SWR 策略）
   * 同月历数据，先缓存后刷新
   */
  const loadTrendData = useCallback(async () => {
    if (!userId) return;

    const key = cacheKey('trend', userId);

    // 1. 先读缓存
    const cached = await getCache<PersonalStatusRecord[]>(key);
    if (cached) {
      setTrendRecords(cached);
    } else {
      setTrendLoading(true);
    }
    setTrendError(null);

    // 2. 后台请求最新数据
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const records = await supabaseService.getUserTrendData(
        userId,
        startStr,
        endStr,
      );
      setTrendRecords(records);
      setCache(key, records);
    } catch (error) {
      console.error('加载趋势数据失败:', error);
      if (!cached) {
        setTrendError('数据加载失败，请稍后重试');
      }
    } finally {
      setTrendLoading(false);
    }
  }, [userId, refreshTrigger]);

  // 加载节假日数据
  useEffect(() => {
    const h = getHolidaysForMonth(calendarYear, calendarMonth);
    setHolidays(h);
  }, [calendarYear, calendarMonth]);

  // 加载月历数据
  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // 加载趋势数据（仅初始化时加载一次）
  useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  // 聚合趋势数据
  const trendData = useMemo(
    () => aggregateTrendData(trendRecords, trendDimension),
    [trendRecords, trendDimension],
  );

  // 处理月份切换
  // 需求: 7.2
  const handleMonthChange = useCallback((year: number, month: number) => {
    setCalendarYear(year);
    setCalendarMonth(month);
  }, []);

  // 处理维度切换
  const handleDimensionChange = useCallback((dim: TrendDimension) => {
    setTrendDimension(dim);
  }, []);

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      showsVerticalScrollIndicator={false}
    >
      {/* 月历视图 */}
      <View style={styles.section}>
        {calendarLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator
              size="small"
              color={theme.colors.text}
            />
          </View>
        )}
        {calendarError && (
          <View style={styles.errorBanner}>
            <Text style={[styles.errorText, {color: theme.colors.error}]}>
              {calendarError}
            </Text>
          </View>
        )}
        <CalendarView
          year={calendarYear}
          month={calendarMonth}
          statusRecords={monthlyRecords}
          holidays={holidays}
          theme={theme}
          onMonthChange={handleMonthChange}
        />
      </View>

      {/* 分隔线 */}
      <View style={[styles.divider, {backgroundColor: theme.colors.divider}]} />

      {/* 长期趋势图 */}
      <View style={styles.section}>
        {trendLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator
              size="small"
              color={theme.colors.text}
            />
          </View>
        )}
        {trendError && (
          <View style={styles.errorBanner}>
            <Text style={[styles.errorText, {color: theme.colors.error}]}>
              {trendError}
            </Text>
          </View>
        )}
        <LongTermTrendChart
          data={trendData}
          dimension={trendDimension}
          onDimensionChange={handleDimensionChange}
          theme={theme}
        />
      </View>

      {/* 分隔线 */}
      <View style={[styles.divider, {backgroundColor: theme.colors.divider}]} />

      {/* 标签占比模块 - 需求 1.1 */}
      <View style={styles.section}>
        <TagProportionSection theme={theme} userId={userId} refreshTrigger={refreshTrigger} />
      </View>

      {/* 底部间距 */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginHorizontal: 8,
    marginTop: 12,
    position: 'relative',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    marginTop: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  errorBanner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
  },
  bottomSpacer: {
    height: 24,
  },
});

export default MyPage;

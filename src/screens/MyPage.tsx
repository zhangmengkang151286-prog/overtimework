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

  // 加载状态
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);

  // 错误状态
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);

  // 上次成功加载的数据（网络失败时保留）
  const [lastMonthlyRecords, setLastMonthlyRecords] = useState<PersonalStatusRecord[]>([]);
  const [lastTrendRecords, setLastTrendRecords] = useState<PersonalStatusRecord[]>([]);

  /**
   * 加载月历数据
   * 需求: 7.1, 7.2
   */
  const loadCalendarData = useCallback(async () => {
    if (!userId) return;

    setCalendarLoading(true);
    setCalendarError(null);

    try {
      const records = await supabaseService.getUserMonthlyRecords(
        userId,
        calendarYear,
        calendarMonth,
      );
      setMonthlyRecords(records);
      setLastMonthlyRecords(records);
    } catch (error) {
      console.error('加载月历数据失败:', error);
      // 需求 7.3: 网络不可用时保留上次成功加载的数据
      setCalendarError('数据加载失败，显示上次数据');
      setMonthlyRecords(lastMonthlyRecords);
    } finally {
      setCalendarLoading(false);
    }
  }, [userId, calendarYear, calendarMonth, refreshTrigger]);

  /**
   * 加载趋势图数据
   * 需求: 7.1, 7.2
   * 天维度最多显示最近 30 天的数据
   */
  const loadTrendData = useCallback(async () => {
    if (!userId) return;

    setTrendLoading(true);
    setTrendError(null);

    try {
      // 获取最近 90 天的数据用于趋势图（周/月维度需要更多数据）
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
      setLastTrendRecords(records);
    } catch (error) {
      console.error('加载趋势数据失败:', error);
      // 需求 7.3: 网络不可用时保留上次成功加载的数据
      setTrendError('数据加载失败，显示上次数据');
      setTrendRecords(lastTrendRecords);
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
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </View>
        )}
        {calendarError && (
          <View style={styles.errorBanner}>
            <Text style={[styles.errorText, {color: '#FF5000'}]}>
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
      <View style={[styles.divider, {backgroundColor: isDark ? '#27272A' : '#E5E7EB'}]} />

      {/* 长期趋势图 */}
      <View style={styles.section}>
        {trendLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator
              size="small"
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </View>
        )}
        {trendError && (
          <View style={styles.errorBanner}>
            <Text style={[styles.errorText, {color: '#FF5000'}]}>
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
      <View style={[styles.divider, {backgroundColor: isDark ? '#27272A' : '#E5E7EB'}]} />

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

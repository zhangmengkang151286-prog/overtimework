import {useEffect, useCallback, useRef} from 'react';
import {useAppDispatch, useAppSelector} from './redux';
import {
  addHistoricalData,
  setCurrentViewData,
  setLoadingHistorical,
  setError,
} from '../store/slices/dataSlice';
import {supabaseHistoricalService} from '../services/supabaseHistoricalService';
import {RealTimeData} from '../types';

/**
 * 历史数据管理Hook
 * 负责获取和缓存历史数据
 * 需求: 6.5
 */
export const useHistoricalData = () => {
  const dispatch = useAppDispatch();
  const selectedTime = useAppSelector((state: any) => state.data.selectedTime);
  const isViewingHistory = useAppSelector(
    (state: any) => state.data.isViewingHistory,
  );
  const historicalDataCache = useAppSelector(
    (state: any) => state.data.historicalDataCache,
  );
  const realTimeData = useAppSelector((state: any) => state.data.realTimeData);

  // 防抖定时器
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedTimeRef = useRef<number | null>(null);

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * 格式化时间为 HH:mm
   */
  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  /**
   * 将时间对齐到15分钟间隔
   */
  const alignToInterval = (date: Date, intervalMinutes: number = 15): Date => {
    const aligned = new Date(date);
    const minutes = aligned.getMinutes();
    const remainder = minutes % intervalMinutes;
    aligned.setMinutes(minutes - remainder);
    aligned.setSeconds(0);
    aligned.setMilliseconds(0);
    return aligned;
  };

  /**
   * 转换 HistoricalData 为 RealTimeData
   */
  const convertToRealTimeData = (historicalData: any): RealTimeData => {
    return {
      timestamp: new Date(historicalData.date), // 保持为 Date 对象
      participantCount: historicalData.stats.participantCount,
      overtimeCount: historicalData.stats.overtimeCount,
      onTimeCount: historicalData.stats.onTimeCount,
      tagDistribution: historicalData.tagDistribution.map((tag: any) => ({
        tagId: tag.tagId,
        tagName: tag.tagName,
        count: tag.totalCount,
        isOvertime: tag.overtimeCount > tag.onTimeCount,
        color: '', // 不在这里生成颜色，由TrendPage统一分配
      })),
      dailyStatus: [
        {
          date: new Date(historicalData.date), // 保持为 Date 对象
          isOvertimeDominant: historicalData.stats.isOvertimeDominant,
          participantCount: historicalData.stats.participantCount,
          overtimeCount: historicalData.stats.overtimeCount,
          onTimeCount: historicalData.stats.onTimeCount,
          status: historicalData.stats.isOvertimeDominant
            ? 'overtime'
            : 'ontime',
        },
      ],
    };
  };

  /**
   * 获取历史数据
   */
  const fetchHistoricalData = useCallback(
    async (time: Date) => {
      // 对齐到15分钟间隔
      const alignedTime = alignToInterval(time);
      const timestamp = alignedTime.getTime();

      // 检查是否已经获取过相同时间点的数据
      if (lastFetchedTimeRef.current === timestamp) {
        return;
      }

      // 检查是否是今天
      const today = new Date();
      const isToday =
        alignedTime.getFullYear() === today.getFullYear() &&
        alignedTime.getMonth() === today.getMonth() &&
        alignedTime.getDate() === today.getDate();

      // 如果是今天，直接使用实时数据
      if (isToday) {
        console.log(
          '[useHistoricalData] Selected time is today, using real-time data',
        );
        if (realTimeData) {
          dispatch(setCurrentViewData(realTimeData));
        }
        lastFetchedTimeRef.current = timestamp;
        return;
      }

      // 检查缓存
      const cached = historicalDataCache[timestamp];
      if (cached) {
        if (cached.isAvailable) {
          dispatch(setCurrentViewData(cached.data));
        }
        return;
      }

      // 获取新数据
      try {
        dispatch(setLoadingHistorical(true));
        dispatch(setError(null));

        const historicalData =
          await supabaseHistoricalService.getHistoricalData(alignedTime);

        if (historicalData.isAvailable) {
          const data = {
            data: convertToRealTimeData(historicalData),
            isAvailable: true,
          };

          console.log('[useHistoricalData] Historical data fetched:', {
            timestamp: alignedTime.toISOString(),
            participantCount: data.data.participantCount,
            overtimeCount: data.data.overtimeCount,
            onTimeCount: data.data.onTimeCount,
            tagDistributionLength: data.data.tagDistribution.length,
            dailyStatusLength: data.data.dailyStatus.length,
          });

          // 保存到Redux store
          dispatch(addHistoricalData(data));

          // 更新当前视图数据
          dispatch(setCurrentViewData(data.data));

          console.log('[useHistoricalData] setCurrentViewData dispatched');
        } else {
          // 创建空的历史数据（没有可用数据时）
          // 注意：timestamp 使用字符串，Redux reducer 会处理序列化
          const emptyHistoricalData = {
            data: {
              timestamp: alignedTime.toISOString(),
              participantCount: 0,
              overtimeCount: 0,
              onTimeCount: 0,
              tagDistribution: [],
              dailyStatus: [],
            },
            isAvailable: false,
          } as any; // 使用 any 避免类型错误，Redux reducer 会正确处理
          dispatch(addHistoricalData(emptyHistoricalData));
          dispatch(setError('该日期的历史数据不可用'));
        }

        lastFetchedTimeRef.current = timestamp;
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
        dispatch(setError('获取历史数据失败'));
      } finally {
        dispatch(setLoadingHistorical(false));
      }
    },
    [dispatch, historicalDataCache, realTimeData],
  );

  /**
   * 当选择的时间变化时，获取对应的历史数据
   * 使用防抖避免频繁请求
   */
  useEffect(() => {
    if (!isViewingHistory) {
      // 如果不在查看历史数据，使用实时数据
      if (realTimeData) {
        dispatch(setCurrentViewData(realTimeData));
      }
      return;
    }

    // 清除之前的定时器
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // 设置新的防抖定时器（300ms）
    fetchTimeoutRef.current = setTimeout(() => {
      // 将 ISO 字符串转换为 Date 对象
      const timeDate = new Date(selectedTime);
      fetchHistoricalData(timeDate);
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [
    selectedTime,
    isViewingHistory,
    fetchHistoricalData,
    realTimeData,
    dispatch,
  ]);

  /**
   * 预加载附近的历史数据（可选优化）
   */
  const prefetchNearbyData = useCallback(
    async (centerTime: Date, count: number = 4) => {
      const times: Date[] = [];
      const intervalMs = 15 * 60 * 1000; // 15分钟

      // 生成前后各count个时间点
      for (let i = -count; i <= count; i++) {
        if (i === 0) continue; // 跳过中心点（已经获取）
        const time = new Date(centerTime.getTime() + i * intervalMs);
        times.push(alignToInterval(time));
      }

      // 过滤掉已缓存的时间点
      const uncachedTimes = times.filter(
        time => !historicalDataCache[time.getTime()],
      );

      if (uncachedTimes.length === 0) return;

      // 批量获取
      try {
        const promises = uncachedTimes.map(async time => {
          try {
            const historicalData =
              await supabaseHistoricalService.getHistoricalData(time);
            if (historicalData.isAvailable) {
              return {
                data: convertToRealTimeData(historicalData),
                isAvailable: true,
              };
            }
            return null;
          } catch (error) {
            console.warn(`Failed to prefetch data for ${time.toISOString()}`);
            return null;
          }
        });

        const results = await Promise.all(promises);
        results.forEach(result => {
          if (result) {
            dispatch(addHistoricalData(result));
          }
        });
      } catch (error) {
        console.error('Failed to prefetch nearby data:', error);
      }
    },
    [dispatch, historicalDataCache],
  );

  return {
    fetchHistoricalData,
    prefetchNearbyData,
  };
};

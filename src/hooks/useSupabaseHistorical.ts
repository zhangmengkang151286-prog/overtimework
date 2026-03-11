import {useEffect, useCallback, useRef, useState} from 'react';
import {useAppDispatch, useAppSelector} from './redux';
import {setError} from '../store/slices/dataSlice';
import {
  supabaseHistoricalService,
  HistoricalData,
} from '../services/supabaseHistoricalService';

/**
 * Supabase 历史数据 Hook
 * 负责获取和缓存历史数据
 * 需求: 14.5
 */
export const useSupabaseHistorical = () => {
  const dispatch = useAppDispatch();
  const selectedTime = useAppSelector((state: any) => state.data.selectedTime);
  const isViewingHistory = useAppSelector(
    (state: any) => state.data.isViewingHistory,
  );

  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // 防抖定时器
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedDateRef = useRef<string | null>(null);

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
   * 获取历史数据
   */
  const fetchHistoricalData = useCallback(
    async (date: Date) => {
      const dateStr = formatDate(date);

      // 检查是否已经获取过相同日期的数据
      if (lastFetchedDateRef.current === dateStr) {
        return;
      }

      try {
        setLoading(true);
        dispatch(setError(null));

        const data = await supabaseHistoricalService.getHistoricalData(date);

        setHistoricalData(data);
        lastFetchedDateRef.current = dateStr;

        if (!data.isAvailable) {
          dispatch(setError('该日期的历史数据不可用'));
        }

        // 预加载附近日期的数据
        supabaseHistoricalService.prefetchNearbyDates(date, 3, 3);
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
        dispatch(setError('获取历史数据失败'));
      } finally {
        setLoading(false);
      }
    },
    [dispatch],
  );

  /**
   * 获取日期范围内的历史数据
   */
  const fetchHistoricalDataRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      try {
        setLoading(true);
        dispatch(setError(null));

        const data = await supabaseHistoricalService.getHistoricalDataRange(
          startDate,
          endDate,
        );

        return data;
      } catch (error) {
        console.error('Failed to fetch historical data range:', error);
        dispatch(setError('获取历史数据范围失败'));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [dispatch],
  );

  /**
   * 当选择的时间变化时，获取对应的历史数据
   * 使用防抖避免频繁请求
   */
  useEffect(() => {
    if (!isViewingHistory) {
      // 如果不在查看历史数据，清空历史数据
      setHistoricalData(null);
      return;
    }

    // 清除之前的定时器
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // 设置新的防抖定时器（300ms）
    fetchTimeoutRef.current = setTimeout(() => {
      fetchHistoricalData(selectedTime);
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [selectedTime, isViewingHistory, fetchHistoricalData]);

  /**
   * 清除缓存
   */
  const clearCache = useCallback(() => {
    supabaseHistoricalService.clearCache();
  }, []);

  /**
   * 清除指定日期的缓存
   */
  const clearCacheForDate = useCallback((date: Date) => {
    supabaseHistoricalService.clearCacheForDate(date);
  }, []);

  /**
   * 获取缓存大小
   */
  const getCacheSize = useCallback(() => {
    return supabaseHistoricalService.getCacheSize();
  }, []);

  return {
    historicalData,
    loading,
    fetchHistoricalData,
    fetchHistoricalDataRange,
    clearCache,
    clearCacheForDate,
    getCacheSize,
  };
};

import {useEffect, useState, useCallback} from 'react';
import {useAppDispatch} from './redux';
import {setError} from '../store/slices/dataSlice';
import {
  supabaseRealtimeService,
  NetworkStatus,
  SupabaseRealTimeData,
} from '../services/supabaseRealtimeService';
import {dailyResetService} from '../services/dailyResetService';

/**
 * Supabase 实时数据 Hook
 * 集成 Supabase Realtime 订阅和每日重置服务
 * 需求: 14.3
 */
export const useSupabaseRealtime = () => {
  const dispatch = useAppDispatch();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const [realTimeData, setRealTimeData] = useState<SupabaseRealTimeData | null>(
    null,
  );

  /**
   * 处理数据更新
   */
  const handleDataUpdate = useCallback((data: SupabaseRealTimeData) => {
    console.log('Real-time data updated:', data);
    setRealTimeData(data);
    setLastUpdateTime(new Date());
  }, []);

  /**
   * 处理错误
   */
  const handleError = useCallback(
    (error: Error) => {
      console.error('Real-time service error:', error);
      dispatch(setError(error.message));
    },
    [dispatch],
  );

  /**
   * 处理网络状态变化
   */
  const handleNetworkStatusChange = useCallback((status: NetworkStatus) => {
    console.log('Network status changed:', status);
    setNetworkStatus(status);
  }, []);

  /**
   * 处理每日重置
   */
  const handleDailyReset = useCallback(
    (date: Date) => {
      console.log('Daily reset triggered at:', date);
      dispatch(setError(null));
      // 重置后立即刷新数据
      supabaseRealtimeService.refresh();
    },
    [dispatch],
  );

  /**
   * 启动服务
   */
  useEffect(() => {
    let mounted = true;

    const startServices = async () => {
      try {
        console.log('Starting Supabase realtime and daily reset services...');

        // 启动 Supabase 实时数据服务
        await supabaseRealtimeService.start();

        // 启动每日重置服务
        await dailyResetService.start();

        if (mounted) {
          setIsServiceRunning(true);
          console.log('Services started successfully');
        }
      } catch (error) {
        console.error('Failed to start services:', error);
        if (mounted) {
          dispatch(setError('启动服务失败，请重试'));
        }
      }
    };

    startServices();

    // 订阅实时数据更新
    const unsubscribeData =
      supabaseRealtimeService.onDataUpdate(handleDataUpdate);

    // 订阅错误
    const unsubscribeError = supabaseRealtimeService.onError(handleError);

    // 订阅网络状态变化
    const unsubscribeNetwork = supabaseRealtimeService.onNetworkStatusChange(
      handleNetworkStatusChange,
    );

    // 订阅每日重置
    const unsubscribeReset = dailyResetService.onReset(handleDailyReset);

    // 清理函数
    return () => {
      mounted = false;

      console.log('Cleaning up Supabase realtime hook...');

      // 取消所有订阅
      unsubscribeData();
      unsubscribeError();
      unsubscribeNetwork();
      unsubscribeReset();

      // 停止服务
      supabaseRealtimeService.stop();
      dailyResetService.stop();

      setIsServiceRunning(false);
    };
  }, [
    handleDataUpdate,
    handleError,
    handleNetworkStatusChange,
    handleDailyReset,
    dispatch,
  ]);

  /**
   * 手动刷新数据
   */
  const refresh = useCallback(async () => {
    try {
      await supabaseRealtimeService.refresh();
    } catch (error) {
      console.error('Failed to refresh data:', error);
      dispatch(setError('刷新数据失败，请重试'));
    }
  }, [dispatch]);

  /**
   * 手动触发重置（用于测试）
   */
  const manualReset = useCallback(async () => {
    try {
      await dailyResetService.manualReset();
    } catch (error) {
      console.error('Failed to trigger manual reset:', error);
      dispatch(setError('重置失败，请重试'));
    }
  }, [dispatch]);

  return {
    realTimeData,
    networkStatus,
    lastUpdateTime,
    isServiceRunning,
    refresh,
    manualReset,
  };
};

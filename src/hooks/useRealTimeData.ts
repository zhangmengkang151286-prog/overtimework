import {useEffect, useState, useCallback} from 'react';
import {useAppDispatch} from './redux';
import {
  setRealTimeData,
  setError,
  resetDailyData,
} from '../store/slices/dataSlice';
import {
  realTimeDataService,
  NetworkStatus,
} from '../services/realTimeDataService';
import {dailyResetService} from '../services/dailyResetService';
import {RealTimeData} from '../types';

/**
 * 实时数据Hook
 * 集成实时数据服务和每日重置服务
 * 需求: 1.4, 2.4, 5.4, 12.1-12.7
 */
export const useRealTimeData = () => {
  const dispatch = useAppDispatch();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isServiceRunning, setIsServiceRunning] = useState(false);

  /**
   * 处理数据更新
   */
  const handleDataUpdate = useCallback(
    (data: RealTimeData) => {
      dispatch(setRealTimeData(data));
      setLastUpdateTime(new Date());
    },
    [dispatch],
  );

  /**
   * 处理错误
   */
  const handleError = useCallback(
    (error: Error) => {
      dispatch(setError(error.message));
    },
    [dispatch],
  );

  /**
   * 处理网络状态变化
   */
  const handleNetworkStatusChange = useCallback((status: NetworkStatus) => {
    setNetworkStatus(status);
  }, []);

  /**
   * 处理每日重置
   */
  const handleDailyReset = useCallback(
    (date: Date) => {
      console.log('Daily reset triggered at:', date);
      dispatch(resetDailyData());
      dispatch(setError(null));
    },
    [dispatch],
  );

  /**
   * 处理历史数据保存
   */
  const handleHistorySave = useCallback((date: Date, data: RealTimeData) => {
    console.log('Historical data saved for:', date);
    // 可以在这里添加额外的处理逻辑
  }, []);

  /**
   * 启动服务
   */
  useEffect(() => {
    let mounted = true;

    const startServices = async () => {
      try {
        // 启动实时数据服务
        await realTimeDataService.start();

        // 启动每日重置服务
        await dailyResetService.start();

        if (mounted) {
          setIsServiceRunning(true);
        }
      } catch (error) {
        console.error('Failed to start services:', error);
      }
    };

    startServices();

    // 订阅实时数据更新
    const unsubscribeData = realTimeDataService.onDataUpdate(handleDataUpdate);

    // 订阅错误
    const unsubscribeError = realTimeDataService.onError(handleError);

    // 订阅网络状态变化
    const unsubscribeNetwork = realTimeDataService.onNetworkStatusChange(
      handleNetworkStatusChange,
    );

    // 订阅每日重置
    const unsubscribeReset = dailyResetService.onReset(handleDailyReset);

    // 订阅历史数据保存
    const unsubscribeHistorySave =
      dailyResetService.onHistorySave(handleHistorySave);

    // 清理函数
    return () => {
      mounted = false;

      // 取消所有订阅
      unsubscribeData();
      unsubscribeError();
      unsubscribeNetwork();
      unsubscribeReset();
      unsubscribeHistorySave();

      // 停止服务
      realTimeDataService.stop();
      dailyResetService.stop();

      setIsServiceRunning(false);
    };
  }, [
    handleDataUpdate,
    handleError,
    handleNetworkStatusChange,
    handleDailyReset,
    handleHistorySave,
  ]);

  /**
   * 手动刷新数据
   */
  const refresh = useCallback(async () => {
    await realTimeDataService.refresh();
  }, []);

  /**
   * 手动触发重置（用于测试）
   */
  const manualReset = useCallback(async () => {
    await dailyResetService.manualReset();
  }, []);

  return {
    networkStatus,
    lastUpdateTime,
    isServiceRunning,
    refresh,
    manualReset,
  };
};

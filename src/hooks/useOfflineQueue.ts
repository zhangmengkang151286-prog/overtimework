import {useState, useEffect} from 'react';
import {offlineQueueService, SyncStatus} from '../services/offlineQueueService';

/**
 * 离线队列 Hook
 * 提供离线队列状态和同步功能
 * 验证需求: 14.6
 */
export const useOfflineQueue = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    totalItems: 0,
    syncedItems: 0,
    failedItems: 0,
  });

  const [queueStatus, setQueueStatus] = useState(
    offlineQueueService.getQueueStatus(),
  );

  useEffect(() => {
    // 监听同步状态变化
    const unsubscribe = offlineQueueService.addSyncListener(status => {
      setSyncStatus(status);
      setQueueStatus(offlineQueueService.getQueueStatus());
    });

    // 定期更新队列状态
    const interval = setInterval(() => {
      setQueueStatus(offlineQueueService.getQueueStatus());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const manualSync = async () => {
    await offlineQueueService.syncQueue();
  };

  const clearQueue = async () => {
    await offlineQueueService.clearQueue();
    setQueueStatus(offlineQueueService.getQueueStatus());
  };

  return {
    syncStatus,
    queueStatus,
    manualSync,
    clearQueue,
  };
};

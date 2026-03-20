import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {storageService} from './storage';
import {supabaseService} from './supabaseService';
import {RealTimeData} from '../types';
import {MemoryCache} from '../utils/performance';

/**
 * 实时数据服务
 * 负责管理3秒间隔的数据刷新、网络监听、错误处理和离线支持
 * 需求: 1.4, 2.4, 5.4
 */

export interface RealTimeDataServiceConfig {
  refreshInterval: number; // 刷新间隔（毫秒）
  retryAttempts: number; // 重试次数
  retryDelay: number; // 重试延迟（毫秒）
  cacheExpiration: number; // 缓存过期时间（毫秒）
}

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

type DataUpdateCallback = (data: RealTimeData) => void;
type ErrorCallback = (error: Error) => void;
type NetworkStatusCallback = (status: NetworkStatus) => void;

class RealTimeDataService {
  private config: RealTimeDataServiceConfig;
  private isRunning: boolean = false;
  private retryCount: number = 0;
  private networkStatus: NetworkStatus = {
    isConnected: true,
    isInternetReachable: null,
    type: null,
  };
  private unsubscribeNetInfo: (() => void) | null = null;
  private unsubscribeRealtime: (() => void) | null = null;

  // 回调函数
  private dataUpdateCallbacks: Set<DataUpdateCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private networkStatusCallbacks: Set<NetworkStatusCallback> = new Set();

  // 最后一次成功获取的数据
  private lastSuccessfulData: RealTimeData | null = null;
  private lastUpdateTime: Date | null = null;

  // 内存缓存
  private memoryCache: MemoryCache<string, RealTimeData>;

  constructor(config?: Partial<RealTimeDataServiceConfig>) {
    this.config = {
      refreshInterval: 15000, // 15秒
      retryAttempts: 3,
      retryDelay: 2000, // 2秒
      cacheExpiration: 5 * 60 * 1000, // 5分钟
      ...config,
    };
    this.memoryCache = new MemoryCache<string, RealTimeData>(
      50,
      this.config.cacheExpiration,
    );
  }

  /**
   * 启动实时数据服务
   * 不再自动轮询，由 TrendPage 的 30 秒轮询统一管理
   * 仅负责网络监听、缓存和手动刷新
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // 启动网络监听
    this.startNetworkMonitoring();

    // 立即获取一次数据
    await this.fetchData();
  }

  /**
   * 停止实时数据服务
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // 停止网络监听
    this.stopNetworkMonitoring();

    // 清理内存缓存
    this.memoryCache.clear();
  }

  /**
   * 从 PostgREST API 获取数据
   */
  private async fetchData(): Promise<void> {
    if (!this.networkStatus.isConnected) {
      await this.loadCachedData();
      return;
    }

    try {
      const [stats, topTags, dailyStatus] = await Promise.all([
        supabaseService.getRealTimeStats(),
        supabaseService.getTopTags(20),
        supabaseService.getDailyStatus(7),
      ]);

      const validTags = topTags.filter((tag: any) => tag.totalCount > 0).slice(0, 20);
      const tagDistribution = validTags.map((tag: any) => ({
        tagId: tag.tagId,
        tagName: tag.tagName,
        count: tag.totalCount,
        isOvertime: tag.overtimeCount > tag.onTimeCount,
        color: '',
      }));

      const data: RealTimeData = {
        timestamp: new Date(),
        participantCount: stats.participantCount,
        overtimeCount: stats.overtimeCount,
        onTimeCount: stats.onTimeCount,
        tagDistribution,
        dailyStatus,
      };

      // 保存到缓存
      this.cacheData(data);

      // 更新最后成功数据
      this.lastSuccessfulData = data;
      this.lastUpdateTime = new Date();

      // 重置重试计数
      this.retryCount = 0;

      // 通知所有订阅者
      this.notifyDataUpdate(data);
    } catch (error) {
      console.error('获取实时数据失败:', error);
      await this.handleFetchError(error as Error);
    }
  }

  /**
   * 处理获取数据错误
   */
  private async handleFetchError(error: Error): Promise<void> {
    this.retryCount++;

    // 通知错误回调
    this.notifyError(error);

    // 如果还有重试次数，延迟后重试
    if (this.retryCount <= this.config.retryAttempts) {
      setTimeout(() => {
        if (this.isRunning) {
          this.fetchData();
        }
      }, this.config.retryDelay);
    } else {
      // 重试次数用尽，使用缓存数据
      await this.loadCachedData();
      // 重置重试计数，下次刷新周期重新开始
      this.retryCount = 0;
    }
  }

  /**
   * 缓存数据
   */
  private async cacheData(data: RealTimeData): Promise<void> {
    try {
      await storageService.saveCachedData(data);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * 加载缓存数据
   */
  private async loadCachedData(): Promise<void> {
    try {
      const cached = await storageService.getCachedData();
      if (cached) {
        const isExpired = await storageService.isCacheExpired();

        // 转换缓存数据
        const cachedData: RealTimeData = {
          ...cached.data,
          timestamp: new Date(cached.data.timestamp),
          dailyStatus: cached.data.dailyStatus, // dailyStatus.date is already a string
        };

        if (!isExpired) {
          this.notifyDataUpdate(cachedData);
        } else {
          // 即使过期，也可以使用，但要通知用户数据可能不是最新的
          this.notifyDataUpdate(cachedData);
          this.notifyError(new Error('数据可能不是最新的，请检查网络连接'));
        }
      } else {
        this.notifyError(new Error('无法获取数据，请检查网络连接'));
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
      this.notifyError(error as Error);
    }
  }

  /**
   * 启动网络监听
   */
  private startNetworkMonitoring(): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener(
      (state: NetInfoState) => {
        const newStatus: NetworkStatus = {
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        };

        const wasConnected = this.networkStatus.isConnected;
        this.networkStatus = newStatus;

        // 通知网络状态变化
        this.notifyNetworkStatusChange(newStatus);

        // 如果从断网恢复到联网，立即尝试获取数据
        if (!wasConnected && newStatus.isConnected) {
          this.retryCount = 0;
          this.fetchData();
        }
      },
    );
  }

  /**
   * 停止网络监听
   */
  private stopNetworkMonitoring(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  /**
   * 订阅数据更新
   */
  onDataUpdate(callback: DataUpdateCallback): () => void {
    this.dataUpdateCallbacks.add(callback);

    // 如果有最后一次成功的数据，立即调用回调
    if (this.lastSuccessfulData) {
      callback(this.lastSuccessfulData);
    }

    // 返回取消订阅函数
    return () => {
      this.dataUpdateCallbacks.delete(callback);
    };
  }

  /**
   * 订阅错误
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * 订阅网络状态变化
   */
  onNetworkStatusChange(callback: NetworkStatusCallback): () => void {
    this.networkStatusCallbacks.add(callback);

    // 立即调用一次回调，传递当前状态
    callback(this.networkStatus);

    return () => {
      this.networkStatusCallbacks.delete(callback);
    };
  }

  /**
   * 通知数据更新
   */
  private notifyDataUpdate(data: RealTimeData): void {
    this.dataUpdateCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data update callback:', error);
      }
    });
  }

  /**
   * 通知错误
   */
  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }

  /**
   * 通知网络状态变化
   */
  private notifyNetworkStatusChange(status: NetworkStatus): void {
    this.networkStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in network status callback:', error);
      }
    });
  }

  /**
   * 手动刷新数据
   */
  async refresh(): Promise<void> {
    this.retryCount = 0;
    await this.fetchData();
  }

  /**
   * 获取当前网络状态
   */
  getNetworkStatus(): NetworkStatus {
    return {...this.networkStatus};
  }

  /**
   * 获取最后更新时间
   */
  getLastUpdateTime(): Date | null {
    return this.lastUpdateTime;
  }

  /**
   * 检查服务是否正在运行
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }
}

// 导出单例实例
export const realTimeDataService = new RealTimeDataService();

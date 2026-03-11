import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {supabaseService} from './supabaseService';
import {storageService} from './storage';
import {RealTimeStats, TagStats, DailyStatus, TagDistribution} from '../types';

/**
 * Supabase 实时数据服务
 * 使用 Supabase Realtime 订阅实现实时数据更新
 * 需求: 14.3
 */

export interface RealtimeServiceConfig {
  cacheExpiration: number; // 缓存过期时间（毫秒）
  reconnectDelay: number; // 重连延迟（毫秒）
}

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export interface SupabaseRealTimeData {
  stats: RealTimeStats;
  topTags: TagStats[];
  dailyStatus: DailyStatus[];
  timestamp: Date;
}

type DataUpdateCallback = (data: SupabaseRealTimeData) => void;
type ErrorCallback = (error: Error) => void;
type NetworkStatusCallback = (status: NetworkStatus) => void;

class SupabaseRealtimeService {
  private config: RealtimeServiceConfig;
  private isRunning: boolean = false;
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
  private lastSuccessfulData: SupabaseRealTimeData | null = null;
  private lastUpdateTime: Date | null = null;

  // 重连定时器
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<RealtimeServiceConfig>) {
    this.config = {
      cacheExpiration: 5 * 60 * 1000, // 5分钟
      reconnectDelay: 5000, // 5秒
      ...config,
    };
  }

  /**
   * 启动实时数据订阅服务
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Supabase realtime service is already running');
      return;
    }

    console.log('Starting Supabase realtime service...');
    this.isRunning = true;

    // 启动网络监听
    this.startNetworkMonitoring();

    // 立即获取一次数据
    await this.fetchInitialData();

    // 启动实时订阅
    this.startRealtimeSubscription();
  }

  /**
   * 停止实时数据订阅服务
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping Supabase realtime service...');
    this.isRunning = false;

    // 停止实时订阅
    this.stopRealtimeSubscription();

    // 停止网络监听
    this.stopNetworkMonitoring();

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 获取初始数据
   */
  private async fetchInitialData(): Promise<void> {
    if (!this.networkStatus.isConnected) {
      console.log('No network connection, loading cached data');
      await this.loadCachedData();
      return;
    }

    try {
      console.log('Fetching initial real-time data from Supabase...');

      // 并行获取所有数据
      const [stats, topTags, dailyStatus] = await Promise.all([
        supabaseService.getRealTimeStats(),
        supabaseService.getTopTags(10),
        supabaseService.getDailyStatus(7),
      ]);

      const realTimeData: SupabaseRealTimeData = {
        stats,
        topTags,
        dailyStatus,
        timestamp: new Date(),
      };

      // 保存到缓存
      await this.cacheData(realTimeData);

      // 更新最后成功数据
      this.lastSuccessfulData = realTimeData;
      this.lastUpdateTime = new Date();

      // 通知所有订阅者
      this.notifyDataUpdate(realTimeData);

      console.log('Initial data fetched successfully');
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      await this.handleFetchError(error as Error);
    }
  }

  /**
   * 启动实时订阅
   */
  private startRealtimeSubscription(): void {
    console.log('Starting Supabase Realtime subscription...');

    // 订阅实时统计数据变化
    this.unsubscribeRealtime = supabaseService.subscribeToRealTimeStats(
      async stats => {
        try {
          console.log('Received real-time stats update:', stats);

          // 获取最新的 Top Tags 和每日状态
          const [topTags, dailyStatus] = await Promise.all([
            supabaseService.getTopTags(10),
            supabaseService.getDailyStatus(7),
          ]);

          const realTimeData: SupabaseRealTimeData = {
            stats,
            topTags,
            dailyStatus,
            timestamp: new Date(),
          };

          // 保存到缓存
          await this.cacheData(realTimeData);

          // 更新最后成功数据
          this.lastSuccessfulData = realTimeData;
          this.lastUpdateTime = new Date();

          // 通知所有订阅者
          this.notifyDataUpdate(realTimeData);
        } catch (error) {
          console.error('Error processing real-time update:', error);
          this.notifyError(error as Error);
        }
      },
    );

    console.log('Realtime subscription started');
  }

  /**
   * 停止实时订阅
   */
  private stopRealtimeSubscription(): void {
    if (this.unsubscribeRealtime) {
      console.log('Stopping Supabase Realtime subscription...');
      this.unsubscribeRealtime();
      this.unsubscribeRealtime = null;
    }
  }

  /**
   * 处理获取数据错误
   */
  private async handleFetchError(error: Error): Promise<void> {
    console.error('Fetch error:', error);

    // 通知错误回调
    this.notifyError(error);

    // 尝试加载缓存数据
    await this.loadCachedData();

    // 如果服务仍在运行且有网络，安排重连
    if (this.isRunning && this.networkStatus.isConnected) {
      this.scheduleReconnect();
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // 已经有重连计划
    }

    console.log(`Scheduling reconnect in ${this.config.reconnectDelay}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.isRunning) {
        console.log('Attempting to reconnect...');
        this.stopRealtimeSubscription();
        this.fetchInitialData().then(() => {
          this.startRealtimeSubscription();
        });
      }
    }, this.config.reconnectDelay);
  }

  /**
   * 缓存数据
   */
  private async cacheData(data: SupabaseRealTimeData): Promise<void> {
    try {
      // 转换为可序列化的格式（兼容旧的 RealTimeData 格式）
      const cacheData = {
        timestamp: data.timestamp,
        participantCount: data.stats.participantCount,
        overtimeCount: data.stats.overtimeCount,
        onTimeCount: data.stats.onTimeCount,
        tagDistribution: data.topTags.map(tag => ({
          tagId: tag.tagId,
          tagName: tag.tagName,
          count: tag.totalCount,
          isOvertime: tag.overtimeCount > tag.onTimeCount,
          color: '#007AFF', // 默认颜色
        })),
        dailyStatus: data.dailyStatus.map(status => ({
          date: status.date,
          isOvertimeDominant: status.isOvertimeDominant,
          participantCount: status.participantCount,
          overtimeCount: status.overtimeCount,
          onTimeCount: status.onTimeCount,
        })),
      };

      await storageService.saveCachedData(cacheData);
      console.log('Data cached successfully');
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

        // 转换缓存数据为 SupabaseRealTimeData 格式
        const cachedData: SupabaseRealTimeData = {
          stats: {
            participantCount: cached.data.participantCount,
            overtimeCount: cached.data.overtimeCount,
            onTimeCount: cached.data.onTimeCount,
            lastUpdated: new Date(cached.data.timestamp),
          },
          topTags: cached.data.tagDistribution.map((tag: any) => ({
            tagId: tag.tagId,
            tagName: tag.tagName,
            overtimeCount: tag.isOvertime ? tag.count : 0,
            onTimeCount: tag.isOvertime ? 0 : tag.count,
            totalCount: tag.count,
          })),
          dailyStatus: cached.data.dailyStatus.map((status: any) => ({
            date: new Date(status.date),
            isOvertimeDominant: status.isOvertimeDominant,
            participantCount: status.participantCount,
            overtimeCount: status.overtimeCount,
            onTimeCount: status.onTimeCount,
          })),
          timestamp: new Date(cached.data.timestamp),
        };

        if (!isExpired) {
          console.log('Using valid cached data');
          this.notifyDataUpdate(cachedData);
        } else {
          console.log('Cached data is expired');
          // 即使过期，也可以使用，但要通知用户数据可能不是最新的
          this.notifyDataUpdate(cachedData);
          this.notifyError(new Error('数据可能不是最新的，请检查网络连接'));
        }
      } else {
        console.log('No cached data available');
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

        console.log('Network status changed:', newStatus);

        // 通知网络状态变化
        this.notifyNetworkStatusChange(newStatus);

        // 如果从断网恢复到联网，重新启动订阅
        if (!wasConnected && newStatus.isConnected) {
          console.log('Network reconnected, restarting subscription...');
          this.stopRealtimeSubscription();
          this.fetchInitialData().then(() => {
            this.startRealtimeSubscription();
          });
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
  private notifyDataUpdate(data: SupabaseRealTimeData): void {
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
    await this.fetchInitialData();
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
export const supabaseRealtimeService = new SupabaseRealtimeService();

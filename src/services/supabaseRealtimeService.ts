/**
 * 实时数据服务（已迁移到轮询方式）
 * 原 supabaseRealtimeService.ts 的替代版本
 */

import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {dataService} from './dataService';
import {storageService} from './storage';
import {RealTimeStats, TagStats, DailyStatus, TagDistribution} from '../types';

// 轮询间隔（毫秒）
const POLL_INTERVAL = 5000; // 5 秒

// 缓存键
const CACHE_KEY_REALTIME = 'realtime_data_cache';
const CACHE_KEY_TIMESTAMP = 'realtime_data_timestamp';
const CACHE_EXPIRY = 60000; // 缓存有效期 60 秒

/**
 * 实时数据服务类
 */
class RealtimeService {
  private pollInterval: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private callbacks: Set<(data: any) => void> = new Set();
  private lastData: any = null;
  private isOnline: boolean = true;

  constructor() {
    // 监听网络状态
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true;

      // 从离线恢复到在线时，立即轮询一次
      if (!wasOnline && this.isOnline && this.isPolling) {
        this.pollOnce();
      }
    });
  }

  /**
   * 开始轮询实时数据
   */
  startPolling(callback: (data: any) => void): () => void {
    // 添加回调
    this.callbacks.add(callback);

    // 如果还没有开始轮询，启动轮询
    if (!this.isPolling) {
      this.isPolling = true;

      // 立即执行一次
      this.pollOnce();

      // 启动定时轮询
      this.pollInterval = setInterval(() => {
        this.pollOnce();
      }, POLL_INTERVAL);
    } else {
      // 如果已经在轮询，立即返回最后的数据
      if (this.lastData) {
        callback(this.lastData);
      }
    }

    // 返回取消订阅函数
    return () => {
      this.callbacks.delete(callback);

      // 如果没有回调了，停止轮询
      if (this.callbacks.size === 0) {
        this.stopPolling();
      }
    };
  }

  /**
   * 停止轮询
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    this.callbacks.clear();
  }

  /**
   * 执行一次轮询
   */
  private async pollOnce(): Promise<void> {
    // 如果离线，尝试从缓存加载
    if (!this.isOnline) {
      await this.loadFromCache();
      return;
    }

    try {
      // 获取实时统计数据
      const stats = await dataService.getRealTimeStats();

      // 获取 Top 标签
      const topTags = await dataService.getTopTags(10);

      // 获取每日状态
      const dailyStatus = await dataService.getDailyStatus(7);

      // 构建完整数据
      const data = {
        realTimeStats: stats,
        topTags,
        dailyStatus,
        lastUpdated: new Date(),
      };

      // 保存到缓存
      await this.saveToCache(data);

      // 更新最后的数据
      this.lastData = data;

      // 通知所有回调
      this.callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in realtime callback:', error);
        }
      });
    } catch (error) {
      console.error('Realtime poll error:', error);

      // 如果请求失败，尝试从缓存加载
      await this.loadFromCache();
    }
  }

  /**
   * 保存到缓存
   */
  private async saveToCache(data: any): Promise<void> {
    try {
      await storageService.setItem(CACHE_KEY_REALTIME, JSON.stringify(data));
      await storageService.setItem(
        CACHE_KEY_TIMESTAMP,
        Date.now().toString(),
      );
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }

  /**
   * 从缓存加载
   */
  private async loadFromCache(): Promise<void> {
    try {
      const cachedData = await storageService.getItem(CACHE_KEY_REALTIME);
      const cachedTimestamp = await storageService.getItem(
        CACHE_KEY_TIMESTAMP,
      );

      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const age = Date.now() - timestamp;

        // 如果缓存未过期
        if (age < CACHE_EXPIRY) {
          const data = JSON.parse(cachedData);
          this.lastData = data;

          // 通知所有回调
          this.callbacks.forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.error('Error in realtime callback:', error);
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load from cache:', error);
    }
  }

  /**
   * 手动刷新数据
   */
  async refresh(): Promise<void> {
    await this.pollOnce();
  }

  /**
   * 获取最后的数据
   */
  getLastData(): any {
    return this.lastData;
  }
}

// 导出单例
export const realtimeService = new RealtimeService();

// 导出兼容的函数（保持与原 API 一致）
export const startRealtimeSubscription = (
  callback: (data: any) => void,
): (() => void) => {
  return realtimeService.startPolling(callback);
};

export const stopRealtimeSubscription = (): void => {
  realtimeService.stopPolling();
};

export const refreshRealtimeData = async (): Promise<void> => {
  await realtimeService.refresh();
};

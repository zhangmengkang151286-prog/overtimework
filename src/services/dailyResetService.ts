import {apiClient} from './api';
import {storageService} from './storage';
import {RealTimeData} from '../types';

/**
 * 每日数据重置服务
 * 负责在00:00时重置所有当日统计数据并保存历史记录
 * 需求: 12.1-12.7
 */

export interface DailyResetConfig {
  checkInterval: number; // 检查间隔（毫秒）
  resetHour: number; // 重置时刻（小时）
  resetMinute: number; // 重置时刻（分钟）
}

type ResetCallback = (date: Date) => void;
type HistorySaveCallback = (date: Date, data: RealTimeData) => void;

class DailyResetService {
  private config: DailyResetConfig;
  private checkTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastResetDate: Date | null = null;

  // 回调函数
  private resetCallbacks: Set<ResetCallback> = new Set();
  private historySaveCallbacks: Set<HistorySaveCallback> = new Set();

  constructor(config?: Partial<DailyResetConfig>) {
    this.config = {
      checkInterval: 60000, // 每分钟检查一次
      resetHour: 6, // 06:00 - 工作日开始时间
      resetMinute: 0,
      ...config,
    };
  }

  /**
   * 启动每日重置服务
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Daily reset service is already running');
      return;
    }

    console.log('Starting daily reset service...');
    this.isRunning = true;

    // 加载上次重置日期
    await this.loadLastResetDate();

    // 检查是否需要立即重置（应用启动时可能已经过了重置时间）
    await this.checkAndReset();

    // 启动定时检查
    this.startCheckTimer();
  }

  /**
   * 停止每日重置服务
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping daily reset service...');
    this.isRunning = false;

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * 启动定时检查
   */
  private startCheckTimer(): void {
    this.checkTimer = setInterval(() => {
      if (this.isRunning) {
        this.checkAndReset();
      }
    }, this.config.checkInterval);
  }

  /**
   * 检查并执行重置
   */
  private async checkAndReset(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDate = this.getDateString(now);

    // 检查是否到达重置时间
    const isResetTime =
      currentHour === this.config.resetHour &&
      currentMinute === this.config.resetMinute;

    // 检查今天是否已经重置过
    const lastResetDateStr = this.lastResetDate
      ? this.getDateString(this.lastResetDate)
      : null;
    const alreadyResetToday = lastResetDateStr === currentDate;

    if (isResetTime && !alreadyResetToday) {
      console.log('Reset time reached, performing daily reset...');
      await this.performReset(now);
    }
  }

  /**
   * 执行重置操作
   */
  private async performReset(resetTime: Date): Promise<void> {
    try {
      // 1. 获取前一日的完整数据
      const yesterday = new Date(resetTime);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayData = await this.getYesterdayData();

      // 2. 保存历史数据
      if (yesterdayData) {
        await this.saveHistoricalData(yesterday, yesterdayData);
        console.log(
          'Historical data saved for:',
          this.getDateString(yesterday),
        );

        // 通知历史数据保存回调
        this.notifyHistorySave(yesterday, yesterdayData);
      }

      // 3. 清空本地缓存的实时数据
      await this.clearLocalData();

      // 4. 更新最后重置日期
      this.lastResetDate = resetTime;
      await this.saveLastResetDate(resetTime);

      // 5. 通知重置回调
      this.notifyReset(resetTime);

      console.log('Daily reset completed successfully');
    } catch (error) {
      console.error('Failed to perform daily reset:', error);
      // 即使失败，也更新重置日期，避免重复尝试
      this.lastResetDate = resetTime;
      await this.saveLastResetDate(resetTime);
    }
  }

  /**
   * 获取前一日的数据
   */
  private async getYesterdayData(): Promise<RealTimeData | null> {
    try {
      // 尝试从缓存获取
      const cached = await storageService.getCachedData();
      if (cached) {
        return {
          ...cached.data,
          timestamp: new Date(cached.data.timestamp),
          dailyStatus: cached.data.dailyStatus, // dailyStatus.date is already a string
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get yesterday data:', error);
      return null;
    }
  }

  /**
   * 保存历史数据
   */
  private async saveHistoricalData(
    date: Date,
    data: RealTimeData,
  ): Promise<void> {
    try {
      const dateStr = this.getDateString(date);
      const storageKey = `@OvertimeIndexApp:history:${dateStr}`;

      // 保存到本地存储
      await storageService.setItem(storageKey, {
        date: dateStr,
        data: {
          ...data,
          timestamp: data.timestamp.toISOString(),
          dailyStatus: data.dailyStatus, // dailyStatus.date is already a string
        },
      });

      console.log('Historical data saved to local storage');

      // 可选：同步到服务器
      // await this.syncHistoricalDataToServer(date, data);
    } catch (error) {
      console.error('Failed to save historical data:', error);
      throw error;
    }
  }

  /**
   * 清空本地数据
   */
  private async clearLocalData(): Promise<void> {
    try {
      // 清空缓存的实时数据
      await storageService.removeItem('@OvertimeIndexApp:cachedData');
      await storageService.removeItem('@OvertimeIndexApp:lastUpdate');

      console.log('Local data cleared');
    } catch (error) {
      console.error('Failed to clear local data:', error);
      throw error;
    }
  }

  /**
   * 加载上次重置日期
   */
  private async loadLastResetDate(): Promise<void> {
    try {
      const dateStr = await storageService.getItem<string>(
        '@OvertimeIndexApp:lastResetDate',
      );
      if (dateStr) {
        this.lastResetDate = new Date(dateStr);
        console.log('Last reset date loaded:', this.lastResetDate);
      }
    } catch (error) {
      console.error('Failed to load last reset date:', error);
    }
  }

  /**
   * 保存最后重置日期
   */
  private async saveLastResetDate(date: Date): Promise<void> {
    try {
      await storageService.setItem(
        '@OvertimeIndexApp:lastResetDate',
        date.toISOString(),
      );
    } catch (error) {
      console.error('Failed to save last reset date:', error);
    }
  }

  /**
   * 获取日期字符串 (YYYY-MM-DD)
   */
  private getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 订阅重置事件
   */
  onReset(callback: ResetCallback): () => void {
    this.resetCallbacks.add(callback);
    return () => {
      this.resetCallbacks.delete(callback);
    };
  }

  /**
   * 订阅历史数据保存事件
   */
  onHistorySave(callback: HistorySaveCallback): () => void {
    this.historySaveCallbacks.add(callback);
    return () => {
      this.historySaveCallbacks.delete(callback);
    };
  }

  /**
   * 通知重置回调
   */
  private notifyReset(date: Date): void {
    this.resetCallbacks.forEach(callback => {
      try {
        callback(date);
      } catch (error) {
        console.error('Error in reset callback:', error);
      }
    });
  }

  /**
   * 通知历史数据保存回调
   */
  private notifyHistorySave(date: Date, data: RealTimeData): void {
    this.historySaveCallbacks.forEach(callback => {
      try {
        callback(date, data);
      } catch (error) {
        console.error('Error in history save callback:', error);
      }
    });
  }

  /**
   * 手动触发重置（用于测试）
   */
  async manualReset(): Promise<void> {
    const now = new Date();
    await this.performReset(now);
  }

  /**
   * 获取上次重置日期
   */
  getLastResetDate(): Date | null {
    return this.lastResetDate;
  }

  /**
   * 获取历史数据
   */
  async getHistoricalData(date: Date): Promise<RealTimeData | null> {
    try {
      const dateStr = this.getDateString(date);
      const storageKey = `@OvertimeIndexApp:history:${dateStr}`;

      const stored = await storageService.getItem<{
        date: string;
        data: any;
      }>(storageKey);

      if (stored) {
        return {
          ...stored.data,
          timestamp: new Date(stored.data.timestamp),
          dailyStatus: stored.data.dailyStatus, // dailyStatus.date is already a string
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get historical data:', error);
      return null;
    }
  }

  /**
   * 检查服务是否正在运行
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }
}

// 导出单例实例
export const dailyResetService = new DailyResetService();

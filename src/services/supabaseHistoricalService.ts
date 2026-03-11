import {supabaseService} from './supabaseService';
import {storageService} from './storage';
import {DailyStatus, TagStats} from '../types';

/**
 * Supabase 历史数据服务
 * 负责查询和缓存历史数据
 * 需求: 14.5
 */

export interface HistoricalData {
  date: string;
  stats: DailyStatus;
  tagDistribution: TagStats[];
  isAvailable: boolean;
}

export interface HistoricalDataCache {
  [date: string]: HistoricalData;
}

class SupabaseHistoricalService {
  private cache: HistoricalDataCache = {};
  private cacheExpiration: number = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 获取指定日期的历史数据
   * 注意：只查询按天存储的历史数据，不支持具体时间点
   */
  async getHistoricalData(date: Date): Promise<HistoricalData> {
    const dateStr = this.formatDate(date);
    const today = this.formatDate(new Date());

    // 如果查询的是今天，返回不可用（应该使用实时数据）
    if (dateStr === today) {
      console.log(`Date ${dateStr} is today, historical data not available`);
      return {
        date: dateStr,
        stats: {
          date: date,
          isOvertimeDominant: false,
          participantCount: 0,
          overtimeCount: 0,
          onTimeCount: 0,
        },
        tagDistribution: [],
        isAvailable: false,
      };
    }

    // 检查缓存
    if (this.cache[dateStr]) {
      console.log(`Using cached historical data for ${dateStr}`);
      return this.cache[dateStr];
    }

    try {
      console.log(`Fetching historical data for ${dateStr}...`);

      // 并行获取统计数据和标签分布
      const [stats, tagDistribution] = await Promise.all([
        supabaseService.getHistoricalDataByDate(dateStr),
        supabaseService.getHistoricalTagDistribution(dateStr),
      ]);

      const historicalData: HistoricalData = {
        date: dateStr,
        stats: stats || {
          date: date,
          isOvertimeDominant: false,
          participantCount: 0,
          overtimeCount: 0,
          onTimeCount: 0,
        },
        tagDistribution: tagDistribution || [],
        isAvailable: stats !== null,
      };

      // 保存到缓存
      this.cache[dateStr] = historicalData;

      // 保存到本地存储
      await this.saveToLocalStorage(dateStr, historicalData);

      console.log(
        `Historical data fetched for ${dateStr}, available: ${historicalData.isAvailable}`,
      );

      return historicalData;
    } catch (error) {
      console.error(`Failed to fetch historical data for ${dateStr}:`, error);

      // 尝试从本地存储加载
      const cached = await this.loadFromLocalStorage(dateStr);
      if (cached) {
        console.log(`Using local storage data for ${dateStr}`);
        this.cache[dateStr] = cached;
        return cached;
      }

      // 返回空数据
      return {
        date: dateStr,
        stats: {
          date: date,
          isOvertimeDominant: false,
          participantCount: 0,
          overtimeCount: 0,
          onTimeCount: 0,
        },
        tagDistribution: [],
        isAvailable: false,
      };
    }
  }

  /**
   * 获取日期范围内的历史数据
   */
  async getHistoricalDataRange(
    startDate: Date,
    endDate: Date,
  ): Promise<HistoricalData[]> {
    const startDateStr = this.formatDate(startDate);
    const endDateStr = this.formatDate(endDate);

    try {
      console.log(
        `Fetching historical data range: ${startDateStr} to ${endDateStr}`,
      );

      const dailyStats = await supabaseService.getHistoricalDataRange(
        startDateStr,
        endDateStr,
      );

      // 为每个日期获取标签分布
      const results = await Promise.all(
        dailyStats.map(async stats => {
          const dateStr = this.formatDate(stats.date);
          const tagDistribution =
            await supabaseService.getHistoricalTagDistribution(dateStr);

          const historicalData: HistoricalData = {
            date: dateStr,
            stats,
            tagDistribution: tagDistribution || [],
            isAvailable: true,
          };

          // 保存到缓存
          this.cache[dateStr] = historicalData;

          return historicalData;
        }),
      );

      return results;
    } catch (error) {
      console.error('Failed to fetch historical data range:', error);
      throw error;
    }
  }

  /**
   * 预加载附近日期的数据
   */
  async prefetchNearbyDates(
    centerDate: Date,
    daysBefore: number = 3,
    daysAfter: number = 3,
  ): Promise<void> {
    const dates: Date[] = [];

    // 生成日期列表
    for (let i = -daysBefore; i <= daysAfter; i++) {
      if (i === 0) continue; // 跳过中心日期
      const date = new Date(centerDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    // 过滤掉已缓存的日期
    const uncachedDates = dates.filter(
      date => !this.cache[this.formatDate(date)],
    );

    if (uncachedDates.length === 0) {
      console.log('All nearby dates are already cached');
      return;
    }

    console.log(`Prefetching ${uncachedDates.length} nearby dates...`);

    // 批量获取
    try {
      await Promise.all(
        uncachedDates.map(date => this.getHistoricalData(date)),
      );
      console.log('Prefetch completed');
    } catch (error) {
      console.error('Failed to prefetch nearby dates:', error);
    }
  }

  /**
   * 保存到本地存储
   */
  private async saveToLocalStorage(
    date: string,
    data: HistoricalData,
  ): Promise<void> {
    try {
      const key = `historical_${date}`;
      await storageService.setItem(key, {
        data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save historical data to local storage:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  private async loadFromLocalStorage(
    date: string,
  ): Promise<HistoricalData | null> {
    try {
      const key = `historical_${date}`;
      const cached: any = await storageService.getItem(key);

      if (!cached) {
        return null;
      }

      // 检查是否过期
      const age = Date.now() - cached.timestamp;
      if (age > this.cacheExpiration) {
        console.log(`Local storage data for ${date} is expired`);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error(
        'Failed to load historical data from local storage:',
        error,
      );
      return null;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = {};
    console.log('Historical data cache cleared');
  }

  /**
   * 清除指定日期的缓存
   */
  clearCacheForDate(date: Date): void {
    const dateStr = this.formatDate(date);
    delete this.cache[dateStr];
    console.log(`Cache cleared for ${dateStr}`);
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }
}

// 导出单例
export const supabaseHistoricalService = new SupabaseHistoricalService();

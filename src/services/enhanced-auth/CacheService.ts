/**
 * 缓存服务
 *
 * 提供内存缓存和持久化缓存功能,优化数据访问性能
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheOptions {
  ttl?: number; // 缓存有效期(毫秒)
  persistent?: boolean; // 是否持久化到AsyncStorage
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, CacheEntry<any>>;
  private readonly CACHE_PREFIX = '@enhanced_auth_cache:';

  private constructor() {
    this.memoryCache = new Map();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param options 缓存选项
   */
  public async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl,
    };

    // 存储到内存缓存
    this.memoryCache.set(key, entry);

    // 如果需要持久化
    if (options.persistent) {
      try {
        await AsyncStorage.setItem(
          this.CACHE_PREFIX + key,
          JSON.stringify(entry),
        );
      } catch (error) {
        console.error('持久化缓存失败:', error);
      }
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  public async get<T>(key: string): Promise<T | null> {
    // 先从内存缓存获取
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data as T;
    }

    // 如果内存缓存不存在或已过期,尝试从持久化缓存获取
    try {
      const persistentData = await AsyncStorage.getItem(
        this.CACHE_PREFIX + key,
      );
      if (persistentData) {
        const entry: CacheEntry<T> = JSON.parse(persistentData);

        if (this.isValid(entry)) {
          // 恢复到内存缓存
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          // 过期了,删除持久化缓存
          await this.remove(key);
        }
      }
    } catch (error) {
      console.error('读取持久化缓存失败:', error);
    }

    return null;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  public async remove(key: string): Promise<void> {
    // 从内存缓存删除
    this.memoryCache.delete(key);

    // 从持久化缓存删除
    try {
      await AsyncStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      console.error('删除持久化缓存失败:', error);
    }
  }

  /**
   * 清空所有缓存
   */
  public async clear(): Promise<void> {
    // 清空内存缓存
    this.memoryCache.clear();

    // 清空持久化缓存
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('清空持久化缓存失败:', error);
    }
  }

  /**
   * 检查缓存是否存在且有效
   * @param key 缓存键
   * @returns 是否存在且有效
   */
  public async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * 获取或设置缓存(如果不存在则执行fetcher获取数据)
   * @param key 缓存键
   * @param fetcher 数据获取函数
   * @param options 缓存选项
   * @returns 缓存数据
   */
  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    // 先尝试获取缓存
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 缓存不存在,执行fetcher获取数据
    const data = await fetcher();

    // 存储到缓存
    await this.set(key, data, options);

    return data;
  }

  /**
   * 检查缓存条目是否有效
   * @param entry 缓存条目
   * @returns 是否有效
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) {
      return true; // 没有设置TTL,永久有效
    }

    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * 清理过期的内存缓存
   */
  public cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.memoryCache.forEach((entry, key) => {
      if (entry.ttl && now - entry.timestamp >= entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计
   */
  public getStats(): {
    memorySize: number;
    keys: string[];
  } {
    return {
      memorySize: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
    };
  }
}

// 导出单例实例
export const cacheService = CacheService.getInstance();

// 定期清理过期缓存(每5分钟)
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      cacheService.cleanupExpired();
    },
    5 * 60 * 1000,
  );
}

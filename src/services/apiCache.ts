/**
 * API 缓存服务（Stale-While-Revalidate 策略）
 *
 * 打开页面时先从 AsyncStorage 读取缓存数据秒显示，
 * 同时后台静默请求最新数据，成功后更新界面和缓存。
 * 网络失败时用户无感知，继续展示缓存数据。
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 缓存键前缀
const CACHE_PREFIX = '@OvertimeIndexApp:apiCache:';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * 读取缓存
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * 写入缓存
 */
export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = {data, timestamp: Date.now()};
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // 缓存写入失败不影响主流程
  }
}

/**
 * 生成缓存键（基于函数名和参数）
 */
export function cacheKey(name: string, ...args: (string | number)[]): string {
  return `${name}:${args.join(':')}`;
}

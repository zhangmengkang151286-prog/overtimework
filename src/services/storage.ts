import AsyncStorage from '@react-native-async-storage/async-storage';
import {User, UserStatus, RealTimeData} from '../types';

// 存储键常量
const STORAGE_KEYS = {
  USER: '@OvertimeIndexApp:user',
  USER_STATUS: '@OvertimeIndexApp:userStatus',
  THEME: '@OvertimeIndexApp:theme',
  CACHED_DATA: '@OvertimeIndexApp:cachedData',
  LAST_UPDATE: '@OvertimeIndexApp:lastUpdate',
} as const;

// 通用存储操作
class StorageService {
  // 存储数据
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      throw error;
    }
  }

  // 获取数据
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      return null;
    }
  }

  // 删除数据
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      throw error;
    }
  }

  // 清空所有数据
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // 用户相关存储
  async saveUser(user: User): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER, user);
  }

  async getUser(): Promise<User | null> {
    return await this.getItem<User>(STORAGE_KEYS.USER);
  }

  async removeUser(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER);
  }

  // 用户状态存储
  async saveUserStatus(status: UserStatus): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_STATUS, status);
  }

  async getUserStatus(): Promise<UserStatus | null> {
    return await this.getItem<UserStatus>(STORAGE_KEYS.USER_STATUS);
  }

  // 主题设置存储
  async saveTheme(theme: 'light' | 'dark'): Promise<void> {
    await this.setItem(STORAGE_KEYS.THEME, theme);
  }

  async getTheme(): Promise<'light' | 'dark' | null> {
    return await this.getItem<'light' | 'dark'>(STORAGE_KEYS.THEME);
  }

  // 缓存数据存储
  async saveCachedData(data: RealTimeData): Promise<void> {
    await this.setItem(STORAGE_KEYS.CACHED_DATA, data);
    await this.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
  }

  async getCachedData(): Promise<{data: RealTimeData; lastUpdate: string} | null> {
    const data = await this.getItem<RealTimeData>(STORAGE_KEYS.CACHED_DATA);
    const lastUpdate = await this.getItem<string>(STORAGE_KEYS.LAST_UPDATE);
    
    if (data && lastUpdate) {
      return {data, lastUpdate};
    }
    return null;
  }

  // 检查缓存是否过期（超过5分钟）
  async isCacheExpired(): Promise<boolean> {
    const lastUpdate = await this.getItem<string>(STORAGE_KEYS.LAST_UPDATE);
    if (!lastUpdate) return true;
    
    const lastUpdateTime = new Date(lastUpdate);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60);
    
    return diffMinutes > 5;
  }
}

export const storageService = new StorageService();
export {STORAGE_KEYS};
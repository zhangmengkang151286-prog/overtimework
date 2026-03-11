import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {supabaseService} from './supabaseService';
import {UserStatusSubmission} from '../types';

/**
 * 离线队列服务
 * 管理离线时的数据操作队列，在网络恢复后自动同步
 * 验证需求: 14.6
 */

const QUEUE_STORAGE_KEY = '@OvertimeIndexApp:offlineQueue';
const MAX_QUEUE_SIZE = 100;
const SYNC_RETRY_DELAY = 5000; // 5秒

export interface QueueItem {
  id: string;
  type:
    | 'submitStatus'
    | 'updateProfile'
    | 'createTag'
    | 'updateTag'
    | 'deleteTag';
  data: any;
  timestamp: number;
  retryCount: number;
}

class OfflineQueueService {
  private queue: QueueItem[] = [];
  private isSyncing = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private async initialize() {
    // 从本地存储加载队列
    await this.loadQueue();

    // 监听网络状态变化
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.queue.length > 0) {
        console.log('Network connected, starting sync...');
        this.syncQueue();
      }
    });
  }

  /**
   * 从本地存储加载队列
   */
  private async loadQueue() {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
        console.log(`Loaded ${this.queue.length} items from offline queue`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * 保存队列到本地存储
   */
  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * 添加操作到队列
   */
  async addToQueue(type: QueueItem['type'], data: any): Promise<string> {
    const item: QueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // 检查队列大小限制
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // 移除最旧的项
      this.queue.shift();
    }

    this.queue.push(item);
    await this.saveQueue();

    console.log(
      `Added ${type} to offline queue, queue size: ${this.queue.length}`,
    );

    // 如果网络可用，立即尝试同步
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.syncQueue();
    }

    return item.id;
  }

  /**
   * 同步队列
   */
  async syncQueue(): Promise<void> {
    if (this.isSyncing || this.queue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners({
      isSyncing: true,
      totalItems: this.queue.length,
      syncedItems: 0,
      failedItems: 0,
    });

    const failedItems: QueueItem[] = [];
    let syncedCount = 0;

    for (const item of this.queue) {
      try {
        await this.processQueueItem(item);
        syncedCount++;
        this.notifyListeners({
          isSyncing: true,
          totalItems: this.queue.length,
          syncedItems: syncedCount,
          failedItems: failedItems.length,
        });
      } catch (error) {
        console.error(`Failed to sync queue item ${item.id}:`, error);
        item.retryCount++;

        // 如果重试次数超过3次，放弃该项
        if (item.retryCount < 3) {
          failedItems.push(item);
        } else {
          console.warn(
            `Dropping queue item ${item.id} after 3 failed attempts`,
          );
        }
      }
    }

    // 更新队列为失败的项
    this.queue = failedItems;
    await this.saveQueue();

    this.isSyncing = false;
    this.notifyListeners({
      isSyncing: false,
      totalItems: this.queue.length,
      syncedItems: syncedCount,
      failedItems: failedItems.length,
    });

    console.log(
      `Sync completed: ${syncedCount} synced, ${failedItems.length} failed`,
    );

    // 如果还有失败的项，延迟后重试
    if (failedItems.length > 0) {
      setTimeout(() => this.syncQueue(), SYNC_RETRY_DELAY);
    }
  }

  /**
   * 处理单个队列项
   */
  private async processQueueItem(item: QueueItem): Promise<void> {
    switch (item.type) {
      case 'submitStatus':
        await this.syncSubmitStatus(item.data);
        break;
      case 'updateProfile':
        await this.syncUpdateProfile(item.data);
        break;
      case 'createTag':
        await this.syncCreateTag(item.data);
        break;
      case 'updateTag':
        await this.syncUpdateTag(item.data);
        break;
      case 'deleteTag':
        await this.syncDeleteTag(item.data);
        break;
      default:
        console.warn(`Unknown queue item type: ${item.type}`);
    }
  }

  /**
   * 同步状态提交
   */
  private async syncSubmitStatus(data: {
    userId: string;
    isOvertime: boolean;
    tagId: string;
    overtimeHours?: number;
    date: string;
  }): Promise<void> {
    await supabaseService.submitUserStatus({
      user_id: data.userId,
      date: data.date,
      is_overtime: data.isOvertime,
      tag_id: data.tagId,
      overtime_hours: data.overtimeHours,
    });
  }

  /**
   * 同步用户信息更新
   */
  private async syncUpdateProfile(data: {
    userId: string;
    updates: any;
  }): Promise<void> {
    await supabaseService.updateUser(data.userId, data.updates);
  }

  /**
   * 同步标签创建
   */
  private async syncCreateTag(data: {
    name: string;
    type: string;
  }): Promise<void> {
    await supabaseService.createTag({
      name: data.name,
      type: data.type as 'industry' | 'company' | 'position' | 'custom',
    });
  }

  /**
   * 同步标签更新
   */
  private async syncUpdateTag(data: {id: string; updates: any}): Promise<void> {
    await supabaseService.updateTag(data.id, data.updates);
  }

  /**
   * 同步标签删除
   */
  private async syncDeleteTag(data: {id: string}): Promise<void> {
    await supabaseService.deleteTag(data.id);
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): {
    queueSize: number;
    isSyncing: boolean;
    oldestItem: number | null;
  } {
    return {
      queueSize: this.queue.length,
      isSyncing: this.isSyncing,
      oldestItem: this.queue.length > 0 ? this.queue[0].timestamp : null,
    };
  }

  /**
   * 清空队列
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('Offline queue cleared');
  }

  /**
   * 添加同步状态监听器
   */
  addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  /**
   * 通知监听器
   */
  private notifyListeners(status: SyncStatus) {
    this.syncListeners.forEach(listener => listener(status));
  }
}

export interface SyncStatus {
  isSyncing: boolean;
  totalItems: number;
  syncedItems: number;
  failedItems: number;
}

export const offlineQueueService = new OfflineQueueService();

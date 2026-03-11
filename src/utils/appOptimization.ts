/**
 * 应用优化工具
 * Application Optimization Utilities
 *
 * 提供应用启动优化、性能监控和资源管理功能
 * Provides app startup optimization, performance monitoring, and resource management
 */

import {InteractionManager, Platform} from 'react-native';
import {PerformanceMonitor} from './performance';

/**
 * 应用启动优化器
 * App Startup Optimizer
 */
export class AppStartupOptimizer {
  private static instance: AppStartupOptimizer;
  private startTime: number = 0;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): AppStartupOptimizer {
    if (!AppStartupOptimizer.instance) {
      AppStartupOptimizer.instance = new AppStartupOptimizer();
    }
    return AppStartupOptimizer.instance;
  }

  /**
   * 记录应用启动开始时间
   */
  markStartup(): void {
    this.startTime = Date.now();
    // 使用 start 方法返回的函数来结束计时
    // 我们不在这里调用，而是在 markStartupComplete 中手动计算
  }

  /**
   * 记录应用启动完成时间
   */
  markStartupComplete(): void {
    if (this.startTime > 0 && !this.isInitialized) {
      const duration = Date.now() - this.startTime;
      // 手动记录性能指标
      PerformanceMonitor.getInstance().record('app-startup', duration);
      console.log(`App startup completed in ${duration}ms`);
      this.isInitialized = true;
    }
  }

  /**
   * 延迟执行非关键任务
   * Defer non-critical tasks until after interactions
   */
  deferTask(task: () => void): void {
    InteractionManager.runAfterInteractions(() => {
      task();
    });
  }

  /**
   * 批量延迟执行任务
   */
  deferTasks(tasks: Array<() => void>): void {
    InteractionManager.runAfterInteractions(() => {
      tasks.forEach(task => task());
    });
  }

  /**
   * 获取启动时间
   */
  getStartupTime(): number {
    return this.startTime > 0 ? Date.now() - this.startTime : 0;
  }

  /**
   * 重置优化器状态
   */
  reset(): void {
    this.startTime = 0;
    this.isInitialized = false;
  }
}

/**
 * 资源管理器
 * Resource Manager
 */
export class ResourceManager {
  private static instance: ResourceManager;
  private imageCache: Map<string, any> = new Map();
  private maxCacheSize: number = 50;

  private constructor() {}

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * 缓存图片资源
   */
  cacheImage(uri: string, image: any): void {
    if (this.imageCache.size >= this.maxCacheSize) {
      // 删除最早的缓存项
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }
    this.imageCache.set(uri, image);
  }

  /**
   * 获取缓存的图片
   */
  getCachedImage(uri: string): any | undefined {
    return this.imageCache.get(uri);
  }

  /**
   * 清理图片缓存
   */
  clearImageCache(): void {
    this.imageCache.clear();
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.imageCache.size;
  }

  /**
   * 设置最大缓存大小
   */
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
    // 如果当前缓存超过新的最大值，清理多余的项
    while (this.imageCache.size > this.maxCacheSize) {
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }
  }
}

/**
 * 网络优化器
 * Network Optimizer
 */
export class NetworkOptimizer {
  private static instance: NetworkOptimizer;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing: boolean = false;
  private maxConcurrentRequests: number = 3;
  private activeRequests: number = 0;

  private constructor() {}

  static getInstance(): NetworkOptimizer {
    if (!NetworkOptimizer.instance) {
      NetworkOptimizer.instance = new NetworkOptimizer();
    }
    return NetworkOptimizer.instance;
  }

  /**
   * 添加请求到队列
   */
  async queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });

      this.processQueue();
    });
  }

  /**
   * 处理请求队列
   */
  private async processQueue(): Promise<void> {
    if (
      this.isProcessing ||
      this.activeRequests >= this.maxConcurrentRequests
    ) {
      return;
    }

    this.isProcessing = true;

    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.maxConcurrentRequests
    ) {
      const request = this.requestQueue.shift();
      if (request) {
        this.activeRequests++;
        request().finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
      }
    }

    this.isProcessing = false;
  }

  /**
   * 设置最大并发请求数
   */
  setMaxConcurrentRequests(max: number): void {
    this.maxConcurrentRequests = max;
  }

  /**
   * 获取队列长度
   */
  getQueueLength(): number {
    return this.requestQueue.length;
  }

  /**
   * 清空请求队列
   */
  clearQueue(): void {
    this.requestQueue = [];
  }
}

/**
 * 应用优化配置
 * App Optimization Configuration
 */
export interface OptimizationConfig {
  enablePerformanceMonitoring: boolean;
  enableResourceCaching: boolean;
  enableNetworkOptimization: boolean;
  maxImageCacheSize: number;
  maxConcurrentRequests: number;
}

/**
 * 默认优化配置
 */
export const defaultOptimizationConfig: OptimizationConfig = {
  enablePerformanceMonitoring: true,
  enableResourceCaching: true,
  enableNetworkOptimization: true,
  maxImageCacheSize: 50,
  maxConcurrentRequests: 3,
};

/**
 * 应用优化管理器
 * App Optimization Manager
 */
export class AppOptimizationManager {
  private static instance: AppOptimizationManager;
  private config: OptimizationConfig;

  private constructor(config: OptimizationConfig = defaultOptimizationConfig) {
    this.config = config;
    this.initialize();
  }

  static getInstance(config?: OptimizationConfig): AppOptimizationManager {
    if (!AppOptimizationManager.instance) {
      AppOptimizationManager.instance = new AppOptimizationManager(config);
    }
    return AppOptimizationManager.instance;
  }

  /**
   * 初始化优化管理器
   */
  private initialize(): void {
    if (this.config.enableResourceCaching) {
      ResourceManager.getInstance().setMaxCacheSize(
        this.config.maxImageCacheSize,
      );
    }

    if (this.config.enableNetworkOptimization) {
      NetworkOptimizer.getInstance().setMaxConcurrentRequests(
        this.config.maxConcurrentRequests,
      );
    }

    console.log('App optimization manager initialized');
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = {...this.config, ...config};

    if (config.maxImageCacheSize !== undefined) {
      ResourceManager.getInstance().setMaxCacheSize(config.maxImageCacheSize);
    }

    if (config.maxConcurrentRequests !== undefined) {
      NetworkOptimizer.getInstance().setMaxConcurrentRequests(
        config.maxConcurrentRequests,
      );
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): OptimizationConfig {
    return {...this.config};
  }

  /**
   * 清理所有缓存
   */
  clearAllCaches(): void {
    ResourceManager.getInstance().clearImageCache();
    NetworkOptimizer.getInstance().clearQueue();
    console.log('All caches cleared');
  }

  /**
   * 获取优化统计信息
   */
  getOptimizationStats(): {
    imageCacheSize: number;
    networkQueueLength: number;
    startupTime: number;
  } {
    return {
      imageCacheSize: ResourceManager.getInstance().getCacheSize(),
      networkQueueLength: NetworkOptimizer.getInstance().getQueueLength(),
      startupTime: AppStartupOptimizer.getInstance().getStartupTime(),
    };
  }
}

/**
 * 导出单例实例
 */
export const appStartupOptimizer = AppStartupOptimizer.getInstance();
export const resourceManager = ResourceManager.getInstance();
export const networkOptimizer = NetworkOptimizer.getInstance();
export const appOptimizationManager = AppOptimizationManager.getInstance();

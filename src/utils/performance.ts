import {InteractionManager} from 'react-native';

/**
 * 性能优化工具
 * 提供动画性能优化和内存管理功能
 * 需求: 优化动画性能和内存使用
 */

/**
 * 延迟执行，等待动画完成
 */
export const runAfterInteractions = (callback: () => void): void => {
  InteractionManager.runAfterInteractions(() => {
    callback();
  });
};

/**
 * 防抖函数
 * 用于优化频繁触发的事件（如搜索输入）
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * 节流函数
 * 用于限制函数执行频率（如滚动事件）
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 批量更新优化
 * 将多个状态更新合并为一次
 */
export class BatchUpdater<T> {
  private updates: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private callback: (updates: T[]) => void;
  private delay: number;

  constructor(callback: (updates: T[]) => void, delay: number = 100) {
    this.callback = callback;
    this.delay = delay;
  }

  add(update: T): void {
    this.updates.push(update);

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush(): void {
    if (this.updates.length > 0) {
      this.callback([...this.updates]);
      this.updates = [];
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  clear(): void {
    this.updates = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * 内存缓存管理器
 * 用于管理有限大小的内存缓存
 */
export class MemoryCache<K, V> {
  private cache: Map<K, {value: V; timestamp: number}> = new Map();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: K, value: V): void {
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期项
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: K[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 开始计时
   */
  start(label: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.record(label, duration);
    };
  }

  /**
   * 记录性能指标
   */
  record(label: string, duration: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }

    const metrics = this.metrics.get(label)!;
    metrics.push(duration);

    // 限制每个标签的记录数量
    if (metrics.length > 100) {
      metrics.shift();
    }

    console.log(`Performance [${label}]: ${duration}ms`);
  }

  /**
   * 获取平均性能
   */
  getAverage(label: string): number | null {
    const metrics = this.metrics.get(label);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sum = metrics.reduce((acc, val) => acc + val, 0);
    return sum / metrics.length;
  }

  /**
   * 获取所有性能指标
   */
  getAllMetrics(): Map<string, {average: number; count: number}> {
    const result = new Map<string, {average: number; count: number}>();

    this.metrics.forEach((values, label) => {
      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        result.set(label, {
          average: sum / values.length,
          count: values.length,
        });
      }
    });

    return result;
  }

  /**
   * 清除指标
   */
  clear(label?: string): void {
    if (label) {
      this.metrics.delete(label);
    } else {
      this.metrics.clear();
    }
  }
}

/**
 * 便捷的性能测量函数
 */
export const measurePerformance = async <T>(
  label: string,
  fn: () => Promise<T> | T,
): Promise<T> => {
  const monitor = PerformanceMonitor.getInstance();
  const end = monitor.start(label);

  try {
    const result = await fn();
    return result;
  } finally {
    end();
  }
};

/**
 * 动画帧率优化
 * 确保动画在60fps下运行
 */
export const optimizeAnimation = (callback: () => void): void => {
  requestAnimationFrame(() => {
    runAfterInteractions(callback);
  });
};

/**
 * 列表渲染优化配置
 */
export const LIST_OPTIMIZATION_CONFIG = {
  // 初始渲染数量
  initialNumToRender: 10,
  // 最大渲染批次大小
  maxToRenderPerBatch: 5,
  // 更新单元格批次周期
  updateCellsBatchingPeriod: 50,
  // 窗口大小
  windowSize: 10,
  // 移除剪切子视图
  removeClippedSubviews: true,
};

/**
 * 图片优化配置
 */
export const IMAGE_OPTIMIZATION_CONFIG = {
  // 缓存策略
  cache: 'default' as const,
  // 优先级
  priority: 'normal' as const,
  // 调整大小模式
  resizeMode: 'cover' as const,
};

/**
 * 内存监控器
 * 监控和管理应用内存使用
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryWarningListeners: Set<() => void> = new Set();
  private isMonitoring: boolean = false;

  private constructor() {}

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * 开始监控内存
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('Memory monitoring started');

    // 在React Native中，可以监听内存警告事件
    // 这里提供一个基础实现
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('Memory monitoring stopped');
  }

  /**
   * 订阅内存警告
   */
  onMemoryWarning(callback: () => void): () => void {
    this.memoryWarningListeners.add(callback);
    return () => {
      this.memoryWarningListeners.delete(callback);
    };
  }

  /**
   * 触发内存警告
   */
  triggerMemoryWarning(): void {
    console.warn('Memory warning triggered');
    this.memoryWarningListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in memory warning callback:', error);
      }
    });
  }

  /**
   * 清理建议
   */
  suggestCleanup(): string[] {
    const suggestions: string[] = [];

    // 检查性能监控器
    const perfMonitor = PerformanceMonitor.getInstance();
    const metrics = perfMonitor.getAllMetrics();
    if (metrics.size > 50) {
      suggestions.push('Clear performance metrics');
    }

    return suggestions;
  }
}

/**
 * 资源清理管理器
 * 管理组件卸载时的资源清理
 */
export class ResourceCleanupManager {
  private cleanupFunctions: Map<string, () => void> = new Map();

  /**
   * 注册清理函数
   */
  register(key: string, cleanup: () => void): void {
    this.cleanupFunctions.set(key, cleanup);
  }

  /**
   * 执行清理
   */
  cleanup(key: string): void {
    const cleanup = this.cleanupFunctions.get(key);
    if (cleanup) {
      try {
        cleanup();
        this.cleanupFunctions.delete(key);
      } catch (error) {
        console.error(`Error cleaning up resource ${key}:`, error);
      }
    }
  }

  /**
   * 清理所有资源
   */
  cleanupAll(): void {
    this.cleanupFunctions.forEach((cleanup, key) => {
      try {
        cleanup();
      } catch (error) {
        console.error(`Error cleaning up resource ${key}:`, error);
      }
    });
    this.cleanupFunctions.clear();
  }

  /**
   * 获取注册的资源数量
   */
  getResourceCount(): number {
    return this.cleanupFunctions.size;
  }
}

/**
 * 动画性能优化器
 */
export class AnimationOptimizer {
  private static instance: AnimationOptimizer;
  private activeAnimations: Set<string> = new Set();
  private maxConcurrentAnimations: number = 10;

  private constructor() {}

  static getInstance(): AnimationOptimizer {
    if (!AnimationOptimizer.instance) {
      AnimationOptimizer.instance = new AnimationOptimizer();
    }
    return AnimationOptimizer.instance;
  }

  /**
   * 注册动画
   */
  registerAnimation(id: string): boolean {
    if (this.activeAnimations.size >= this.maxConcurrentAnimations) {
      console.warn('Too many concurrent animations, skipping:', id);
      return false;
    }

    this.activeAnimations.add(id);
    return true;
  }

  /**
   * 注销动画
   */
  unregisterAnimation(id: string): void {
    this.activeAnimations.delete(id);
  }

  /**
   * 获取活动动画数量
   */
  getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * 检查是否可以启动新动画
   */
  canStartAnimation(): boolean {
    return this.activeAnimations.size < this.maxConcurrentAnimations;
  }

  /**
   * 设置最大并发动画数
   */
  setMaxConcurrentAnimations(max: number): void {
    this.maxConcurrentAnimations = max;
  }
}

/**
 * 使用动画优化器的辅助函数
 */
export const withAnimationOptimization = (
  id: string,
  animationFn: () => void,
): void => {
  const optimizer = AnimationOptimizer.getInstance();

  if (optimizer.registerAnimation(id)) {
    try {
      animationFn();
    } finally {
      // 动画完成后注销
      setTimeout(() => {
        optimizer.unregisterAnimation(id);
      }, 1000); // 假设大多数动画在1秒内完成
    }
  }
};

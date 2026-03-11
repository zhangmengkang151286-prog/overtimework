import {
  debounce,
  throttle,
  MemoryCache,
  BatchUpdater,
  PerformanceMonitor,
  measurePerformance,
  MemoryMonitor,
  ResourceCleanupManager,
  AnimationOptimizer,
} from '../utils/performance';

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    it('should limit function execution', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('arg1', 'arg2');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('MemoryCache', () => {
    it('should store and retrieve values', () => {
      const cache = new MemoryCache<string, number>(10, 1000);

      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    it('should return undefined for missing keys', () => {
      const cache = new MemoryCache<string, number>(10, 1000);
      expect(cache.get('missing')).toBeUndefined();
    });

    it('should respect max size', () => {
      const cache = new MemoryCache<string, number>(2, 1000);

      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);

      expect(cache.size()).toBe(2);
      expect(cache.get('key1')).toBeUndefined(); // First item removed
      expect(cache.get('key2')).toBe(2);
      expect(cache.get('key3')).toBe(3);
    });

    it('should check if key exists', () => {
      const cache = new MemoryCache<string, number>(10, 1000);

      cache.set('key1', 100);
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete keys', () => {
      const cache = new MemoryCache<string, number>(10, 1000);

      cache.set('key1', 100);
      cache.delete('key1');
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should clear all keys', () => {
      const cache = new MemoryCache<string, number>(10, 1000);

      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.clear();

      expect(cache.size()).toBe(0);
    });
  });

  describe('BatchUpdater', () => {
    it('should batch updates', () => {
      const callback = jest.fn();
      const updater = new BatchUpdater<number>(callback, 100);

      updater.add(1);
      updater.add(2);
      updater.add(3);

      expect(callback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledWith([1, 2, 3]);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should flush manually', () => {
      const callback = jest.fn();
      const updater = new BatchUpdater<number>(callback, 100);

      updater.add(1);
      updater.add(2);
      updater.flush();

      expect(callback).toHaveBeenCalledWith([1, 2]);
    });

    it('should clear updates', () => {
      const callback = jest.fn();
      const updater = new BatchUpdater<number>(callback, 100);

      updater.add(1);
      updater.add(2);
      updater.clear();

      jest.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('PerformanceMonitor', () => {
    it('should be a singleton', () => {
      const monitor1 = PerformanceMonitor.getInstance();
      const monitor2 = PerformanceMonitor.getInstance();

      expect(monitor1).toBe(monitor2);
    });

    it('should record performance metrics', () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.clear();

      monitor.record('test', 100);
      monitor.record('test', 200);

      const average = monitor.getAverage('test');
      expect(average).toBe(150);
    });

    it('should start and stop timing', () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.clear();

      const end = monitor.start('test');
      end();

      const average = monitor.getAverage('test');
      expect(average).toBeGreaterThanOrEqual(0);
    });

    it('should get all metrics', () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.clear();

      monitor.record('test1', 100);
      monitor.record('test2', 200);

      const metrics = monitor.getAllMetrics();
      expect(metrics.size).toBe(2);
      expect(metrics.get('test1')?.average).toBe(100);
      expect(metrics.get('test2')?.average).toBe(200);
    });

    it('should clear specific metric', () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.clear();

      monitor.record('test1', 100);
      monitor.record('test2', 200);

      monitor.clear('test1');

      expect(monitor.getAverage('test1')).toBeNull();
      expect(monitor.getAverage('test2')).toBe(200);
    });
  });

  describe('measurePerformance', () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    it('should measure sync function performance', async () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.clear();

      const result = await measurePerformance('test', () => {
        return 'result';
      });

      expect(result).toBe('result');
      expect(monitor.getAverage('test')).toBeGreaterThanOrEqual(0);
    });

    it('should measure async function performance', async () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.clear();

      const result = await measurePerformance('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      });

      expect(result).toBe('result');
      const average = monitor.getAverage('test');
      expect(average).toBeGreaterThanOrEqual(10);
    });
  });

  describe('MemoryMonitor', () => {
    it('should be a singleton', () => {
      const monitor1 = MemoryMonitor.getInstance();
      const monitor2 = MemoryMonitor.getInstance();

      expect(monitor1).toBe(monitor2);
    });

    it('should start and stop monitoring', () => {
      const monitor = MemoryMonitor.getInstance();

      monitor.startMonitoring();
      monitor.stopMonitoring();

      // No errors should occur
      expect(true).toBe(true);
    });

    it('should trigger memory warnings', () => {
      const monitor = MemoryMonitor.getInstance();
      const callback = jest.fn();

      const unsubscribe = monitor.onMemoryWarning(callback);
      monitor.triggerMemoryWarning();

      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      monitor.triggerMemoryWarning();

      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should provide cleanup suggestions', () => {
      const monitor = MemoryMonitor.getInstance();
      const suggestions = monitor.suggestCleanup();

      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('ResourceCleanupManager', () => {
    it('should register and cleanup resources', () => {
      const manager = new ResourceCleanupManager();
      const cleanup = jest.fn();

      manager.register('resource1', cleanup);
      expect(manager.getResourceCount()).toBe(1);

      manager.cleanup('resource1');
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(manager.getResourceCount()).toBe(0);
    });

    it('should cleanup all resources', () => {
      const manager = new ResourceCleanupManager();
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();

      manager.register('resource1', cleanup1);
      manager.register('resource2', cleanup2);

      manager.cleanupAll();

      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
      expect(manager.getResourceCount()).toBe(0);
    });

    it('should handle cleanup errors gracefully', () => {
      const manager = new ResourceCleanupManager();
      const cleanup = jest.fn(() => {
        throw new Error('Cleanup error');
      });

      manager.register('resource1', cleanup);
      manager.cleanup('resource1');

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('AnimationOptimizer', () => {
    it('should be a singleton', () => {
      const optimizer1 = AnimationOptimizer.getInstance();
      const optimizer2 = AnimationOptimizer.getInstance();

      expect(optimizer1).toBe(optimizer2);
    });

    it('should register and unregister animations', () => {
      const optimizer = AnimationOptimizer.getInstance();

      const registered = optimizer.registerAnimation('anim1');
      expect(registered).toBe(true);
      expect(optimizer.getActiveAnimationCount()).toBe(1);

      optimizer.unregisterAnimation('anim1');
      expect(optimizer.getActiveAnimationCount()).toBe(0);
    });

    it('should limit concurrent animations', () => {
      const optimizer = AnimationOptimizer.getInstance();
      optimizer.setMaxConcurrentAnimations(2);

      optimizer.registerAnimation('anim1');
      optimizer.registerAnimation('anim2');
      const registered = optimizer.registerAnimation('anim3');

      expect(registered).toBe(false);
      expect(optimizer.getActiveAnimationCount()).toBe(2);

      // Cleanup
      optimizer.unregisterAnimation('anim1');
      optimizer.unregisterAnimation('anim2');
    });

    it('should check if can start animation', () => {
      const optimizer = AnimationOptimizer.getInstance();
      optimizer.setMaxConcurrentAnimations(1);

      expect(optimizer.canStartAnimation()).toBe(true);

      optimizer.registerAnimation('anim1');
      expect(optimizer.canStartAnimation()).toBe(false);

      optimizer.unregisterAnimation('anim1');
      expect(optimizer.canStartAnimation()).toBe(true);
    });
  });
});

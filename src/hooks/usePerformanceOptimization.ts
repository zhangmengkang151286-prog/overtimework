import {useEffect, useRef, useCallback} from 'react';
import {
  MemoryMonitor,
  ResourceCleanupManager,
  AnimationOptimizer,
  PerformanceMonitor,
} from '../utils/performance';

/**
 * 性能优化Hook
 * 提供内存监控、资源清理和动画优化
 * 需求: 优化动画性能和内存使用
 */

interface PerformanceOptimizationOptions {
  enableMemoryMonitoring?: boolean;
  enableAnimationOptimization?: boolean;
  componentName?: string;
}

export const usePerformanceOptimization = (
  options: PerformanceOptimizationOptions = {},
) => {
  const {
    enableMemoryMonitoring = true,
    enableAnimationOptimization = true,
    componentName = 'unknown',
  } = options;

  const memoryMonitor = MemoryMonitor.getInstance();
  const animationOptimizer = AnimationOptimizer.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();
  const cleanupManager = useRef(new ResourceCleanupManager());
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  // 监控组件渲染性能
  useEffect(() => {
    renderCount.current++;

    if (renderCount.current > 1) {
      const renderTime = Date.now() - mountTime.current;
      performanceMonitor.record(`${componentName}-render`, renderTime);

      // 警告频繁重渲染
      if (renderCount.current > 10) {
        console.warn(
          `Component ${componentName} has rendered ${renderCount.current} times`,
        );
      }
    }
  });

  // 内存监控
  useEffect(() => {
    if (!enableMemoryMonitoring) return;

    const unsubscribe = memoryMonitor.onMemoryWarning(() => {
      console.warn(`Memory warning in component: ${componentName}`);
      // 执行清理
      cleanupManager.current.cleanupAll();
    });

    return unsubscribe;
  }, [enableMemoryMonitoring, componentName]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      const cleanupTime = Date.now() - mountTime.current;
      performanceMonitor.record(`${componentName}-lifetime`, cleanupTime);

      // 清理所有注册的资源
      cleanupManager.current.cleanupAll();
    };
  }, [componentName]);

  /**
   * 注册需要清理的资源
   */
  const registerCleanup = useCallback((key: string, cleanup: () => void) => {
    cleanupManager.current.register(key, cleanup);
  }, []);

  /**
   * 优化动画执行
   */
  const optimizeAnimation = useCallback(
    (animationId: string, animationFn: () => void) => {
      if (!enableAnimationOptimization) {
        animationFn();
        return;
      }

      if (animationOptimizer.registerAnimation(animationId)) {
        try {
          animationFn();
        } finally {
          setTimeout(() => {
            animationOptimizer.unregisterAnimation(animationId);
          }, 1000);
        }
      } else {
        console.warn(`Animation ${animationId} skipped due to optimization`);
      }
    },
    [enableAnimationOptimization],
  );

  /**
   * 测量操作性能
   */
  const measureOperation = useCallback(
    async <T>(operationName: string, fn: () => Promise<T> | T): Promise<T> => {
      const end = performanceMonitor.start(`${componentName}-${operationName}`);
      try {
        return await fn();
      } finally {
        end();
      }
    },
    [componentName],
  );

  /**
   * 获取组件性能统计
   */
  const getPerformanceStats = useCallback(() => {
    return {
      renderCount: renderCount.current,
      lifetime: Date.now() - mountTime.current,
      registeredResources: cleanupManager.current.getResourceCount(),
      activeAnimations: animationOptimizer.getActiveAnimationCount(),
    };
  }, []);

  return {
    registerCleanup,
    optimizeAnimation,
    measureOperation,
    getPerformanceStats,
  };
};

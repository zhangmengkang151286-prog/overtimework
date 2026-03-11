import {useCallback, useEffect, useRef} from 'react';
import {useErrorHandler} from './useErrorHandler';
import {withRetry, CircuitBreaker} from '../utils/errorHandler';
import {PerformanceMonitor} from '../utils/performance';

/**
 * 错误恢复Hook
 * 提供自动重试、电路断路器和性能监控的错误恢复机制
 * 需求: 网络错误的友好提示和重试机制
 */

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  useCircuitBreaker?: boolean;
  onRetry?: (attempt: number, error: any) => void;
  onSuccess?: () => void;
  onFailure?: (error: any) => void;
}

export const useErrorRecovery = () => {
  const {handleError, showSuccess, showWarning} = useErrorHandler();
  const circuitBreakerRef = useRef<CircuitBreaker>(new CircuitBreaker());
  const performanceMonitor = PerformanceMonitor.getInstance();

  /**
   * 执行带错误恢复的异步操作
   */
  const executeWithRecovery = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options: ErrorRecoveryOptions = {},
    ): Promise<T | null> => {
      const {
        maxRetries = 3,
        retryDelay = 1000,
        useCircuitBreaker = false,
        onRetry,
        onSuccess,
        onFailure,
      } = options;

      const end = performanceMonitor.start('error-recovery-operation');

      try {
        let result: T;

        if (useCircuitBreaker) {
          // 使用电路断路器
          result = await circuitBreakerRef.current.execute(async () => {
            return await withRetry(fn, {
              maxAttempts: maxRetries,
              delay: retryDelay,
              onRetry: (attempt, error) => {
                showWarning(`正在重试... (${attempt}/${maxRetries})`);
                if (onRetry) {
                  onRetry(attempt, error);
                }
              },
            });
          });
        } else {
          // 直接使用重试机制
          result = await withRetry(fn, {
            maxAttempts: maxRetries,
            delay: retryDelay,
            onRetry: (attempt, error) => {
              showWarning(`正在重试... (${attempt}/${maxRetries})`);
              if (onRetry) {
                onRetry(attempt, error);
              }
            },
          });
        }

        if (onSuccess) {
          onSuccess();
        }

        end();
        return result;
      } catch (error) {
        handleError(error);

        if (onFailure) {
          onFailure(error);
        }

        end();
        return null;
      }
    },
    [handleError, showWarning, performanceMonitor],
  );

  /**
   * 获取电路断路器状态
   */
  const getCircuitBreakerState = useCallback(() => {
    return circuitBreakerRef.current.getState();
  }, []);

  /**
   * 重置电路断路器
   */
  const resetCircuitBreaker = useCallback(() => {
    circuitBreakerRef.current = new CircuitBreaker();
  }, []);

  return {
    executeWithRecovery,
    getCircuitBreakerState,
    resetCircuitBreaker,
  };
};

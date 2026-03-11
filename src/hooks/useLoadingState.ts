/**
 * 加载状态管理Hook
 *
 * 提供统一的加载状态管理,支持多个并发操作
 */

import {useState, useCallback, useRef} from 'react';

export interface LoadingState {
  isLoading: boolean;
  loadingKeys: Set<string>;
}

export interface UseLoadingStateReturn {
  isLoading: boolean;
  isLoadingKey: (key: string) => boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  withLoading: <T>(operation: () => Promise<T>, key?: string) => Promise<T>;
}

/**
 * 加载状态管理Hook
 * @param initialLoading 初始加载状态
 * @returns 加载状态和控制方法
 */
export function useLoadingState(
  initialLoading: boolean = false,
): UseLoadingStateReturn {
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const loadingKeysRef = useRef<Set<string>>(new Set());

  // 开始加载
  const startLoading = useCallback((key: string = 'default') => {
    loadingKeysRef.current.add(key);
    setLoadingKeys(new Set(loadingKeysRef.current));
  }, []);

  // 停止加载
  const stopLoading = useCallback((key: string = 'default') => {
    loadingKeysRef.current.delete(key);
    setLoadingKeys(new Set(loadingKeysRef.current));
  }, []);

  // 检查特定key是否正在加载
  const isLoadingKey = useCallback(
    (key: string) => {
      return loadingKeys.has(key);
    },
    [loadingKeys],
  );

  // 包装异步操作,自动管理加载状态
  const withLoading = useCallback(
    async <T>(
      operation: () => Promise<T>,
      key: string = 'default',
    ): Promise<T> => {
      try {
        startLoading(key);
        return await operation();
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading],
  );

  return {
    isLoading: loadingKeys.size > 0,
    isLoadingKey,
    startLoading,
    stopLoading,
    withLoading,
  };
}

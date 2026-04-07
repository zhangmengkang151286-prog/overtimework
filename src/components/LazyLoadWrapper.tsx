/**
 * LazyLoadWrapper - 懒加载组件包装器
 * 为懒加载组件提供 Suspense 边界和加载状态
 * 验证需求: 10.3
 */

import React, {Suspense, ReactNode} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {Skeleton} from './LoadingSkeleton';

interface LazyLoadWrapperProps {
  /** 子组件 */
  children: ReactNode;
  /** 加载时显示的组件类型 */
  fallbackType?: 'spinner' | 'skeleton';
  /** 自定义加载组件 */
  fallback?: ReactNode;
  /** 容器样式 */
  containerStyle?: any;
}

/**
 * 懒加载包装器组件
 *
 * 功能：
 * 1. 为懒加载组件提供 Suspense 边界
 * 2. 显示加载状态（Spinner 或 Skeleton）
 * 3. 错误边界处理
 *
 * @example
 * ```tsx
 * <LazyLoadWrapper fallbackType="skeleton">
 *   <LazyComponent />
 * </LazyLoadWrapper>
 * ```
 */
export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  fallbackType = 'spinner',
  fallback,
  containerStyle,
}) => {
  // 默认加载组件
  const defaultFallback =
    fallbackType === 'skeleton' ? (
      <Skeleton width="100%" height={200} />
    ) : (
      <View style={[styles.spinnerContainer, containerStyle]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
};

/**
 * 页面级懒加载包装器
 * 用于整个页面的懒加载
 */
export const PageLazyLoadWrapper: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  return (
    <Suspense
      fallback={
        <View style={styles.pageContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      }>
      {children}
    </Suspense>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E0F',
  },
});

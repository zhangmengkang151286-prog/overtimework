/**
 * 网络状态提示条
 *
 * 显示网络连接状态和数据更新状态
 * 使用 Reanimated withSpring/withTiming 驱动滑入/滑出
 */

import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {spacing} from '../theme/spacing';
import {duration, easing, spring} from '../theme/animations';
import {
  realTimeDataService,
  NetworkStatus,
} from '../services/realTimeDataService';

export const NetworkStatusBar: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [showBar, setShowBar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const slideVal = useSharedValue(-60);

  useEffect(() => {
    // 订阅网络状态变化（只在断网时显示，网络正常时不显示）
    const unsubscribeNetwork = realTimeDataService.onNetworkStatusChange(
      status => {
        setNetworkStatus(status);
        const isDisconnected =
          !status.isConnected || status.isInternetReachable === false;
        setShowBar(isDisconnected);

        if (!isDisconnected) {
          setErrorMessage(null);
        }
      },
    );

    // 订阅数据更新
    const unsubscribeData = realTimeDataService.onDataUpdate(() => {
      setLastUpdateTime(new Date());
      setErrorMessage(null);
    });

    // 订阅错误
    const unsubscribeError = realTimeDataService.onError(error => {
      console.log('Network error:', error.message);
      setErrorMessage(error.message);
      if (!networkStatus.isConnected) {
        setShowBar(true);
      }
    });

    return () => {
      unsubscribeNetwork();
      unsubscribeData();
      unsubscribeError();
    };
  }, [networkStatus.isConnected]);

  // 根据 showBar 驱动滑入/滑出动画
  useEffect(() => {
    if (showBar) {
      slideVal.value = withSpring(0, spring.default);
    } else {
      slideVal.value = withTiming(-60, {
        duration: duration.medium,
        easing: easing.easeIn,
      });
    }
  }, [showBar, slideVal]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateY: slideVal.value}],
  }));

  const handleRetry = async () => {
    try {
      await realTimeDataService.refresh();
      setErrorMessage(null);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const getStatusMessage = (): string => {
    if (errorMessage) {
      return errorMessage;
    }
    if (!networkStatus.isConnected) {
      return '网络连接已断开';
    }
    if (networkStatus.isInternetReachable === false) {
      return '无法访问互联网';
    }
    return '网络已连接';
  };

  const getStatusColor = (): string => {
    if (
      !networkStatus.isConnected ||
      networkStatus.isInternetReachable === false ||
      errorMessage
    ) {
      return colors.light.error;
    }
    return colors.light.success;
  };

  // 网络正常时完全不渲染，避免在刘海/灵动岛设备上绿条露出
  if (!showBar) {
    return null;
  }

  return (
    <ReAnimated.View
      style={[
        styles.container,
        {backgroundColor: getStatusColor()},
        animStyle,
      ]}>
      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{getStatusMessage()}</Text>
          {lastUpdateTime && networkStatus.isConnected && !errorMessage && (
            <Text style={styles.timestamp}>
              最后更新: {lastUpdateTime.toLocaleTimeString('zh-CN')}
            </Text>
          )}
        </View>
        {(!networkStatus.isConnected || errorMessage) && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.7}>
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        )}
      </View>
    </ReAnimated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 40,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timestamp: {
    ...typography.caption,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  retryText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

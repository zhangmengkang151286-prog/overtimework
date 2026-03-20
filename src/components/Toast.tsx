/**
 * Toast 通知组件
 *
 * 显示临时通知消息（成功、错误、警告、信息）
 * 使用 Reanimated withTiming/withSpring 驱动入场/退场动画
 */

import React, {useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {removeNotification} from '../store/slices/uiSlice';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {spacing} from '../theme/spacing';
import {duration, easing, spring} from '../theme/animations';

/**
 * Toast 容器 — 管理多条通知
 */
export const ToastContainer: React.FC = () => {
  const notifications = useAppSelector(state => state.ui.notifications);
  const dispatch = useAppDispatch();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map(notification => (
        <Toast
          key={notification.id}
          id={notification.id}
          type={notification.type}
          message={notification.message}
          duration={notification.duration}
          onDismiss={() => dispatch(removeNotification(notification.id))}
        />
      ))}
    </View>
  );
};

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration: autoDismissMs = 3000,
  onDismiss,
}) => {
  const fadeVal = useSharedValue(0);
  const slideVal = useSharedValue(-100);

  const dismiss = useCallback(() => {
    fadeVal.value = withTiming(0, {duration: duration.normal, easing: easing.easeIn});
    slideVal.value = withTiming(-100, {
      duration: duration.normal,
      easing: easing.easeIn,
    });
    // 动画结束后移除
    setTimeout(() => onDismiss(), duration.normal);
  }, [fadeVal, slideVal, onDismiss]);

  useEffect(() => {
    // 入场动画
    fadeVal.value = withTiming(1, {duration: duration.medium, easing: easing.easeOut});
    slideVal.value = withSpring(0, spring.default);

    // 自动消失
    const timer = setTimeout(dismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: fadeVal.value,
    transform: [{translateY: slideVal.value}],
  }));

  const getBackgroundColor = (): string => {
    switch (type) {
      case 'success':
        return colors.light.success;
      case 'error':
        return colors.light.error;
      case 'warning':
        return colors.light.warning;
      case 'info':
        return colors.light.info;
      default:
        return colors.light.text;
    }
  };

  const getIcon = (): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <ReAnimated.View
      style={[
        styles.toast,
        {backgroundColor: getBackgroundColor()},
        animStyle,
      ]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={dismiss}
        activeOpacity={0.9}>
        <View style={styles.content}>
          <Text style={styles.icon}>{getIcon()}</Text>
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </ReAnimated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 999,
  },
  toast: {
    borderRadius: 8,
    marginBottom: spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  touchable: {
    padding: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: typography.fontSize.xl,
    color: '#FFFFFF',
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  message: {
    ...typography.styles.body,
    color: '#FFFFFF',
    flex: 1,
  },
});

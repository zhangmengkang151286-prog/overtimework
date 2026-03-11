import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, TouchableOpacity} from 'react-native';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {removeNotification} from '../store/slices/uiSlice';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {spacing} from '../theme/spacing';

/**
 * Toast通知组件
 * 显示临时通知消息（成功、错误、警告、信息）
 * 需求: 友好的错误提示和用户反馈
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
  duration = 3000,
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // 入场动画
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // 自动消失
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

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
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={handleDismiss}
        activeOpacity={0.9}>
        <View style={styles.content}>
          <Text style={styles.icon}>{getIcon()}</Text>
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // 留出状态栏和网络状态条的空间
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
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  message: {
    ...typography.body,
    color: '#FFFFFF',
    flex: 1,
  },
});

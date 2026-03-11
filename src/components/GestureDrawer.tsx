import React, {useEffect, useCallback} from 'react';
import {StyleSheet, Dimensions, TouchableWithoutFeedback} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;
// 屏幕左边缘触发区域宽度
const EDGE_WIDTH = 25;
// 弹簧动画配置 - 模拟 X/Twitter 的丝滑手感
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
  overshootClamping: false,
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 0.5,
};

interface GestureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  children: React.ReactNode;
}

export const GestureDrawer: React.FC<GestureDrawerProps> = ({
  isOpen,
  onClose,
  onOpen,
  children,
}) => {
  // translateX: -DRAWER_WIDTH = 完全隐藏, 0 = 完全打开
  const translateX = useSharedValue(-DRAWER_WIDTH);
  // 控制抽屉内容和遮罩是否可见
  const isVisible = useSharedValue(false);

  const closeDrawer = useCallback(() => {
    onClose();
  }, [onClose]);

  const openDrawer = useCallback(() => {
    onOpen();
  }, [onOpen]);

  // 响应 isOpen 变化
  useEffect(() => {
    if (isOpen) {
      isVisible.value = true;
      translateX.value = withSpring(0, SPRING_CONFIG);
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, {duration: 250}, (finished) => {
        if (finished) {
          isVisible.value = false;
        }
      });
    }
  }, [isOpen]);

  // 抽屉内部的拖拽关闭手势
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // 只允许向左拖（关闭方向），不允许超过 0（完全打开位置）
      const newX = Math.min(0, Math.max(-DRAWER_WIDTH, event.translationX));
      translateX.value = newX;
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const currentX = translateX.value;

      if (velocity < -500) {
        // 快速向左滑 → 关闭
        translateX.value = withTiming(-DRAWER_WIDTH, {duration: 250}, () => {
          isVisible.value = false;
          runOnJS(closeDrawer)();
        });
      } else if (velocity > 500) {
        // 快速向右滑 → 打开
        translateX.value = withSpring(0, SPRING_CONFIG);
      } else {
        if (currentX < -DRAWER_WIDTH * 0.4) {
          translateX.value = withTiming(-DRAWER_WIDTH, {duration: 250}, () => {
            isVisible.value = false;
            runOnJS(closeDrawer)();
          });
        } else {
          translateX.value = withSpring(0, SPRING_CONFIG);
        }
      }
    });

  // 屏幕左边缘的滑动打开手势
  const edgeGesture = Gesture.Pan()
    .activeOffsetX(10)
    .failOffsetY([-20, 20])
    .onStart(() => {
      // 开始拖拽时让抽屉可见
      isVisible.value = true;
      runOnJS(openDrawer)();
    })
    .onUpdate((event) => {
      // 从 -DRAWER_WIDTH 开始，跟随手指向右移动
      const newX = Math.min(0, Math.max(-DRAWER_WIDTH, -DRAWER_WIDTH + event.translationX));
      translateX.value = newX;
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const currentX = translateX.value;

      if (velocity > 500 || currentX > -DRAWER_WIDTH * 0.5) {
        // 快速向右滑或超过一半 → 打开
        translateX.value = withSpring(0, SPRING_CONFIG);
      } else {
        // 否则关闭
        translateX.value = withTiming(-DRAWER_WIDTH, {duration: 250}, () => {
          isVisible.value = false;
          runOnJS(closeDrawer)();
        });
      }
    });

  // 抽屉动画样式
  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  // 遮罩透明度跟随抽屉位置
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-DRAWER_WIDTH, 0],
      [0, 0.5],
      Extrapolation.CLAMP,
    ),
    pointerEvents: isVisible.value ? 'auto' as const : 'none' as const,
  }));

  // 抽屉容器可见性
  const drawerContainerStyle = useAnimatedStyle(() => ({
    pointerEvents: isVisible.value ? 'auto' as const : 'none' as const,
  }));

  return (
    <>
      {/* 屏幕左边缘触发区域 - 始终存在，用于从左滑动打开 */}
      <GestureDetector gesture={edgeGesture}>
        <Animated.View style={styles.edgeTrigger} />
      </GestureDetector>

      {/* 半透明遮罩 */}
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* 抽屉内容 - 手势驱动 */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.drawer, drawerStyle, drawerContainerStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  edgeTrigger: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#000',
    zIndex: 1001,
  },
});

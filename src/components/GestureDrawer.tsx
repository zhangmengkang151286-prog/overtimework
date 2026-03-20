/**
 * 全屏抽屉组件 — Reanimated + Gesture Handler 版
 *
 * 使用绝对定位覆盖层 + Reanimated translateX 实现
 * 支持手势左滑关闭（跟手拖动 + 松手判断）
 * 支持屏幕左边缘右滑打开（20px 触摸热区）
 *
 * children 始终挂载（避免每次打开重新初始化），
 * 通过 translateX 动画控制显隐，通过 pointerEvents 控制触摸穿透。
 */

import React, {useEffect, useRef, useState, useCallback} from 'react';
import {StyleSheet, Dimensions, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {duration, easing} from '../theme/animations';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
export const DRAWER_WIDTH = SCREEN_WIDTH;

// 滑动关闭阈值：超过屏幕宽度 30% 或速度超过 500 则关闭
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// 边缘手势打开阈值：滑动超过屏幕 20% 或速度超过 500 则打开
const EDGE_OPEN_THRESHOLD = SCREEN_WIDTH * 0.2;
// 左侧边缘触摸热区宽度
const EDGE_WIDTH = 20;

interface GestureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  children: React.ReactNode;
}

export const GestureDrawer: React.FC<GestureDrawerProps> = React.memo(
  ({isOpen, onClose, onOpen, children}) => {
    const slideVal = useSharedValue(-SCREEN_WIDTH);
    const backdropVal = useSharedValue(0);
    // 手势开始时的位置
    const startX = useSharedValue(0);
    // 是否曾经打开过（首次打开前不渲染，避免透明层拦截触摸）
    const hasOpenedOnce = useRef(false);
    // 是否完全关闭（动画结束后设为 true，用于 pointerEvents 穿透）
    const [isFullyClosed, setIsFullyClosed] = useState(true);
    // 边缘手势是否正在拖动中（控制抽屉内容可见性）
    const [isEdgeDragging, setIsEdgeDragging] = useState(false);
    // 边缘手势已完成打开动画，useEffect 应跳过重复滑入
    const openedByEdgeGesture = useRef(false);

    const markClosed = useCallback(() => setIsFullyClosed(true), []);
    const triggerClose = useCallback(() => onClose(), [onClose]);
    const triggerOpen = useCallback(() => onOpen(), [onOpen]);
    const markEdgeDragStart = useCallback(() => setIsEdgeDragging(true), []);
    const markEdgeDragEnd = useCallback(() => setIsEdgeDragging(false), []);
    const markEdgeOpenDone = useCallback(() => {
      openedByEdgeGesture.current = true;
    }, []);

    useEffect(() => {
      if (isOpen) {
        hasOpenedOnce.current = true;
        setIsFullyClosed(false);
        // 如果是边缘手势打开的，动画已经在手势 onEnd 中完成，跳过重复动画
        if (openedByEdgeGesture.current) {
          openedByEdgeGesture.current = false;
          return;
        }
        // 立即重置到屏幕外
        slideVal.value = -SCREEN_WIDTH;
        backdropVal.value = 0;
        // 滑入动画
        slideVal.value = withTiming(0, {
          duration: duration.medium,
          easing: easing.easeOut,
        });
        backdropVal.value = withTiming(1, {
          duration: duration.normal,
          easing: easing.ease,
        });
      } else if (hasOpenedOnce.current) {
        // 滑出动画
        slideVal.value = withTiming(
          -SCREEN_WIDTH,
          {duration: duration.normal, easing: easing.easeIn},
          finished => {
            if (finished) {
              runOnJS(markClosed)();
              runOnJS(markEdgeDragEnd)();
            }
          },
        );
        backdropVal.value = withTiming(0, {
          duration: duration.normal,
          easing: easing.ease,
        });
      }
    }, [isOpen]);

    // 手势：左滑关闭（抽屉打开时生效）
    const panGesture = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .onStart(() => {
        startX.value = slideVal.value;
      })
      .onUpdate(event => {
        // 只允许向左滑（translationX < 0），限制不超过 0（不能向右滑出屏幕）
        const newVal = startX.value + event.translationX;
        slideVal.value = Math.min(0, newVal);
        // 遮罩透明度跟随滑动进度
        backdropVal.value = interpolate(
          slideVal.value,
          [-SCREEN_WIDTH, 0],
          [0, 1],
          Extrapolation.CLAMP,
        );
      })
      .onEnd(event => {
        const shouldClose =
          slideVal.value < -SWIPE_THRESHOLD ||
          event.velocityX < -VELOCITY_THRESHOLD;

        if (shouldClose) {
          // 关闭动画
          slideVal.value = withTiming(
            -SCREEN_WIDTH,
            {duration: duration.normal, easing: easing.easeIn},
            finished => {
              if (finished) {
                runOnJS(markClosed)();
                runOnJS(triggerClose)();
              }
            },
          );
          backdropVal.value = withTiming(0, {
            duration: duration.normal,
            easing: easing.ease,
          });
        } else {
          // 弹回原位
          slideVal.value = withTiming(0, {
            duration: duration.normal,
            easing: easing.easeOut,
          });
          backdropVal.value = withTiming(1, {
            duration: duration.normal,
            easing: easing.ease,
          });
        }
      });

    // 边缘手势：从左边缘向右滑动打开抽屉
    const edgePanGesture = Gesture.Pan()
      .activeOffsetX(10) // 只响应向右滑动
      .onStart(() => {
        'worklet';
        // 从屏幕外开始
        slideVal.value = -SCREEN_WIDTH;
        backdropVal.value = 0;
        runOnJS(markEdgeDragStart)();
      })
      .onUpdate(event => {
        'worklet';
        // translationX 为正值（向右滑），映射到 slideVal: -SCREEN_WIDTH ~ 0
        const progress = Math.min(event.translationX, SCREEN_WIDTH);
        slideVal.value = -SCREEN_WIDTH + progress;
        backdropVal.value = interpolate(
          slideVal.value,
          [-SCREEN_WIDTH, 0],
          [0, 1],
          Extrapolation.CLAMP,
        );
      })
      .onEnd(event => {
        'worklet';
        const shouldOpen =
          event.translationX > EDGE_OPEN_THRESHOLD ||
          event.velocityX > VELOCITY_THRESHOLD;

        if (shouldOpen) {
          // 打开动画
          slideVal.value = withTiming(0, {
            duration: duration.medium,
            easing: easing.easeOut,
          });
          backdropVal.value = withTiming(1, {
            duration: duration.normal,
            easing: easing.ease,
          });
          // 标记：边缘手势已完成打开动画，避免 useEffect 重复播放
          runOnJS(markEdgeOpenDone)();
          runOnJS(triggerOpen)();
        } else {
          // 弹回关闭
          slideVal.value = withTiming(
            -SCREEN_WIDTH,
            {duration: duration.normal, easing: easing.easeIn},
            finished => {
              if (finished) {
                runOnJS(markEdgeDragEnd)();
              }
            },
          );
          backdropVal.value = withTiming(0, {
            duration: duration.normal,
            easing: easing.ease,
          });
        }
      });

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: backdropVal.value,
    }));

    const containerStyle = useAnimatedStyle(() => ({
      transform: [{translateX: slideVal.value}],
    }));

    // 抽屉内容是否需要渲染（打开过 或 正在边缘拖动中）
    const shouldRenderDrawer = hasOpenedOnce.current || isEdgeDragging;

    return (
      <>
        {/* 左侧边缘触摸热区 — 抽屉关闭时始终存在，用于检测右滑打开手势 */}
        {isFullyClosed && !isOpen && (
          <View style={styles.edgeZone} pointerEvents="box-none">
            <GestureDetector gesture={edgePanGesture}>
              <View style={styles.edgeTouchArea} />
            </GestureDetector>
          </View>
        )}

        {/* 抽屉主体 */}
        {shouldRenderDrawer && (
          <View
            style={styles.fullScreen}
            pointerEvents={isFullyClosed && !isEdgeDragging ? 'none' : 'box-none'}>
            {/* 半透明遮罩 — 点击关闭 */}
            <ReAnimated.View
              style={[styles.backdrop, backdropStyle]}
              pointerEvents={isFullyClosed && !isEdgeDragging ? 'none' : 'auto'}
            />

            {/* 抽屉内容 — 手势滑动关闭 */}
            <GestureDetector gesture={panGesture}>
              <ReAnimated.View
                style={[styles.container, containerStyle]}
                pointerEvents={isFullyClosed && !isEdgeDragging ? 'none' : 'box-none'}>
                {children}
              </ReAnimated.View>
            </GestureDetector>
          </View>
        )}
      </>
    );
  },
);

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 999,
  },
  // 边缘触摸热区 — 覆盖屏幕左侧 20px，全高
  edgeZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: EDGE_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 998,
  },
  edgeTouchArea: {
    width: EDGE_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

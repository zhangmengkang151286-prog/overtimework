/**
 * 动画系统 - 流畅的动画过渡
 * 验证需求: 11.5
 */

import {Easing} from 'react-native-reanimated';

export const animations = {
  // 动画时长
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 800,
  },

  // 缓动函数
  easing: {
    linear: Easing.linear,
    ease: Easing.ease,
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    easeInOut: Easing.inOut(Easing.ease),

    // 弹性动画
    spring: Easing.elastic(1),
    bounce: Easing.bounce,

    // 贝塞尔曲线
    bezier: Easing.bezier(0.25, 0.1, 0.25, 1),

    // 自定义缓动
    smooth: Easing.bezier(0.4, 0.0, 0.2, 1),
    emphasized: Easing.bezier(0.0, 0.0, 0.2, 1),
    decelerated: Easing.bezier(0.0, 0.0, 0.2, 1),
    accelerated: Easing.bezier(0.4, 0.0, 1, 1),
  },

  // 预定义动画配置
  presets: {
    // 淡入淡出
    fade: {
      duration: 250,
      easing: Easing.ease,
    },

    // 滑动
    slide: {
      duration: 300,
      easing: Easing.out(Easing.ease),
    },

    // 缩放
    scale: {
      duration: 200,
      easing: Easing.out(Easing.ease),
    },

    // 弹簧
    spring: {
      duration: 400,
      easing: Easing.elastic(1),
    },

    // 平滑过渡（用于数据变化）
    smooth: {
      duration: 1000,
      easing: Easing.inOut(Easing.cubic),
    },

    // 快速响应（用于用户交互）
    quick: {
      duration: 150,
      easing: Easing.out(Easing.ease),
    },
  },

  // 交互动画配置
  interaction: {
    // 按钮按下
    press: {
      scale: 0.95,
      duration: 100,
      easing: Easing.out(Easing.ease),
    },

    // 悬停效果
    hover: {
      scale: 1.05,
      duration: 150,
      easing: Easing.out(Easing.ease),
    },

    // 点击波纹
    ripple: {
      duration: 600,
      easing: Easing.out(Easing.ease),
    },
  },

  // 页面过渡动画
  transition: {
    // 淡入
    fadeIn: {
      duration: 300,
      easing: Easing.out(Easing.ease),
    },

    // 淡出
    fadeOut: {
      duration: 200,
      easing: Easing.in(Easing.ease),
    },

    // 从右侧滑入
    slideInRight: {
      duration: 300,
      easing: Easing.out(Easing.ease),
    },

    // 从左侧滑入
    slideInLeft: {
      duration: 300,
      easing: Easing.out(Easing.ease),
    },

    // 从下方滑入
    slideInUp: {
      duration: 300,
      easing: Easing.out(Easing.ease),
    },

    // 从上方滑入
    slideInDown: {
      duration: 300,
      easing: Easing.out(Easing.ease),
    },
  },
} as const;

export type Animations = typeof animations;

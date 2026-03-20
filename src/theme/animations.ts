/**
 * 动画系统 - 统一的动画参数配置
 *
 * 所有组件的动画时长、缓动、弹簧参数都从这里取，不再硬编码魔法数字。
 * 同时导出 Reanimated 和 RN Animated 两种格式，方便渐进迁移。
 */

import {Easing as ReanimatedEasing} from 'react-native-reanimated';

// ============ 统一时长常量 ============
export const duration = {
  instant: 0,
  fast: 100,
  normal: 200,
  medium: 280,
  slow: 400,
  slower: 600,
  slowest: 800,
  data: 1000, // 数据变化动画（如数字滚轮、进度条）
} as const;

// ============ Reanimated 缓动 ============
export const easing = {
  linear: ReanimatedEasing.linear,
  ease: ReanimatedEasing.ease,
  easeOut: ReanimatedEasing.out(ReanimatedEasing.ease),
  easeIn: ReanimatedEasing.in(ReanimatedEasing.ease),
  easeInOut: ReanimatedEasing.inOut(ReanimatedEasing.ease),
  smooth: ReanimatedEasing.bezier(0.25, 0.1, 0.25, 1),
  decelerated: ReanimatedEasing.bezier(0.0, 0.0, 0.2, 1),
} as const;

// ============ 统一弹簧参数 ============
export const spring = {
  /** 通用弹簧 - 适用于大多数弹出/滑入动画 */
  default: {damping: 15, stiffness: 150, mass: 1},
  /** 轻快弹簧 - 适用于按钮、开关等小元素 */
  snappy: {damping: 20, stiffness: 300, mass: 0.8},
  /** 柔和弹簧 - 适用于面板、抽屉等大面积元素 */
  gentle: {damping: 20, stiffness: 120, mass: 1},
} as const;

// ============ 预设动画配置（Reanimated withTiming 参数） ============
export const presets = {
  /** 淡入淡出 */
  fade: {duration: duration.normal, easing: easing.ease},
  /** 快速淡出 */
  fadeOut: {duration: duration.fast, easing: easing.easeIn},
  /** 滑入（面板、抽屉从屏幕外进入） */
  slideIn: {duration: duration.medium, easing: easing.easeOut},
  /** 滑出（面板、抽屉退出屏幕） */
  slideOut: {duration: duration.normal, easing: easing.easeIn},
  /** 弹窗/覆盖层消失 */
  dismiss: {duration: duration.normal, easing: easing.easeIn},
  /** 快速响应（用户交互反馈） */
  quick: {duration: duration.fast, easing: easing.easeOut},
  /** 数据变化（进度条、数字、对抗条） */
  data: {duration: duration.slower, easing: easing.smooth},
  /** 骨架屏闪烁 */
  pulse: {duration: duration.slowest, easing: easing.easeInOut},
} as const;

// ============ 向后兼容的导出 ============
export const animations = {
  duration,
  easing,
  presets,
  spring,
  interaction: {
    press: {scale: 0.95, duration: duration.fast, easing: easing.easeOut},
    hover: {scale: 1.05, duration: duration.normal, easing: easing.easeOut},
  },
  transition: {
    fadeIn: {duration: duration.medium, easing: easing.easeOut},
    fadeOut: {duration: duration.normal, easing: easing.easeIn},
    slideInRight: {duration: duration.medium, easing: easing.easeOut},
    slideInLeft: {duration: duration.medium, easing: easing.easeOut},
    slideInUp: {duration: duration.medium, easing: easing.easeOut},
    slideInDown: {duration: duration.medium, easing: easing.easeOut},
  },
} as const;

export type Animations = typeof animations;

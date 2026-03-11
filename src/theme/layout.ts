/**
 * 布局系统 - 响应式布局和尺寸
 * 验证需求: 1.5, 11.4
 */

import {Dimensions, Platform} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export const layout = {
  // 屏幕尺寸
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  // 断点（用于响应式设计）
  breakpoints: {
    xs: 320,
    sm: 375,
    md: 414,
    lg: 768,
    xl: 1024,
  },

  // 判断屏幕尺寸
  isSmallDevice: SCREEN_WIDTH < 375,
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768,
  isTablet: SCREEN_WIDTH >= 768,

  // 圆角半径
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },

  // 边框宽度
  borderWidth: {
    none: 0,
    hairline: Platform.select({ios: 0.5, android: 1, default: 1}),
    thin: 1,
    medium: 2,
    thick: 3,
  },

  // 阴影预设
  shadow: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 16,
    },
  },

  // 不透明度
  opacity: {
    disabled: 0.4,
    hover: 0.8,
    pressed: 0.6,
    overlay: 0.5,
  },

  // 图标尺寸
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    '2xl': 48,
  },

  // 按钮高度
  buttonHeight: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
  },

  // 输入框高度
  inputHeight: {
    sm: 32,
    md: 40,
    lg: 48,
  },

  // 容器最大宽度
  containerMaxWidth: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },

  // Z-index层级
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },
} as const;

/**
 * 响应式尺寸计算
 */
export const responsive = {
  /**
   * 根据屏幕宽度缩放
   */
  scale: (size: number): number => {
    const baseWidth = 375; // iPhone X 基准宽度
    return (SCREEN_WIDTH / baseWidth) * size;
  },

  /**
   * 根据屏幕高度缩放
   */
  verticalScale: (size: number): number => {
    const baseHeight = 812; // iPhone X 基准高度
    return (SCREEN_HEIGHT / baseHeight) * size;
  },

  /**
   * 适度缩放（介于固定和完全缩放之间）
   */
  moderateScale: (size: number, factor: number = 0.5): number => {
    return size + (responsive.scale(size) - size) * factor;
  },

  /**
   * 根据屏幕尺寸返回不同的值
   */
  select: <T>(values: {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    default: T;
  }): T => {
    if (SCREEN_WIDTH < layout.breakpoints.sm && values.xs !== undefined) {
      return values.xs;
    }
    if (SCREEN_WIDTH < layout.breakpoints.md && values.sm !== undefined) {
      return values.sm;
    }
    if (SCREEN_WIDTH < layout.breakpoints.lg && values.md !== undefined) {
      return values.md;
    }
    if (SCREEN_WIDTH < layout.breakpoints.xl && values.lg !== undefined) {
      return values.lg;
    }
    if (values.xl !== undefined) {
      return values.xl;
    }
    return values.default;
  },
};

export type Layout = typeof layout;
export type Responsive = typeof responsive;

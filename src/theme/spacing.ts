/**
 * 间距系统 - 一致的布局间距
 * 验证需求: 11.4
 */

export const spacing = {
  // 基础间距单位 (4px)
  unit: 4,

  // 预定义间距值
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,

  // 内边距预设
  padding: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
  },

  // 外边距预设
  margin: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
  },

  // 间隙预设（用于flexbox gap）
  gap: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
  },

  // 容器内边距
  container: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },

  // 组件间距
  component: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // 屏幕边距
  screen: {
    horizontal: 16,
    vertical: 16,
  },
} as const;

export type Spacing = typeof spacing;

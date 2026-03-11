/**
 * 海报主题配置
 * 
 * 为分享海报功能提供专用的主题配置
 * 遵循应用的金融终端风格，支持深色/浅色主题
 * 
 * 验证需求: 13.1, 13.2, 13.3, 13.4
 */

import {Dimensions} from 'react-native';
import {colors} from './colors';
import {typography} from './typography';
import {layout} from './layout';

/**
 * 获取屏幕尺寸
 */
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

/**
 * 海报尺寸配置
 * 动态适配屏幕尺寸，确保在不同设备上都能正常显示
 */
export const posterDimensions = {
  // 海报宽度 = 屏幕宽度（用于全屏显示）
  width: SCREEN_WIDTH,
  // 海报高度 = 屏幕高度 * 0.8（留出顶部导航和底部按钮空间）
  height: SCREEN_HEIGHT * 0.8,
  // 宽高比
  aspectRatio: SCREEN_WIDTH / (SCREEN_HEIGHT * 0.8),
  // 内容区域宽度（减去左右边距）
  contentWidth: SCREEN_WIDTH - 48, // 左右各24px边距
} as const;

/**
 * 海报间距配置
 */
export const posterSpacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * 海报圆角配置
 */
export const posterBorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

/**
 * 海报阴影配置
 */
export const posterShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

/**
 * 海报浅色主题配置
 */
export const posterLightTheme = {
  // 背景色
  background: colors.light.background,
  backgroundGradient: ['#FFFFFF', '#F5F5F5'],
  backgroundSecondary: colors.light.backgroundSecondary,
  
  // 文本颜色
  text: colors.light.text,
  textSecondary: colors.light.textSecondary,
  textTertiary: colors.light.textTertiary,
  textInverse: colors.light.textInverse,
  
  // 边框颜色
  border: colors.light.border,
  borderLight: colors.light.borderLight,
  borderDark: colors.light.borderDark,
  
  // 主色调
  primary: colors.light.primary,
  primaryLight: colors.light.primaryLight,
  primaryDark: colors.light.primaryDark,
  
  // 强调色
  accent: '#FFD700', // 金色强调
  accentLight: '#FFE44D',
  accentDark: '#CCB000',
  
  // 状态颜色
  success: colors.light.success,
  warning: colors.light.warning,
  error: colors.light.error,
  info: colors.light.info,
  
  // 加班指数专用颜色
  overtime: colors.light.overtime,
  overtimeLight: colors.light.overtimeLight,
  overtimeDark: colors.light.overtimeDark,
  
  ontime: colors.light.ontime,
  ontimeLight: colors.light.ontimeLight,
  ontimeDark: colors.light.ontimeDark,
  
  pending: colors.light.pending,
  pendingLight: colors.light.pendingLight,
  pendingDark: colors.light.pendingDark,
  
  // 卡片颜色
  card: colors.light.card,
  cardBorder: colors.light.cardBorder,
  cardShadow: colors.light.cardShadow,
  
  // 图表颜色
  chartColors: colors.light.chartColors,
} as const;

/**
 * 海报深色主题配置
 * 遵循金融终端风格：纯黑背景 + 极细边框 + 高对比度
 */
export const posterDarkTheme = {
  // 背景色 - 深灰金融风（和纯黑页面背景区分）
  background: '#111114',
  backgroundGradient: ['#131316', '#0C0C0E'],
  backgroundSecondary: colors.dark.backgroundSecondary, // #09090B
  
  // 文本颜色 - 高对比度
  text: colors.dark.text, // #E8EAED
  textSecondary: colors.dark.textSecondary, // #B8BBBE
  textTertiary: colors.dark.textTertiary, // #8A8D91
  textInverse: colors.dark.textInverse, // #000000
  
  // 边框颜色 - 极细专业感
  border: colors.dark.border, // #27272A
  borderLight: colors.dark.borderLight, // #3F3F46
  borderDark: colors.dark.borderDark, // #18181B
  
  // 主色调 - 下班青色
  primary: colors.dark.primary, // #00D9FF
  primaryLight: colors.dark.primaryLight,
  primaryDark: colors.dark.primaryDark,
  
  // 强调色 - 金色
  accent: '#FFD700',
  accentLight: '#FFE44D',
  accentDark: '#CCB000',
  
  // 状态颜色
  success: colors.dark.success, // #00C896
  warning: colors.dark.warning, // #FFB020
  error: colors.dark.error, // #EF4444
  info: colors.dark.info, // #00D9FF
  
  // 加班指数专用颜色
  overtime: colors.dark.overtime, // #EF4444
  overtimeLight: colors.dark.overtimeLight,
  overtimeDark: colors.dark.overtimeDark,
  
  ontime: colors.dark.ontime, // #00C896
  ontimeLight: colors.dark.ontimeLight,
  ontimeDark: colors.dark.ontimeDark,
  
  pending: colors.dark.pending, // #FFB020
  pendingLight: colors.dark.pendingLight,
  pendingDark: colors.dark.pendingDark,
  
  // 卡片颜色
  card: colors.dark.card, // #09090B
  cardBorder: colors.dark.cardBorder, // #27272A
  cardShadow: 'none', // 禁用阴影
  
  // 图表颜色 - 专业数据可视化配色
  chartColors: colors.dark.chartColors,
} as const;

/**
 * 海报字体配置
 */
export const posterTypography = {
  // 标题样式
  title: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  
  // 副标题样式
  subtitle: {
    fontSize: 24,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: 32,
    letterSpacing: -0.25,
  },
  
  // 正文样式
  body: {
    fontSize: 18,
    fontWeight: typography.fontWeight.regular,
    lineHeight: 24,
    letterSpacing: 0,
  },
  
  // 小号正文
  bodySmall: {
    fontSize: 16,
    fontWeight: typography.fontWeight.regular,
    lineHeight: 22,
    letterSpacing: 0,
  },
  
  // 标签样式
  caption: {
    fontSize: 14,
    fontWeight: typography.fontWeight.regular,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  
  // 数字样式 - 等宽字体
  number: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 56,
    letterSpacing: -1,
    fontFamily: typography.fontFamily.monospace,
  },
  
  // 小号数字
  numberSmall: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: typography.fontFamily.monospace,
  },
  
  // 数据标签 - 专业数据展示
  dataLabel: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  
  // 时间样式 - 等宽字体
  time: {
    fontSize: 16,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 22,
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily.monospace,
  },
} as const;

/**
 * 海报布局配置
 */
export const posterLayout = {
  // 内边距
  padding: posterSpacing.lg, // 24px
  contentPadding: posterSpacing.lg, // 24px (内容区域内边距)
  
  // Header 高度
  headerHeight: 80,
  
  // Footer 高度
  footerHeight: 80,
  
  // Content 区域高度
  contentHeight: posterDimensions.height - 80 - 80, // 1174px
  
  // 头像尺寸
  avatarSize: 48,
  
  // Logo 尺寸
  logoSize: 32,
  
  // 图标尺寸
  iconSize: {
    sm: 16,
    md: 24,
    lg: 32,
  },
  
  // 卡片间距
  cardSpacing: posterSpacing.md, // 16px
  
  // 元素间距
  elementSpacing: posterSpacing.sm, // 12px
} as const;

/**
 * 海报主题类型
 */
export type PosterTheme = typeof posterLightTheme | typeof posterDarkTheme;

/**
 * 完整的海报主题配置
 */
export const posterTheme = {
  // 尺寸
  dimensions: posterDimensions,
  
  // 间距
  spacing: posterSpacing,
  
  // 圆角
  borderRadius: posterBorderRadius,
  
  // 阴影
  shadows: posterShadows,
  
  // 颜色主题
  colors: {
    light: posterLightTheme,
    dark: posterDarkTheme,
  },
  
  // 字体
  typography: posterTypography,
  
  // 布局
  layout: posterLayout,
} as const;

/**
 * 获取海报主题
 * @param isDark 是否为深色主题
 * @returns 海报主题配置
 */
export const getPosterTheme = (isDark: boolean): PosterTheme => {
  return isDark ? posterDarkTheme : posterLightTheme;
};

export default posterTheme;

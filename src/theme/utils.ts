/**
 * 主题工具函数
 * 提供便捷的样式创建和主题相关的辅助函数
 */

import {StyleSheet, ViewStyle, TextStyle, ImageStyle} from 'react-native';
import {Theme} from './index';

/**
 * 创建带主题的样式
 * 允许根据主题动态生成样式
 */
export const createThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  stylesFn: (theme: Theme) => T,
) => {
  return (theme: Theme): T => {
    return StyleSheet.create(stylesFn(theme));
  };
};

/**
 * 合并样式
 * 类型安全的样式合并函数
 */
export const mergeStyles = <
  T extends ViewStyle | TextStyle | ImageStyle = ViewStyle,
>(
  ...styles: (T | undefined | false | null)[]
): T => {
  return styles
    .filter((style): style is T => Boolean(style))
    .reduce((acc, style) => {
      return {...acc, ...style};
    }, {} as T);
};

/**
 * 添加透明度到颜色
 * @param color - 十六进制颜色值 (如 '#FF0000')
 * @param opacity - 透明度 (0-1)
 * @returns 带透明度的颜色字符串
 */
export const addOpacity = (color: string, opacity: number): string => {
  // 移除 # 号
  const hex = color.replace('#', '');

  // 转换透明度为十六进制 (0-255)
  const alpha = Math.round(opacity * 255);
  const alphaHex = alpha.toString(16).padStart(2, '0');

  // 返回带透明度的颜色
  return `#${hex}${alphaHex}`;
};

/**
 * 根据主题返回不同的值
 */
export const themeValue = <T>(theme: Theme, lightValue: T, darkValue: T): T => {
  return theme.isDark ? darkValue : lightValue;
};

/**
 * 创建阴影样式
 * 根据平台和主题生成合适的阴影
 */
export const createShadow = (
  theme: Theme,
  elevation: 'sm' | 'md' | 'lg' | 'xl' = 'md',
): ViewStyle => {
  const shadow = theme.layout.shadow[elevation];

  // 在深色模式下，阴影应该更明显
  if (theme.isDark) {
    return {
      ...shadow,
      shadowOpacity: (shadow.shadowOpacity || 0) * 1.5,
    };
  }

  return shadow;
};

/**
 * 获取对比色
 * 根据背景色返回合适的文本颜色
 */
export const getContrastColor = (
  theme: Theme,
  backgroundColor: string,
): string => {
  // 简化版本：根据主题返回对比色
  // 实际应用中可以使用更复杂的算法计算亮度
  return theme.isDark ? theme.colors.text : theme.colors.text;
};

/**
 * 创建渐变色数组
 * 在两个颜色之间生成渐变
 */
export const createGradient = (
  startColor: string,
  endColor: string,
  steps: number = 5,
): string[] => {
  // 简化版本：返回起始和结束颜色
  // 实际应用中可以实现真正的颜色插值
  return [startColor, endColor];
};

/**
 * 判断是否为小屏幕设备
 */
export const isSmallScreen = (theme: Theme): boolean => {
  return theme.layout.isSmallDevice;
};

/**
 * 判断是否为平板设备
 */
export const isTablet = (theme: Theme): boolean => {
  return theme.layout.isTablet;
};

/**
 * 获取安全的间距值
 * 确保间距值在合理范围内
 */
export const getSafeSpacing = (
  theme: Theme,
  spacing: keyof typeof theme.spacing,
): number => {
  const value = theme.spacing[spacing];
  return typeof value === 'number' ? Math.max(0, value) : 0;
};

/**
 * 创建圆角样式
 */
export const createBorderRadius = (
  theme: Theme,
  radius: keyof typeof theme.layout.borderRadius,
): ViewStyle => {
  return {
    borderRadius: theme.layout.borderRadius[radius],
  };
};

/**
 * 创建边框样式
 */
export const createBorder = (
  theme: Theme,
  width: keyof typeof theme.layout.borderWidth = 'thin',
  color?: string,
): ViewStyle => {
  return {
    borderWidth: theme.layout.borderWidth[width],
    borderColor: color || theme.colors.border,
  };
};

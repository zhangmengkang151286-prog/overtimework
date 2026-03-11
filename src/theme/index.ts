/**
 * 主题系统 - 统一的设计系统
 * 验证需求: 3.2, 11.1-11.5
 */

import {lightColors, darkColors, ColorScheme} from './colors';
import {typography, Typography} from './typography';
import {spacing, Spacing} from './spacing';
import {layout, responsive, Layout, Responsive} from './layout';
import {animations, Animations} from './animations';

export interface Theme {
  colors: ColorScheme;
  typography: Typography;
  spacing: Spacing;
  layout: Layout;
  animations: Animations;
  isDark: boolean;
}

/**
 * 创建主题对象
 */
export const createTheme = (mode: 'light' | 'dark'): Theme => ({
  colors: mode === 'dark' ? darkColors : lightColors,
  typography,
  spacing,
  layout,
  animations,
  isDark: mode === 'dark',
});

/**
 * 预定义主题
 */
export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');

/**
 * 获取主题
 */
export const getTheme = (mode: 'light' | 'dark'): Theme => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

/**
 * 导出所有主题相关模块
 */
export {lightColors, darkColors} from './colors';
export {typography} from './typography';
export {spacing} from './spacing';
export {layout, responsive} from './layout';
export {animations} from './animations';
export * from './utils';

export type {ColorScheme} from './colors';
export type {Typography} from './typography';
export type {Spacing} from './spacing';
export type {Layout, Responsive} from './layout';
export type {Animations} from './animations';

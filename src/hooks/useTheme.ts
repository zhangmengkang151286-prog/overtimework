/**
 * useTheme Hook - 在组件中使用主题
 * 验证需求: 3.2, 11.1
 *
 * 注意：此文件保持向后兼容性
 * 新代码请使用 useThemeToggle 获取完整的主题切换功能
 */

import {useAppSelector} from './redux';
import {getTheme, Theme} from '../theme';

/**
 * 获取当前主题的Hook（返回旧的主题对象）
 *
 * @deprecated 建议使用 useThemeToggle 获取更完整的主题功能
 */
export const useTheme = (): Theme => {
  const themeMode = useAppSelector((state: any) => state.ui.theme);
  return getTheme(themeMode);
};

/**
 * 获取主题模式的Hook
 *
 * @deprecated 建议使用 useThemeToggle().theme
 */
export const useThemeMode = (): 'light' | 'dark' => {
  return useAppSelector((state: any) => state.ui.theme);
};

/**
 * 判断是否为深色模式的Hook
 *
 * @deprecated 建议使用 useThemeToggle().isDark
 */
export const useIsDarkMode = (): boolean => {
  const themeMode = useAppSelector((state: any) => state.ui.theme);
  return themeMode === 'dark';
};

// 导出新的主题切换 Hook
export {useThemeToggle, type ThemeToggleResult} from './useThemeToggle';

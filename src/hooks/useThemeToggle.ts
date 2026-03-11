/**
 * useThemeToggle Hook - 主题切换功能
 * 集成 gluestack-ui 的主题系统并支持持久化
 * 验证需求: 1.2, 2.1, 7.1, 10.5, 3.5
 */

import {useEffect, useState, useCallback} from 'react';
import {useColorMode} from '@gluestack-ui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAppDispatch, useAppSelector} from './redux';
import {setTheme as setReduxTheme} from '../store/slices/uiSlice';

const THEME_STORAGE_KEY = '@app/theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeToggleResult {
  /** 当前主题模式 */
  theme: ThemeMode;
  /** 是否为深色模式 */
  isDark: boolean;
  /** 切换主题 */
  toggleTheme: () => void;
  /** 设置特定主题 */
  setTheme: (mode: ThemeMode) => void;
  /** gluestack-ui colorMode */
  gluestackColorMode: string;
  /** 主题是否正在加载 */
  isLoading: boolean;
}

/**
 * 主题切换 Hook
 *
 * 功能：
 * 1. 集成 gluestack-ui 的 useColorMode
 * 2. 支持主题持久化（AsyncStorage）
 * 3. 与 Redux store 同步
 * 4. 提供切换和设置主题的方法
 *
 * @example
 * ```tsx
 * const { theme, isDark, toggleTheme, setTheme } = useThemeToggle();
 *
 * // 切换主题
 * <Button onPress={toggleTheme}>
 *   {isDark ? '切换到浅色' : '切换到深色'}
 * </Button>
 *
 * // 设置特定主题
 * <Button onPress={() => setTheme('dark')}>深色模式</Button>
 * ```
 */
export const useThemeToggle = (): ThemeToggleResult => {
  const dispatch = useAppDispatch();
  const reduxTheme = useAppSelector((state: any) => state.ui.theme);
  const gluestackColorMode = useColorMode();
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：从 AsyncStorage 加载保存的主题
  useEffect(() => {
    loadPersistedTheme();
  }, []);

  /**
   * 从 AsyncStorage 加载保存的主题
   */
  const loadPersistedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        // 如果有保存的主题且与当前 Redux 主题不同，更新 Redux
        if (savedTheme !== reduxTheme) {
          dispatch(setReduxTheme(savedTheme));
        }
        // 同步 gluestack-ui 的 colorMode
        if (gluestackColorMode && savedTheme !== gluestackColorMode) {
          gluestackColorMode.setColorMode(savedTheme);
        }
      }
    } catch (error) {
      console.error('Failed to load persisted theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 持久化主题到 AsyncStorage
   */
  const persistTheme = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to persist theme:', error);
    }
  };

  /**
   * 设置主题
   */
  const setTheme = useCallback(
    (mode: ThemeMode) => {
      // 更新 Redux store
      dispatch(setReduxTheme(mode));
      // 更新 gluestack-ui colorMode
      if (gluestackColorMode) {
        gluestackColorMode.setColorMode(mode);
      }
      // 持久化到 AsyncStorage
      persistTheme(mode);
    },
    [dispatch, gluestackColorMode],
  );

  /**
   * 切换主题
   */
  const toggleTheme = useCallback(() => {
    const newTheme: ThemeMode = reduxTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [reduxTheme, setTheme]);

  return {
    theme: reduxTheme,
    isDark: reduxTheme === 'dark',
    toggleTheme,
    setTheme,
    gluestackColorMode: gluestackColorMode?.colorMode || reduxTheme,
    isLoading,
  };
};

/**
 * 获取当前主题模式的 Hook（简化版）
 */
export const useThemeMode = (): ThemeMode => {
  const reduxTheme = useAppSelector((state: any) => state.ui.theme);
  return reduxTheme;
};

/**
 * 判断是否为深色模式的 Hook（简化版）
 */
export const useIsDarkMode = (): boolean => {
  const reduxTheme = useAppSelector((state: any) => state.ui.theme);
  return reduxTheme === 'dark';
};

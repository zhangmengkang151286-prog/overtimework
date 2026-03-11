/**
 * useThemeToggle Hook 测试
 * 验证需求: 1.2, 2.1, 7.1, 10.5
 */

import React from 'react';
import {renderHook, act, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useThemeToggle} from '../useThemeToggle';
import uiReducer from '../../store/slices/uiSlice';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('useThemeToggle', () => {
  let store: any;

  beforeEach(() => {
    // 创建测试 store
    store = configureStore({
      reducer: {
        ui: uiReducer,
      },
    });

    // 清除 mock
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  const wrapper = ({children}: any) => (
    <Provider store={store}>{children}</Provider>
  );

  describe('初始化', () => {
    it('应该返回默认的深色主题', async () => {
      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('应该从 AsyncStorage 加载保存的主题', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('light');

      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@app/theme');
    });
  });

  describe('setTheme', () => {
    it('应该设置主题并持久化', async () => {
      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setTheme('light');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
      });

      expect(result.current.isDark).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app/theme', 'light');
    });

    it('应该能够设置深色主题', async () => {
      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setTheme('dark');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });

      expect(result.current.isDark).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app/theme', 'dark');
    });
  });

  describe('toggleTheme', () => {
    it('应该从深色切换到浅色', async () => {
      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 初始为深色
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
      });

      expect(result.current.isDark).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app/theme', 'light');
    });

    it('应该从浅色切换到深色', async () => {
      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 先设置为浅色
      act(() => {
        result.current.setTheme('light');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
      });

      // 切换到深色
      act(() => {
        result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });

      expect(result.current.isDark).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app/theme', 'dark');
    });

    it('应该能够多次切换主题', async () => {
      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 第一次切换：深色 -> 浅色
      act(() => {
        result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
      });

      // 第二次切换：浅色 -> 深色
      act(() => {
        result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });

      // 第三次切换：深色 -> 浅色
      act(() => {
        result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('持久化', () => {
    it('应该在设置主题时保存到 AsyncStorage', async () => {
      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setTheme('light');
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@app/theme',
          'light',
        );
      });
    });

    it('应该在切换主题时保存到 AsyncStorage', async () => {
      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('应该处理 AsyncStorage 错误', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error'),
      );

      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 应该使用默认主题
      expect(result.current.theme).toBe('dark');

      consoleError.mockRestore();
    });
  });

  describe('Redux 同步', () => {
    it('应该与 Redux store 同步', async () => {
      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setTheme('light');
      });

      await waitFor(() => {
        expect(store.getState().ui.theme).toBe('light');
      });
    });

    it('应该反映 Redux store 的变化', async () => {
      const {result} = renderHook(() => useThemeToggle(), {wrapper});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 直接修改 Redux store
      act(() => {
        store.dispatch({type: 'ui/setTheme', payload: 'light'});
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
      });
    });
  });
});

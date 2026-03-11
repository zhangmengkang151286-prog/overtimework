/**
 * useThemeToggle Hook 测试 - gluestack-ui 集成
 * 验证需求: 3.5
 */

import React from 'react';
import {renderHook, act, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useThemeToggle} from '../useThemeToggle';
import {store} from '../../store';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock gluestack-ui
jest.mock('@gluestack-ui/themed', () => ({
  useColorMode: () => ({
    colorMode: 'dark',
    setColorMode: jest.fn(),
  }),
  GluestackUIProvider: ({children}: any) => children,
}));

// 测试包装器
const wrapper = ({children}: {children: React.ReactNode}) => (
  <Provider store={store}>{children}</Provider>
);

describe('useThemeToggle - gluestack-ui 集成', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('应该正确初始化主题', async () => {
    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.theme).toBeDefined();
    expect(typeof result.current.isDark).toBe('boolean');
  });

  it('应该从 AsyncStorage 加载保存的主题', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('light');

    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@app/theme');
  });

  it('应该能够切换主题', async () => {
    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialTheme = result.current.theme;

    act(() => {
      result.current.toggleTheme();
    });

    await waitFor(() => {
      expect(result.current.theme).not.toBe(initialTheme);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('应该能够设置特定主题', async () => {
    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setTheme('light');
    });

    await waitFor(() => {
      expect(result.current.theme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app/theme', 'light');
  });

  it('应该持久化主题到 AsyncStorage', async () => {
    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setTheme('dark');
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app/theme', 'dark');
    });
  });

  it('应该在切换主题时更新 isDark 状态', async () => {
    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 切换到浅色
    act(() => {
      result.current.setTheme('light');
    });

    await waitFor(() => {
      expect(result.current.isDark).toBe(false);
    });

    // 切换回深色
    act(() => {
      result.current.setTheme('dark');
    });

    await waitFor(() => {
      expect(result.current.isDark).toBe(true);
    });
  });

  it('应该提供 gluestackColorMode', async () => {
    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.gluestackColorMode).toBeDefined();
  });

  it('应该在 AsyncStorage 加载失败时使用默认主题', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
      new Error('Storage error'),
    );

    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 应该使用默认主题
    expect(result.current.theme).toBeDefined();
  });

  it('应该在持久化失败时继续工作', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
      new Error('Storage error'),
    );

    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 即使持久化失败，主题切换应该仍然工作
    act(() => {
      result.current.setTheme('light');
    });

    await waitFor(() => {
      expect(result.current.theme).toBe('light');
    });
  });

  it('应该提供 toggleTheme 函数', async () => {
    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('应该提供 setTheme 函数', async () => {
    const {result} = renderHook(() => useThemeToggle(), {wrapper});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.setTheme).toBe('function');
  });
});

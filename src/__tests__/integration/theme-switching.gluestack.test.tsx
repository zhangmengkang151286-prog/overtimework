/**
 * 主题切换集成测试 - gluestack-ui
 * 验证需求: 3.5
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config as gluestackConfig} from '@gluestack-ui/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SettingsScreen} from '../../screens/SettingsScreen';
import {store} from '../../store';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    reset: jest.fn(),
  }),
}));

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getTags: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../services/storage', () => ({
  storageService: {
    logout: jest.fn(),
  },
}));

// 测试包装器
const TestWrapper = ({children}: {children: React.ReactNode}) => (
  <GluestackUIProvider config={gluestackConfig}>
    <Provider store={store}>{children}</Provider>
  </GluestackUIProvider>
);

describe('主题切换集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('应该在设置页面显示主题切换开关', async () => {
    const {getByText} = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(getByText('深色模式')).toBeTruthy();
    });
  });

  it('应该显示当前主题状态', async () => {
    const {getByText} = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      // 默认是深色主题
      expect(getByText('当前为深色主题')).toBeTruthy();
    });
  });

  it('应该能够通过开关切换主题', async () => {
    const {getByRole, getByText} = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(getByText('深色模式')).toBeTruthy();
    });

    // 查找并点击开关
    const switchElement = getByRole('switch');
    fireEvent(switchElement, 'onValueChange', false);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app/theme', 'light');
    });
  });

  it('应该在应用启动时加载保存的主题', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('light');

    render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@app/theme');
    });
  });

  it('应该在主题切换后持久化到 AsyncStorage', async () => {
    const {getByRole} = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>,
    );

    await waitFor(() => {
      const switchElement = getByRole('switch');
      expect(switchElement).toBeTruthy();
    });

    const switchElement = getByRole('switch');

    // 切换到浅色模式
    fireEvent(switchElement, 'onValueChange', false);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app/theme', 'light');
    });

    // 切换回深色模式
    fireEvent(switchElement, 'onValueChange', true);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app/theme', 'dark');
    });
  });
});

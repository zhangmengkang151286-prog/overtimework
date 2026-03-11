/**
 * 用户交互流程集成测试 - gluestack-ui
 * 验证需求: 9.2
 *
 * 测试完整的用户交互流程
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {configureStore} from '@reduxjs/toolkit';
import dataReducer from '../../store/slices/dataSlice';
import uiReducer from '../../store/slices/uiSlice';
import userReducer from '../../store/slices/userSlice';
import TrendPage from '../../screens/TrendPage';
import {SettingsScreen} from '../../screens/SettingsScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
  }),
}));

// Mock supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'tag-1',
              name: '互联网',
              category: 'industry',
            },
          ],
          error: null,
        }),
      })),
      insert: jest.fn().mockResolvedValue({data: null, error: null}),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({data: null, error: null}),
      })),
    })),
    auth: {
      signOut: jest.fn().mockResolvedValue({error: null}),
    },
  },
}));

jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getTags: jest.fn().mockResolvedValue([
      {id: 'tag-1', name: '互联网', category: 'industry'},
      {id: 'tag-2', name: '金融', category: 'industry'},
    ]),
    submitStatus: jest.fn().mockResolvedValue({success: true}),
  },
}));

jest.mock('../../services/storage', () => ({
  storageService: {
    logout: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock useUserStatus
jest.mock('../../hooks/useUserStatus', () => ({
  useUserStatus: jest.fn(() => ({
    status: null,
    hasSubmittedToday: false,
    submitStatus: jest.fn().mockResolvedValue({success: true}),
    forceResetTodayStatus: jest.fn(),
    shouldShowSelector: true,
  })),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
  addEventListener: jest.fn(() => jest.fn()),
}));

// 创建测试用的 store
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      data: dataReducer,
      ui: uiReducer,
      user: userReducer,
    },
    preloadedState: {
      data: {
        realTimeData: {
          timestamp: new Date(),
          participantCount: 100,
          overtimeCount: 60,
          onTimeCount: 40,
          tagDistribution: [
            {tag: '互联网', count: 30},
            {tag: '金融', count: 20},
          ],
          dailyStatus: [
            {date: '2024-02-01', overtime_count: 50, ontime_count: 30},
            {date: '2024-02-02', overtime_count: 60, ontime_count: 40},
          ],
        },
        selectedTime: new Date().toISOString(),
        isViewingHistory: false,
        tags: [
          {id: 'tag-1', name: '互联网', category: 'industry'},
          {id: 'tag-2', name: '金融', category: 'industry'},
        ],
      },
      ui: {
        isMenuOpen: false,
        theme: 'dark',
      },
      user: {
        user: {
          id: 'test-id',
          phone_number: '13800138000',
          name: '测试用户',
        },
        isAuthenticated: true,
      },
      ...preloadedState,
    },
  });
};

// 测试包装器
const TestWrapper = ({
  children,
  store,
}: {
  children: React.ReactNode;
  store?: any;
}) => {
  const testStore = store || createTestStore();
  return (
    <GluestackUIProvider config={config}>
      <Provider store={testStore}>{children}</Provider>
    </GluestackUIProvider>
  );
};

describe('状态提交流程测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该能够选择加班状态', async () => {
    const store = createTestStore();
    const {getByText} = render(
      <TestWrapper store={store}>
        <TrendPage />
      </TestWrapper>,
    );

    // 等待页面加载
    await waitFor(() => {
      expect(getByText('打工人下班指数')).toBeTruthy();
    });

    // 查找并点击加班按钮
    const overtimeButton = getByText('加班');
    fireEvent.press(overtimeButton);

    // 验证状态更新
    await waitFor(() => {
      const state = store.getState();
      expect(state.user.user?.status).toBe('overtime');
    });
  });

  it('应该能够选择准时下班状态', async () => {
    const store = createTestStore();
    const {getByText} = render(
      <TestWrapper store={store}>
        <TrendPage />
      </TestWrapper>,
    );

    // 等待页面加载
    await waitFor(() => {
      expect(getByText('打工人下班指数')).toBeTruthy();
    });

    // 查找并点击准时下班按钮
    const ontimeButton = getByText('准时下班');
    fireEvent.press(ontimeButton);

    // 验证状态更新
    await waitFor(() => {
      const state = store.getState();
      expect(state.user.user?.status).toBe('ontime');
    });
  });

  it('应该能够切换状态', async () => {
    const store = createTestStore();
    const {getByText} = render(
      <TestWrapper store={store}>
        <TrendPage />
      </TestWrapper>,
    );

    // 等待页面加载
    await waitFor(() => {
      expect(getByText('打工人下班指数')).toBeTruthy();
    });

    // 先选择加班
    const overtimeButton = getByText('加班');
    fireEvent.press(overtimeButton);

    await waitFor(() => {
      const state = store.getState();
      expect(state.user.user?.status).toBe('overtime');
    });

    // 再切换到准时下班
    const ontimeButton = getByText('准时下班');
    fireEvent.press(ontimeButton);

    await waitFor(() => {
      const state = store.getState();
      expect(state.user.user?.status).toBe('ontime');
    });
  });
});

describe('数据可视化交互测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该显示实时数据', async () => {
    const store = createTestStore();
    const {getByText} = render(
      <TestWrapper store={store}>
        <TrendPage />
      </TestWrapper>,
    );

    // 验证显示参与人数
    await waitFor(() => {
      expect(getByText('100')).toBeTruthy();
    });

    // 验证显示加班人数
    expect(getByText('60')).toBeTruthy();

    // 验证显示准时下班人数
    expect(getByText('40')).toBeTruthy();
  });

  it('应该显示标签分布', async () => {
    const store = createTestStore();
    const {getByText} = render(
      <TestWrapper store={store}>
        <TrendPage />
      </TestWrapper>,
    );

    // 验证显示标签
    await waitFor(() => {
      expect(getByText('互联网')).toBeTruthy();
    });

    expect(getByText('金融')).toBeTruthy();
  });

  it('应该能够查看历史数据', async () => {
    const store = createTestStore();
    const {getByText, getByTestId} = render(
      <TestWrapper store={store}>
        <TrendPage />
      </TestWrapper>,
    );

    // 等待页面加载
    await waitFor(() => {
      expect(getByText('打工人下班指数')).toBeTruthy();
    });

    // 点击历史数据按钮
    const historyButton = getByTestId('history-button');
    fireEvent.press(historyButton);

    // 验证切换到历史视图
    await waitFor(() => {
      const state = store.getState();
      expect(state.data.isViewingHistory).toBe(true);
    });
  });
});

describe('设置页面交互测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该显示用户信息', async () => {
    const store = createTestStore();
    const {getByText} = render(
      <TestWrapper store={store}>
        <SettingsScreen />
      </TestWrapper>,
    );

    // 验证显示用户名
    await waitFor(() => {
      expect(getByText('测试用户')).toBeTruthy();
    });

    // 验证显示手机号
    expect(getByText('13800138000')).toBeTruthy();
  });

  it('应该能够退出登录', async () => {
    const store = createTestStore();
    const {getByText} = render(
      <TestWrapper store={store}>
        <SettingsScreen />
      </TestWrapper>,
    );

    // 等待页面加载
    await waitFor(() => {
      expect(getByText('设置')).toBeTruthy();
    });

    // 点击退出登录
    const logoutButton = getByText('退出登录');
    fireEvent.press(logoutButton);

    // 验证调用退出登录
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalled();
    });
  });

  it('应该能够切换主题', async () => {
    const store = createTestStore();
    const {getByRole} = render(
      <TestWrapper store={store}>
        <SettingsScreen />
      </TestWrapper>,
    );

    // 等待页面加载
    await waitFor(() => {
      const switchElement = getByRole('switch');
      expect(switchElement).toBeTruthy();
    });

    // 切换主题
    const switchElement = getByRole('switch');
    fireEvent(switchElement, 'onValueChange', false);

    // 验证主题更新
    await waitFor(() => {
      const state = store.getState();
      expect(state.ui.theme).toBe('light');
    });
  });
});

describe('完整用户流程测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该能够完成完整的状态提交流程', async () => {
    const store = createTestStore();
    const {getByText} = render(
      <TestWrapper store={store}>
        <TrendPage />
      </TestWrapper>,
    );

    // 1. 等待页面加载
    await waitFor(() => {
      expect(getByText('打工人下班指数')).toBeTruthy();
    });

    // 2. 选择状态
    const overtimeButton = getByText('加班');
    fireEvent.press(overtimeButton);

    // 3. 验证状态更新
    await waitFor(() => {
      const state = store.getState();
      expect(state.user.user?.status).toBe('overtime');
    });

    // 4. 验证数据更新
    await waitFor(() => {
      const state = store.getState();
      expect(state.data.realTimeData.overtimeCount).toBeGreaterThan(0);
    });
  });

  it('应该能够完成完整的设置流程', async () => {
    const store = createTestStore();
    const {getByText, getByRole} = render(
      <TestWrapper store={store}>
        <SettingsScreen />
      </TestWrapper>,
    );

    // 1. 等待页面加载
    await waitFor(() => {
      expect(getByText('设置')).toBeTruthy();
    });

    // 2. 切换主题
    const switchElement = getByRole('switch');
    fireEvent(switchElement, 'onValueChange', false);

    // 3. 验证主题更新
    await waitFor(() => {
      const state = store.getState();
      expect(state.ui.theme).toBe('light');
    });

    // 4. 退出登录
    const logoutButton = getByText('退出登录');
    fireEvent.press(logoutButton);

    // 5. 验证导航到登录页
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalled();
    });
  });
});

describe('错误处理测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该处理网络错误', async () => {
    // Mock 网络错误
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const supabaseService = require('../../services/supabaseService');
    supabaseService.supabaseService.submitStatus.mockRejectedValue(
      new Error('Network error'),
    );

    const store = createTestStore();
    const {getByText} = render(
      <TestWrapper store={store}>
        <TrendPage />
      </TestWrapper>,
    );

    // 等待页面加载
    await waitFor(() => {
      expect(getByText('打工人下班指数')).toBeTruthy();
    });

    // 尝试提交状态
    const overtimeButton = getByText('加班');
    fireEvent.press(overtimeButton);

    // 验证显示错误提示
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    jest.restoreAllMocks();
  });

  it('应该处理未登录状态', async () => {
    const store = createTestStore({
      user: {
        user: null,
        isAuthenticated: false,
      },
    });

    const {getByText} = render(
      <TestWrapper store={store}>
        <TrendPage />
      </TestWrapper>,
    );

    // 验证显示登录提示
    await waitFor(() => {
      expect(getByText('请先登录')).toBeTruthy();
    });
  });
});

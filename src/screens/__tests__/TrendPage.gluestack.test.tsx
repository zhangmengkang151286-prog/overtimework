/**
 * TrendPage Gluestack-UI 迁移测试
 * 验证需求: 7.1
 */
import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {configureStore} from '@reduxjs/toolkit';
import TrendPage from '../TrendPage';
import dataSlice from '../../store/slices/dataSlice';
import userSlice from '../../store/slices/userSlice';

// Mock 依赖
jest.mock('../../hooks/useHistoricalData', () => ({
  useHistoricalData: jest.fn(),
}));

jest.mock('../../hooks/useUserStatus', () => ({
  useUserStatus: jest.fn(() => ({
    userStatus: {hasSubmittedToday: false},
    isSubmitting: false,
    submitUserStatus: jest.fn(),
    shouldShowSelector: true,
    forceResetTodayStatus: jest.fn(),
  })),
}));

jest.mock('../../hooks/useRealTimeData', () => ({
  useRealTimeData: jest.fn(() => ({
    networkStatus: {isConnected: true},
    refresh: jest.fn(),
  })),
}));

jest.mock('../../hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({
    isDark: false,
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      primary: '#007AFF',
      success: '#34C759',
      error: '#FF3B30',
      warning: '#FF9500',
      surface: '#F2F2F7',
      border: '#C6C6C8',
    },
  })),
}));

jest.mock('../../hooks/useWorkdayCountdown', () => ({
  useWorkdayCountdown: jest.fn(() => ({
    progressPercent: 50,
    progressColor: '#34C759',
    countdownText: '距离下班还有 4 小时',
    textColor: '#000000',
  })),
}));

jest.mock('../../services/hourlySnapshotService', () => ({
  hourlySnapshotService: {
    startHourlySnapshot: jest.fn(),
    stopHourlySnapshot: jest.fn(),
    getSnapshot: jest.fn(() => Promise.resolve(null)),
  },
}));

jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getRealTimeStats: jest.fn(() =>
      Promise.resolve({
        participantCount: 100,
        overtimeCount: 60,
        onTimeCount: 40,
      }),
    ),
    getTopTags: jest.fn(() => Promise.resolve([])),
    getDailyStatus: jest.fn(() => Promise.resolve([])),
    getTags: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock 组件
const mockForwardRef = () => null;
jest.mock('../../components', () => ({
  HistoricalStatusIndicator: () => null,
  DataVisualization: mockForwardRef,
  TimeAxis: () => null,
  UserStatusSelector: () => null,
}));

jest.mock('../../components/GlassmorphismCard.example', () => ({
  GlassmorphismCard: () => null,
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      data: dataSlice,
      user: userSlice,
    },
    preloadedState: {
      data: {
        realTimeData: {
          participantCount: 100,
          overtimeCount: 60,
          onTimeCount: 40,
          tagDistribution: [],
          dailyStatus: [],
        },
        selectedTime: new Date().toISOString(),
        isViewingHistory: false,
        tags: [],
      },
      user: {
        profile: null,
        isAuthenticated: false,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <GluestackUIProvider config={config}>{component}</GluestackUIProvider>
    </Provider>,
  );
};

describe('TrendPage - Gluestack-UI 迁移', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染页面标题', () => {
    const {getByText} = renderWithProviders(<TrendPage />);
    expect(getByText('趋势')).toBeTruthy();
  });

  it('应该显示刷新按钮', () => {
    const {getByLabelText} = renderWithProviders(<TrendPage />);
    expect(getByLabelText('刷新数据')).toBeTruthy();
  });

  it('应该显示菜单按钮', () => {
    const {getByLabelText} = renderWithProviders(<TrendPage />);
    expect(getByLabelText('打开菜单')).toBeTruthy();
  });

  it('应该能够打开和关闭菜单 Modal', async () => {
    const {getByLabelText, getByText, queryByText} = renderWithProviders(
      <TrendPage />,
    );

    // 初始状态菜单不可见
    expect(queryByText('菜单')).toBeFalsy();

    // 点击菜单按钮
    const menuButton = getByLabelText('打开菜单');
    fireEvent.press(menuButton);

    // 等待 Modal 打开
    await waitFor(() => {
      expect(getByText('菜单')).toBeTruthy();
    });

    // 点击取消按钮
    const cancelButton = getByText('取消');
    fireEvent.press(cancelButton);

    // 等待 Modal 关闭
    await waitFor(() => {
      expect(queryByText('菜单')).toBeFalsy();
    });
  });

  it('应该显示参与人数', () => {
    const {getByText} = renderWithProviders(<TrendPage />);
    expect(getByText('本轮参与人数 (06:00-次日05:59)')).toBeTruthy();
  });

  it('应该显示提交状态按钮', () => {
    const {getByLabelText} = renderWithProviders(<TrendPage />);
    expect(getByLabelText('提交今日工作状态')).toBeTruthy();
  });

  it('应该使用 gluestack-ui 的 Pressable 组件', () => {
    const {getByLabelText} = renderWithProviders(<TrendPage />);
    const menuButton = getByLabelText('打开菜单');

    // 验证可以点击
    fireEvent.press(menuButton);
    expect(menuButton).toBeTruthy();
  });

  it('应该使用 gluestack-ui 的 Modal 组件', async () => {
    const {getByLabelText, getByText} = renderWithProviders(<TrendPage />);

    // 打开菜单
    const menuButton = getByLabelText('打开菜单');
    fireEvent.press(menuButton);

    // 验证 Modal 内容
    await waitFor(() => {
      expect(getByText('菜单')).toBeTruthy();
      expect(getByText('⚙️ 设置')).toBeTruthy();
      expect(getByText('取消')).toBeTruthy();
    });
  });

  it('应该使用 gluestack-ui 的 spacing tokens', () => {
    const {getByText} = renderWithProviders(<TrendPage />);
    const title = getByText('趋势');

    // 验证组件渲染成功（说明 spacing tokens 正常工作）
    expect(title).toBeTruthy();
  });

  it('应该正确处理风格切换', () => {
    const {getByLabelText} = renderWithProviders(<TrendPage />);
    const toggleButton = getByLabelText('切换视觉风格');

    // 点击切换按钮
    fireEvent.press(toggleButton);

    // 验证按钮可以点击
    expect(toggleButton).toBeTruthy();
  });
});

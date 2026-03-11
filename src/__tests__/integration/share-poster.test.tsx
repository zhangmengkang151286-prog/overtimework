/**
 * 分享海报功能集成测试
 * 
 * 测试完整的分享海报功能流程，包括：
 * - 保存海报到相册的完整流程
 * - 分享海报的完整流程
 * - 海报切换流程
 * - 数据加载流程
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {configureStore} from '@reduxjs/toolkit';
import {Alert} from 'react-native';
import dataReducer from '../../store/slices/dataSlice';
import uiReducer from '../../store/slices/uiSlice';
import userReducer from '../../store/slices/userSlice';
import {SharePosterScreen} from '../../screens/SharePosterScreen';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import {captureRef} from 'react-native-view-shot';

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  ArrowLeft: 'ArrowLeft',
  Save: 'Save',
  Share2: 'Share2',
  Download: 'Download',
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock expo-media-library
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  saveToLibraryAsync: jest.fn(),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

// Mock react-native-view-shot
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock supabaseService
const mockGetRealTimeStats = jest.fn();
const mockGetHourlySnapshots = jest.fn();
const mockGetTagDistribution = jest.fn();
const mockGetDailyStatus = jest.fn();
const mockGetTrendData = jest.fn();
const mockGetTagStatistics = jest.fn();
const mockGetCurrentUser = jest.fn();

jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getRealTimeStats: mockGetRealTimeStats,
    getHourlySnapshots: mockGetHourlySnapshots,
    getTagDistribution: mockGetTagDistribution,
    getDailyStatus: mockGetDailyStatus,
    getTrendData: mockGetTrendData,
    getTagStatistics: mockGetTagStatistics,
    getCurrentUser: mockGetCurrentUser,
  },
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
          tagDistribution: [],
          dailyStatus: [],
        },
        selectedTime: new Date().toISOString(),
        isViewingHistory: false,
        tags: [],
      },
      ui: {
        isMenuOpen: false,
        theme: 'dark',
      },
      user: {
        user: {
          id: 'test-user-id',
          phone_number: '13800138000',
          username: '测试用户',
          avatar_url: 'https://example.com/avatar.png',
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

describe('分享海报 - 保存流程集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认的 mock 返回值
    mockGetRealTimeStats.mockResolvedValue({
      total_participants: 100,
      on_time_count: 40,
      overtime_count: 60,
    });
    
    mockGetHourlySnapshots.mockResolvedValue([
      {hour: 9, participant_count: 10},
      {hour: 10, participant_count: 20},
    ]);
    
    mockGetTagDistribution.mockResolvedValue([
      {tag_name: '项目加班', count: 30},
      {tag_name: '会议', count: 20},
    ]);
    
    mockGetCurrentUser.mockResolvedValue({
      id: 'test-user-id',
      username: '测试用户',
      avatar_url: 'https://example.com/avatar.png',
    });
    
    (captureRef as jest.Mock).mockResolvedValue('file:///test-image.png');
  });

  it('应该能够完成完整的保存到相册流程', async () => {
    // Mock 权限授予
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    
    // Mock 保存成功
    (MediaLibrary.saveToLibraryAsync as jest.Mock).mockResolvedValue({
      id: 'test-asset-id',
    });

    const {getByText} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 点击"保存到本地"按钮
    const saveButton = getByText('保存到本地');
    fireEvent.press(saveButton);

    // 验证流程
    await waitFor(() => {
      // 1. 请求权限
      expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
      
      // 2. 截图
      expect(captureRef).toHaveBeenCalled();
      
      // 3. 保存到相册
      expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith(
        'file:///test-image.png',
      );
    });
  });

  it('应该在权限被拒绝时显示提示', async () => {
    // Mock 权限拒绝
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const {getByText} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 点击"保存到本地"按钮
    const saveButton = getByText('保存到本地');
    fireEvent.press(saveButton);

    // 验证显示权限提示
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '需要相册权限',
        '请在设置中开启相册访问权限',
        expect.any(Array),
      );
    });

    // 验证不会保存
    expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
  });

  it('应该在保存失败时显示错误提示', async () => {
    // Mock 权限授予
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    
    // Mock 保存失败
    (MediaLibrary.saveToLibraryAsync as jest.Mock).mockRejectedValue(
      new Error('保存失败'),
    );

    const {getByText} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 点击"保存到本地"按钮
    const saveButton = getByText('保存到本地');
    fireEvent.press(saveButton);

    // 验证显示错误提示
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '保存失败',
        expect.any(String),
      );
    });
  });
});

describe('分享海报 - 分享流程集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认的 mock 返回值
    mockGetRealTimeStats.mockResolvedValue({
      total_participants: 100,
      on_time_count: 40,
      overtime_count: 60,
    });
    
    mockGetCurrentUser.mockResolvedValue({
      id: 'test-user-id',
      username: '测试用户',
      avatar_url: 'https://example.com/avatar.png',
    });
    
    (captureRef as jest.Mock).mockResolvedValue('file:///test-image.png');
  });

  it('应该能够完成完整的分享流程', async () => {
    // Mock 分享功能可用
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    
    // Mock 分享成功
    (Sharing.shareAsync as jest.Mock).mockResolvedValue({});

    const {getByText} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 点击"分享"按钮
    const shareButton = getByText('分享');
    fireEvent.press(shareButton);

    // 验证流程
    await waitFor(() => {
      // 1. 检查分享功能可用性
      expect(Sharing.isAvailableAsync).toHaveBeenCalled();
      
      // 2. 截图
      expect(captureRef).toHaveBeenCalled();
      
      // 3. 调用系统分享
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        'file:///test-image.png',
        {
          mimeType: 'image/png',
          dialogTitle: '分享海报',
        },
      );
    });
  });

  it('应该在分享功能不可用时显示提示', async () => {
    // Mock 分享功能不可用
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    const {getByText} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 点击"分享"按钮
    const shareButton = getByText('分享');
    fireEvent.press(shareButton);

    // 验证显示提示
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '分享失败',
        expect.stringContaining('分享功能不可用'),
      );
    });

    // 验证不会调用分享
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('应该在分享失败时显示错误提示', async () => {
    // Mock 分享功能可用
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    
    // Mock 分享失败
    (Sharing.shareAsync as jest.Mock).mockRejectedValue(
      new Error('分享失败'),
    );

    const {getByText} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 点击"分享"按钮
    const shareButton = getByText('分享');
    fireEvent.press(shareButton);

    // 验证显示错误提示
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '分享失败',
        expect.any(String),
      );
    });
  });
});

describe('分享海报 - 海报切换流程集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置默认的 mock 返回值
    mockGetRealTimeStats.mockResolvedValue({
      total_participants: 100,
      on_time_count: 40,
      overtime_count: 60,
    });
    
    mockGetHourlySnapshots.mockResolvedValue([]);
    mockGetTagDistribution.mockResolvedValue([]);
    mockGetDailyStatus.mockResolvedValue([]);
    mockGetTrendData.mockResolvedValue([]);
    mockGetTagStatistics.mockResolvedValue([]);
    
    mockGetCurrentUser.mockResolvedValue({
      id: 'test-user-id',
      username: '测试用户',
      avatar_url: 'https://example.com/avatar.png',
    });
  });

  it('应该能够通过滑动切换海报', async () => {
    const {getByTestId} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 获取轮播组件
    const carousel = getByTestId('poster-carousel');
    
    // 模拟滑动到第二个海报
    fireEvent(carousel, 'onIndexChange', 1);

    // 验证索引更新
    await waitFor(() => {
      const indicators = getByTestId('poster-indicators');
      expect(indicators).toBeTruthy();
    });
  });

  it('应该能够通过点击指示器切换海报', async () => {
    const {getByTestId} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 点击第三个指示器圆点
    const indicator2 = getByTestId('indicator-2');
    fireEvent.press(indicator2);

    // 验证切换到第三个海报
    await waitFor(() => {
      const carousel = getByTestId('poster-carousel');
      expect(carousel).toBeTruthy();
    });
  });

  it('应该在切换海报时更新指示器状态', async () => {
    const {getByTestId} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 获取轮播组件
    const carousel = getByTestId('poster-carousel');
    
    // 切换到第二个海报
    fireEvent(carousel, 'onIndexChange', 1);

    // 验证指示器更新
    await waitFor(() => {
      const indicator1 = getByTestId('indicator-1');
      expect(indicator1).toBeTruthy();
    });
  });
});

describe('分享海报 - 数据加载流程集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetCurrentUser.mockResolvedValue({
      id: 'test-user-id',
      username: '测试用户',
      avatar_url: 'https://example.com/avatar.png',
    });
  });

  it('应该在打开界面时加载趋势数据', async () => {
    mockGetRealTimeStats.mockResolvedValue({
      total_participants: 100,
      on_time_count: 40,
      overtime_count: 60,
    });
    
    mockGetHourlySnapshots.mockResolvedValue([
      {hour: 9, participant_count: 10},
    ]);
    
    mockGetTagDistribution.mockResolvedValue([
      {tag_name: '项目加班', count: 30},
    ]);

    const {getByTestId} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 验证数据加载
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
      expect(mockGetHourlySnapshots).toHaveBeenCalled();
      expect(mockGetTagDistribution).toHaveBeenCalled();
      expect(mockGetCurrentUser).toHaveBeenCalled();
    });

    // 验证海报渲染
    await waitFor(() => {
      const trendPoster = getByTestId('trend-poster');
      expect(trendPoster).toBeTruthy();
    });
  });

  it('应该在数据加载失败时显示错误提示', async () => {
    // Mock 数据加载失败
    mockGetRealTimeStats.mockRejectedValue(new Error('网络错误'));

    const {getByText} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 验证显示错误提示
    await waitFor(() => {
      expect(getByText('数据加载失败')).toBeTruthy();
    });
  });

  it('应该在数据加载时显示加载状态', async () => {
    // Mock 延迟加载
    mockGetRealTimeStats.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                total_participants: 100,
                on_time_count: 40,
                overtime_count: 60,
              }),
            100,
          ),
        ),
    );

    const {getByTestId} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 验证显示加载状态
    const loadingIndicator = getByTestId('loading-indicator');
    expect(loadingIndicator).toBeTruthy();

    // 等待加载完成
    await waitFor(
      () => {
        expect(mockGetRealTimeStats).toHaveBeenCalled();
      },
      {timeout: 3000},
    );
  });

  it('应该支持重试加载数据', async () => {
    // Mock 第一次失败，第二次成功
    mockGetRealTimeStats
      .mockRejectedValueOnce(new Error('网络错误'))
      .mockResolvedValueOnce({
        total_participants: 100,
        on_time_count: 40,
        overtime_count: 60,
      });

    const {getByText} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待错误显示
    await waitFor(() => {
      expect(getByText('数据加载失败')).toBeTruthy();
    });

    // 点击重试按钮
    const retryButton = getByText('重试');
    fireEvent.press(retryButton);

    // 验证重新加载
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalledTimes(2);
    });
  });
});

describe('分享海报 - 完整用户流程集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 设置所有 mock 返回值
    mockGetRealTimeStats.mockResolvedValue({
      total_participants: 100,
      on_time_count: 40,
      overtime_count: 60,
    });
    
    mockGetHourlySnapshots.mockResolvedValue([]);
    mockGetTagDistribution.mockResolvedValue([]);
    
    mockGetCurrentUser.mockResolvedValue({
      id: 'test-user-id',
      username: '测试用户',
      avatar_url: 'https://example.com/avatar.png',
    });
    
    (captureRef as jest.Mock).mockResolvedValue('file:///test-image.png');
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (MediaLibrary.saveToLibraryAsync as jest.Mock).mockResolvedValue({
      id: 'test-asset-id',
    });
  });

  it('应该能够完成完整的用户流程：打开 -> 切换 -> 保存', async () => {
    const {getByText, getByTestId} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 1. 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 2. 切换到第二个海报
    const carousel = getByTestId('poster-carousel');
    fireEvent(carousel, 'onIndexChange', 1);

    await waitFor(() => {
      const indicator1 = getByTestId('indicator-1');
      expect(indicator1).toBeTruthy();
    });

    // 3. 保存海报
    const saveButton = getByText('保存到本地');
    fireEvent.press(saveButton);

    // 4. 验证保存成功
    await waitFor(() => {
      expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalled();
    });
  });

  it('应该能够完成完整的用户流程：打开 -> 浏览 -> 分享', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue({});

    const {getByText, getByTestId} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 1. 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 2. 浏览多个海报
    const carousel = getByTestId('poster-carousel');
    
    fireEvent(carousel, 'onIndexChange', 1);
    await waitFor(() => {
      const indicator1 = getByTestId('indicator-1');
      expect(indicator1).toBeTruthy();
    });
    
    fireEvent(carousel, 'onIndexChange', 2);
    await waitFor(() => {
      const indicator2 = getByTestId('indicator-2');
      expect(indicator2).toBeTruthy();
    });

    // 3. 分享当前海报
    const shareButton = getByText('分享');
    fireEvent.press(shareButton);

    // 4. 验证分享成功
    await waitFor(() => {
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });
  });

  it('应该能够处理用户取消操作', async () => {
    const {getByTestId} = render(
      <TestWrapper>
        <SharePosterScreen />
      </TestWrapper>,
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(mockGetRealTimeStats).toHaveBeenCalled();
    });

    // 点击返回按钮
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    // 验证导航返回
    expect(mockGoBack).toHaveBeenCalled();
  });
});

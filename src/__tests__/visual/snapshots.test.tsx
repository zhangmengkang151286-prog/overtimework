/**
 * 视觉快照测试 - Gluestack UI 迁移
 *
 * 用于检查 UI 变化，确保迁移前后视觉一致性
 * 覆盖所有页面和组件的快照测试
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {configureStore} from '@reduxjs/toolkit';
import dataReducer from '../../store/slices/dataSlice';
import uiReducer from '../../store/slices/uiSlice';
import userReducer from '../../store/slices/userSlice';

// 导入所有页面组件
import TrendPage from '../../screens/TrendPage';
import {LoginScreen} from '../../screens/LoginScreen';
import {SettingsScreen} from '../../screens/SettingsScreen';
import {PhoneRegisterScreen} from '../../screens/PhoneRegisterScreen';
import {CompleteProfileScreen} from '../../screens/CompleteProfileScreen';
import {SetPasswordScreen} from '../../screens/SetPasswordScreen';
import {PasswordRecoveryScreen} from '../../screens/PasswordRecoveryScreen';
import {DataManagementScreen} from '../../screens/DataManagementScreen';

// 导入 Gluestack 组件
import {DataCard} from '../../components/gluestack/DataCard';
import {StatusButton} from '../../components/gluestack/StatusButton';
import {StatusIndicator} from '../../components/gluestack/StatusIndicator';
import {VersusBar} from '../../components/VersusBar';
import {GridChart} from '../../components/GridChart';
import {TimeAxis} from '../../components/TimeAxis';

// Mock useUserStatus hook
jest.mock('../../hooks/useUserStatus', () => ({
  useUserStatus: jest.fn(() => ({
    userStatus: {
      hasSubmittedToday: false,
      canSubmitStatus: true,
    },
    isSubmitting: false,
    submitUserStatus: jest.fn(),
    forceResetTodayStatus: jest.fn(),
    shouldShowSelector: true,
  })),
}));

// Mock useHistoricalData hook
jest.mock('../../hooks/useHistoricalData', () => ({
  useHistoricalData: jest.fn(() => ({
    historicalData: [],
    loading: false,
    error: null,
  })),
}));

// 创建测试用的 store
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      data: dataReducer,
      ui: uiReducer,
      user: userReducer,
    },
    preloadedState,
  });
};

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

// Mock AuthService
jest.mock('../../services/enhanced-auth/AuthService', () => ({
  AuthService: {
    sendSMSCode: jest.fn(),
    loginWithPhone: jest.fn(),
    loginWithPassword: jest.fn(),
    loginWithWeChat: jest.fn(),
  },
}));

// Mock ProfileService
jest.mock('../../services/enhanced-auth/ProfileService', () => ({
  ProfileService: {
    completeProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

// Mock LocationService
jest.mock('../../services/enhanced-auth/LocationService', () => ({
  LocationService: {
    getCurrentLocation: jest.fn(),
  },
}));

// Mock lazy-loaded components
jest.mock('../../components/HistoricalStatusIndicator', () => ({
  HistoricalStatusIndicator: () => null,
}));

describe('视觉快照测试 - 页面组件', () => {
  describe('趋势页 (TrendPage)', () => {
    it('应该正确渲染趋势页', () => {
      const store = createTestStore();

      const {toJSON} = render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <TrendPage />
          </GluestackUIProvider>
        </Provider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该正确渲染趋势页（有数据状态）', () => {
      const store = createTestStore({
        data: {
          realTimeStats: {
            overtimeCount: 150,
            ontimeCount: 50,
            participantCount: 200,
            topTags: [
              {tag: '互联网', count: 80},
              {tag: '金融', count: 60},
            ],
          },
        },
      });

      const {toJSON} = render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <TrendPage />
          </GluestackUIProvider>
        </Provider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('登录页 (LoginScreen)', () => {
    it('应该正确渲染登录页', () => {
      const store = createTestStore();

      const {toJSON} = render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <LoginScreen />
          </GluestackUIProvider>
        </Provider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('注册页 (PhoneRegisterScreen)', () => {
    it('应该正确渲染注册页', () => {
      const store = createTestStore();

      const {toJSON} = render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <PhoneRegisterScreen />
          </GluestackUIProvider>
        </Provider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('完善资料页 (CompleteProfileScreen)', () => {
    it('应该正确渲染完善资料页', () => {
      const store = createTestStore();

      const {toJSON} = render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <CompleteProfileScreen />
          </GluestackUIProvider>
        </Provider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('设置密码页 (SetPasswordScreen)', () => {
    it('应该正确渲染设置密码页', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <SetPasswordScreen />
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('密码恢复页 (PasswordRecoveryScreen)', () => {
    it('应该正确渲染密码恢复页', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <PasswordRecoveryScreen />
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('设置页 (SettingsScreen)', () => {
    it('应该正确渲染设置页', () => {
      const store = createTestStore();

      const {toJSON} = render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <SettingsScreen />
          </GluestackUIProvider>
        </Provider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该正确渲染设置页（已登录状态）', () => {
      const store = createTestStore({
        user: {
          isAuthenticated: true,
          profile: {
            name: '测试用户',
            phone: '13800138000',
          },
        },
      });

      const {toJSON} = render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <SettingsScreen />
          </GluestackUIProvider>
        </Provider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('数据管理页 (DataManagementScreen)', () => {
    it('应该正确渲染数据管理页', () => {
      const store = createTestStore();

      const {toJSON} = render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <DataManagementScreen />
          </GluestackUIProvider>
        </Provider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});

describe('视觉快照测试 - Gluestack 组件', () => {
  describe('DataCard 组件', () => {
    it('应该正确渲染基本 DataCard', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <DataCard title="参与人数" value="1234" />
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该正确渲染带副标题的 DataCard', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <DataCard title="参与人数" value="1234" subtitle="较昨日增长 10%" />
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('StatusButton 组件', () => {
    it('应该正确渲染加班状态按钮', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <StatusButton status="overtime" onPress={jest.fn()}>
            加班
          </StatusButton>
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该正确渲染下班状态按钮', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <StatusButton status="ontime" onPress={jest.fn()}>
            下班
          </StatusButton>
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该正确渲染待定状态按钮', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <StatusButton status="pending" onPress={jest.fn()}>
            待定
          </StatusButton>
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('StatusIndicator 组件', () => {
    it('应该正确渲染加班指示器', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <StatusIndicator status="overtime" />
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该正确渲染下班指示器', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <StatusIndicator status="ontime" />
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该正确渲染不同尺寸的指示器', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <>
            <StatusIndicator status="overtime" size="sm" />
            <StatusIndicator status="ontime" size="md" />
            <StatusIndicator status="pending" size="lg" />
          </>
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('VersusBar 组件', () => {
    it('应该正确渲染对比条', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <VersusBar overtimeCount={150} ontimeCount={50} />
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该正确渲染平衡状态的对比条', () => {
      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <VersusBar overtimeCount={100} ontimeCount={100} />
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('GridChart 组件', () => {
    it('应该正确渲染网格图表', () => {
      const mockData = [
        [0, 1, 2, 3, 4, 5, 6],
        [1, 2, 3, 4, 5, 6, 7],
        [2, 3, 4, 5, 6, 7, 8],
      ];

      const mockTagDistribution = [
        {tag: '互联网', count: 10, status: 'overtime'},
        {tag: '金融', count: 8, status: 'ontime'},
      ];

      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <GridChart
            data={mockData}
            maxValue={10}
            tagDistribution={mockTagDistribution}
          />
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('TimeAxis 组件', () => {
    it('应该正确渲染时间轴', () => {
      const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
      const mockSnapshots = hours.map(hour => ({
        hour,
        overtimeCount: Math.floor(Math.random() * 100),
        ontimeCount: Math.floor(Math.random() * 100),
      }));

      const {toJSON} = render(
        <GluestackUIProvider config={config}>
          <TimeAxis hours={hours} currentHour={14} snapshots={mockSnapshots} />
        </GluestackUIProvider>,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});

describe('视觉快照测试 - 响应式布局', () => {
  it('应该正确渲染小屏幕布局', () => {
    const store = createTestStore();

    const {toJSON} = render(
      <Provider store={store}>
        <GluestackUIProvider config={config}>
          <TrendPage />
        </GluestackUIProvider>
      </Provider>,
    );

    expect(toJSON()).toMatchSnapshot();
  });
});

describe('视觉快照测试 - 边界情况', () => {
  it('应该正确渲染空数据状态', () => {
    const store = createTestStore({
      data: {
        realTimeStats: {
          overtimeCount: 0,
          ontimeCount: 0,
          participantCount: 0,
          topTags: [],
        },
      },
    });

    const {toJSON} = render(
      <Provider store={store}>
        <GluestackUIProvider config={config}>
          <TrendPage />
        </GluestackUIProvider>
      </Provider>,
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('应该正确渲染加载状态', () => {
    const store = createTestStore({
      ui: {
        isLoading: true,
      },
    });

    const {toJSON} = render(
      <Provider store={store}>
        <GluestackUIProvider config={config}>
          <TrendPage />
        </GluestackUIProvider>
      </Provider>,
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('应该正确渲染错误状态', () => {
    const store = createTestStore({
      ui: {
        error: '网络连接失败',
      },
    });

    const {toJSON} = render(
      <Provider store={store}>
        <GluestackUIProvider config={config}>
          <TrendPage />
        </GluestackUIProvider>
      </Provider>,
    );

    expect(toJSON()).toMatchSnapshot();
  });
});

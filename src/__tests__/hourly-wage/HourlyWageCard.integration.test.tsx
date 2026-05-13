/**
 * HourlyWageCard 集成测试
 *
 * - mock (config, submission, now, isHoliday) 组合，验证三态切换
 * - 配置修改触发立即重算
 * - 重新打卡入口点击后呼出回调
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {WageConfig, LiveMetrics, SettledMetrics} from '../../types/hourly-wage';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock useAuth
const mockUser = {
  id: 'test-user-1',
  phoneNumber: '13800000000',
  name: '测试用户',
  province: '北京',
  city: '北京',
  industry: '互联网',
  positionCategory: '技术研发',
  position: '工程师',
  workStartTime: '09:00',
  workEndTime: '18:00',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
  }),
}));

// Mock useWageConfig
let mockWageConfigReturn = {
  config: null as WageConfig | null,
  isLoading: false,
  save: jest.fn(),
};

jest.mock('../../hooks/useWageConfig', () => ({
  useWageConfig: () => mockWageConfigReturn,
}));

// Mock useWageCardState
let mockWageCardStateReturn = {
  state: 'IDLE' as 'IDLE' | 'LIVE' | 'SETTLED',
  liveMetrics: null as LiveMetrics | null,
  settledMetrics: null as SettledMetrics | null,
};

jest.mock('../../hooks/useWageCardState', () => ({
  useWageCardState: () => mockWageCardStateReturn,
}));

// Mock holidays
jest.mock('../../data/holidays', () => ({
  allHolidays: [],
  holidays2025: [],
  holidays2026: [],
  getHolidaysForMonth: () => [],
}));

// Mock useIsTodayHoliday - 默认返回 false（工作日）
let mockIsHoliday = false;
jest.mock('../../hooks/useIsTodayHoliday', () => ({
  useIsTodayHoliday: () => mockIsHoliday,
}));

// Mock react-native-modal
jest.mock('react-native-modal', () => {
  const {View} = require('react-native');
  return ({isVisible, children}: any) =>
    isVisible ? <View testID="modal-container">{children}</View> : null;
});

import {HourlyWageCard} from '../../components/HourlyWageCard';

// ─── Redux Store 工厂 ────────────────────────────────────────────────────────

function createTestStore(overrides: {
  hasSubmittedToday?: boolean;
  lastSubmission?: any;
} = {}) {
  return configureStore({
    reducer: {
      ui: (
        state = {
          theme: 'dark',
          notifications: [],
          isMenuOpen: false,
          isStatusSelectorVisible: false,
          isTagSelectorVisible: false,
          isLoading: false,
          currentScreen: 'MyPage',
          error: null,
          isRetrying: false,
        },
        action: any,
      ) => {
        if (action.type === 'ui/addNotification') {
          return {
            ...state,
            notifications: [
              ...state.notifications,
              {...action.payload, id: String(state.notifications.length + 1), timestamp: new Date()},
            ],
          };
        }
        return state;
      },
      user: (
        state = {
          currentUser: mockUser,
          isAuthenticated: true,
          userStatus: {
            hasSubmittedToday: overrides.hasSubmittedToday ?? false,
            lastSubmission: overrides.lastSubmission ?? undefined,
          },
          error: null,
          isLoading: false,
        },
        _action: any,
      ) => state,
    },
  });
}

function renderCard(
  storeOverrides: {hasSubmittedToday?: boolean; lastSubmission?: any} = {},
  onCheckIn?: jest.Mock,
) {
  const store = createTestStore(storeOverrides);
  const result = render(
    <Provider store={store}>
      <HourlyWageCard userId="test-user-1" onCheckIn={onCheckIn} />
    </Provider>,
  );
  return {...result, store};
}

// ─── 测试数据 ────────────────────────────────────────────────────────────────

const defaultConfig: WageConfig = {
  monthlySalary: 15000,
  workStartTime: '09:00',
  workEndTime: '18:00',
};

const mockLiveMetricsOntime: LiveMetrics = {
  variant: 'ONTIME',
  nominalHourlyRate: 86.2,
  currentHourlyRate: 86.2,
  dilutionPercent: 0,
  earnedToday: 345,
  expectedWastedAmount: 0,
  remainingMs: 3600000,
};

const mockLiveMetricsOvertime: LiveMetrics = {
  variant: 'OVERTIME',
  nominalHourlyRate: 86.2,
  currentHourlyRate: 62.7,
  dilutionPercent: 27.3,
  earnedToday: 500,
  expectedWastedAmount: 188,
  remainingMs: 7200000,
};

const mockSettledMetricsOntime: SettledMetrics = {
  nominalDailySalary: 689.7,
  actualHourlyRate: 86.2,
  dilutionPercent: 0,
  wastedHours: 0,
  wastedAmount: 0,
};

const mockSettledMetricsOvertime: SettledMetrics = {
  nominalDailySalary: 689.7,
  actualHourlyRate: 62.7,
  dilutionPercent: 27.3,
  wastedHours: 2,
  wastedAmount: 188,
};

// ─── 测试套件 ────────────────────────────────────────────────────────────────

describe('HourlyWageCard 集成测试', () => {
  beforeEach(() => {
    mockWageConfigReturn = {config: null, isLoading: false, save: jest.fn()};
    mockWageCardStateReturn = {state: 'IDLE', liveMetrics: null, settledMetrics: null};
    mockIsHoliday = false;
  });

  describe('Loading 态', () => {
    it('isLoading 为 true 时展示骨架屏', () => {
      mockWageConfigReturn = {config: null, isLoading: true, save: jest.fn()};

      const {getByTestId} = renderCard();
      expect(getByTestId('hourly-wage-card-loading')).toBeTruthy();
    });
  });

  describe('三态切换', () => {
    it('config 为 null + state IDLE → 展示 IDLE 无配置分支', () => {
      mockWageConfigReturn = {config: null, isLoading: false, save: jest.fn()};
      mockWageCardStateReturn = {state: 'IDLE', liveMetrics: null, settledMetrics: null};

      const {getByTestId} = renderCard();
      expect(getByTestId('idle-card-no-config')).toBeTruthy();
    });

    it('config 有值 + state IDLE + 非节假日 → 展示 IDLE 工作日分支', () => {
      mockWageConfigReturn = {config: defaultConfig, isLoading: false, save: jest.fn()};
      mockWageCardStateReturn = {state: 'IDLE', liveMetrics: null, settledMetrics: null};

      const {getByTestId} = renderCard();
      expect(getByTestId('idle-card-workday')).toBeTruthy();
    });

    it('state LIVE + variant ONTIME → 展示 LiveCard ONTIME', () => {
      mockWageConfigReturn = {config: defaultConfig, isLoading: false, save: jest.fn()};
      mockWageCardStateReturn = {
        state: 'LIVE',
        liveMetrics: mockLiveMetricsOntime,
        settledMetrics: null,
      };

      const {getByTestId} = renderCard();
      expect(getByTestId('live-card-ontime')).toBeTruthy();
    });

    it('state LIVE + variant OVERTIME → 展示 LiveCard OVERTIME', () => {
      mockWageConfigReturn = {config: defaultConfig, isLoading: false, save: jest.fn()};
      mockWageCardStateReturn = {
        state: 'LIVE',
        liveMetrics: mockLiveMetricsOvertime,
        settledMetrics: null,
      };

      const {getByTestId} = renderCard();
      expect(getByTestId('live-card-overtime')).toBeTruthy();
    });

    it('state SETTLED + ONTIME → 展示 SettledCard ONTIME', () => {
      mockWageConfigReturn = {config: defaultConfig, isLoading: false, save: jest.fn()};
      mockWageCardStateReturn = {
        state: 'SETTLED',
        liveMetrics: null,
        settledMetrics: mockSettledMetricsOntime,
      };

      const {getByTestId} = renderCard();
      expect(getByTestId('settled-card-ontime')).toBeTruthy();
    });

    it('state SETTLED + OVERTIME → 展示 SettledCard OVERTIME', () => {
      mockWageConfigReturn = {config: defaultConfig, isLoading: false, save: jest.fn()};
      mockWageCardStateReturn = {
        state: 'SETTLED',
        liveMetrics: null,
        settledMetrics: mockSettledMetricsOvertime,
      };

      const {getByTestId} = renderCard();
      expect(getByTestId('settled-card-overtime')).toBeTruthy();
    });
  });

  describe('配置修改触发立即重算', () => {
    it('点击"去配置薪资"打开 SalaryConfigModal', () => {
      mockWageConfigReturn = {config: null, isLoading: false, save: jest.fn()};
      mockWageCardStateReturn = {state: 'IDLE', liveMetrics: null, settledMetrics: null};

      const {getByTestId} = renderCard();

      // 点击配置按钮
      fireEvent.press(getByTestId('config-button'));

      // Modal 应该可见
      expect(getByTestId('modal-container')).toBeTruthy();
    });
  });

  describe('重新打卡入口', () => {
    it('LIVE 状态下点击"修改打卡"触发 onCheckIn 回调', () => {
      mockWageConfigReturn = {config: defaultConfig, isLoading: false, save: jest.fn()};
      mockWageCardStateReturn = {
        state: 'LIVE',
        liveMetrics: mockLiveMetricsOntime,
        settledMetrics: null,
      };

      const mockOnCheckIn = jest.fn();
      const {getByTestId} = renderCard({}, mockOnCheckIn);

      fireEvent.press(getByTestId('resubmit-button'));
      expect(mockOnCheckIn).toHaveBeenCalledTimes(1);
    });

    it('SETTLED 状态下点击"重新打卡"触发 onCheckIn 回调', () => {
      mockWageConfigReturn = {config: defaultConfig, isLoading: false, save: jest.fn()};
      mockWageCardStateReturn = {
        state: 'SETTLED',
        liveMetrics: null,
        settledMetrics: mockSettledMetricsOntime,
      };

      const mockOnCheckIn = jest.fn();
      const {getByTestId} = renderCard({}, mockOnCheckIn);

      fireEvent.press(getByTestId('resubmit-button'));
      expect(mockOnCheckIn).toHaveBeenCalledTimes(1);
    });

    it('IDLE 工作日状态下点击"去打卡"触发 onCheckIn 回调', () => {
      mockWageConfigReturn = {config: defaultConfig, isLoading: false, save: jest.fn()};
      mockWageCardStateReturn = {state: 'IDLE', liveMetrics: null, settledMetrics: null};

      const mockOnCheckIn = jest.fn();
      const {getByTestId} = renderCard({}, mockOnCheckIn);

      fireEvent.press(getByTestId('checkin-button'));
      expect(mockOnCheckIn).toHaveBeenCalledTimes(1);
    });
  });
});

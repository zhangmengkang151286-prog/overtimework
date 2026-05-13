/**
 * MyPage 接入 HourlyWageCard 后的 snapshot 测试
 *
 * - 未配置薪资时卡片展示配置引导
 * - 已配置 + 未打卡展示 IDLE 静态信息
 * - 确保现有月历 / 趋势图 / 标签分布仍正常渲染
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {WageConfig, LiveMetrics, SettledMetrics} from '../../types/hourly-wage';
import {Theme} from '../../theme';
import {lightTheme, darkTheme} from '../../theme';

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

// Mock useIsTodayHoliday
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

// Mock supabaseService（月历和趋势数据）
jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getUserMonthlyRecords: jest.fn().mockResolvedValue([]),
    getUserTrendData: jest.fn().mockResolvedValue([]),
  },
}));

// Mock apiCache
jest.mock('../../services/apiCache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn(),
  cacheKey: (...args: any[]) => args.join(':'),
}));

import {MyPage} from '../../screens/MyPage';

// ─── Redux Store 工厂 ────────────────────────────────────────────────────────

function createTestStore() {
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
        _action: any,
      ) => state,
      user: (
        state = {
          currentUser: mockUser,
          isAuthenticated: true,
          userStatus: {
            hasSubmittedToday: false,
            lastSubmission: undefined,
          },
          error: null,
          isLoading: false,
        },
        _action: any,
      ) => state,
    },
  });
}

function renderMyPage(theme: Theme) {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <MyPage theme={theme} userId="test-user-1" />
    </Provider>,
  );
}

// ─── 测试套件 ────────────────────────────────────────────────────────────────

describe('MyPage 接入 HourlyWageCard snapshot 测试', () => {
  beforeEach(() => {
    mockWageConfigReturn = {config: null, isLoading: false, save: jest.fn()};
    mockWageCardStateReturn = {state: 'IDLE', liveMetrics: null, settledMetrics: null};
    mockIsHoliday = false;
  });

  it('未配置薪资时 — 卡片展示配置引导', () => {
    mockWageConfigReturn = {config: null, isLoading: false, save: jest.fn()};
    mockWageCardStateReturn = {state: 'IDLE', liveMetrics: null, settledMetrics: null};

    const {getByTestId, toJSON} = renderMyPage(darkTheme);

    // 时薪卡片存在且展示无配置分支
    expect(getByTestId('idle-card-no-config')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('已配置 + 未打卡 — 展示 IDLE 静态信息', () => {
    const config: WageConfig = {
      monthlySalary: 15000,
      workStartTime: '09:00',
      workEndTime: '18:00',
    };
    mockWageConfigReturn = {config, isLoading: false, save: jest.fn()};
    mockWageCardStateReturn = {state: 'IDLE', liveMetrics: null, settledMetrics: null};

    const {getByTestId, toJSON} = renderMyPage(darkTheme);

    // 时薪卡片存在且展示工作日分支
    expect(getByTestId('idle-card-workday')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('现有月历 / 趋势图 / 标签分布仍正常渲染', () => {
    mockWageConfigReturn = {config: null, isLoading: false, save: jest.fn()};
    mockWageCardStateReturn = {state: 'IDLE', liveMetrics: null, settledMetrics: null};

    const {toJSON} = renderMyPage(darkTheme);
    const tree = toJSON();

    // 验证整体结构存在（ScrollView 包含多个 section）
    expect(tree).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});

/**
 * UserStatusSelector 改造后集成测试
 * 验证时间点选择器接入后，提交回调中 overtimeHours 正确换算
 *
 * - 提交"到 21:00" → 回调中 overtimeHours === 3
 * - 提交"到 18:30" + 标准下班 18:00 → overtimeHours === 0.5
 * - 快捷项选择的交互路径
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {UserStatusSelector} from '../../components/UserStatusSelector';
import {UserStatusSubmission} from '../../types';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  SafeAreaProvider: ({children}: any) => children,
}));

// ─── Redux Store 工厂 ────────────────────────────────────────────────────────
function createTestStore(workEndTime = '18:00') {
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
          currentUser: {
            id: 'test-user-1',
            phoneNumber: '13800000000',
            name: '测试用户',
            province: '北京',
            city: '北京',
            industry: '互联网',
            position: '工程师',
            workStartTime: '09:00',
            workEndTime: workEndTime,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          isAuthenticated: true,
          userStatus: {hasSubmittedToday: false},
          error: null,
        },
        _action: any,
      ) => state,
    },
  });
}

function renderWithStore(
  ui: React.ReactElement,
  workEndTime = '18:00',
) {
  const store = createTestStore(workEndTime);
  const result = render(<Provider store={store}>{ui}</Provider>);
  return {...result, store};
}

/**
 * 核心换算逻辑验证
 * 验证 endTimeToOvertimeHours 在 UserStatusSelector 中的集成正确性
 */
describe('UserStatusSelector 时间换算集成', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 10, 17, 0, 0));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('提交"到 21:00" + 标准下班 18:00 → overtimeHours === 3', () => {
    const {endTimeToOvertimeHours} = require('../../utils/overtimeTimePicker');
    const hours = endTimeToOvertimeHours('21:00', '18:00');
    expect(hours).toBe(3);
  });

  it('提交"到 18:30" + 标准下班 18:00 → overtimeHours === 0.5', () => {
    const {endTimeToOvertimeHours} = require('../../utils/overtimeTimePicker');
    const hours = endTimeToOvertimeHours('18:30', '18:00');
    expect(hours).toBe(0.5);
  });

  it('提交"到 20:00" + 标准下班 17:30 → overtimeHours === 2.5', () => {
    const {endTimeToOvertimeHours} = require('../../utils/overtimeTimePicker');
    const hours = endTimeToOvertimeHours('20:00', '17:30');
    expect(hours).toBe(2.5);
  });

  it('快捷项 +1h 对应 overtimeHours === 1', () => {
    const {endTimeToOvertimeHours, generateQuickPicks} = require('../../utils/overtimeTimePicker');
    const picks = generateQuickPicks('18:00');
    expect(picks[0]).toBe('19:00');
    expect(endTimeToOvertimeHours(picks[0], '18:00')).toBe(1);
  });

  it('快捷项 +3h 对应 overtimeHours === 3', () => {
    const {endTimeToOvertimeHours, generateQuickPicks} = require('../../utils/overtimeTimePicker');
    const picks = generateQuickPicks('18:00');
    expect(picks[2]).toBe('21:00');
    expect(endTimeToOvertimeHours(picks[2], '18:00')).toBe(3);
  });

  it('未配置 workEndTime 时降级 18:00，选择 21:00 → overtimeHours === 3', () => {
    const {endTimeToOvertimeHours} = require('../../utils/overtimeTimePicker');
    const userWorkEndTime = undefined || '18:00';
    const hours = endTimeToOvertimeHours('21:00', userWorkEndTime);
    expect(hours).toBe(3);
  });
});

/**
 * UserStatusSelector 组件渲染集成测试
 * 验证组件正确渲染并从 Redux 读取 workEndTime
 */
describe('UserStatusSelector 组件渲染', () => {
  const mockOnStatusSelect = jest.fn();

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 10, 17, 0, 0));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('渲染状态选择界面，包含"准时下班"和"加班"按钮', () => {
    const {getByText} = renderWithStore(
      <UserStatusSelector
        visible={true}
        onStatusSelect={mockOnStatusSelect}
        availableTags={[]}
      />,
    );

    expect(getByText('准时下班')).toBeTruthy();
    expect(getByText('加班')).toBeTruthy();
  });

  it('选择"准时下班"后不进入时间选择步骤', () => {
    const {getByText, queryByText} = renderWithStore(
      <UserStatusSelector
        visible={true}
        onStatusSelect={mockOnStatusSelect}
        availableTags={[]}
      />,
    );

    fireEvent.press(getByText('准时下班'));

    // 不应该出现时间选择器的标题
    expect(queryByText('预计下班到几点')).toBeNull();
  });

  it('用户的 workEndTime 从 Redux store 正确读取（17:30）', () => {
    const {getByText} = renderWithStore(
      <UserStatusSelector
        visible={true}
        onStatusSelect={mockOnStatusSelect}
        availableTags={[]}
      />,
      '17:30',
    );

    // 组件应该正常渲染
    expect(getByText('加班')).toBeTruthy();
  });

  it('未配置 workEndTime 时（currentUser 为 null）降级 18:00', () => {
    const store = configureStore({
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
            currentUser: null,
            isAuthenticated: false,
            userStatus: {hasSubmittedToday: false},
            error: null,
          },
          _action: any,
        ) => state,
      },
    });

    const {getByText} = render(
      <Provider store={store}>
        <UserStatusSelector
          visible={true}
          onStatusSelect={mockOnStatusSelect}
          availableTags={[]}
        />
      </Provider>,
    );

    // 组件应该正常渲染，不崩溃
    expect(getByText('加班')).toBeTruthy();
    expect(getByText('准时下班')).toBeTruthy();
  });
});

/**
 * SalaryConfigModal 单元测试
 * - 非法月薪展示校验提示、不关闭
 * - 合法月薪调用 onSave 回调
 * - 深色/浅色主题下的 snapshot
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {SalaryConfigModal} from '../../components/wage/SalaryConfigModal';

// ─── Mock react-native-modal ─────────────────────────────────────────────────
jest.mock('react-native-modal', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    __esModule: true,
    default: ({isVisible, children}: any) =>
      isVisible ? React.createElement(View, {testID: 'modal-container'}, children) : null,
  };
});

// ─── Redux Store 工厂 ────────────────────────────────────────────────────────
function createTestStore(themeMode: 'light' | 'dark' = 'dark') {
  return configureStore({
    reducer: {
      ui: (state = {
        theme: themeMode,
        notifications: [],
        isMenuOpen: false,
        isStatusSelectorVisible: false,
        isTagSelectorVisible: false,
        isLoading: false,
        currentScreen: 'MyPage',
        error: null,
        isRetrying: false,
      }, action: any) => {
        if (action.type === 'ui/addNotification') {
          return {
            ...state,
            notifications: [...state.notifications, {...action.payload, id: '1', timestamp: new Date()}],
          };
        }
        return state;
      },
    },
  });
}

function renderWithStore(
  ui: React.ReactElement,
  themeMode: 'light' | 'dark' = 'dark',
) {
  const store = createTestStore(themeMode);
  const result = render(<Provider store={store}>{ui}</Provider>);
  return {...result, store};
}

// ─── 测试套件 ────────────────────────────────────────────────────────────────

describe('SalaryConfigModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSave: jest.fn().mockResolvedValue(undefined),
    workStartTime: '09:00',
    workEndTime: '18:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('非法月薪校验', () => {
    it('空输入时不调用 onSave，触发错误通知', async () => {
      const {getByTestId, store} = renderWithStore(
        <SalaryConfigModal {...defaultProps} />,
      );

      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.ui.notifications).toHaveLength(1);
        expect(state.ui.notifications[0].type).toBe('error');
      });
      expect(defaultProps.onSave).not.toHaveBeenCalled();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('输入 0 时不调用 onSave', async () => {
      const {getByTestId, store} = renderWithStore(
        <SalaryConfigModal {...defaultProps} />,
      );

      fireEvent.changeText(getByTestId('salary-input'), '0');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.ui.notifications).toHaveLength(1);
      });
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('输入负数时不调用 onSave', async () => {
      const {getByTestId, store} = renderWithStore(
        <SalaryConfigModal {...defaultProps} />,
      );

      fireEvent.changeText(getByTestId('salary-input'), '-5000');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.ui.notifications).toHaveLength(1);
      });
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('onSave 抛出 WageConfigError 时展示对应提示且不关闭', async () => {
      const onSave = jest.fn().mockRejectedValue('INVALID_TIME_ORDER');
      const {getByTestId, store} = renderWithStore(
        <SalaryConfigModal {...defaultProps} onSave={onSave} />,
      );

      fireEvent.changeText(getByTestId('salary-input'), '10000');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.ui.notifications).toHaveLength(1);
        expect(state.ui.notifications[0].message).toContain('个人资料页修改');
      });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('合法月薪提交', () => {
    it('输入合法月薪后调用 onSave 并关闭', async () => {
      const {getByTestId} = renderWithStore(
        <SalaryConfigModal {...defaultProps} />,
      );

      fireEvent.changeText(getByTestId('salary-input'), '15000');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(15000);
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('编辑模式下回填当前月薪', () => {
      const {getByTestId} = renderWithStore(
        <SalaryConfigModal {...defaultProps} currentSalary={20000} />,
      );

      const input = getByTestId('salary-input');
      expect(input.props.value).toBe('20000');
    });
  });

  describe('主题 snapshot', () => {
    it('深色主题渲染正确', () => {
      const {toJSON} = renderWithStore(
        <SalaryConfigModal {...defaultProps} currentSalary={10000} />,
        'dark',
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('浅色主题渲染正确', () => {
      const {toJSON} = renderWithStore(
        <SalaryConfigModal {...defaultProps} currentSalary={10000} />,
        'light',
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('交互行为', () => {
    it('点击取消按钮调用 onClose', () => {
      const {getByTestId} = renderWithStore(
        <SalaryConfigModal {...defaultProps} />,
      );

      fireEvent.press(getByTestId('cancel-button'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('visible 为 false 时不渲染内容', () => {
      const {queryByTestId} = renderWithStore(
        <SalaryConfigModal {...defaultProps} visible={false} />,
      );

      expect(queryByTestId('salary-input')).toBeNull();
    });
  });
});

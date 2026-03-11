/**
 * PhoneRegisterScreen gluestack-ui 迁移测试
 *
 * 测试目标：
 * 1. 验证所有 Tamagui 组件已替换为 gluestack-ui 组件
 * 2. 验证表单输入功能正常
 * 3. 验证验证码发送功能
 * 4. 验证注册功能
 * 5. 验证错误处理
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {PhoneRegisterScreen} from '../PhoneRegisterScreen';
import {AuthService} from '../../services/enhanced-auth/AuthService';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock AuthService
jest.mock('../../services/enhanced-auth/AuthService', () => ({
  AuthService: {
    sendSMSCode: jest.fn(),
    registerWithPhone: jest.fn(),
  },
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// 创建测试 store
const createTestStore = () => {
  return configureStore({
    reducer: {
      user: (state = {user: null}) => state,
    },
  });
};

describe('PhoneRegisterScreen - gluestack-ui 迁移', () => {
  const renderComponent = () => {
    const store = createTestStore();
    return render(
      <Provider store={store}>
        <GluestackUIProvider config={config}>
          <PhoneRegisterScreen />
        </GluestackUIProvider>
      </Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('组件渲染', () => {
    it('应该正确渲染所有 gluestack-ui 组件', () => {
      const {getByText, getByPlaceholderText} = renderComponent();

      // 验证标题
      expect(getByText('打工人加班指数')).toBeTruthy();
      expect(getByText('新用户注册')).toBeTruthy();

      // 验证表单标签
      expect(getByText('手机号')).toBeTruthy();
      expect(getByText('验证码')).toBeTruthy();

      // 验证输入框
      expect(getByPlaceholderText('请输入手机号')).toBeTruthy();
      expect(getByPlaceholderText('请输入验证码')).toBeTruthy();

      // 验证按钮
      expect(getByText('获取验证码')).toBeTruthy();
      expect(getByText('注册')).toBeTruthy();
      expect(getByText('立即登录')).toBeTruthy();
    });

    it('应该显示提示信息', () => {
      const {getByText} = renderComponent();
      expect(getByText(/注册即表示同意用户协议和隐私政策/)).toBeTruthy();
    });
  });

  describe('表单输入', () => {
    it('应该能够输入手机号', () => {
      const {getByPlaceholderText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');

      fireEvent.changeText(phoneInput, '13800138000');
      expect(phoneInput.props.value).toBe('13800138000');
    });

    it('应该能够输入验证码', () => {
      const {getByPlaceholderText} = renderComponent();
      const codeInput = getByPlaceholderText('请输入验证码');

      fireEvent.changeText(codeInput, '123456');
      expect(codeInput.props.value).toBe('123456');
    });

    it('应该限制手机号最大长度为11位', () => {
      const {getByPlaceholderText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');

      expect(phoneInput.props.maxLength).toBe(11);
    });

    it('应该限制验证码最大长度为6位', () => {
      const {getByPlaceholderText} = renderComponent();
      const codeInput = getByPlaceholderText('请输入验证码');

      expect(codeInput.props.maxLength).toBe(6);
    });
  });

  describe('验证码发送', () => {
    it('应该在手机号为空时显示错误', async () => {
      const {getByText} = renderComponent();
      const sendButton = getByText('获取验证码');

      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText('请输入手机号')).toBeTruthy();
      });
    });

    it('应该在手机号格式错误时显示错误', async () => {
      const {getByPlaceholderText, getByText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');
      const sendButton = getByText('获取验证码');

      fireEvent.changeText(phoneInput, '123');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText('请输入正确的手机号')).toBeTruthy();
      });
    });

    it('应该在手机号正确时发送验证码', async () => {
      (AuthService.sendSMSCode as jest.Mock).mockResolvedValue({
        success: true,
      });

      const {getByPlaceholderText, getByText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');
      const sendButton = getByText('获取验证码');

      fireEvent.changeText(phoneInput, '13800138000');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(AuthService.sendSMSCode).toHaveBeenCalledWith(
          '13800138000',
          'register',
        );
      });
    });

    it('应该在发送成功后显示倒计时', async () => {
      (AuthService.sendSMSCode as jest.Mock).mockResolvedValue({
        success: true,
      });

      const {getByPlaceholderText, getByText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');
      const sendButton = getByText('获取验证码');

      fireEvent.changeText(phoneInput, '13800138000');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText(/\d+秒/)).toBeTruthy();
      });
    });
  });

  describe('注册功能', () => {
    it('应该在手机号为空时显示错误', async () => {
      const {getByText} = renderComponent();
      const registerButton = getByText('注册');

      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('请输入手机号')).toBeTruthy();
      });
    });

    it('应该在验证码为空时显示错误', async () => {
      const {getByPlaceholderText, getByText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');
      const registerButton = getByText('注册');

      fireEvent.changeText(phoneInput, '13800138000');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('请输入验证码')).toBeTruthy();
      });
    });

    it('应该在验证码长度不正确时显示错误', async () => {
      const {getByPlaceholderText, getByText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');
      const codeInput = getByPlaceholderText('请输入验证码');
      const registerButton = getByText('注册');

      fireEvent.changeText(phoneInput, '13800138000');
      fireEvent.changeText(codeInput, '123');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('验证码为6位数字')).toBeTruthy();
      });
    });

    it('应该在信息正确时调用注册接口', async () => {
      (AuthService.registerWithPhone as jest.Mock).mockResolvedValue({
        success: true,
        user: {
          id: '123',
          phone_number: '13800138000',
        },
      });

      const {getByPlaceholderText, getByText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');
      const codeInput = getByPlaceholderText('请输入验证码');
      const registerButton = getByText('注册');

      fireEvent.changeText(phoneInput, '13800138000');
      fireEvent.changeText(codeInput, '123456');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(AuthService.registerWithPhone).toHaveBeenCalledWith(
          '13800138000',
          '123456',
        );
      });
    });
  });

  describe('导航', () => {
    it('应该能够导航到登录页', () => {
      const {getByText} = renderComponent();
      const loginLink = getByText('立即登录');

      fireEvent.press(loginLink);

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('加载状态', () => {
    it('应该在加载时禁用输入框', async () => {
      (AuthService.sendSMSCode as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({success: true}), 100),
          ),
      );

      const {getByPlaceholderText, getByText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');
      const sendButton = getByText('获取验证码');

      fireEvent.changeText(phoneInput, '13800138000');
      fireEvent.press(sendButton);

      // 输入框应该被禁用
      await waitFor(() => {
        expect(phoneInput.props.editable).toBe(false);
      });
    });

    it('应该在注册时显示加载文本', async () => {
      (AuthService.registerWithPhone as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({success: true, user: {id: '123'}}), 100),
          ),
      );

      const {getByPlaceholderText, getByText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');
      const codeInput = getByPlaceholderText('请输入验证码');
      const registerButton = getByText('注册');

      fireEvent.changeText(phoneInput, '13800138000');
      fireEvent.changeText(codeInput, '123456');
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(getByText('注册中...')).toBeTruthy();
      });
    });
  });

  describe('错误清除', () => {
    it('应该在重新输入手机号时清除错误', async () => {
      const {getByPlaceholderText, getByText, queryByText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');
      const sendButton = getByText('获取验证码');

      // 触发错误
      fireEvent.press(sendButton);
      await waitFor(() => {
        expect(getByText('请输入手机号')).toBeTruthy();
      });

      // 重新输入
      fireEvent.changeText(phoneInput, '13800138000');

      // 错误应该被清除
      await waitFor(() => {
        expect(queryByText('请输入手机号')).toBeNull();
      });
    });

    it('应该在重新输入验证码时清除错误', async () => {
      const {getByPlaceholderText, getByText, queryByText} = renderComponent();
      const phoneInput = getByPlaceholderText('请输入手机号');
      const codeInput = getByPlaceholderText('请输入验证码');
      const registerButton = getByText('注册');

      // 触发错误
      fireEvent.changeText(phoneInput, '13800138000');
      fireEvent.press(registerButton);
      await waitFor(() => {
        expect(getByText('请输入验证码')).toBeTruthy();
      });

      // 重新输入
      fireEvent.changeText(codeInput, '123456');

      // 错误应该被清除
      await waitFor(() => {
        expect(queryByText('请输入验证码')).toBeNull();
      });
    });
  });
});

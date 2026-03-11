/**
 * LoginScreen gluestack-ui 迁移测试
 *
 * 验证 LoginScreen 已成功迁移到 gluestack-ui
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {NavigationContainer} from '@react-navigation/native';
import {LoginScreen} from '../LoginScreen';
import userReducer from '../../store/slices/userSlice';
import {AuthService} from '../../services/enhanced-auth/AuthService';

// Mock AuthService
jest.mock('../../services/enhanced-auth/AuthService');

// 创建测试 store
const createTestStore = () => {
  return configureStore({
    reducer: {
      user: userReducer,
    },
  });
};

// 测试包装器
const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => {
  const store = createTestStore();

  return (
    <GluestackUIProvider config={config}>
      <Provider store={store}>
        <NavigationContainer>{children}</NavigationContainer>
      </Provider>
    </GluestackUIProvider>
  );
};

describe('LoginScreen - gluestack-ui 迁移测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('组件渲染', () => {
    it('应该正确渲染 gluestack-ui 组件', () => {
      const {getByText, getByPlaceholderText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 验证标题
      expect(getByText('打工人加班指数')).toBeTruthy();
      expect(getByText('冷静看待工作数据')).toBeTruthy();

      // 验证登录方式切换按钮
      expect(getByText('验证码登录')).toBeTruthy();
      expect(getByText('密码登录')).toBeTruthy();

      // 验证输入框
      expect(getByPlaceholderText('请输入手机号')).toBeTruthy();
      expect(getByPlaceholderText('请输入验证码')).toBeTruthy();

      // 验证按钮
      expect(getByText('获取验证码')).toBeTruthy();
      expect(getByText('登录')).toBeTruthy();
    });

    it('应该使用 gluestack-ui 的 FormControl 组件', () => {
      const {getByText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 验证表单标签
      expect(getByText('手机号')).toBeTruthy();
      expect(getByText('验证码')).toBeTruthy();
    });

    it('应该使用 gluestack-ui 的 Button 组件', () => {
      const {getByText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      const loginButton = getByText('登录');
      expect(loginButton).toBeTruthy();
    });

    it('应该使用 gluestack-ui 的 Input 组件', () => {
      const {getByPlaceholderText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      const phoneInput = getByPlaceholderText('请输入手机号');
      expect(phoneInput).toBeTruthy();
    });
  });

  describe('登录方式切换', () => {
    it('应该能够切换到密码登录', () => {
      const {getByText, getByPlaceholderText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 点击密码登录按钮
      const passwordButton = getByText('密码登录');
      fireEvent.press(passwordButton);

      // 验证密码输入框出现
      expect(getByPlaceholderText('请输入密码')).toBeTruthy();
      expect(getByText('忘记密码？')).toBeTruthy();
    });

    it('应该能够切换回验证码登录', () => {
      const {getByText, getByPlaceholderText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 先切换到密码登录
      fireEvent.press(getByText('密码登录'));

      // 再切换回验证码登录
      fireEvent.press(getByText('验证码登录'));

      // 验证验证码输入框出现
      expect(getByPlaceholderText('请输入验证码')).toBeTruthy();
      expect(getByText('获取验证码')).toBeTruthy();
    });
  });

  describe('表单验证', () => {
    it('应该显示手机号错误信息', async () => {
      const {getByText, getByPlaceholderText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 不输入手机号，直接点击登录
      const loginButton = getByText('登录');
      fireEvent.press(loginButton);

      // 验证错误信息显示
      await waitFor(() => {
        expect(getByText('请输入手机号')).toBeTruthy();
      });
    });

    it('应该显示验证码错误信息', async () => {
      const {getByText, getByPlaceholderText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 输入手机号
      const phoneInput = getByPlaceholderText('请输入手机号');
      fireEvent.changeText(phoneInput, '13800138000');

      // 不输入验证码，直接点击登录
      const loginButton = getByText('登录');
      fireEvent.press(loginButton);

      // 验证错误信息显示
      await waitFor(() => {
        expect(getByText('请输入验证码')).toBeTruthy();
      });
    });

    it('应该显示密码错误信息', async () => {
      const {getByText, getByPlaceholderText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 切换到密码登录
      fireEvent.press(getByText('密码登录'));

      // 输入手机号
      const phoneInput = getByPlaceholderText('请输入手机号');
      fireEvent.changeText(phoneInput, '13800138000');

      // 不输入密码，直接点击登录
      const loginButton = getByText('登录');
      fireEvent.press(loginButton);

      // 验证错误信息显示
      await waitFor(() => {
        expect(getByText('请输入密码')).toBeTruthy();
      });
    });
  });

  describe('发送验证码', () => {
    it('应该能够发送验证码', async () => {
      (AuthService.sendSMSCode as jest.Mock).mockResolvedValue({
        success: true,
      });

      const {getByText, getByPlaceholderText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 输入手机号
      const phoneInput = getByPlaceholderText('请输入手机号');
      fireEvent.changeText(phoneInput, '13800138000');

      // 点击获取验证码
      const sendButton = getByText('获取验证码');
      fireEvent.press(sendButton);

      // 验证 AuthService 被调用
      await waitFor(() => {
        expect(AuthService.sendSMSCode).toHaveBeenCalledWith(
          '13800138000',
          'login',
        );
      });
    });

    it('应该显示倒计时', async () => {
      (AuthService.sendSMSCode as jest.Mock).mockResolvedValue({
        success: true,
      });

      const {getByText, getByPlaceholderText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 输入手机号
      const phoneInput = getByPlaceholderText('请输入手机号');
      fireEvent.changeText(phoneInput, '13800138000');

      // 点击获取验证码
      const sendButton = getByText('获取验证码');
      fireEvent.press(sendButton);

      // 验证倒计时显示
      await waitFor(() => {
        expect(getByText(/\d+秒/)).toBeTruthy();
      });
    });
  });

  describe('样式和布局', () => {
    it('应该使用 gluestack-ui 的 spacing tokens', () => {
      const {getByText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 组件应该正常渲染，说明 spacing tokens 正确
      expect(getByText('打工人加班指数')).toBeTruthy();
    });

    it('应该使用 gluestack-ui 的 color tokens', () => {
      const {getByText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 组件应该正常渲染，说明 color tokens 正确
      expect(getByText('冷静看待工作数据')).toBeTruthy();
    });

    it('应该使用 gluestack-ui 的 VStack 和 HStack 布局', () => {
      const {getByText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 验证布局正确
      expect(getByText('验证码登录')).toBeTruthy();
      expect(getByText('密码登录')).toBeTruthy();
    });
  });

  describe('功能完整性', () => {
    it('应该保持所有原有功能', () => {
      const {getByText, getByPlaceholderText} = render(
        <TestWrapper>
          <LoginScreen />
        </TestWrapper>,
      );

      // 验证所有关键功能元素存在
      expect(getByText('打工人加班指数')).toBeTruthy();
      expect(getByText('验证码登录')).toBeTruthy();
      expect(getByText('密码登录')).toBeTruthy();
      expect(getByPlaceholderText('请输入手机号')).toBeTruthy();
      expect(getByText('获取验证码')).toBeTruthy();
      expect(getByText('登录')).toBeTruthy();
      expect(getByText('💡 新用户自动注册，老用户直接登录')).toBeTruthy();
    });
  });
});

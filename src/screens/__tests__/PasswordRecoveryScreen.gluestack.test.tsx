import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {PasswordRecoveryScreen} from '../PasswordRecoveryScreen';
import {AuthService} from '../../services/enhanced-auth/AuthService';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock AuthService
jest.mock('../../services/enhanced-auth/AuthService', () => ({
  AuthService: {
    sendSMSCode: jest.fn(),
    verifySMSCode: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

describe('PasswordRecoveryScreen - gluestack-ui 迁移测试', () => {
  const renderScreen = () =>
    render(
      <GluestackUIProvider config={config}>
        <PasswordRecoveryScreen />
      </GluestackUIProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染步骤1（输入手机号）', () => {
    const {getByText, getByPlaceholderText} = renderScreen();

    expect(getByText('找回密码')).toBeTruthy();
    expect(getByText('请输入您的注册手机号')).toBeTruthy();
    expect(getByPlaceholderText('请输入手机号')).toBeTruthy();
    expect(getByText('发送验证码')).toBeTruthy();
    expect(getByText('返回登录')).toBeTruthy();
  });

  it('应该能够发送验证码并进入步骤2', async () => {
    const {getByPlaceholderText, getByText} = renderScreen();

    (AuthService.sendSMSCode as jest.Mock).mockResolvedValue({
      success: true,
    });

    const phoneInput = getByPlaceholderText('请输入手机号');
    const sendButton = getByText('发送验证码');

    fireEvent.changeText(phoneInput, '13800138000');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(AuthService.sendSMSCode).toHaveBeenCalledWith(
        '13800138000',
        'reset_password',
      );
      expect(getByText('验证手机号')).toBeTruthy();
    });
  });

  it('应该在步骤2显示验证码输入', async () => {
    const {getByPlaceholderText, getByText} = renderScreen();

    (AuthService.sendSMSCode as jest.Mock).mockResolvedValue({
      success: true,
    });

    const phoneInput = getByPlaceholderText('请输入手机号');
    const sendButton = getByText('发送验证码');

    fireEvent.changeText(phoneInput, '13800138000');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(getByPlaceholderText('请输入6位验证码')).toBeTruthy();
      expect(getByText('下一步')).toBeTruthy();
      expect(getByText('返回上一步')).toBeTruthy();
    });
  });

  it('应该能够验证验证码并进入步骤3', async () => {
    const {getByPlaceholderText, getByText} = renderScreen();

    (AuthService.sendSMSCode as jest.Mock).mockResolvedValue({
      success: true,
    });
    (AuthService.verifySMSCode as jest.Mock).mockResolvedValue(true);

    // 步骤1：发送验证码
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, '13800138000');
    fireEvent.press(getByText('发送验证码'));

    await waitFor(() => {
      expect(getByText('验证手机号')).toBeTruthy();
    });

    // 步骤2：验证验证码
    const codeInput = getByPlaceholderText('请输入6位验证码');
    fireEvent.changeText(codeInput, '123456');
    fireEvent.press(getByText('下一步'));

    await waitFor(() => {
      expect(AuthService.verifySMSCode).toHaveBeenCalledWith(
        '13800138000',
        '123456',
        'reset_password',
      );
      expect(getByText('设置新密码')).toBeTruthy();
    });
  });

  it('应该在步骤3显示密码输入和要求', async () => {
    const {getByPlaceholderText, getByText} = renderScreen();

    (AuthService.sendSMSCode as jest.Mock).mockResolvedValue({
      success: true,
    });
    (AuthService.verifySMSCode as jest.Mock).mockResolvedValue(true);

    // 进入步骤3
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, '13800138000');
    fireEvent.press(getByText('发送验证码'));

    await waitFor(() => {
      expect(getByText('验证手机号')).toBeTruthy();
    });

    const codeInput = getByPlaceholderText('请输入6位验证码');
    fireEvent.changeText(codeInput, '123456');
    fireEvent.press(getByText('下一步'));

    await waitFor(() => {
      expect(getByPlaceholderText('至少8位，包含字母和数字')).toBeTruthy();
      expect(getByPlaceholderText('请再次输入新密码')).toBeTruthy();
      expect(getByText('密码要求：')).toBeTruthy();
      expect(getByText('• 长度至少8位')).toBeTruthy();
      expect(getByText('• 必须包含字母和数字')).toBeTruthy();
    });
  });

  it('应该能够成功重置密码', async () => {
    const {getByPlaceholderText, getByText} = renderScreen();

    (AuthService.sendSMSCode as jest.Mock).mockResolvedValue({
      success: true,
    });
    (AuthService.verifySMSCode as jest.Mock).mockResolvedValue(true);
    (AuthService.resetPassword as jest.Mock).mockResolvedValue({
      success: true,
    });

    // 进入步骤3
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, '13800138000');
    fireEvent.press(getByText('发送验证码'));

    await waitFor(() => {
      expect(getByText('验证手机号')).toBeTruthy();
    });

    const codeInput = getByPlaceholderText('请输入6位验证码');
    fireEvent.changeText(codeInput, '123456');
    fireEvent.press(getByText('下一步'));

    await waitFor(() => {
      expect(getByText('设置新密码')).toBeTruthy();
    });

    // 步骤3：设置新密码
    const newPasswordInput = getByPlaceholderText('至少8位，包含字母和数字');
    const confirmPasswordInput = getByPlaceholderText('请再次输入新密码');
    fireEvent.changeText(newPasswordInput, 'Test1234');
    fireEvent.changeText(confirmPasswordInput, 'Test1234');
    fireEvent.press(getByText('完成'));

    await waitFor(() => {
      expect(AuthService.resetPassword).toHaveBeenCalledWith(
        '13800138000',
        '123456',
        'Test1234',
      );
    });
  });

  it('应该能够返回登录页面', () => {
    const {getByText} = renderScreen();

    const backButton = getByText('返回登录');
    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalled();
  });
});

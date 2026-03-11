import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {SetPasswordScreen} from '../SetPasswordScreen';
import {AuthService} from '../../services/enhanced-auth/AuthService';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      userId: 'test-user-id',
      phoneNumber: '13800138000',
    },
  }),
}));

// Mock AuthService
jest.mock('../../services/enhanced-auth/AuthService', () => ({
  AuthService: {
    setPassword: jest.fn(),
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

describe('SetPasswordScreen - gluestack-ui 迁移测试', () => {
  const renderScreen = () =>
    render(
      <GluestackUIProvider config={config}>
        <SetPasswordScreen />
      </GluestackUIProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染所有 gluestack-ui 组件', () => {
    const {getByText, getByPlaceholderText} = renderScreen();

    expect(getByText('设置登录密码')).toBeTruthy();
    expect(
      getByText('设置密码后，您可以使用手机号 + 密码快速登录'),
    ).toBeTruthy();
    expect(getByPlaceholderText('请输入密码（6-20位）')).toBeTruthy();
    expect(getByPlaceholderText('请再次输入密码')).toBeTruthy();
    expect(getByText('设置密码')).toBeTruthy();
    expect(getByText('暂时跳过')).toBeTruthy();
  });

  it('应该显示密码强度指示器', () => {
    const {getByPlaceholderText, getByText} = renderScreen();

    const passwordInput = getByPlaceholderText('请输入密码（6-20位）');
    fireEvent.changeText(passwordInput, '123456');

    expect(getByText('密码强度：')).toBeTruthy();
  });

  it('应该验证两次密码是否一致', () => {
    const {getByPlaceholderText, getByText} = renderScreen();

    const passwordInput = getByPlaceholderText('请输入密码（6-20位）');
    const confirmInput = getByPlaceholderText('请再次输入密码');

    fireEvent.changeText(passwordInput, '123456');
    fireEvent.changeText(confirmInput, '654321');

    expect(getByText('两次输入的密码不一致')).toBeTruthy();
  });

  it('应该能够切换密码可见性', () => {
    const {getByText} = renderScreen();

    const showButton = getByText('显示');
    fireEvent.press(showButton);

    expect(getByText('隐藏')).toBeTruthy();
  });

  it('应该成功设置密码', async () => {
    const {getByPlaceholderText, getByText} = renderScreen();

    (AuthService.setPassword as jest.Mock).mockResolvedValue({
      success: true,
    });

    const passwordInput = getByPlaceholderText('请输入密码（6-20位）');
    const confirmInput = getByPlaceholderText('请再次输入密码');
    const submitButton = getByText('设置密码');

    fireEvent.changeText(passwordInput, '123456');
    fireEvent.changeText(confirmInput, '123456');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(AuthService.setPassword).toHaveBeenCalledWith(
        'test-user-id',
        '123456',
      );
    });
  });

  it('应该能够跳过设置密码', () => {
    const {getByText} = renderScreen();

    const skipButton = getByText('暂时跳过');
    fireEvent.press(skipButton);

    // Alert 应该被调用
    expect(require('react-native').Alert.alert).toHaveBeenCalled();
  });
});

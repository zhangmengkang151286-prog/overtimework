/**
 * 表单提交集成测试 - gluestack-ui
 * 验证需求: 9.2
 *
 * 测试表单提交功能
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {configureStore} from '@reduxjs/toolkit';
import dataReducer from '../../store/slices/dataSlice';
import uiReducer from '../../store/slices/uiSlice';
import userReducer from '../../store/slices/userSlice';
import {LoginScreen} from '../../screens/LoginScreen';
import {PhoneRegisterScreen} from '../../screens/PhoneRegisterScreen';
import {CompleteProfileScreen} from '../../screens/CompleteProfileScreen';
import {SetPasswordScreen} from '../../screens/SetPasswordScreen';

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
const mockSendSMSCode = jest.fn();
const mockLoginWithPhone = jest.fn();
const mockLoginWithPassword = jest.fn();
const mockRegisterWithPhone = jest.fn();

jest.mock('../../services/enhanced-auth/AuthService', () => ({
  AuthService: {
    sendSMSCode: mockSendSMSCode,
    loginWithPhone: mockLoginWithPhone,
    loginWithPassword: mockLoginWithPassword,
    registerWithPhone: mockRegisterWithPhone,
  },
}));

// Mock ProfileService
const mockCompleteProfile = jest.fn();
jest.mock('../../services/enhanced-auth/ProfileService', () => ({
  ProfileService: {
    completeProfile: mockCompleteProfile,
  },
}));

// Mock supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({data: null, error: null}),
      })),
    })),
  },
}));

jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getTags: jest.fn().mockResolvedValue([]),
  },
}));

// Mock useUserStatus
jest.mock('../../hooks/useUserStatus', () => ({
  useUserStatus: jest.fn(() => ({
    status: null,
    hasSubmittedToday: false,
    submitStatus: jest.fn(),
    forceResetTodayStatus: jest.fn(),
    shouldShowSelector: true,
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
        user: null,
        isAuthenticated: false,
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

describe('登录表单提交测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该能够提交验证码登录表单', async () => {
    mockSendSMSCode.mockResolvedValue({success: true});
    mockLoginWithPhone.mockResolvedValue({
      success: true,
      user: {id: 'test-id', phone_number: '13800138000'},
    });

    const {getByPlaceholderText, getByText} = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    // 输入手机号
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, '13800138000');

    // 发送验证码
    const sendButton = getByText('发送验证码');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockSendSMSCode).toHaveBeenCalledWith('13800138000');
    });

    // 输入验证码
    const codeInput = getByPlaceholderText('请输入验证码');
    fireEvent.changeText(codeInput, '123456');

    // 提交登录
    const loginButton = getByText('登录');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLoginWithPhone).toHaveBeenCalledWith('13800138000', '123456');
    });
  });

  it('应该能够提交密码登录表单', async () => {
    mockLoginWithPassword.mockResolvedValue({
      success: true,
      user: {id: 'test-id', phone_number: '13800138000'},
    });

    const {getByPlaceholderText, getByText} = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    // 切换到密码登录
    const passwordTab = getByText('密码登录');
    fireEvent.press(passwordTab);

    // 输入手机号和密码
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, '13800138000');

    const passwordInput = getByPlaceholderText('请输入密码');
    fireEvent.changeText(passwordInput, 'Test123456');

    // 提交登录
    const loginButton = getByText('登录');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLoginWithPassword).toHaveBeenCalledWith(
        '13800138000',
        'Test123456',
      );
    });
  });

  it('应该在手机号格式错误时显示错误', async () => {
    const {getByPlaceholderText, getByText} = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    // 输入无效手机号
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, '123');

    // 尝试发送验证码
    const sendButton = getByText('发送验证码');
    fireEvent.press(sendButton);

    // 验证不会调用 API
    await waitFor(() => {
      expect(mockSendSMSCode).not.toHaveBeenCalled();
    });
  });
});

describe('注册表单提交测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该能够提交注册表单', async () => {
    mockSendSMSCode.mockResolvedValue({success: true});
    mockRegisterWithPhone.mockResolvedValue({
      success: true,
      user: {id: 'test-id', phone_number: '13800138000'},
    });

    const {getByPlaceholderText, getByText} = render(
      <TestWrapper>
        <PhoneRegisterScreen />
      </TestWrapper>,
    );

    // 输入手机号
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, '13800138000');

    // 发送验证码
    const sendButton = getByText('发送验证码');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockSendSMSCode).toHaveBeenCalled();
    });

    // 输入验证码
    const codeInput = getByPlaceholderText('请输入验证码');
    fireEvent.changeText(codeInput, '123456');

    // 提交注册
    const registerButton = getByText('注册');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(mockRegisterWithPhone).toHaveBeenCalledWith(
        '13800138000',
        '123456',
      );
    });
  });

  it('应该在验证码为空时禁用注册按钮', () => {
    const {getByPlaceholderText, getByText} = render(
      <TestWrapper>
        <PhoneRegisterScreen />
      </TestWrapper>,
    );

    // 只输入手机号
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, '13800138000');

    // 注册按钮应该被禁用
    const registerButton = getByText('注册');
    expect(registerButton.props.accessibilityState?.disabled).toBeTruthy();
  });
});

describe('完善资料表单提交测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该能够提交完善资料表单', async () => {
    mockCompleteProfile.mockResolvedValue({success: true});

    const store = createTestStore({
      user: {
        user: {id: 'test-id', phone_number: '13800138000'},
        isAuthenticated: true,
      },
    });

    const {getByPlaceholderText, getByText} = render(
      <TestWrapper store={store}>
        <CompleteProfileScreen />
      </TestWrapper>,
    );

    // 输入姓名
    const nameInput = getByPlaceholderText('请输入姓名');
    fireEvent.changeText(nameInput, '张三');

    // 提交表单
    const submitButton = getByText('下一步');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockCompleteProfile).toHaveBeenCalled();
    });
  });

  it('应该能够跳过完善资料', () => {
    const store = createTestStore({
      user: {
        user: {id: 'test-id', phone_number: '13800138000'},
        isAuthenticated: true,
      },
    });

    const {getByText} = render(
      <TestWrapper store={store}>
        <CompleteProfileScreen />
      </TestWrapper>,
    );

    // 点击跳过
    const skipButton = getByText('跳过');
    fireEvent.press(skipButton);

    // 验证导航
    expect(mockNavigate).toHaveBeenCalled();
  });
});

describe('设置密码表单提交测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该能够提交设置密码表单', async () => {
    const store = createTestStore({
      user: {
        user: {id: 'test-id', phone_number: '13800138000'},
        isAuthenticated: true,
      },
    });

    const {getByPlaceholderText, getByText} = render(
      <TestWrapper store={store}>
        <SetPasswordScreen />
      </TestWrapper>,
    );

    // 输入密码
    const passwordInput = getByPlaceholderText('请输入密码');
    fireEvent.changeText(passwordInput, 'Test123456');

    // 输入确认密码
    const confirmInput = getByPlaceholderText('请再次输入密码');
    fireEvent.changeText(confirmInput, 'Test123456');

    // 提交表单
    const submitButton = getByText('完成');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it('应该在密码不匹配时显示错误', async () => {
    const store = createTestStore({
      user: {
        user: {id: 'test-id', phone_number: '13800138000'},
        isAuthenticated: true,
      },
    });

    const {getByPlaceholderText, getByText} = render(
      <TestWrapper store={store}>
        <SetPasswordScreen />
      </TestWrapper>,
    );

    // 输入不匹配的密码
    const passwordInput = getByPlaceholderText('请输入密码');
    fireEvent.changeText(passwordInput, 'Test123456');

    const confirmInput = getByPlaceholderText('请再次输入密码');
    fireEvent.changeText(confirmInput, 'Different123');

    // 提交表单
    const submitButton = getByText('完成');
    fireEvent.press(submitButton);

    // 验证显示错误
    await waitFor(() => {
      expect(getByText('两次输入的密码不一致')).toBeTruthy();
    });
  });

  it('应该能够跳过设置密码', () => {
    const store = createTestStore({
      user: {
        user: {id: 'test-id', phone_number: '13800138000'},
        isAuthenticated: true,
      },
    });

    const {getByText} = render(
      <TestWrapper store={store}>
        <SetPasswordScreen />
      </TestWrapper>,
    );

    // 点击跳过
    const skipButton = getByText('跳过');
    fireEvent.press(skipButton);

    // 验证导航
    expect(mockNavigate).toHaveBeenCalled();
  });
});

describe('表单验证测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该验证手机号格式', () => {
    const {getByPlaceholderText, getByText} = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    // 输入无效手机号
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, 'invalid');

    // 尝试发送验证码（按钮文本是"获取验证码"）
    const sendButton = getByText('获取验证码');
    fireEvent.press(sendButton);

    // 验证不会调用 API
    expect(mockSendSMSCode).not.toHaveBeenCalled();
  });

  it('应该验证验证码格式', () => {
    const {getByPlaceholderText, getByText} = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    // 输入有效手机号
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, '13800138000');

    // 输入无效验证码
    const codeInput = getByPlaceholderText('请输入验证码');
    fireEvent.changeText(codeInput, '12');

    // 尝试登录
    const loginButton = getByText('登录');
    fireEvent.press(loginButton);

    // 验证不会调用 API
    expect(mockLoginWithPhone).not.toHaveBeenCalled();
  });

  it('应该验证密码强度', () => {
    const store = createTestStore({
      user: {
        user: {id: 'test-id', phone_number: '13800138000'},
        isAuthenticated: true,
      },
    });

    const {getByPlaceholderText, getByText} = render(
      <TestWrapper store={store}>
        <SetPasswordScreen />
      </TestWrapper>,
    );

    // 输入弱密码（使用正确的占位符文本）
    const passwordInput = getByPlaceholderText('请输入密码（6-20位）');
    fireEvent.changeText(passwordInput, '123');

    const confirmInput = getByPlaceholderText('请再次输入密码');
    fireEvent.changeText(confirmInput, '123');

    // 尝试提交（按钮文本是"设置密码"）
    const submitButton = getByText('设置密码');
    fireEvent.press(submitButton);

    // 验证显示错误
    expect(getByText('密码长度为 6-20 位，建议包含字母和数字')).toBeTruthy();
  });
});

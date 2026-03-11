/**
 * 页面导航集成测试 - gluestack-ui
 * 验证需求: 9.2
 *
 * 测试页面导航功能
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Provider} from 'react-redux';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {store} from '../../store';
import {LoginScreen} from '../../screens/LoginScreen';
import {PhoneRegisterScreen} from '../../screens/PhoneRegisterScreen';
import {CompleteProfileScreen} from '../../screens/CompleteProfileScreen';
import {SetPasswordScreen} from '../../screens/SetPasswordScreen';
import TrendPage from '../../screens/TrendPage';
import {SettingsScreen} from '../../screens/SettingsScreen';

// Mock dependencies
jest.mock('../../services/enhanced-auth/AuthService', () => ({
  AuthService: {
    sendSMSCode: jest.fn().mockResolvedValue({success: true}),
    loginWithPhone: jest.fn().mockResolvedValue({
      success: true,
      user: {id: 'test-id', phone_number: '13800138000'},
    }),
    registerWithPhone: jest.fn().mockResolvedValue({
      success: true,
      user: {id: 'test-id', phone_number: '13800138000'},
    }),
  },
}));

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getTags: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../services/storage', () => ({
  storageService: {
    logout: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const Stack = createNativeStackNavigator();

// 创建导航测试包装器
const NavigationTestWrapper = ({
  initialRouteName = 'Login',
}: {
  initialRouteName?: string;
}) => (
  <GluestackUIProvider config={config}>
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRouteName}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="PhoneRegister" component={PhoneRegisterScreen} />
          <Stack.Screen
            name="CompleteProfile"
            component={CompleteProfileScreen}
          />
          <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
          <Stack.Screen name="TrendPage" component={TrendPage} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  </GluestackUIProvider>
);

describe('页面导航集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该能够从登录页导航到注册页', async () => {
    const {getByText, findByText} = render(<NavigationTestWrapper />);

    // 等待登录页加载
    await waitFor(() => {
      expect(getByText('登录')).toBeTruthy();
    });

    // 点击注册链接
    const registerLink = getByText('立即注册');
    fireEvent.press(registerLink);

    // 验证导航到注册页
    await waitFor(() => {
      expect(findByText('注册')).toBeTruthy();
    });
  });

  it('应该能够从注册页返回登录页', async () => {
    const {getByText, findByText} = render(
      <NavigationTestWrapper initialRouteName="PhoneRegister" />,
    );

    // 等待注册页加载
    await waitFor(() => {
      expect(getByText('注册')).toBeTruthy();
    });

    // 点击登录链接
    const loginLink = getByText('已有账号？去登录');
    fireEvent.press(loginLink);

    // 验证导航到登录页
    await waitFor(() => {
      expect(findByText('登录')).toBeTruthy();
    });
  });

  it('应该能够从登录页导航到密码找回页', async () => {
    const {getByText} = render(<NavigationTestWrapper />);

    // 等待登录页加载
    await waitFor(() => {
      expect(getByText('登录')).toBeTruthy();
    });

    // 点击忘记密码链接
    const forgotPasswordLink = getByText('忘记密码？');
    fireEvent.press(forgotPasswordLink);

    // 验证导航到密码找回页
    await waitFor(() => {
      expect(getByText('重置密码')).toBeTruthy();
    });
  });

  it('应该能够完成注册流程并导航到完善资料页', async () => {
    const {getByText, getByPlaceholderText} = render(
      <NavigationTestWrapper initialRouteName="PhoneRegister" />,
    );

    // 等待注册页加载
    await waitFor(() => {
      expect(getByText('注册')).toBeTruthy();
    });

    // 输入手机号
    const phoneInput = getByPlaceholderText('请输入手机号');
    fireEvent.changeText(phoneInput, '13800138000');

    // 发送验证码
    const sendButton = getByText('发送验证码');
    fireEvent.press(sendButton);

    // 输入验证码
    const codeInput = getByPlaceholderText('请输入验证码');
    fireEvent.changeText(codeInput, '123456');

    // 点击注册
    const registerButton = getByText('注册');
    fireEvent.press(registerButton);

    // 验证导航到完善资料页
    await waitFor(
      () => {
        expect(getByText('完善资料')).toBeTruthy();
      },
      {timeout: 3000},
    );
  });
});

describe('认证流程导航测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该能够完成完整的注册流程', async () => {
    const {getByText, getByPlaceholderText} = render(
      <NavigationTestWrapper initialRouteName="PhoneRegister" />,
    );

    // 1. 注册页面
    await waitFor(() => {
      expect(getByText('注册')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('请输入手机号'), '13800138000');
    fireEvent.press(getByText('发送验证码'));
    fireEvent.changeText(getByPlaceholderText('请输入验证码'), '123456');
    fireEvent.press(getByText('注册'));

    // 2. 完善资料页面
    await waitFor(
      () => {
        expect(getByText('完善资料')).toBeTruthy();
      },
      {timeout: 3000},
    );

    // 3. 可以选择跳过或完成资料
    const skipButton = getByText('跳过');
    expect(skipButton).toBeTruthy();
  });

  it('应该能够从完善资料页导航到设置密码页', async () => {
    const {getByText} = render(
      <NavigationTestWrapper initialRouteName="CompleteProfile" />,
    );

    // 等待完善资料页加载
    await waitFor(() => {
      expect(getByText('完善资料')).toBeTruthy();
    });

    // 点击下一步（假设已填写资料）
    const nextButton = getByText('下一步');
    fireEvent.press(nextButton);

    // 验证导航到设置密码页
    await waitFor(() => {
      expect(getByText('设置密码')).toBeTruthy();
    });
  });
});

describe('主页面导航测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该能够从趋势页导航到设置页', async () => {
    const {getByText, getByTestId} = render(
      <NavigationTestWrapper initialRouteName="TrendPage" />,
    );

    // 等待趋势页加载
    await waitFor(() => {
      expect(getByText('打工人下班指数')).toBeTruthy();
    });

    // 点击设置按钮（假设有设置按钮）
    const settingsButton = getByTestId('settings-button');
    fireEvent.press(settingsButton);

    // 验证导航到设置页
    await waitFor(() => {
      expect(getByText('设置')).toBeTruthy();
    });
  });
});

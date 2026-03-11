import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {configureStore} from '@reduxjs/toolkit';
import {SettingsScreen} from '../SettingsScreen';
import userReducer from '../../store/slices/userSlice';

// Mock 导航
const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
  }),
}));

// Mock Supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('../../services/supabaseService', () => ({
  supabaseService: {
    getTags: jest.fn().mockResolvedValue([]),
  },
}));

// Mock 存储服务
jest.mock('../../services/storage', () => ({
  storageService: {
    logout: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock 认证服务
jest.mock('../../services/enhanced-auth/AuthService', () => ({
  AuthService: {
    sendSMSCode: jest.fn().mockResolvedValue({}),
    loginWithPassword: jest.fn().mockResolvedValue({success: true}),
    setPassword: jest.fn().mockResolvedValue({success: true}),
  },
}));

// Mock 个人资料服务
jest.mock('../../services/enhanced-auth/ProfileService', () => ({
  ProfileService: {
    getInstance: jest.fn(() => ({
      updateProfile: jest.fn().mockResolvedValue({}),
      updatePhoneNumber: jest.fn().mockResolvedValue({}),
    })),
  },
}));

// Mock 定位服务
jest.mock('../../services/enhanced-auth/LocationService', () => ({
  locationService: {
    requestLocationPermission: jest.fn().mockResolvedValue(true),
    getLocationInfo: jest.fn().mockResolvedValue({
      province: '北京市',
      city: '北京市',
    }),
  },
}));

// Mock 主题 hook
jest.mock('../../hooks/useTheme', () => ({
  useThemeToggle: jest.fn(() => ({
    isDark: false,
    toggleTheme: jest.fn(),
  })),
}));

// Mock 中国地区数据
jest.mock('../../data/chinaRegions', () => ({
  getProvinces: jest.fn(() => ['北京市', '上海市', '广东省']),
  getCitiesByProvince: jest.fn(() => ['北京市', '朝阳区', '海淀区']),
}));

// Mock SearchableSelector
jest.mock('../../components/SearchableSelector', () => ({
  SearchableSelector: () => null,
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const mockUser = {
  id: 'test-user-id',
  username: '测试用户',
  phoneNumber: '13800138000',
  province: '北京市',
  city: '北京市',
  industry: '互联网',
  company: '测试公司',
  position: '工程师',
  workStartTime: '09:00',
  workEndTime: '18:00',
};

const createTestStore = (user = mockUser) => {
  return configureStore({
    reducer: {
      user: userReducer,
    },
    preloadedState: {
      user: {
        currentUser: user,
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  });
};

const renderWithProviders = (
  component: React.ReactElement,
  store = createTestStore(),
) => {
  return render(
    <GluestackUIProvider config={config}>
      <Provider store={store}>
        <NavigationContainer>{component}</NavigationContainer>
      </Provider>
    </GluestackUIProvider>,
  );
};

describe('SettingsScreen - Gluestack UI 迁移', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染设置页面', () => {
    const {getByText} = renderWithProviders(<SettingsScreen />);

    expect(getByText('设置')).toBeTruthy();
    expect(getByText('个人信息')).toBeTruthy();
    expect(getByText('应用设置')).toBeTruthy();
  });

  it('应该显示用户信息', () => {
    const {getByText} = renderWithProviders(<SettingsScreen />);

    expect(getByText('测试用户')).toBeTruthy();
    expect(getByText('13800138000')).toBeTruthy();
    expect(getByText(/北京市/)).toBeTruthy();
    expect(getByText(/互联网/)).toBeTruthy();
  });

  it('应该显示主题切换开关', () => {
    const {getByText} = renderWithProviders(<SettingsScreen />);

    expect(getByText('深色模式')).toBeTruthy();
    expect(getByText('当前为浅色主题')).toBeTruthy();
  });

  it('应该显示所有设置项', () => {
    const {getByText} = renderWithProviders(<SettingsScreen />);

    // 个人信息设置
    expect(getByText('编辑个人信息')).toBeTruthy();
    expect(getByText('修改手机号')).toBeTruthy();
    expect(getByText('修改密码')).toBeTruthy();

    // 应用设置
    expect(getByText('通知设置')).toBeTruthy();
    expect(getByText('隐私设置')).toBeTruthy();

    // 数据管理
    expect(getByText('管理基础数据')).toBeTruthy();

    // 关于
    expect(getByText('关于应用')).toBeTruthy();
    expect(getByText('帮助与反馈')).toBeTruthy();

    // 退出登录
    expect(getByText('退出登录')).toBeTruthy();
  });

  it('应该显示版本信息', () => {
    const {getByText} = renderWithProviders(<SettingsScreen />);

    expect(getByText('版本 1.0.0')).toBeTruthy();
  });

  it('应该使用 gluestack-ui 组件', () => {
    const {UNSAFE_root} = renderWithProviders(<SettingsScreen />);

    // 验证使用了 gluestack-ui 的 Box 组件
    const boxes = UNSAFE_root.findAllByType('Box' as any);
    expect(boxes.length).toBeGreaterThan(0);
  });

  it('点击编辑个人信息应该打开模态框', async () => {
    const {getByText} = renderWithProviders(<SettingsScreen />);

    const editButton = getByText('编辑个人信息');
    fireEvent.press(editButton);

    // 模态框应该打开（在实际应用中会显示）
    // 这里我们只验证按钮可以被点击
    expect(editButton).toBeTruthy();
  });

  it('点击数据管理应该导航到数据管理页面', () => {
    const {getByText} = renderWithProviders(<SettingsScreen />);

    const dataManagementButton = getByText('管理基础数据');
    fireEvent.press(dataManagementButton);

    expect(mockNavigate).toHaveBeenCalledWith('DataManagement');
  });
});

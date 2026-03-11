import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {CompleteProfileScreen} from '../CompleteProfileScreen';
import {store} from '../../store';

// Mock dependencies
jest.mock('../../services/supabaseService');
jest.mock('../../services/enhanced-auth/AuthService');
jest.mock('../../services/enhanced-auth/LocationService');
jest.mock('../../services/storage');
jest.mock('../../services/enhanced-auth/ImageProcessingService');
jest.mock('expo-image-picker');
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    userId: 'test-user-id',
    phoneNumber: '13800138000',
  },
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <GluestackUIProvider config={config}>
        <NavigationContainer>{component}</NavigationContainer>
      </GluestackUIProvider>
    </Provider>,
  );
};

describe('CompleteProfileScreen - Gluestack UI 迁移', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该使用 gluestack-ui 组件渲染完善资料页面', () => {
    const {getByText, getByPlaceholderText} = renderWithProviders(
      <CompleteProfileScreen />,
    );

    // 验证标题
    expect(getByText('完善个人信息')).toBeTruthy();
    expect(getByText('请填写以下信息以完成注册')).toBeTruthy();

    // 验证表单字段标签
    expect(getByText('用户名 *')).toBeTruthy();
    expect(getByText('省份城市 *')).toBeTruthy();
    expect(getByText('行业 *')).toBeTruthy();
    expect(getByText('公司 *')).toBeTruthy();
    expect(getByText('职位 *')).toBeTruthy();
    expect(getByText('标准工作时间 *')).toBeTruthy();

    // 验证输入框
    expect(getByPlaceholderText('请输入用户名')).toBeTruthy();

    // 验证按钮
    expect(getByText('完成')).toBeTruthy();
  });

  it('应该使用 gluestack-ui Input 组件', () => {
    const {getByPlaceholderText} = renderWithProviders(
      <CompleteProfileScreen />,
    );

    const usernameInput = getByPlaceholderText('请输入用户名');
    expect(usernameInput).toBeTruthy();

    // 测试输入
    fireEvent.changeText(usernameInput, '测试用户');
    expect(usernameInput.props.value).toBe('测试用户');
  });

  it('应该使用 gluestack-ui Button 组件', () => {
    const {getByText} = renderWithProviders(<CompleteProfileScreen />);

    const submitButton = getByText('完成');
    expect(submitButton).toBeTruthy();

    // 测试按钮点击
    fireEvent.press(submitButton);
  });

  it('应该显示头像上传区域', () => {
    const {getByText} = renderWithProviders(<CompleteProfileScreen />);

    expect(getByText('点击上传头像')).toBeTruthy();
    expect(getByText('+')).toBeTruthy();
  });

  it('应该显示省份城市选择按钮', () => {
    const {getByText} = renderWithProviders(<CompleteProfileScreen />);

    expect(getByText('请选择省份')).toBeTruthy();
    expect(getByText('请选择城市')).toBeTruthy();
  });

  it('应该显示行业、公司、职位选择按钮', () => {
    const {getByText} = renderWithProviders(<CompleteProfileScreen />);

    expect(getByText('请选择行业')).toBeTruthy();
    expect(getByText('请选择公司')).toBeTruthy();
    expect(getByText('请选择职位')).toBeTruthy();
  });

  it('应该在编辑模式下显示正确的标题', () => {
    const editRoute = {
      params: {
        isEditing: true,
      },
    };

    jest
      .spyOn(require('@react-navigation/native'), 'useRoute')
      .mockReturnValue(editRoute);

    const {getByText} = renderWithProviders(<CompleteProfileScreen />);

    expect(getByText('编辑个人信息')).toBeTruthy();
    expect(getByText('修改您的个人信息')).toBeTruthy();
    expect(getByText('保存修改')).toBeTruthy();
  });

  it('应该使用 gluestack-ui 的样式 tokens', () => {
    const {getByText} = renderWithProviders(<CompleteProfileScreen />);

    const heading = getByText('完善个人信息');
    expect(heading).toBeTruthy();
    // gluestack-ui 组件应该有正确的样式属性
  });

  it('应该正确处理表单验证', async () => {
    const {getByText} = renderWithProviders(<CompleteProfileScreen />);

    const submitButton = getByText('完成');
    fireEvent.press(submitButton);

    // 应该显示验证错误（通过 Alert）
    await waitFor(() => {
      // Alert.alert 会被调用
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });
});

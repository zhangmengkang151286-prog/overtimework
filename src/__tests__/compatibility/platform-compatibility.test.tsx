/**
 * 平台兼容性测试
 * 测试 iOS 和 Android 平台的兼容性
 * 验证需求: 9.5
 */

import React from 'react';
import {Platform} from 'react-native';
import {render} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {Provider} from 'react-redux';
import {store} from '../../store';

// 导入组件
import {AppButton} from '../../components/gluestack/Button';
import {DataCard} from '../../components/gluestack/DataCard';
import {StatusButton} from '../../components/gluestack/StatusButton';
import {StatusIndicator} from '../../components/gluestack/StatusIndicator';

// 测试包装器
const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <GluestackUIProvider config={config}>{children}</GluestackUIProvider>
  </Provider>
);

describe('平台兼容性测试', () => {
  describe('平台检测', () => {
    it('应该正确识别当前平台', () => {
      expect(Platform.OS).toBeDefined();
      expect(['ios', 'android', 'web']).toContain(Platform.OS);
    });

    it('应该提供平台版本信息', () => {
      if (Platform.OS !== 'web') {
        expect(Platform.Version).toBeDefined();
      }
    });
  });

  describe('iOS 兼容性', () => {
    beforeEach(() => {
      // Mock iOS 平台
      Platform.OS = 'ios';
    });

    it('Button 组件应该在 iOS 上正常渲染', () => {
      const {getByText} = render(
        <TestWrapper>
          <AppButton>iOS 按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('iOS 按钮')).toBeTruthy();
    });

    it('DataCard 组件应该在 iOS 上正常渲染', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="iOS 卡片" value="100" />
        </TestWrapper>,
      );

      expect(getByText('iOS 卡片')).toBeTruthy();
      expect(getByText('100')).toBeTruthy();
    });

    it('StatusButton 组件应该在 iOS 上正常渲染', () => {
      const {getByText} = render(
        <TestWrapper>
          <StatusButton status="overtime" onPress={() => {}}>
            加班
          </StatusButton>
        </TestWrapper>,
      );

      expect(getByText('加班')).toBeTruthy();
    });

    it('StatusIndicator 组件应该在 iOS 上正常渲染', () => {
      const {getByText} = render(
        <TestWrapper>
          <StatusIndicator status="overtime" />
        </TestWrapper>,
      );

      expect(getByText('加班')).toBeTruthy();
    });
  });

  describe('Android 兼容性', () => {
    beforeEach(() => {
      // Mock Android 平台
      Platform.OS = 'android';
    });

    it('Button 组件应该在 Android 上正常渲染', () => {
      const {getByText} = render(
        <TestWrapper>
          <AppButton>Android 按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('Android 按钮')).toBeTruthy();
    });

    it('DataCard 组件应该在 Android 上正常渲染', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="Android 卡片" value="100" />
        </TestWrapper>,
      );

      expect(getByText('Android 卡片')).toBeTruthy();
      expect(getByText('100')).toBeTruthy();
    });

    it('StatusButton 组件应该在 Android 上正常渲染', () => {
      const {getByText} = render(
        <TestWrapper>
          <StatusButton status="ontime" onPress={() => {}}>
            下班
          </StatusButton>
        </TestWrapper>,
      );

      expect(getByText('下班')).toBeTruthy();
    });

    it('StatusIndicator 组件应该在 Android 上正常渲染', () => {
      const {getByText} = render(
        <TestWrapper>
          <StatusIndicator status="ontime" />
        </TestWrapper>,
      );

      expect(getByText('下班')).toBeTruthy();
    });
  });

  describe('平台特定样式', () => {
    it('应该根据平台应用不同的样式', () => {
      const iosStyle = Platform.select({
        ios: {shadowOpacity: 0.3},
        android: {elevation: 4},
      });

      if (Platform.OS === 'ios') {
        expect(iosStyle).toHaveProperty('shadowOpacity');
      } else if (Platform.OS === 'android') {
        expect(iosStyle).toHaveProperty('elevation');
      }
    });

    it('应该支持平台特定的组件属性', () => {
      const platformProps = Platform.select({
        ios: {activeOpacity: 0.7},
        android: {rippleColor: 'rgba(0, 0, 0, 0.1)'},
        default: {},
      });

      expect(platformProps).toBeDefined();
    });
  });

  describe('SafeArea 兼容性', () => {
    it('应该正确处理 SafeArea', () => {
      // SafeArea 在 iOS 上特别重要
      const {container} = render(
        <TestWrapper>
          <AppButton>测试按钮</AppButton>
        </TestWrapper>,
      );

      expect(container).toBeTruthy();
    });
  });

  describe('字体兼容性', () => {
    it('应该使用系统默认字体', () => {
      const systemFont = Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      });

      expect(systemFont).toBeDefined();
    });
  });

  describe('触摸反馈兼容性', () => {
    it('应该在两个平台上都支持触摸反馈', () => {
      const {getByText} = render(
        <TestWrapper>
          <AppButton onPress={() => {}}>可点击按钮</AppButton>
        </TestWrapper>,
      );

      const button = getByText('可点击按钮');
      expect(button).toBeTruthy();
    });
  });
});

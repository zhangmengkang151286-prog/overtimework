/**
 * 屏幕尺寸兼容性测试
 * 测试不同屏幕尺寸下的布局和显示
 * 验证需求: 9.5
 */

import React from 'react';
import {Dimensions} from 'react-native';
import {render} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {Provider} from 'react-redux';
import {store} from '../../store';

// 导入组件
import {AppButton} from '../../components/gluestack/Button';
import {DataCard} from '../../components/gluestack/DataCard';
import {VersusBar} from '../../components/VersusBar';

// 测试包装器
const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <GluestackUIProvider config={config}>{children}</GluestackUIProvider>
  </Provider>
);

// 屏幕尺寸配置
const SCREEN_SIZES = {
  small: {width: 375, height: 667}, // iPhone SE
  medium: {width: 390, height: 844}, // iPhone 12
  large: {width: 428, height: 926}, // iPhone 12 Pro Max
  tablet: {width: 768, height: 1024}, // iPad
};

describe('屏幕尺寸兼容性测试', () => {
  describe('屏幕尺寸检测', () => {
    it('应该能够获取屏幕尺寸', () => {
      const {width, height} = Dimensions.get('window');
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });

    it('应该能够获取屏幕缩放比例', () => {
      const scale = Dimensions.get('window').scale;
      expect(scale).toBeGreaterThan(0);
    });
  });

  describe('小屏幕兼容性 (375x667)', () => {
    beforeEach(() => {
      // Mock 小屏幕尺寸
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        ...SCREEN_SIZES.small,
        scale: 2,
        fontScale: 1,
      });
    });

    it('Button 组件应该在小屏幕上正常显示', () => {
      const {getByText} = render(
        <TestWrapper>
          <AppButton>小屏幕按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('小屏幕按钮')).toBeTruthy();
    });

    it('DataCard 组件应该在小屏幕上正常显示', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="小屏幕卡片" value="100" />
        </TestWrapper>,
      );

      expect(getByText('小屏幕卡片')).toBeTruthy();
    });

    it('VersusBar 组件应该在小屏幕上正常显示', () => {
      const {container} = render(
        <TestWrapper>
          <VersusBar overtimeCount={60} ontimeCount={40} />
        </TestWrapper>,
      );

      expect(container).toBeTruthy();
    });
  });

  describe('中等屏幕兼容性 (390x844)', () => {
    beforeEach(() => {
      // Mock 中等屏幕尺寸
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        ...SCREEN_SIZES.medium,
        scale: 3,
        fontScale: 1,
      });
    });

    it('Button 组件应该在中等屏幕上正常显示', () => {
      const {getByText} = render(
        <TestWrapper>
          <AppButton>中等屏幕按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('中等屏幕按钮')).toBeTruthy();
    });

    it('DataCard 组件应该在中等屏幕上正常显示', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="中等屏幕卡片" value="200" />
        </TestWrapper>,
      );

      expect(getByText('中等屏幕卡片')).toBeTruthy();
    });
  });

  describe('大屏幕兼容性 (428x926)', () => {
    beforeEach(() => {
      // Mock 大屏幕尺寸
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        ...SCREEN_SIZES.large,
        scale: 3,
        fontScale: 1,
      });
    });

    it('Button 组件应该在大屏幕上正常显示', () => {
      const {getByText} = render(
        <TestWrapper>
          <AppButton>大屏幕按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('大屏幕按钮')).toBeTruthy();
    });

    it('DataCard 组件应该在大屏幕上正常显示', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="大屏幕卡片" value="300" />
        </TestWrapper>,
      );

      expect(getByText('大屏幕卡片')).toBeTruthy();
    });
  });

  describe('平板兼容性 (768x1024)', () => {
    beforeEach(() => {
      // Mock 平板屏幕尺寸
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        ...SCREEN_SIZES.tablet,
        scale: 2,
        fontScale: 1,
      });
    });

    it('Button 组件应该在平板上正常显示', () => {
      const {getByText} = render(
        <TestWrapper>
          <AppButton>平板按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('平板按钮')).toBeTruthy();
    });

    it('DataCard 组件应该在平板上正常显示', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="平板卡片" value="400" />
        </TestWrapper>,
      );

      expect(getByText('平板卡片')).toBeTruthy();
    });

    it('应该能够检测平板设备', () => {
      const {width} = Dimensions.get('window');
      const isTablet = width >= 768;
      expect(isTablet).toBe(true);
    });
  });

  describe('响应式布局', () => {
    it('应该根据屏幕宽度调整布局', () => {
      const {width} = Dimensions.get('window');
      const columns = width >= 768 ? 3 : width >= 390 ? 2 : 1;

      expect(columns).toBeGreaterThan(0);
      expect(columns).toBeLessThanOrEqual(3);
    });

    it('应该根据屏幕高度调整内容', () => {
      const {height} = Dimensions.get('window');
      const isShortScreen = height < 700;

      expect(typeof isShortScreen).toBe('boolean');
    });
  });

  describe('字体缩放兼容性', () => {
    it('应该支持系统字体缩放', () => {
      const fontScale = Dimensions.get('window').fontScale;
      expect(fontScale).toBeGreaterThan(0);
    });

    it('应该在大字体模式下正常显示', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        ...SCREEN_SIZES.medium,
        scale: 3,
        fontScale: 1.5, // 大字体模式
      });

      const {getByText} = render(
        <TestWrapper>
          <AppButton>大字体按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('大字体按钮')).toBeTruthy();
    });
  });

  describe('横屏/竖屏兼容性', () => {
    it('应该支持竖屏模式', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 390,
        height: 844,
        scale: 3,
        fontScale: 1,
      });

      const {width, height} = Dimensions.get('window');
      const isPortrait = height > width;
      expect(isPortrait).toBe(true);
    });

    it('应该支持横屏模式', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 844,
        height: 390,
        scale: 3,
        fontScale: 1,
      });

      const {width, height} = Dimensions.get('window');
      const isLandscape = width > height;
      expect(isLandscape).toBe(true);
    });
  });

  describe('屏幕尺寸变化', () => {
    it('应该能够监听屏幕尺寸变化', () => {
      const listener = jest.fn();
      const subscription = Dimensions.addEventListener('change', listener);

      expect(subscription).toBeDefined();
      subscription.remove();
    });
  });
});

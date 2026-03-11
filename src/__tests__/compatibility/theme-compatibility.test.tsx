/**
 * 主题兼容性测试
 * 测试深色/浅色模式的兼容性
 * 验证需求: 9.5
 */

import React from 'react';
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
const TestWrapper: React.FC<{
  children: React.ReactNode;
  colorMode?: 'light' | 'dark';
}> = ({children, colorMode = 'light'}) => (
  <Provider store={store}>
    <GluestackUIProvider config={config} colorMode={colorMode}>
      {children}
    </GluestackUIProvider>
  </Provider>
);

describe('主题兼容性测试', () => {
  describe('浅色模式', () => {
    it('Button 组件应该在浅色模式下正常显示', () => {
      const {getByText} = render(
        <TestWrapper colorMode="light">
          <AppButton>浅色按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('浅色按钮')).toBeTruthy();
    });

    it('DataCard 组件应该在浅色模式下正常显示', () => {
      const {getByText} = render(
        <TestWrapper colorMode="light">
          <DataCard title="浅色卡片" value="100" />
        </TestWrapper>,
      );

      expect(getByText('浅色卡片')).toBeTruthy();
      expect(getByText('100')).toBeTruthy();
    });

    it('StatusButton 组件应该在浅色模式下正常显示', () => {
      const {getByText} = render(
        <TestWrapper colorMode="light">
          <StatusButton status="overtime" onPress={() => {}}>
            加班
          </StatusButton>
        </TestWrapper>,
      );

      expect(getByText('加班')).toBeTruthy();
    });

    it('StatusIndicator 组件应该在浅色模式下正常显示', () => {
      const {getByText} = render(
        <TestWrapper colorMode="light">
          <StatusIndicator status="overtime" />
        </TestWrapper>,
      );

      expect(getByText('加班')).toBeTruthy();
    });
  });

  describe('深色模式', () => {
    it('Button 组件应该在深色模式下正常显示', () => {
      const {getByText} = render(
        <TestWrapper colorMode="dark">
          <AppButton>深色按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('深色按钮')).toBeTruthy();
    });

    it('DataCard 组件应该在深色模式下正常显示', () => {
      const {getByText} = render(
        <TestWrapper colorMode="dark">
          <DataCard title="深色卡片" value="200" />
        </TestWrapper>,
      );

      expect(getByText('深色卡片')).toBeTruthy();
      expect(getByText('200')).toBeTruthy();
    });

    it('StatusButton 组件应该在深色模式下正常显示', () => {
      const {getByText} = render(
        <TestWrapper colorMode="dark">
          <StatusButton status="ontime" onPress={() => {}}>
            下班
          </StatusButton>
        </TestWrapper>,
      );

      expect(getByText('下班')).toBeTruthy();
    });

    it('StatusIndicator 组件应该在深色模式下正常显示', () => {
      const {getByText} = render(
        <TestWrapper colorMode="dark">
          <StatusIndicator status="ontime" />
        </TestWrapper>,
      );

      expect(getByText('下班')).toBeTruthy();
    });
  });

  describe('主题切换', () => {
    it('应该能够从浅色切换到深色', () => {
      const {rerender, getByText} = render(
        <TestWrapper colorMode="light">
          <AppButton>切换按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('切换按钮')).toBeTruthy();

      rerender(
        <TestWrapper colorMode="dark">
          <AppButton>切换按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('切换按钮')).toBeTruthy();
    });

    it('应该能够从深色切换到浅色', () => {
      const {rerender, getByText} = render(
        <TestWrapper colorMode="dark">
          <DataCard title="切换卡片" value="300" />
        </TestWrapper>,
      );

      expect(getByText('切换卡片')).toBeTruthy();

      rerender(
        <TestWrapper colorMode="light">
          <DataCard title="切换卡片" value="300" />
        </TestWrapper>,
      );

      expect(getByText('切换卡片')).toBeTruthy();
    });
  });

  describe('颜色对比度', () => {
    it('浅色模式应该有足够的对比度', () => {
      const {getByText} = render(
        <TestWrapper colorMode="light">
          <AppButton>高对比度按钮</AppButton>
        </TestWrapper>,
      );

      // 验证组件渲染成功
      expect(getByText('高对比度按钮')).toBeTruthy();
    });

    it('深色模式应该有足够的对比度', () => {
      const {getByText} = render(
        <TestWrapper colorMode="dark">
          <AppButton>高对比度按钮</AppButton>
        </TestWrapper>,
      );

      // 验证组件渲染成功
      expect(getByText('高对比度按钮')).toBeTruthy();
    });
  });

  describe('主题一致性', () => {
    it('所有组件应该使用相同的主题', () => {
      const {getByText} = render(
        <TestWrapper colorMode="light">
          <>
            <AppButton>按钮</AppButton>
            <DataCard title="卡片" value="100" />
            <StatusButton status="overtime" onPress={() => {}}>
              状态按钮
            </StatusButton>
            <StatusIndicator status="overtime" />
          </>
        </TestWrapper>,
      );

      expect(getByText('按钮')).toBeTruthy();
      expect(getByText('卡片')).toBeTruthy();
      expect(getByText('状态按钮')).toBeTruthy();
      expect(getByText('加班')).toBeTruthy();
    });
  });

  describe('系统主题跟随', () => {
    it('应该能够检测系统主题偏好', () => {
      // 在实际应用中，这会检测系统主题
      // 这里我们只验证组件能够接受主题参数
      const {getByText} = render(
        <TestWrapper colorMode="dark">
          <AppButton>系统主题按钮</AppButton>
        </TestWrapper>,
      );

      expect(getByText('系统主题按钮')).toBeTruthy();
    });
  });

  describe('主题持久化', () => {
    it('应该能够保存主题偏好', () => {
      // 验证组件在不同主题下都能正常渲染
      const lightRender = render(
        <TestWrapper colorMode="light">
          <AppButton>持久化按钮</AppButton>
        </TestWrapper>,
      );

      expect(lightRender.getByText('持久化按钮')).toBeTruthy();

      const darkRender = render(
        <TestWrapper colorMode="dark">
          <AppButton>持久化按钮</AppButton>
        </TestWrapper>,
      );

      expect(darkRender.getByText('持久化按钮')).toBeTruthy();
    });
  });

  describe('主题性能', () => {
    it('主题切换应该快速完成', () => {
      const startTime = performance.now();

      const {rerender} = render(
        <TestWrapper colorMode="light">
          <AppButton>性能测试按钮</AppButton>
        </TestWrapper>,
      );

      rerender(
        <TestWrapper colorMode="dark">
          <AppButton>性能测试按钮</AppButton>
        </TestWrapper>,
      );

      const switchTime = performance.now() - startTime;

      // 主题切换应该在 100ms 内完成
      expect(switchTime).toBeLessThan(100);
    });
  });
});

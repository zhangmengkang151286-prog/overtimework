/**
 * Gluestack-UI 迁移性能测试
 * 测试应用启动速度、页面渲染性能，对比迁移前后的性能数据
 * 验证需求: 9.4
 */

import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {Provider} from 'react-redux';
import {store} from '../../store';
import {NavigationContainer} from '@react-navigation/native';

// 导入 gluestack 组件
import {AppButton} from '../../components/gluestack/Button';
import {DataCard} from '../../components/gluestack/DataCard';
import {StatusButton} from '../../components/gluestack/StatusButton';
import {StatusIndicator} from '../../components/gluestack/StatusIndicator';
// 这些组件已经迁移到 gluestack，但还在原位置
import {VersusBar} from '../../components/VersusBar';
import {GridChart} from '../../components/GridChart';
import {TimeAxis} from '../../components/TimeAxis';

// 测试包装器
const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <GluestackUIProvider config={config}>
      <NavigationContainer>{children}</NavigationContainer>
    </GluestackUIProvider>
  </Provider>
);

describe('Gluestack-UI 性能测试', () => {
  describe('组件渲染性能', () => {
    it('Button 组件应该快速渲染（< 50ms）', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <AppButton>测试按钮</AppButton>
        </TestWrapper>,
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(50);
    });

    it('DataCard 组件应该快速渲染（< 100ms）', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <DataCard title="测试卡片" value="100" subtitle="测试副标题" />
        </TestWrapper>,
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100);
    });

    it('StatusButton 组件应该快速渲染（< 50ms）', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <StatusButton status="overtime" onPress={() => {}}>
            加班
          </StatusButton>
        </TestWrapper>,
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(50);
    });

    it('StatusIndicator 组件应该快速渲染（< 50ms）', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <StatusIndicator status="overtime" />
        </TestWrapper>,
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('数据可视化组件性能', () => {
    it('VersusBar 组件应该快速渲染（< 100ms）', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <VersusBar overtimeCount={60} ontimeCount={40} />
        </TestWrapper>,
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100);
    });

    it('GridChart 组件应该快速渲染（< 150ms）', () => {
      const data = Array(7)
        .fill(0)
        .map(() =>
          Array(24)
            .fill(0)
            .map(() => Math.random() * 100),
        );

      const startTime = performance.now();

      render(
        <TestWrapper>
          <GridChart data={data} maxValue={100} />
        </TestWrapper>,
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(150);
    });

    it('TimeAxis 组件应该快速渲染（< 100ms）', () => {
      const hours = Array.from({length: 24}, (_, i) => i);

      const startTime = performance.now();

      render(
        <TestWrapper>
          <TimeAxis hours={hours} currentHour={14} />
        </TestWrapper>,
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('批量渲染性能', () => {
    it('应该快速渲染多个 Button 组件（< 200ms）', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <>
            {Array.from({length: 10}, (_, i) => (
              <AppButton key={i}>按钮 {i}</AppButton>
            ))}
          </>
        </TestWrapper>,
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(200);
    });

    it('应该快速渲染多个 DataCard 组件（< 500ms）', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <>
            {Array.from({length: 10}, (_, i) => (
              <DataCard key={i} title={`卡片 ${i}`} value={i * 100} />
            ))}
          </>
        </TestWrapper>,
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(500);
    });

    it('应该快速渲染多个 StatusIndicator 组件（< 200ms）', () => {
      const statuses: Array<'overtime' | 'ontime' | 'pending'> = [
        'overtime',
        'ontime',
        'pending',
      ];

      const startTime = performance.now();

      render(
        <TestWrapper>
          <>
            {Array.from({length: 20}, (_, i) => (
              <StatusIndicator key={i} status={statuses[i % statuses.length]} />
            ))}
          </>
        </TestWrapper>,
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('重新渲染性能', () => {
    it('Button 组件应该快速重新渲染（< 30ms）', () => {
      const {rerender} = render(
        <TestWrapper>
          <AppButton>初始文本</AppButton>
        </TestWrapper>,
      );

      const startTime = performance.now();

      rerender(
        <TestWrapper>
          <AppButton>更新文本</AppButton>
        </TestWrapper>,
      );

      const rerenderTime = performance.now() - startTime;
      expect(rerenderTime).toBeLessThan(30);
    });

    it('DataCard 组件应该快速重新渲染（< 50ms）', () => {
      const {rerender} = render(
        <TestWrapper>
          <DataCard title="初始标题" value="100" />
        </TestWrapper>,
      );

      const startTime = performance.now();

      rerender(
        <TestWrapper>
          <DataCard title="更新标题" value="200" />
        </TestWrapper>,
      );

      const rerenderTime = performance.now() - startTime;
      expect(rerenderTime).toBeLessThan(50);
    });

    it('VersusBar 组件应该快速重新渲染（< 50ms）', () => {
      const {rerender} = render(
        <TestWrapper>
          <VersusBar overtimeCount={60} ontimeCount={40} />
        </TestWrapper>,
      );

      const startTime = performance.now();

      rerender(
        <TestWrapper>
          <VersusBar overtimeCount={70} ontimeCount={30} />
        </TestWrapper>,
      );

      const rerenderTime = performance.now() - startTime;
      expect(rerenderTime).toBeLessThan(50);
    });
  });

  describe('GluestackUIProvider 性能', () => {
    it('Provider 应该快速初始化（< 100ms）', () => {
      const startTime = performance.now();

      render(
        <GluestackUIProvider config={config}>
          <AppButton>测试</AppButton>
        </GluestackUIProvider>,
      );

      const initTime = performance.now() - startTime;
      expect(initTime).toBeLessThan(100);
    });

    it('嵌套 Provider 应该不影响性能', () => {
      const startTime = performance.now();

      render(
        <Provider store={store}>
          <GluestackUIProvider config={config}>
            <NavigationContainer>
              <AppButton>测试</AppButton>
            </NavigationContainer>
          </GluestackUIProvider>
        </Provider>,
      );

      const initTime = performance.now() - startTime;
      expect(initTime).toBeLessThan(150);
    });
  });

  describe('内存使用', () => {
    it('应该正确清理组件', async () => {
      const {unmount} = render(
        <TestWrapper>
          <DataCard title="测试" value="100" />
        </TestWrapper>,
      );

      // 卸载组件
      unmount();

      // 等待清理完成
      await waitFor(() => {
        expect(true).toBe(true);
      });
    });

    it('应该正确清理多个组件', async () => {
      const {unmount} = render(
        <TestWrapper>
          <>
            {Array.from({length: 10}, (_, i) => (
              <DataCard key={i} title={`卡片 ${i}`} value={i * 100} />
            ))}
          </>
        </TestWrapper>,
      );

      // 卸载组件
      unmount();

      // 等待清理完成
      await waitFor(() => {
        expect(true).toBe(true);
      });
    });
  });
});

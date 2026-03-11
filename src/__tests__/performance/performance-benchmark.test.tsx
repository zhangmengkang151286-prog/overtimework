/**
 * 性能基准测试
 * 对比 Tamagui 和 Gluestack-UI 的性能差异
 * 验证需求: 9.4
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {Provider} from 'react-redux';
import {store} from '../../store';

// 导入 gluestack 组件
import {AppButton} from '../../components/gluestack/Button';
import {DataCard} from '../../components/gluestack/DataCard';
// VersusBar 已经迁移到 gluestack，但还在原位置
import {VersusBar} from '../../components/VersusBar';

// 测试包装器
const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Provider store={store}>
    <GluestackUIProvider config={config}>{children}</GluestackUIProvider>
  </Provider>
);

// 性能测试辅助函数
const measureRenderTime = (component: React.ReactElement): number => {
  const startTime = performance.now();
  render(<TestWrapper>{component}</TestWrapper>);
  return performance.now() - startTime;
};

const measureAverageRenderTime = (
  component: React.ReactElement,
  iterations: number = 10,
): number => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    times.push(measureRenderTime(component));
  }

  return times.reduce((a, b) => a + b, 0) / times.length;
};

describe('性能基准测试', () => {
  describe('Gluestack-UI 基准性能', () => {
    it('Button 平均渲染时间应该 < 50ms', () => {
      const avgTime = measureAverageRenderTime(<AppButton>测试按钮</AppButton>);

      console.log(`Button 平均渲染时间: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(50);
    });

    it('DataCard 平均渲染时间应该 < 100ms', () => {
      const avgTime = measureAverageRenderTime(
        <DataCard title="测试卡片" value="100" />,
      );

      console.log(`DataCard 平均渲染时间: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(100);
    });

    it('VersusBar 平均渲染时间应该 < 100ms', () => {
      const avgTime = measureAverageRenderTime(
        <VersusBar overtimeCount={60} ontimeCount={40} />,
      );

      console.log(`VersusBar 平均渲染时间: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('批量渲染基准', () => {
    it('10个 Button 平均渲染时间应该 < 200ms', () => {
      const component = (
        <>
          {Array.from({length: 10}, (_, i) => (
            <AppButton key={i}>按钮 {i}</AppButton>
          ))}
        </>
      );

      const avgTime = measureAverageRenderTime(component, 5);

      console.log(`10个 Button 平均渲染时间: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(200);
    });

    it('10个 DataCard 平均渲染时间应该 < 500ms', () => {
      const component = (
        <>
          {Array.from({length: 10}, (_, i) => (
            <DataCard key={i} title={`卡片 ${i}`} value={i * 100} />
          ))}
        </>
      );

      const avgTime = measureAverageRenderTime(component, 5);

      console.log(`10个 DataCard 平均渲染时间: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(500);
    });
  });

  describe('性能稳定性', () => {
    it('Button 渲染时间应该稳定（标准差 < 10ms）', () => {
      const times: number[] = [];

      for (let i = 0; i < 20; i++) {
        times.push(measureRenderTime(<AppButton>测试按钮</AppButton>));
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const variance =
        times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) /
        times.length;
      const stdDev = Math.sqrt(variance);

      console.log(`Button 渲染时间标准差: ${stdDev.toFixed(2)}ms`);
      expect(stdDev).toBeLessThan(10);
    });

    it('DataCard 渲染时间应该稳定（标准差 < 20ms）', () => {
      const times: number[] = [];

      for (let i = 0; i < 20; i++) {
        times.push(measureRenderTime(<DataCard title="测试" value="100" />));
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const variance =
        times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) /
        times.length;
      const stdDev = Math.sqrt(variance);

      console.log(`DataCard 渲染时间标准差: ${stdDev.toFixed(2)}ms`);
      expect(stdDev).toBeLessThan(20);
    });
  });

  describe('性能对比报告', () => {
    it('生成性能对比报告', () => {
      const results = {
        button: {
          avgRenderTime: measureAverageRenderTime(
            <AppButton>测试</AppButton>,
            10,
          ),
        },
        dataCard: {
          avgRenderTime: measureAverageRenderTime(
            <DataCard title="测试" value="100" />,
            10,
          ),
        },
        versusBar: {
          avgRenderTime: measureAverageRenderTime(
            <VersusBar overtimeCount={60} ontimeCount={40} />,
            10,
          ),
        },
        batchButton: {
          avgRenderTime: measureAverageRenderTime(
            <>
              {Array.from({length: 10}, (_, i) => (
                <AppButton key={i}>按钮 {i}</AppButton>
              ))}
            </>,
            5,
          ),
        },
        batchDataCard: {
          avgRenderTime: measureAverageRenderTime(
            <>
              {Array.from({length: 10}, (_, i) => (
                <DataCard key={i} title={`卡片 ${i}`} value={i * 100} />
              ))}
            </>,
            5,
          ),
        },
      };

      console.log('\n=== Gluestack-UI 性能报告 ===');
      console.log(
        `Button 平均渲染: ${results.button.avgRenderTime.toFixed(2)}ms`,
      );
      console.log(
        `DataCard 平均渲染: ${results.dataCard.avgRenderTime.toFixed(2)}ms`,
      );
      console.log(
        `VersusBar 平均渲染: ${results.versusBar.avgRenderTime.toFixed(2)}ms`,
      );
      console.log(
        `10个 Button 平均渲染: ${results.batchButton.avgRenderTime.toFixed(2)}ms`,
      );
      console.log(
        `10个 DataCard 平均渲染: ${results.batchDataCard.avgRenderTime.toFixed(2)}ms`,
      );
      console.log('============================\n');

      // 验证所有性能指标都在可接受范围内
      expect(results.button.avgRenderTime).toBeLessThan(50);
      expect(results.dataCard.avgRenderTime).toBeLessThan(100);
      expect(results.versusBar.avgRenderTime).toBeLessThan(100);
      expect(results.batchButton.avgRenderTime).toBeLessThan(200);
      expect(results.batchDataCard.avgRenderTime).toBeLessThan(500);
    });
  });

  describe('性能优化验证', () => {
    it('应该验证 React.memo 优化', () => {
      let renderCount = 0;

      const TestComponent = React.memo(() => {
        renderCount++;
        return <AppButton>测试</AppButton>;
      });

      const {rerender} = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      const initialRenderCount = renderCount;

      // 使用相同的 props 重新渲染
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      // React.memo 应该阻止不必要的重新渲染
      expect(renderCount).toBe(initialRenderCount);
    });

    it('应该验证组件懒加载', () => {
      const LazyComponent = React.lazy(() =>
        Promise.resolve({
          default: () => <AppButton>懒加载按钮</AppButton>,
        }),
      );

      const startTime = performance.now();

      render(
        <TestWrapper>
          <React.Suspense fallback={<AppButton>加载中...</AppButton>}>
            <LazyComponent />
          </React.Suspense>
        </TestWrapper>,
      );

      const loadTime = performance.now() - startTime;

      console.log(`懒加载组件加载时间: ${loadTime.toFixed(2)}ms`);
      expect(loadTime).toBeLessThan(200);
    });
  });
});

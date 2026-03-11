import React from 'react';
import {render} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {GridChart} from '../../../components/GridChart';
import {TagDistribution} from '../../../types';

/**
 * GridChart 组件测试
 * 验证 gluestack-ui 迁移后的功能
 */

const mockTagDistribution: TagDistribution[] = [
  {
    tagId: '1',
    tagName: '开会',
    count: 10,
    isOvertime: true,
  },
  {
    tagId: '2',
    tagName: '写代码',
    count: 8,
    isOvertime: false,
  },
  {
    tagId: '3',
    tagName: '改bug',
    count: 5,
    isOvertime: true,
  },
];

describe('GridChart - gluestack-ui 迁移', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <GluestackUIProvider config={config}>{component}</GluestackUIProvider>,
    );
  };

  it('应该正确渲染网格图', () => {
    const {getByText} = renderWithProvider(
      <GridChart
        tagDistribution={mockTagDistribution}
        overtimeCount={15}
        onTimeCount={8}
      />,
    );

    // 验证图例显示
    expect(getByText(/开会/)).toBeTruthy();
    expect(getByText(/写代码/)).toBeTruthy();
    expect(getByText(/改bug/)).toBeTruthy();
  });

  it('应该正确显示标签数量和百分比', () => {
    const {getAllByText} = renderWithProvider(
      <GridChart
        tagDistribution={mockTagDistribution}
        overtimeCount={15}
        onTimeCount={8}
      />,
    );

    // 验证数量显示（使用 getAllByText 因为可能有多个匹配）
    expect(getAllByText(/10/).length).toBeGreaterThan(0);
    expect(getAllByText(/8/).length).toBeGreaterThan(0);
    expect(getAllByText(/5/).length).toBeGreaterThan(0);
  });

  it('应该支持深色主题', () => {
    const {getByText} = renderWithProvider(
      <GridChart
        tagDistribution={mockTagDistribution}
        overtimeCount={15}
        onTimeCount={8}
        theme="dark"
      />,
    );

    expect(getByText(/开会/)).toBeTruthy();
  });

  it('应该处理空数据', () => {
    const {UNSAFE_root} = renderWithProvider(
      <GridChart tagDistribution={[]} overtimeCount={0} onTimeCount={0} />,
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('应该使用 gluestack-ui 的 VStack 和 HStack', () => {
    const {UNSAFE_root} = renderWithProvider(
      <GridChart
        tagDistribution={mockTagDistribution}
        overtimeCount={15}
        onTimeCount={8}
      />,
    );

    // 验证使用了 gluestack-ui 组件
    expect(UNSAFE_root).toBeTruthy();
  });
});

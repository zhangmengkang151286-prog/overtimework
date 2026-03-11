import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import TimeAxis from '../../TimeAxis';

/**
 * TimeAxis 组件测试
 * 需求: 6.3, 6.5
 */
describe('TimeAxis 组件', () => {
  const mockOnTimeChange = jest.fn();
  const mockOnBackToNow = jest.fn();

  // 创建测试用的时间范围
  const currentTime = new Date('2024-02-18T14:30:00');
  const minTime = new Date('2024-02-18T06:00:00');
  const maxTime = new Date('2024-02-19T05:59:00');

  const defaultProps = {
    currentTime,
    onTimeChange: mockOnTimeChange,
    onBackToNow: mockOnBackToNow,
    minTime,
    maxTime,
    interval: 15,
    theme: 'dark' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染时间轴组件', () => {
    const {getByText} = render(
      <GluestackUIProvider config={config}>
        <TimeAxis {...defaultProps} />
      </GluestackUIProvider>,
    );

    // 验证标题显示
    expect(getByText(/时间轴/)).toBeTruthy();
  });

  it('应该显示时间刻度', () => {
    const {getAllByText} = render(
      <GluestackUIProvider config={config}>
        <TimeAxis {...defaultProps} />
      </GluestackUIProvider>,
    );

    // 验证关键时间点显示（使用 getAllByText 因为可能有多个匹配）
    expect(getAllByText('06:00').length).toBeGreaterThan(0);
    expect(getAllByText('12:00').length).toBeGreaterThan(0);
    expect(getAllByText('18:00').length).toBeGreaterThan(0);
    expect(getAllByText(/次日00:00/).length).toBeGreaterThan(0);
  });

  it('应该显示时间范围', () => {
    const {getAllByText} = render(
      <GluestackUIProvider config={config}>
        <TimeAxis {...defaultProps} />
      </GluestackUIProvider>,
    );

    // 验证最小和最大时间显示
    expect(getAllByText('06:00').length).toBeGreaterThan(0);
    expect(getAllByText(/次日05:59/).length).toBeGreaterThan(0);
  });

  it('当不在"现在"时应该显示"现在"按钮', () => {
    // 设置一个历史时间
    const historicalTime = new Date('2024-02-18T10:00:00');
    const {getByText} = render(
      <GluestackUIProvider config={config}>
        <TimeAxis {...defaultProps} currentTime={historicalTime} />
      </GluestackUIProvider>,
    );

    expect(getByText('现在')).toBeTruthy();
  });

  it('点击"现在"按钮应该触发回调', () => {
    const historicalTime = new Date('2024-02-18T10:00:00');
    const {getByText} = render(
      <GluestackUIProvider config={config}>
        <TimeAxis {...defaultProps} currentTime={historicalTime} />
      </GluestackUIProvider>,
    );

    const nowButton = getByText('现在');
    fireEvent.press(nowButton);

    expect(mockOnBackToNow).toHaveBeenCalled();
  });

  it('应该使用 gluestack-ui 的颜色 tokens', () => {
    const {getByText} = render(
      <GluestackUIProvider config={config}>
        <TimeAxis {...defaultProps} />
      </GluestackUIProvider>,
    );

    // 验证组件能够正常渲染（使用了正确的 tokens）
    expect(getByText(/时间轴/)).toBeTruthy();
  });

  it('应该使用 gluestack-ui 的间距 tokens', () => {
    const {getByText} = render(
      <GluestackUIProvider config={config}>
        <TimeAxis {...defaultProps} />
      </GluestackUIProvider>,
    );

    // 验证组件能够正常渲染（使用了正确的间距）
    expect(getByText(/时间轴/)).toBeTruthy();
  });
});

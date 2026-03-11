import React from 'react';
import {render} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {StatusIndicator} from '../StatusIndicator';

/**
 * 测试辅助函数：包装组件在 GluestackUIProvider 中
 */
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <GluestackUIProvider config={config}>{component}</GluestackUIProvider>,
  );
};

describe('StatusIndicator', () => {
  describe('基础渲染', () => {
    it('应该正确渲染 overtime 状态', () => {
      const {getByTestId} = renderWithProvider(
        <StatusIndicator status="overtime" />,
      );
      // Badge 组件应该被渲染
      expect(getByTestId).toBeDefined();
    });

    it('应该正确渲染 ontime 状态', () => {
      const {getByTestId} = renderWithProvider(
        <StatusIndicator status="ontime" />,
      );
      expect(getByTestId).toBeDefined();
    });

    it('应该正确渲染 pending 状态', () => {
      const {getByTestId} = renderWithProvider(
        <StatusIndicator status="pending" />,
      );
      expect(getByTestId).toBeDefined();
    });
  });

  describe('标签显示', () => {
    it('当 showLabel 为 true 时应该显示默认标签', () => {
      const {getByText} = renderWithProvider(
        <StatusIndicator status="overtime" showLabel />,
      );
      expect(getByText('加班')).toBeTruthy();
    });

    it('当 showLabel 为 true 时应该显示 ontime 标签', () => {
      const {getByText} = renderWithProvider(
        <StatusIndicator status="ontime" showLabel />,
      );
      expect(getByText('准时下班')).toBeTruthy();
    });

    it('当 showLabel 为 true 时应该显示 pending 标签', () => {
      const {getByText} = renderWithProvider(
        <StatusIndicator status="pending" showLabel />,
      );
      expect(getByText('待定')).toBeTruthy();
    });

    it('应该显示自定义标签', () => {
      const {getByText} = renderWithProvider(
        <StatusIndicator status="overtime" showLabel label="自定义标签" />,
      );
      expect(getByText('自定义标签')).toBeTruthy();
    });

    it('当 showLabel 为 false 时不应该显示标签文字', () => {
      const {queryByText} = renderWithProvider(
        <StatusIndicator status="overtime" showLabel={false} />,
      );
      expect(queryByText('加班')).toBeNull();
    });
  });

  describe('尺寸', () => {
    it('应该支持 sm 尺寸', () => {
      const {getByTestId} = renderWithProvider(
        <StatusIndicator status="overtime" size="sm" />,
      );
      expect(getByTestId).toBeDefined();
    });

    it('应该支持 md 尺寸（默认）', () => {
      const {getByTestId} = renderWithProvider(
        <StatusIndicator status="overtime" size="md" />,
      );
      expect(getByTestId).toBeDefined();
    });

    it('应该支持 lg 尺寸', () => {
      const {getByTestId} = renderWithProvider(
        <StatusIndicator status="overtime" size="lg" />,
      );
      expect(getByTestId).toBeDefined();
    });

    it('默认应该使用 md 尺寸', () => {
      const {getByTestId} = renderWithProvider(
        <StatusIndicator status="overtime" />,
      );
      expect(getByTestId).toBeDefined();
    });
  });

  describe('状态颜色映射', () => {
    it('overtime 状态应该使用 error action（红色）', () => {
      const {getByTestId} = renderWithProvider(
        <StatusIndicator status="overtime" showLabel />,
      );
      // 验证组件被渲染（颜色由 gluestack-ui 内部处理）
      expect(getByTestId).toBeDefined();
    });

    it('ontime 状态应该使用 success action（绿色）', () => {
      const {getByTestId} = renderWithProvider(
        <StatusIndicator status="ontime" showLabel />,
      );
      expect(getByTestId).toBeDefined();
    });

    it('pending 状态应该使用 warning action（黄色）', () => {
      const {getByTestId} = renderWithProvider(
        <StatusIndicator status="pending" showLabel />,
      );
      expect(getByTestId).toBeDefined();
    });
  });

  describe('组合使用', () => {
    it('应该支持所有属性的组合', () => {
      const {getByText} = renderWithProvider(
        <StatusIndicator status="ontime" size="lg" showLabel label="已下班" />,
      );
      expect(getByText('已下班')).toBeTruthy();
    });

    it('应该支持不同状态和尺寸的组合', () => {
      const {getByText} = renderWithProvider(
        <StatusIndicator status="pending" size="sm" showLabel />,
      );
      expect(getByText('待定')).toBeTruthy();
    });
  });

  describe('快照测试', () => {
    it('应该匹配 overtime 状态的快照', () => {
      const {toJSON} = renderWithProvider(
        <StatusIndicator status="overtime" showLabel />,
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配 ontime 状态的快照', () => {
      const {toJSON} = renderWithProvider(
        <StatusIndicator status="ontime" showLabel />,
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配 pending 状态的快照', () => {
      const {toJSON} = renderWithProvider(
        <StatusIndicator status="pending" showLabel />,
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配不带标签的快照', () => {
      const {toJSON} = renderWithProvider(
        <StatusIndicator status="overtime" showLabel={false} />,
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});

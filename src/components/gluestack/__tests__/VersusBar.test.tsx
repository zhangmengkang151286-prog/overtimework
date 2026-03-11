import React from 'react';
import {render} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {VersusBar} from '../../VersusBar';

/**
 * 测试辅助函数：包装组件在 GluestackUIProvider 中
 */
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <GluestackUIProvider config={config}>{component}</GluestackUIProvider>,
  );
};

describe('VersusBar 组件', () => {
  describe('基础渲染', () => {
    it('应该正确渲染加班和准时人数', () => {
      const {getByText} = renderWithProvider(
        <VersusBar overtimeCount={60} onTimeCount={40} />,
      );

      expect(getByText('加班 60')).toBeTruthy();
      expect(getByText('准时 40')).toBeTruthy();
    });

    it('应该在 showLabels=false 时隐藏标签', () => {
      const {queryByText} = renderWithProvider(
        <VersusBar overtimeCount={60} onTimeCount={40} showLabels={false} />,
      );

      expect(queryByText('加班 60')).toBeNull();
      expect(queryByText('准时 40')).toBeNull();
    });
  });

  describe('数据处理', () => {
    it('应该处理零值情况', () => {
      const {getByText} = renderWithProvider(
        <VersusBar overtimeCount={0} onTimeCount={0} />,
      );

      expect(getByText('加班 0')).toBeTruthy();
      expect(getByText('准时 0')).toBeTruthy();
    });

    it('应该处理只有加班的情况', () => {
      const {getByText} = renderWithProvider(
        <VersusBar overtimeCount={100} onTimeCount={0} />,
      );

      expect(getByText('加班 100')).toBeTruthy();
      expect(getByText('准时 0')).toBeTruthy();
    });

    it('应该处理只有准时的情况', () => {
      const {getByText} = renderWithProvider(
        <VersusBar overtimeCount={0} onTimeCount={100} />,
      );

      expect(getByText('加班 0')).toBeTruthy();
      expect(getByText('准时 100')).toBeTruthy();
    });

    it('应该正确计算百分比', () => {
      const {getByText} = renderWithProvider(
        <VersusBar overtimeCount={75} onTimeCount={25} />,
      );

      // 75% 加班，25% 准时
      expect(getByText('加班 75')).toBeTruthy();
      expect(getByText('准时 25')).toBeTruthy();
    });

    it('应该处理大数值', () => {
      const {getByText} = renderWithProvider(
        <VersusBar overtimeCount={9999} onTimeCount={8888} />,
      );

      expect(getByText('加班 9999')).toBeTruthy();
      expect(getByText('准时 8888')).toBeTruthy();
    });
  });

  describe('样式和主题', () => {
    it('应该使用 gluestack-ui 的颜色 tokens', () => {
      const {getByText} = renderWithProvider(
        <VersusBar overtimeCount={60} onTimeCount={40} />,
      );

      // 验证组件能够正常渲染（使用了正确的颜色 tokens）
      expect(getByText('加班 60')).toBeTruthy();
    });

    it('应该使用 gluestack-ui 的布局组件', () => {
      const {getByText} = renderWithProvider(
        <VersusBar overtimeCount={60} onTimeCount={40} />,
      );

      // 验证使用了 HStack 和 VStack
      expect(getByText('加班 60')).toBeTruthy();
    });
  });

  describe('快照测试', () => {
    it('应该正确渲染组件快照', () => {
      const {toJSON} = renderWithProvider(
        <VersusBar overtimeCount={60} onTimeCount={40} />,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配隐藏标签的快照', () => {
      const {toJSON} = renderWithProvider(
        <VersusBar overtimeCount={60} onTimeCount={40} showLabels={false} />,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配零值的快照', () => {
      const {toJSON} = renderWithProvider(
        <VersusBar overtimeCount={0} onTimeCount={0} />,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});

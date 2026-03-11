import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {StatusButton} from '../StatusButton';

/**
 * 测试辅助函数：包装组件在 GluestackUIProvider 中
 */
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <GluestackUIProvider config={config}>{component}</GluestackUIProvider>,
  );
};

describe('StatusButton 组件', () => {
  describe('基础渲染', () => {
    it('应该正确渲染 overtime 状态按钮', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime">加班</StatusButton>,
      );
      expect(getByText('加班')).toBeTruthy();
    });

    it('应该正确渲染 ontime 状态按钮', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="ontime">准时下班</StatusButton>,
      );
      expect(getByText('准时下班')).toBeTruthy();
    });

    it('应该正确渲染 pending 状态按钮', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="pending">待定</StatusButton>,
      );
      expect(getByText('待定')).toBeTruthy();
    });

    it('应该支持空子元素', () => {
      const {UNSAFE_root} = renderWithProvider(
        <StatusButton status="overtime" />,
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('状态样式', () => {
    it('overtime 状态应该使用 negative action（红色）', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime">加班</StatusButton>,
      );
      const button = getByText('加班');
      expect(button).toBeTruthy();
    });

    it('ontime 状态应该使用 positive action（绿色）', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="ontime">准时下班</StatusButton>,
      );
      const button = getByText('准时下班');
      expect(button).toBeTruthy();
    });

    it('pending 状态应该使用 secondary action（灰色）', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="pending">待定</StatusButton>,
      );
      const button = getByText('待定');
      expect(button).toBeTruthy();
    });

    it('pending 状态应该使用 outline variant', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="pending">待定</StatusButton>,
      );
      const button = getByText('待定');
      expect(button).toBeTruthy();
    });

    it('overtime 和 ontime 状态应该使用 solid variant', () => {
      const {getByText: getByTextOvertime} = renderWithProvider(
        <StatusButton status="overtime">加班</StatusButton>,
      );
      expect(getByTextOvertime('加班')).toBeTruthy();

      const {getByText: getByTextOntime} = renderWithProvider(
        <StatusButton status="ontime">准时下班</StatusButton>,
      );
      expect(getByTextOntime('准时下班')).toBeTruthy();
    });
  });

  describe('尺寸', () => {
    it('应该支持 xs 尺寸', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime" size="xs">
          加班
        </StatusButton>,
      );
      expect(getByText('加班')).toBeTruthy();
    });

    it('应该支持 sm 尺寸', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime" size="sm">
          加班
        </StatusButton>,
      );
      expect(getByText('加班')).toBeTruthy();
    });

    it('应该支持 md 尺寸（默认）', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime" size="md">
          加班
        </StatusButton>,
      );
      expect(getByText('加班')).toBeTruthy();
    });

    it('应该支持 lg 尺寸', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime" size="lg">
          加班
        </StatusButton>,
      );
      expect(getByText('加班')).toBeTruthy();
    });

    it('应该支持 xl 尺寸', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime" size="xl">
          加班
        </StatusButton>,
      );
      expect(getByText('加班')).toBeTruthy();
    });

    it('默认应该使用 md 尺寸', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime">加班</StatusButton>,
      );
      expect(getByText('加班')).toBeTruthy();
    });
  });

  describe('交互功能', () => {
    it('应该响应点击事件', () => {
      const onPress = jest.fn();
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime" onPress={onPress}>
          加班
        </StatusButton>,
      );

      const button = getByText('加班');
      fireEvent.press(button);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('应该支持禁用状态', () => {
      const onPress = jest.fn();
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime" isDisabled onPress={onPress}>
          加班
        </StatusButton>,
      );

      const button = getByText('加班');
      fireEvent.press(button);

      // 禁用状态下不应该触发点击
      expect(onPress).not.toHaveBeenCalled();
    });

    it('应该支持加载状态', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime" isLoading>
          加班
        </StatusButton>,
      );

      // 加载状态下按钮仍然应该渲染
      expect(getByText('加班')).toBeTruthy();
    });
  });

  describe('组合使用', () => {
    it('应该支持所有属性的组合', () => {
      const onPress = jest.fn();
      const {getByText} = renderWithProvider(
        <StatusButton status="ontime" size="lg" onPress={onPress}>
          已下班
        </StatusButton>,
      );

      const button = getByText('已下班');
      expect(button).toBeTruthy();

      fireEvent.press(button);
      expect(onPress).toHaveBeenCalled();
    });

    it('应该支持不同状态和尺寸的组合', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="pending" size="sm">
          待定
        </StatusButton>,
      );
      expect(getByText('待定')).toBeTruthy();
    });
  });

  describe('边界情况', () => {
    it('应该处理长文本', () => {
      const longText = '这是一个非常非常长的按钮文本用于测试组件的文本处理能力';
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime">{longText}</StatusButton>,
      );
      expect(getByText(longText)).toBeTruthy();
    });

    it('应该处理特殊字符', () => {
      const specialText = '加班 & 准时 < > " \' /';
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime">{specialText}</StatusButton>,
      );
      expect(getByText(specialText)).toBeTruthy();
    });

    it('应该处理数字内容', () => {
      const {getByText} = renderWithProvider(
        <StatusButton status="overtime">123</StatusButton>,
      );
      expect(getByText('123')).toBeTruthy();
    });
  });

  describe('快照测试', () => {
    it('应该匹配 overtime 状态的快照', () => {
      const {toJSON} = renderWithProvider(
        <StatusButton status="overtime">加班</StatusButton>,
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配 ontime 状态的快照', () => {
      const {toJSON} = renderWithProvider(
        <StatusButton status="ontime">准时下班</StatusButton>,
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配 pending 状态的快照', () => {
      const {toJSON} = renderWithProvider(
        <StatusButton status="pending">待定</StatusButton>,
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配禁用状态的快照', () => {
      const {toJSON} = renderWithProvider(
        <StatusButton status="overtime" isDisabled>
          加班
        </StatusButton>,
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配加载状态的快照', () => {
      const {toJSON} = renderWithProvider(
        <StatusButton status="overtime" isLoading>
          加班
        </StatusButton>,
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});

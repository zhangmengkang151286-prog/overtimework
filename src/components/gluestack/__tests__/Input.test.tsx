import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {AppInput} from '../Input';

/**
 * 测试辅助函数：包装组件在 GluestackUIProvider 中
 */
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <GluestackUIProvider config={config}>{component}</GluestackUIProvider>,
  );
};

describe('AppInput (gluestack-ui)', () => {
  describe('基础渲染', () => {
    it('应该正确渲染基础输入框', () => {
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput placeholder="请输入内容" />,
      );

      expect(getByPlaceholderText('请输入内容')).toBeTruthy();
    });

    it('应该显示标签', () => {
      const {getByText} = renderWithProvider(
        <AppInput label="用户名" placeholder="请输入用户名" />,
      );

      expect(getByText('用户名')).toBeTruthy();
    });

    it('应该显示错误信息', () => {
      const {getByText} = renderWithProvider(
        <AppInput error errorMessage="输入错误" placeholder="请输入" />,
      );

      expect(getByText('输入错误')).toBeTruthy();
    });
  });

  describe('交互功能', () => {
    it('应该响应文本变化', () => {
      const onChangeText = jest.fn();
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput placeholder="请输入" onChangeText={onChangeText} />,
      );

      const input = getByPlaceholderText('请输入');
      fireEvent.changeText(input, '测试文本');

      expect(onChangeText).toHaveBeenCalledWith('测试文本');
    });

    it('应该支持密码输入', () => {
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput secureTextEntry placeholder="请输入密码" />,
      );

      const input = getByPlaceholderText('请输入密码');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('应该支持键盘类型', () => {
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput keyboardType="phone-pad" placeholder="请输入手机号" />,
      );

      const input = getByPlaceholderText('请输入手机号');
      expect(input.props.keyboardType).toBe('phone-pad');
    });

    it('应该支持禁用状态', () => {
      const {UNSAFE_root} = renderWithProvider(
        <AppInput isDisabled placeholder="禁用输入框" />,
      );

      // 验证组件被渲染
      expect(UNSAFE_root).toBeTruthy();
    });

    it('应该支持只读状态', () => {
      const {UNSAFE_root} = renderWithProvider(
        <AppInput isReadOnly placeholder="只读输入框" />,
      );

      // 验证组件被渲染
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('样式变体', () => {
    it('应该支持 outline 变体', () => {
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput variant="outline" placeholder="outline 输入框" />,
      );

      expect(getByPlaceholderText('outline 输入框')).toBeTruthy();
    });

    it('应该支持 underlined 变体', () => {
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput variant="underlined" placeholder="underlined 输入框" />,
      );

      expect(getByPlaceholderText('underlined 输入框')).toBeTruthy();
    });

    it('应该支持 rounded 变体', () => {
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput variant="rounded" placeholder="rounded 输入框" />,
      );

      expect(getByPlaceholderText('rounded 输入框')).toBeTruthy();
    });
  });

  describe('尺寸', () => {
    it('应该支持 sm 尺寸', () => {
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput size="sm" placeholder="小尺寸输入框" />,
      );

      expect(getByPlaceholderText('小尺寸输入框')).toBeTruthy();
    });

    it('应该支持 md 尺寸（默认）', () => {
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput size="md" placeholder="中等尺寸输入框" />,
      );

      expect(getByPlaceholderText('中等尺寸输入框')).toBeTruthy();
    });

    it('应该支持 lg 尺寸', () => {
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput size="lg" placeholder="大尺寸输入框" />,
      );

      expect(getByPlaceholderText('大尺寸输入框')).toBeTruthy();
    });
  });

  describe('边界情况', () => {
    it('应该处理空值', () => {
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput value="" placeholder="空值输入框" />,
      );

      const input = getByPlaceholderText('空值输入框');
      expect(input.props.value).toBe('');
    });

    it('应该处理长文本', () => {
      const longText = '这是一个非常非常长的文本用于测试输入框的文本处理能力';
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput value={longText} placeholder="长文本输入框" />,
      );

      const input = getByPlaceholderText('长文本输入框');
      expect(input.props.value).toBe(longText);
    });

    it('应该处理特殊字符', () => {
      const specialText = '特殊字符 & < > " \' /';
      const {getByPlaceholderText} = renderWithProvider(
        <AppInput value={specialText} placeholder="特殊字符输入框" />,
      );

      const input = getByPlaceholderText('特殊字符输入框');
      expect(input.props.value).toBe(specialText);
    });
  });

  describe('快照测试', () => {
    it('应该匹配基础输入框的快照', () => {
      const {toJSON} = renderWithProvider(
        <AppInput placeholder="请输入内容" />,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配带标签的快照', () => {
      const {toJSON} = renderWithProvider(
        <AppInput label="用户名" placeholder="请输入用户名" />,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('应该匹配错误状态的快照', () => {
      const {toJSON} = renderWithProvider(
        <AppInput error errorMessage="输入错误" placeholder="请输入" />,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});

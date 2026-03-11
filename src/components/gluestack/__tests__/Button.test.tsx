import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {AppButton} from '../Button';
import {StatusButton} from '../StatusButton';

// 测试包装器
const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <GluestackUIProvider config={config}>{children}</GluestackUIProvider>
);

describe('AppButton 组件', () => {
  it('应该正确渲染按钮文本', () => {
    const {getByText} = render(
      <TestWrapper>
        <AppButton variant="primary">提交</AppButton>
      </TestWrapper>,
    );

    expect(getByText('提交')).toBeTruthy();
  });

  it('应该支持不同的 variant', () => {
    const {rerender, getByText} = render(
      <TestWrapper>
        <AppButton variant="primary">主要按钮</AppButton>
      </TestWrapper>,
    );

    expect(getByText('主要按钮')).toBeTruthy();

    rerender(
      <TestWrapper>
        <AppButton variant="secondary">次要按钮</AppButton>
      </TestWrapper>,
    );

    expect(getByText('次要按钮')).toBeTruthy();

    rerender(
      <TestWrapper>
        <AppButton variant="ghost">幽灵按钮</AppButton>
      </TestWrapper>,
    );

    expect(getByText('幽灵按钮')).toBeTruthy();

    rerender(
      <TestWrapper>
        <AppButton variant="danger">危险按钮</AppButton>
      </TestWrapper>,
    );

    expect(getByText('危险按钮')).toBeTruthy();
  });

  it('应该支持加载状态', () => {
    const {getByText} = render(
      <TestWrapper>
        <AppButton variant="primary" loading>
          加载中
        </AppButton>
      </TestWrapper>,
    );

    expect(getByText('加载中')).toBeTruthy();
  });

  it('应该支持禁用状态', () => {
    const onPressMock = jest.fn();
    const {getByText} = render(
      <TestWrapper>
        <AppButton variant="primary" disabled onPress={onPressMock}>
          禁用按钮
        </AppButton>
      </TestWrapper>,
    );

    const button = getByText('禁用按钮');
    fireEvent.press(button);

    // 禁用状态下不应该触发 onPress
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('应该响应点击事件', () => {
    const onPressMock = jest.fn();
    const {getByText} = render(
      <TestWrapper>
        <AppButton variant="primary" onPress={onPressMock}>
          点击我
        </AppButton>
      </TestWrapper>,
    );

    const button = getByText('点击我');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('应该支持不同的尺寸', () => {
    const {getByText} = render(
      <TestWrapper>
        <AppButton variant="primary" size="sm">
          小按钮
        </AppButton>
      </TestWrapper>,
    );

    expect(getByText('小按钮')).toBeTruthy();
  });
});

describe('StatusButton 组件', () => {
  it('应该正确渲染状态按钮', () => {
    const {getByText} = render(
      <TestWrapper>
        <StatusButton status="overtime">加班</StatusButton>
      </TestWrapper>,
    );

    expect(getByText('加班')).toBeTruthy();
  });

  it('应该支持不同的状态类型', () => {
    const {rerender, getByText} = render(
      <TestWrapper>
        <StatusButton status="overtime">加班</StatusButton>
      </TestWrapper>,
    );

    expect(getByText('加班')).toBeTruthy();

    rerender(
      <TestWrapper>
        <StatusButton status="ontime">准时下班</StatusButton>
      </TestWrapper>,
    );

    expect(getByText('准时下班')).toBeTruthy();

    rerender(
      <TestWrapper>
        <StatusButton status="pending">待定</StatusButton>
      </TestWrapper>,
    );

    expect(getByText('待定')).toBeTruthy();
  });

  it('应该响应点击事件', () => {
    const onPressMock = jest.fn();
    const {getByText} = render(
      <TestWrapper>
        <StatusButton status="ontime" onPress={onPressMock}>
          准时下班
        </StatusButton>
      </TestWrapper>,
    );

    const button = getByText('准时下班');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('应该支持禁用状态', () => {
    const onPressMock = jest.fn();
    const {getByText} = render(
      <TestWrapper>
        <StatusButton status="pending" isDisabled onPress={onPressMock}>
          待定
        </StatusButton>
      </TestWrapper>,
    );

    const button = getByText('待定');
    fireEvent.press(button);

    // 禁用状态下不应该触发 onPress
    expect(onPressMock).not.toHaveBeenCalled();
  });
});

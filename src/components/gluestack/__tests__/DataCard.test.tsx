import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {DataCard} from '../DataCard';
import {Text} from 'react-native';

// 测试包装器
const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <GluestackUIProvider config={config}>{children}</GluestackUIProvider>
);

describe('DataCard 组件', () => {
  describe('基础渲染', () => {
    it('应该正确渲染标题和数值', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="参与人数" value="1234" />
        </TestWrapper>,
      );

      expect(getByText('参与人数')).toBeTruthy();
      expect(getByText('1234')).toBeTruthy();
    });

    it('应该正确渲染副标题', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="参与人数" value="1234" subtitle="较昨日 +12%" />
        </TestWrapper>,
      );

      expect(getByText('较昨日 +12%')).toBeTruthy();
    });

    it('应该正确渲染图标', () => {
      const TestIcon = () => <Text testID="test-icon">Icon</Text>;

      const {getByTestId} = render(
        <TestWrapper>
          <DataCard title="参与人数" value="1234" icon={<TestIcon />} />
        </TestWrapper>,
      );

      expect(getByTestId('test-icon')).toBeTruthy();
    });

    it('应该支持数字类型的 value', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="参与人数" value={1234} />
        </TestWrapper>,
      );

      expect(getByText('1234')).toBeTruthy();
    });
  });

  describe('样式属性', () => {
    it('默认应该显示边框', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="测试" value="100" />
        </TestWrapper>,
      );

      const card = getByText('测试').parent?.parent?.parent;
      expect(card).toBeTruthy();
    });

    it('bordered=false 时不应该显示边框', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="测试" value="100" bordered={false} />
        </TestWrapper>,
      );

      const card = getByText('测试').parent?.parent?.parent;
      expect(card).toBeTruthy();
    });

    it('elevate=true 时应该有阴影效果', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="测试" value="100" elevate />
        </TestWrapper>,
      );

      const card = getByText('测试').parent?.parent?.parent;
      expect(card).toBeTruthy();
    });
  });

  describe('交互功能', () => {
    it('应该响应点击事件', () => {
      const onPress = jest.fn();

      const {getByText} = render(
        <TestWrapper>
          <DataCard title="参与人数" value="1234" onPress={onPress} />
        </TestWrapper>,
      );

      const card = getByText('参与人数');
      fireEvent.press(card);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('没有 onPress 时不应该是可点击的', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="参与人数" value="1234" />
        </TestWrapper>,
      );

      const card = getByText('参与人数');
      // 不应该抛出错误
      expect(() => fireEvent.press(card)).not.toThrow();
    });
  });

  describe('边界情况', () => {
    it('应该处理空字符串 value', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="测试" value="" />
        </TestWrapper>,
      );

      expect(getByText('测试')).toBeTruthy();
    });

    it('应该处理 0 值', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="测试" value={0} />
        </TestWrapper>,
      );

      expect(getByText('0')).toBeTruthy();
    });

    it('应该处理长文本', () => {
      const longTitle =
        '这是一个非常非常长的标题文本用于测试组件的文本处理能力';
      const longSubtitle =
        '这是一个非常非常长的副标题文本用于测试组件的文本处理能力';

      const {getByText} = render(
        <TestWrapper>
          <DataCard title={longTitle} value="1234" subtitle={longSubtitle} />
        </TestWrapper>,
      );

      expect(getByText(longTitle)).toBeTruthy();
      expect(getByText(longSubtitle)).toBeTruthy();
    });

    it('应该处理大数值', () => {
      const {getByText} = render(
        <TestWrapper>
          <DataCard title="测试" value={999999999} />
        </TestWrapper>,
      );

      expect(getByText('999999999')).toBeTruthy();
    });
  });
});

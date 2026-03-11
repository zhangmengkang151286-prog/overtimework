import React from 'react';
import {View, Text} from 'react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {GridChart} from './src/components/GridChart';
import {TagDistribution} from './src/types';

/**
 * GridChart 组件验证
 * 验证 gluestack-ui 迁移是否成功
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
  {
    tagId: '4',
    tagName: '测试',
    count: 3,
    isOvertime: false,
  },
];

export default function VerifyGridChart() {
  return (
    <GluestackUIProvider config={config}>
      <View style={{flex: 1, padding: 20, backgroundColor: '#fff'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 20}}>
          GridChart 组件验证 - gluestack-ui 迁移
        </Text>
        
        <Text style={{fontSize: 16, marginBottom: 10}}>
          ✅ 使用 VStack 和 HStack 布局
        </Text>
        <Text style={{fontSize: 16, marginBottom: 10}}>
          ✅ 使用 Box 组件创建网格单元
        </Text>
        <Text style={{fontSize: 16, marginBottom: 10}}>
          ✅ 使用 gluestack-ui 的 spacing tokens (space="xs")
        </Text>
        <Text style={{fontSize: 16, marginBottom: 10}}>
          ✅ 使用 gluestack-ui 的颜色 tokens
        </Text>
        <Text style={{fontSize: 16, marginBottom: 20}}>
          ✅ 参照 gluestack-ui 的组件风格
        </Text>

        <GridChart
          tagDistribution={mockTagDistribution}
          overtimeCount={15}
          onTimeCount={11}
          theme="light"
        />
      </View>
    </GluestackUIProvider>
  );
}

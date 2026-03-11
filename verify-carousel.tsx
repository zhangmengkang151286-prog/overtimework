/**
 * 验证 react-native-reanimated-carousel 安装
 * 
 * 这个文件用于验证 carousel 库是否正确安装并可以导入
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

// 简单的测试组件
export const TestCarousel = () => {
  const data = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Carousel
        width={width}
        height={200}
        data={data}
        renderItem={({ item }) => (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#f0f0f0',
            }}
          >
            <Text>{item}</Text>
          </View>
        )}
      />
    </View>
  );
};

console.log('✅ react-native-reanimated-carousel 导入成功！');

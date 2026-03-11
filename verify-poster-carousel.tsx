/**
 * PosterCarousel 组件验证文件
 * 用于测试海报滑动容器的基本功能
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {PosterCarousel} from './src/components/poster/PosterCarousel';
import {posterTheme} from './src/theme/posterTheme';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// 创建测试海报组件
const TestPoster: React.FC<{index: number; color: string}> = ({index, color}) => (
  <View
    style={[
      styles.testPoster,
      {
        backgroundColor: color,
        width: posterTheme.dimensions.width,
        height: posterTheme.dimensions.height,
      },
    ]}>
    <Text style={styles.testText}>海报 {index + 1}</Text>
  </View>
);

export default function VerifyPosterCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 创建4个测试海报
  const testPosters = [
    <TestPoster key="0" index={0} color="#FF6B6B" />,
    <TestPoster key="1" index={1} color="#4ECDC4" />,
    <TestPoster key="2" index={2} color="#45B7D1" />,
    <TestPoster key="3" index={3} color="#FFA07A" />,
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PosterCarousel 测试</Text>
      <Text style={styles.subtitle}>当前索引: {currentIndex}</Text>

      <PosterCarousel
        posters={testPosters}
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT * 0.7}
      />

      <Text style={styles.instructions}>
        👆 左右滑动切换海报
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  testPoster: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  testText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  instructions: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

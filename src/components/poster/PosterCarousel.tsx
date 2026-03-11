/**
 * 海报滑动容器组件
 * 使用 react-native-reanimated-carousel 实现流畅的海报切换
 */

import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {PosterCarouselProps} from '../../types/poster';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const PosterCarousel: React.FC<PosterCarouselProps> = React.memo(
  ({
    posters,
    currentIndex,
    onIndexChange,
    width,
    height,
  }) => {
    return (
      <View style={styles.container}>
        <Carousel
          loop={false}
          width={width}
          height={height}
          data={posters}
          scrollAnimationDuration={300}
          onSnapToItem={onIndexChange}
          defaultIndex={currentIndex}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50,
          }}
          renderItem={({item}) => (
            <View style={styles.itemContainer}>
              {item}
            </View>
          )}
        />
      </View>
    );
  },
  (prevProps, nextProps) => {
    // 只在关键 props 变化时重新渲染
    return (
      prevProps.currentIndex === nextProps.currentIndex &&
      prevProps.posters.length === nextProps.posters.length &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

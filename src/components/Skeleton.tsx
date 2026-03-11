/**
 * 骨架屏组件
 *
 * 在内容加载时显示占位符,提升用户体验
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, ViewStyle} from 'react-native';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

/**
 * 基础骨架屏组件
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animated = true,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [animated, opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: animated ? opacity : 0.3,
        },
        style,
      ]}
    />
  );
};

/**
 * 圆形骨架屏(用于头像)
 */
export const SkeletonCircle: React.FC<
  Omit<SkeletonProps, 'borderRadius'>
> = props => {
  const size = typeof props.width === 'number' ? props.width : 50;
  return (
    <Skeleton {...props} width={size} height={size} borderRadius={size / 2} />
  );
};

/**
 * 文本骨架屏
 */
export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: string | number;
  animated?: boolean;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 16,
  spacing = 8,
  lastLineWidth = '60%',
  animated = true,
}) => {
  return (
    <View>
      {Array.from({length: lines}).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          style={{marginBottom: index < lines - 1 ? spacing : 0}}
          animated={animated}
        />
      ))}
    </View>
  );
};

/**
 * 卡片骨架屏
 */
export interface SkeletonCardProps {
  hasAvatar?: boolean;
  avatarSize?: number;
  hasTitle?: boolean;
  titleLines?: number;
  hasDescription?: boolean;
  descriptionLines?: number;
  animated?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasAvatar = true,
  avatarSize = 50,
  hasTitle = true,
  titleLines = 1,
  hasDescription = true,
  descriptionLines = 2,
  animated = true,
}) => {
  return (
    <View style={styles.card}>
      {hasAvatar && (
        <SkeletonCircle
          width={avatarSize}
          height={avatarSize}
          animated={animated}
          style={styles.avatar}
        />
      )}
      <View style={styles.content}>
        {hasTitle && (
          <SkeletonText
            lines={titleLines}
            lineHeight={20}
            spacing={8}
            animated={animated}
          />
        )}
        {hasDescription && (
          <SkeletonText
            lines={descriptionLines}
            lineHeight={14}
            spacing={6}
            lastLineWidth="70%"
            animated={animated}
            style={{marginTop: 12}}
          />
        )}
      </View>
    </View>
  );
};

/**
 * 列表骨架屏
 */
export interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
  spacing?: number;
  animated?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 5,
  itemHeight = 80,
  spacing = 12,
  animated = true,
}) => {
  return (
    <View>
      {Array.from({length: count}).map((_, index) => (
        <View
          key={index}
          style={[
            styles.listItem,
            {marginBottom: index < count - 1 ? spacing : 0},
          ]}>
          <SkeletonCard animated={animated} />
        </View>
      ))}
    </View>
  );
};

/**
 * 表单骨架屏
 */
export interface SkeletonFormProps {
  fields?: number;
  fieldHeight?: number;
  spacing?: number;
  hasButton?: boolean;
  animated?: boolean;
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({
  fields = 4,
  fieldHeight = 50,
  spacing = 16,
  hasButton = true,
  animated = true,
}) => {
  return (
    <View>
      {Array.from({length: fields}).map((_, index) => (
        <View key={index} style={{marginBottom: spacing}}>
          <Skeleton
            height={12}
            width={100}
            animated={animated}
            style={{marginBottom: 8}}
          />
          <Skeleton height={fieldHeight} animated={animated} />
        </View>
      ))}
      {hasButton && (
        <Skeleton
          height={50}
          animated={animated}
          style={{marginTop: spacing}}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  card: {
    flexDirection: 'row',
    padding: 16,
  },
  avatar: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
});

/**
 * 骨架屏组件（统一版）
 *
 * 使用 Reanimated 在 UI 线程驱动脉冲动画，性能更好。
 * 合并了原 Skeleton.tsx 和 LoadingSkeleton.tsx 的功能。
 */

import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {duration, easing} from '../theme/animations';

// 脉冲动画时长（单程）
const PULSE_DURATION = duration.slowest; // 800ms

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

/**
 * 骨架屏基础组件 — Reanimated 脉冲动画
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animated = true,
}) => {
  const opacity = useSharedValue(0.3);

  // 启动无限循环脉冲
  React.useEffect(() => {
    if (!animated) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, {duration: PULSE_DURATION, easing: easing.easeInOut}),
        withTiming(0.3, {duration: PULSE_DURATION, easing: easing.easeInOut}),
      ),
      -1, // 无限循环
    );
  }, [animated, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: animated ? opacity.value : 0.3,
  }));

  return (
    <ReAnimated.View
      style={[
        styles.skeleton,
        {width, height, borderRadius},
        animStyle,
        style,
      ]}
    />
  );
};

/**
 * 趋势页面骨架屏
 */
export const TrendPageSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 头部时间和参与人数 */}
      <View style={styles.header}>
        <Skeleton width="60%" height={24} />
        <View style={styles.headerRight}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton
            width={40}
            height={40}
            borderRadius={20}
            style={{marginLeft: spacing.sm}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Skeleton width="80%" height={20} />
      </View>

      {/* 历史状态指示器 */}
      <View style={styles.statusIndicator}>
        {[...Array(7)].map((_, index) => (
          <Skeleton
            key={index}
            width={32}
            height={32}
            borderRadius={16}
            style={{marginHorizontal: spacing.xs}}
          />
        ))}
      </View>

      {/* 对抗条 */}
      <View style={styles.section}>
        <Skeleton width="100%" height={8} borderRadius={4} />
      </View>

      {/* 网格图 */}
      <View style={styles.gridContainer}>
        {[...Array(20)].map((_, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {[...Array(10)].map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                width={24}
                height={24}
                borderRadius={4}
                style={{margin: 2}}
              />
            ))}
          </View>
        ))}
      </View>

      {/* 时间轴 */}
      <View style={styles.section}>
        <Skeleton width="100%" height={60} borderRadius={8} />
      </View>
    </View>
  );
};

/**
 * 列表项骨架屏
 */
export const ListItemSkeleton: React.FC<{count?: number}> = ({count = 5}) => {
  return (
    <View style={styles.listContainer}>
      {[...Array(count)].map((_, index) => (
        <View key={index} style={styles.listItem}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.listItemContent}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={12} style={{marginTop: spacing.xs}} />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * 卡片骨架屏
 */
export const CardSkeleton: React.FC<{count?: number}> = ({count = 3}) => {
  return (
    <View style={styles.cardContainer}>
      {[...Array(count)].map((_, index) => (
        <View key={index} style={styles.card}>
          <Skeleton width="100%" height={120} borderRadius={8} />
          <View style={styles.cardContent}>
            <Skeleton width="80%" height={20} />
            <Skeleton width="60%" height={16} style={{marginTop: spacing.sm}} />
            <Skeleton width="40%" height={14} style={{marginTop: spacing.xs}} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.light.border,
  },
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerRight: {
    flexDirection: 'row',
  },
  section: {
    marginBottom: spacing.lg,
  },
  statusIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  gridContainer: {
    marginBottom: spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  listContainer: {
    padding: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.light.surface,
    borderRadius: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardContainer: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardContent: {
    padding: spacing.md,
  },
});

import React from 'react';
import {StyleSheet, View as RNView} from 'react-native';
import {VStack, HStack} from '@gluestack-ui/themed';
import {Text} from '@gluestack-ui/themed';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';

/**
 * Glassmorphism 风格示例卡片
 *
 * 这是一个玻璃拟态风格的"今日参与人数"卡片示例
 * 用于展示效果，不影响现有代码
 *
 * 注意: 本组件使用大�?rgba 颜色值实现玻璃拟态效�?
 * 这些半透明效果是设计的核心特性，不应替换�?gluestack-ui tokens
 *
 * 设计规范�?
 * - 深蓝至黑色线性渐变背景（#020617 �?#000000�?
 * - 半透明卡片背景（rgba(255, 255, 255, 0.05)�?
 * - 极细边框�?.5px, rgba(255, 255, 255, 0.2)�?
 * - 背景模糊效果�?0 度模糊）
 * - 发光数字效果
 * - 系统现代字体（SF Pro / Inter�?
 * - 1px 字间�?
 */

interface GlassmorphismCardProps {
  participantCount: number;
  overtimeCount: number;
  onTimeCount: number;
}

export const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  participantCount,
  overtimeCount,
  onTimeCount,
}) => {
  return (
    <RNView style={styles.container}>
      {/* 深蓝至黑色渐变背�?*/}
      <LinearGradient
        colors={['#020617', '#000000']}
        style={styles.gradientBackground}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
      />

      {/* 玻璃卡片 - 使用真正的背景模�?*/}
      <BlurView intensity={20} tint="dark" style={styles.glassCard}>
        <VStack gap="$4" padding="$4">
          {/* 标题 */}
          <Text style={styles.title}>今日参与人数</Text>

          {/* 主要数字 - 发光效果 */}
          <RNView style={styles.numberContainer}>
            <Text style={styles.glowingNumber}>{participantCount}</Text>
            <Text style={styles.unit}>人</Text>
          </RNView>

          {/* 分隔线 */}
          <RNView style={styles.divider} />

          {/* 详细数据 */}
          <HStack justifyContent="space-between">
            <VStack alignItems="center" flex={1}>
              <Text style={styles.label}>准时下班</Text>
              <Text style={[styles.value, styles.onTimeGlow]}>
                {onTimeCount}
              </Text>
            </VStack>

            <RNView style={styles.verticalDivider} />

            <VStack alignItems="center" flex={1}>
              <Text style={styles.label}>加班</Text>
              <Text style={[styles.value, styles.overtimeGlow]}>
                {overtimeCount}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </BlurView>
    </RNView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 240,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // 半透明玻璃效果
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)', // 极细边框
    borderRadius: 16,
    overflow: 'hidden',
    // 使用 expo-blur �?BlurView 实现真正的背景模�?
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1, // 1px 字间�?
    fontFamily: 'System', // 系统字体
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  glowingNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: 'System',
    // 发光效果（通过多层阴影模拟�?
    textShadowColor: 'rgba(0, 217, 255, 0.8)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 20,
  },
  unit: {
    fontSize: 24,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
    letterSpacing: 1,
    fontFamily: 'System',
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8,
  },
  verticalDivider: {
    width: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    letterSpacing: 1,
    fontFamily: 'System',
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  onTimeGlow: {
    color: '#00D9FF', // 青色
    textShadowColor: 'rgba(0, 217, 255, 0.6)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 12,
  },
  overtimeGlow: {
    color: '#EF4444', // 红色
    textShadowColor: 'rgba(239, 68, 68, 0.6)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 12,
  },
});

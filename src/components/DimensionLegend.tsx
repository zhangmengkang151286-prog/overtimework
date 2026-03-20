import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '@gluestack-ui/themed';

/**
 * DimensionLegend - 统一的维度图例组件
 * 所有5个维度页面共用，保证视觉一致性
 *
 * 两种模式：
 * - 'dot': 实心圆点 + 文字（标签、行业、职位、年龄）
 * - 'gradient': 渐变色条 + 两端文字（省份热力图专用）
 */

interface DimensionLegendProps {
  theme: 'light' | 'dark';
  /** 图例模式：dot=圆点, gradient=渐变色条 */
  variant?: 'dot' | 'gradient';
  /** 渐变色条的颜色生成函数（variant='gradient' 时必传） */
  getGradientColor?: (ratio: number, isDark: boolean) => string;
}

export const DimensionLegend: React.FC<DimensionLegendProps> = ({
  theme,
  variant = 'dot',
  getGradientColor,
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#999999' : '#888888';

  if (variant === 'gradient' && getGradientColor) {
    return (
      <View style={styles.container}>
        <Text size="xs" style={{color: textColor}}>
          准时下班
        </Text>
        <View style={styles.gradientBar}>
          {Array.from({length: 20}, (_, i) => i / 19).map((r, i) => (
            <View
              key={i}
              style={[
                styles.gradientBlock,
                {backgroundColor: getGradientColor(r, isDark)},
              ]}
            />
          ))}
        </View>
        <Text size="xs" style={{color: textColor}}>
          加班
        </Text>
      </View>
    );
  }

  // 默认圆点模式
  return (
    <View style={styles.container}>
      <View style={styles.dotItem}>
        <View style={[styles.dot, {backgroundColor: '#00C805'}]} />
        <Text size="xs" style={{color: textColor}}>
          准时下班
        </Text>
      </View>
      <View style={styles.dotItem}>
        <View style={[styles.dot, {backgroundColor: '#FF5000'}]} />
        <Text size="xs" style={{color: textColor}}>
          加班
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 20,
  },
  dotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gradientBar: {
    flexDirection: 'row',
    marginHorizontal: 6,
  },
  gradientBlock: {
    width: 10,
    height: 5,
    borderRadius: 1,
  },
});

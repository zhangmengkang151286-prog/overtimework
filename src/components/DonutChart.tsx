import React, {useState, useCallback, useMemo} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import Svg, {Path, G} from 'react-native-svg';
import {DimensionItem} from '../types';
import {processTop10WithOthers, ratioToColor} from '../utils/dimensionStatsUtils';
// DataBlurOverlay 遮罩统一由父组件 DataVisualization 处理

/**
 * DonutChart - 行业环形图组件
 * 使用 react-native-svg 绘制环形图，弧段按占比分配，使用 10 级色阶着色
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2
 */

interface DonutChartProps {
  data: DimensionItem[];
  theme: 'light' | 'dark';
  blurData?: boolean;
}

/** 环形图尺寸常量 */
const CHART_SIZE = 220;
const OUTER_RADIUS = 100;
const INNER_RADIUS = 60;
const CENTER_X = CHART_SIZE / 2;
const CENTER_Y = CHART_SIZE / 2;

/** 弧段间隙角度（弧度） */
const GAP_ANGLE = 0.02;

/**
 * 根据角度和半径计算 SVG 坐标点
 */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number,
): {x: number; y: number} {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

/**
 * 生成环形弧段的 SVG Path
 */
function describeArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);

  const sweep = endAngle - startAngle;
  const largeArc = sweep > Math.PI ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  theme,
  blurData = false,
}) => {
  const isDark = theme === 'dark';
  // 选中的弧段索引，null 表示未选中 (Requirements: 2.2 - 中心默认空白)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 处理 Top10 合并 (Requirements: 2.1)
  const processedData = useMemo(() => processTop10WithOthers(data), [data]);

  // 计算总人数
  const totalCount = useMemo(
    () => processedData.reduce((sum, item) => sum + item.totalCount, 0),
    [processedData],
  );

  // 处理弧段点击 (Requirements: 2.4)
  const handleArcPress = useCallback(
    (index: number) => {
      setSelectedIndex(prev => (prev === index ? null : index));
    },
    [],
  );

  // 计算弧段数据
  const arcs = useMemo(() => {
    if (totalCount === 0 || processedData.length === 0) return [];

    const totalGap = GAP_ANGLE * processedData.length;
    const availableAngle = Math.PI * 2 - totalGap;
    let currentAngle = -Math.PI / 2; // 从顶部开始

    return processedData.map((item, index) => {
      const proportion = item.totalCount / totalCount;
      const sweepAngle = proportion * availableAngle;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweepAngle;
      currentAngle = endAngle + GAP_ANGLE;

      // 色阶映射 (Requirements: 2.3)
      const color = ratioToColor(item.overtimeRatio);

      return {
        item,
        index,
        startAngle,
        endAngle,
        color,
        path: describeArc(
          CENTER_X,
          CENTER_Y,
          OUTER_RADIUS,
          INNER_RADIUS,
          startAngle,
          endAngle,
        ),
      };
    });
  }, [processedData, totalCount]);

  // 渲染中心内容 (Requirements: 2.2, 2.4)
  const renderCenter = () => {
    if (selectedIndex === null || !processedData[selectedIndex]) {
      // 中心默认空白 (Requirements: 2.2)
      return null;
    }

    const selected = processedData[selectedIndex];
    return (
      <View style={styles.centerContent}>
        <Text
          size="xs"
          numberOfLines={1}
          color={isDark ? '$trueGray300' : '$trueGray600'}
          textAlign="center"
          style={styles.centerName}>
          {selected.name}
        </Text>
        <Text
          size="lg"
          fontWeight="$bold"
          color={isDark ? '$white' : '$black'}
          textAlign="center">
          {selected.totalCount}
        </Text>
      </View>
    );
  };

  // 空数据处理 (Requirements: 2.5)
  if (processedData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text
          size="sm"
          color={isDark ? '$trueGray500' : '$trueGray400'}>
          该时段暂无行业数据
        </Text>
      </View>
    );
  }

  const chartContent = (
    <View style={styles.container}>
      {/* 环形图 */}
      <View style={styles.chartWrapper}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          <G>
            {arcs.map(arc => {
              const isSelected = selectedIndex === arc.index;
              return (
                <Path
                  key={arc.item.id}
                  d={arc.path}
                  fill={arc.color}
                  opacity={
                    selectedIndex === null || isSelected ? 1 : 0.4
                  }
                  stroke={
                    isSelected
                      ? isDark
                        ? '#FFFFFF'
                        : '#000000'
                      : 'transparent'
                  }
                  strokeWidth={isSelected ? 2 : 0}
                  onPress={() => handleArcPress(arc.index)}
                />
              );
            })}
          </G>
        </Svg>

        {/* 中心区域 */}
        <View style={styles.centerOverlay} pointerEvents="none">
          {renderCenter()}
        </View>
      </View>

      {/* 图例 */}
      <View style={styles.legendContainer}>
        {processedData.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={styles.legendItem}
            activeOpacity={0.6}
            onPress={() => handleArcPress(index)}>
            <View
              style={[
                styles.legendDot,
                {backgroundColor: arcs[index]?.color || '#ccc'},
              ]}
            />
            <Text
              size="xs"
              numberOfLines={1}
              color={isDark ? '$trueGray300' : '$trueGray600'}
              style={styles.legendText}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return chartContent;
};


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  chartWrapper: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    position: 'relative',
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: INNER_RADIUS * 1.6,
  },
  centerName: {
    maxWidth: INNER_RADIUS * 1.5,
    marginBottom: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    maxWidth: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});

/**
 * 长期趋势图组件
 * 使用 react-native-svg 绘制折线图，展示平均加班时长随时间的变化
 * 需求: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4
 */

import React, {useMemo, useCallback} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Dimensions} from 'react-native';
import Svg, {
  Line,
  Path,
  Circle,
  Text as SvgText,
  G,
  Rect,
} from 'react-native-svg';
import {TrendDataPoint, TrendDimension} from '../types/my-page';
import {Theme} from '../theme';
import {typography} from '../theme/typography';

interface LongTermTrendChartProps {
  data: TrendDataPoint[];
  dimension: TrendDimension;
  onDimensionChange: (dimension: TrendDimension) => void;
  theme: Theme;
}

// 维度标签
const DIMENSION_LABELS: {key: TrendDimension; label: string}[] = [
  {key: 'day', label: '天'},
  {key: 'week', label: '周'},
  {key: 'month', label: '月'},
];

// 图表常量
const CHART_HEIGHT = 280;
const CHART_PADDING = {top: 20, right: 16, bottom: 40, left: 40};
const Y_MAX = 12; // 纵坐标最大值（小时）
const Y_TICKS = [0, 3, 6, 9, 12]; // 纵坐标刻度
const MAX_X_LABELS = 7; // 横坐标最多显示标签数

/**
 * 维度切换按钮组
 */
const DimensionSwitch: React.FC<{
  dimension: TrendDimension;
  onDimensionChange: (dimension: TrendDimension) => void;
  theme: Theme;
}> = React.memo(({dimension, onDimensionChange, theme}) => {
  const isDark = theme.isDark;

  return (
    <View
      style={[
        styles.dimensionContainer,
        {
          borderColor: isDark ? '#27272A' : '#E0E0E0',
        },
      ]}
    >
      {DIMENSION_LABELS.map(({key, label}, index) => {
        const isActive = dimension === key;
        const isNotLast = index < DIMENSION_LABELS.length - 1;
        return (
          <React.Fragment key={key}>
            <TouchableOpacity
              style={[
                styles.dimensionButton,
                {
                  backgroundColor: isActive
                    ? (isDark ? '#27272A' : '#E5E7EB')
                    : 'transparent',
                },
              ]}
              onPress={() => onDimensionChange(key)}
              accessibilityLabel={`切换到${label}维度`}
              accessibilityState={{selected: isActive}}
            >
              <Text
                style={[
                  styles.dimensionText,
                  {
                    color: isActive
                      ? theme.colors.text
                      : theme.colors.textTertiary,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
            {/* 分隔线 */}
            {isNotLast && (
              <View
                style={[
                  styles.dimensionDivider,
                  {backgroundColor: isDark ? '#27272A' : '#E0E0E0'},
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
});


/**
 * 空状态提示
 */
const EmptyState: React.FC<{theme: Theme}> = ({theme}) => (
  <View style={styles.emptyContainer}>
    <Text style={[styles.emptyText, {color: theme.colors.textTertiary}]}>
      暂无趋势数据
    </Text>
  </View>
);

/**
 * 计算横坐标标签的显示间隔
 * 确保最多显示 MAX_X_LABELS 个标签
 */
function getXLabelStep(dataLength: number): number {
  if (dataLength <= MAX_X_LABELS) {
    return 1;
  }
  return Math.ceil(dataLength / MAX_X_LABELS);
}

/**
 * LongTermTrendChart 长期趋势图主组件
 * 需求: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4
 */
export const LongTermTrendChart: React.FC<LongTermTrendChartProps> = ({
  data,
  dimension,
  onDimensionChange,
  theme,
}) => {
  const isDark = theme.isDark;

  // 图表绘制区域尺寸（动态计算，和日历宽度一致铺满容器）
  // MyPage section marginHorizontal=8，所以容器宽度 = 屏幕宽度 - 16
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 16;
  const plotWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // 颜色配置
  const lineColor = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)';
  const dotColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)';
  const gridColor = isDark ? '#27272A' : '#E5E5E5';
  const axisTextColor = isDark ? '#8A8D91' : '#999999';

  // 将数据点映射为 SVG 坐标
  const points = useMemo(() => {
    if (data.length === 0) return [];
    if (data.length === 1) {
      // 单个数据点居中显示
      const x = CHART_PADDING.left + plotWidth / 2;
      const y =
        CHART_PADDING.top +
        plotHeight -
        (data[0].avgOvertimeHours / Y_MAX) * plotHeight;
      return [{x, y, point: data[0]}];
    }
    return data.map((point, index) => {
      const x =
        CHART_PADDING.left + (index / (data.length - 1)) * plotWidth;
      const y =
        CHART_PADDING.top +
        plotHeight -
        (point.avgOvertimeHours / Y_MAX) * plotHeight;
      return {x, y, point};
    });
  }, [data, plotWidth, plotHeight]);

  // 是否显示数据点圆点（数据点 <= 7 个时显示）
  const showDots = data.length <= MAX_X_LABELS;

  // 生成平滑贝塞尔曲线路径
  const smoothPath = useMemo(() => {
    if (points.length < 2) return '';
    // Y 坐标边界（防止曲线冲出图表区域产生负数视觉效果）
    const yMin = CHART_PADDING.top; // 图表顶部（对应 Y_MAX）
    const yMax = CHART_PADDING.top + plotHeight; // 图表底部（对应 0h）
    const clampY = (v: number) => Math.max(yMin, Math.min(yMax, v));
    // 使用 Catmull-Rom 样条转三次贝塞尔曲线
    const tension = 0.3;
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      // 控制点（clamp Y 防止超出绘图区域）
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = clampY(p1.y + (p2.y - p0.y) * tension);
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = clampY(p2.y - (p3.y - p1.y) * tension);
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }, [points, plotHeight]);

  // 横坐标标签步长
  const xLabelStep = useMemo(() => getXLabelStep(data.length), [data.length]);

  // 维度切换回调
  const handleDimensionChange = useCallback(
    (dim: TrendDimension) => {
      onDimensionChange(dim);
    },
    [onDimensionChange],
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'transparent',
        },
      ]}
    >
      {/* 标题和维度切换 */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          加班趋势
        </Text>
        <DimensionSwitch
          dimension={dimension}
          onDimensionChange={handleDimensionChange}
          theme={theme}
        />
      </View>

      {/* 图表区域 */}
      {data.length === 0 ? (
        <EmptyState theme={theme} />
      ) : (
        <Svg
          width="100%"
          height={CHART_HEIGHT}
          viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
        >
          {/* 背景 */}
          <Rect
            x={0}
            y={0}
            width={chartWidth}
            height={CHART_HEIGHT}
            fill="transparent"
          />

          {/* 纵坐标网格线和刻度标签 */}
          {Y_TICKS.map((tick) => {
            const y =
              CHART_PADDING.top +
              plotHeight -
              (tick / Y_MAX) * plotHeight;
            return (
              <G key={`y-${tick}`}>
                {/* 网格线 */}
                <Line
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={CHART_PADDING.left + plotWidth}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth={0.5}
                  strokeDasharray={tick === 0 ? undefined : '4,4'}
                />
                {/* 刻度标签 */}
                <SvgText
                  x={CHART_PADDING.left - 12}
                  y={y + 4}
                  fontSize={10}
                  fill={axisTextColor}
                  textAnchor="end"
                >
                  {tick}h
                </SvgText>
              </G>
            );
          })}

          {/* 平滑曲线 */}
          {points.length > 1 && (
            <Path
              d={smoothPath}
              fill="none"
              stroke={lineColor}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* 数据点圆点 - 只在数据点 <= 7 个时显示 */}
          {showDots && points.map((p, index) => (
            <Circle
              key={`dot-${index}`}
              cx={p.x}
              cy={p.y}
              r={2.5}
              fill={dotColor}
            />
          ))}

          {/* 横坐标标签 */}
          {points.map((p, index) => {
            if (index % xLabelStep !== 0) return null;
            return (
              <SvgText
                key={`x-label-${index}`}
                x={p.x}
                y={CHART_HEIGHT - 8}
                fontSize={9}
                fill={axisTextColor}
                textAnchor="middle"
              >
                {p.point.label}
              </SvgText>
            );
          })}
        </Svg>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  // 维度切换
  dimensionContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dimensionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dimensionDivider: {
    width: 1,
  },
  dimensionText: {
    fontSize: typography.fontSize.sm,
  },
  // 空状态
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
  },
});

export default LongTermTrendChart;

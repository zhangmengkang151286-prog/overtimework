/**
 * 加班趋势海报组件
 * 
 * 功能：
 * - 显示用户个人加班趋势图表
 * - 提供时间维度选择器（天/周/月）
 * - 复用 LongTermTrendChart 组件
 * - 支持截图生成海报
 * 
 * 样式规范：
 * - 统一使用 posterTheme 配置
 * - 统一字体、间距、圆角、边框
 * - 统一颜色方案（深色/浅色主题）
 * - 统一图表和选择器样式
 * 
 * 验证需求: 5.1-5.5, 13.1-13.6
 */

import React, {forwardRef, useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {PosterTemplate} from './PosterTemplate';
import {posterTheme, getPosterTheme} from '../../theme/posterTheme';
import {OvertimeTrendData, UserInfo} from '../../types/poster';
import {useThemeToggle} from '../../hooks/useThemeToggle';
import {TrendDataPoint} from '../../types/my-page';
import Svg, {
  Line,
  Path,
  Circle,
  Text as SvgText,
  G,
  Rect,
} from 'react-native-svg';

/**
 * OvertimeTrendPoster 组件属性
 */
interface OvertimeTrendPosterProps {
  data: OvertimeTrendData;
  user: UserInfo;
  onDimensionChange?: (dimension: 'day' | 'week' | 'month') => void;
}

// 维度标签
const DIMENSION_LABELS: {key: 'day' | 'week' | 'month'; label: string}[] = [
  {key: 'day', label: '天'},
  {key: 'week', label: '周'},
  {key: 'month', label: '月'},
];

// 图表常量（针对海报优化）
const CHART_HEIGHT = 320;
const CHART_PADDING = {top: 30, right: 20, bottom: 50, left: 50};
const Y_MAX = 12; // 纵坐标最大值（小时）
const Y_TICKS = [0, 3, 6, 9, 12]; // 纵坐标刻度
const MAX_X_LABELS = 7; // 横坐标最多显示标签数

/**
 * 维度切换按钮组（海报专用样式，统一样式规范）
 */
const DimensionSwitch: React.FC<{
  dimension: 'day' | 'week' | 'month';
  onDimensionChange: (dimension: 'day' | 'week' | 'month') => void;
  isDark: boolean;
  colors: any;
}> = React.memo(({dimension, onDimensionChange, isDark, colors}) => {
  return (
    <View
      style={[
        styles.dimensionContainer,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          borderRadius: posterTheme.borderRadius.sm,
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
                    ? colors.primary
                    : 'transparent',
                  borderRadius: posterTheme.borderRadius.sm,
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
                      ? (isDark ? colors.background : '#FFFFFF')
                      : colors.textSecondary,
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
                  {backgroundColor: colors.border},
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
const EmptyState: React.FC<{colors: any}> = ({colors}) => (
  <View style={styles.emptyContainer}>
    <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
      暂无趋势数据
    </Text>
  </View>
);

/**
 * 计算横坐标标签的显示间隔
 */
function getXLabelStep(dataLength: number): number {
  if (dataLength <= MAX_X_LABELS) {
    return 1;
  }
  return Math.ceil(dataLength / MAX_X_LABELS);
}

/**
 * 趋势图表组件（海报专用，简化版）
 */
const TrendChart: React.FC<{
  dataPoints: TrendDataPoint[];
  isDark: boolean;
  colors: any;
  chartWidth: number;
}> = React.memo(({dataPoints, isDark, colors, chartWidth}) => {
  const plotWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // 颜色配置
  const lineColor = colors.primary;
  const dotColor = colors.primary;
  const gridColor = colors.border;
  const axisTextColor = colors.textSecondary;

  // 将数据点映射为 SVG 坐标
  const points = React.useMemo(() => {
    if (dataPoints.length === 0) return [];
    if (dataPoints.length === 1) {
      // 单个数据点居中显示
      const x = CHART_PADDING.left + plotWidth / 2;
      const y =
        CHART_PADDING.top +
        plotHeight -
        (dataPoints[0].avgOvertimeHours / Y_MAX) * plotHeight;
      return [{x, y, point: dataPoints[0]}];
    }
    return dataPoints.map((point, index) => {
      const x =
        CHART_PADDING.left + (index / (dataPoints.length - 1)) * plotWidth;
      const y =
        CHART_PADDING.top +
        plotHeight -
        (point.avgOvertimeHours / Y_MAX) * plotHeight;
      return {x, y, point};
    });
  }, [dataPoints, plotWidth, plotHeight]);

  // 生成平滑贝塞尔曲线路径
  const smoothPath = React.useMemo(() => {
    if (points.length < 2) return '';
    const yMin = CHART_PADDING.top;
    const yMax = CHART_PADDING.top + plotHeight;
    const clampY = (v: number) => Math.max(yMin, Math.min(yMax, v));
    const tension = 0.3;
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = clampY(p1.y + (p2.y - p0.y) * tension);
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = clampY(p2.y - (p3.y - p1.y) * tension);
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }, [points, plotHeight]);

  // 横坐标标签步长
  const xLabelStep = React.useMemo(
    () => getXLabelStep(dataPoints.length),
    [dataPoints.length],
  );

  if (dataPoints.length === 0) {
    return <EmptyState colors={colors} />;
  }

  return (
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
              y={y + 5}
              fontSize={12}
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
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* 数据点圆点 */}
      {points.map((p, index) => (
        <Circle
          key={`dot-${index}`}
          cx={p.x}
          cy={p.y}
          r={3}
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
            y={CHART_HEIGHT - 12}
            fontSize={11}
            fill={axisTextColor}
            textAnchor="middle"
          >
            {p.point.label}
          </SvgText>
        );
      })}
    </Svg>
  );
});

/**
 * OvertimeTrendPoster 加班趋势海报组件
 * 
 * 验证需求: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export const OvertimeTrendPoster = React.memo(
  forwardRef<View, OvertimeTrendPosterProps>(
    ({data, user, onDimensionChange}, ref) => {
      const {isDark} = useThemeToggle();
      
      // 获取主题颜色（使用 useMemo 缓存）
      const colors = React.useMemo(() => getPosterTheme(isDark), [isDark]);

    // 本地状态管理维度（如果没有外部控制）
    const [localDimension, setLocalDimension] = useState<'day' | 'week' | 'month'>(
      data.dimension,
    );

    // 当前维度
    const currentDimension = data.dimension || localDimension;

    // 格式化日期（使用 useMemo 缓存）
    const currentDate = React.useMemo(() => {
      return new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }, []);

    // 处理维度变更（使用 useCallback 缓存）
    const handleDimensionChange = React.useCallback((dimension: 'day' | 'week' | 'month') => {
      setLocalDimension(dimension);
      onDimensionChange?.(dimension);
    }, [onDimensionChange]);

    // 将 TrendPoint[] 转换为 TrendDataPoint[]
    const trendDataPoints: TrendDataPoint[] = React.useMemo(() => {
      return data.dataPoints.map(point => ({
        date: point.date,
        avgOvertimeHours: point.value,
        label: point.label || point.date,
        recordCount: 1, // 海报中不需要显示记录数，设置为默认值
      }));
    }, [data.dataPoints]);

    // 海报宽度（固定，使用 useMemo 缓存）
    const posterWidth = React.useMemo(() => posterTheme.dimensions.width, []);
    const chartWidth = React.useMemo(() => posterWidth - posterTheme.spacing.lg * 2, [posterWidth]);

    return (
      <PosterTemplate
        ref={ref}
        user={user}
        date={currentDate}
        title="我的加班趋势"
      >
        <View style={styles.container}>
          {/* 维度选择器 */}
          <View style={styles.headerRow}>
            <DimensionSwitch
              dimension={currentDimension}
              onDimensionChange={handleDimensionChange}
              isDark={isDark}
              colors={colors}
            />
          </View>

          {/* 趋势图表 */}
          <View style={styles.chartContainer}>
            <TrendChart
              dataPoints={trendDataPoints}
              isDark={isDark}
              colors={colors}
              chartWidth={chartWidth}
            />
          </View>

          {/* 说明文字 */}
          {trendDataPoints.length > 0 && (
            <View style={styles.descriptionContainer}>
              <Text
                style={[
                  styles.descriptionText,
                  {color: colors.textSecondary},
                ]}
              >
                平均加班时长趋势
              </Text>
            </View>
          )}
        </View>
      </PosterTemplate>
    );
  }),
  (prevProps, nextProps) => {
    // 只在关键 props 变化时重新渲染
    return (
      prevProps.data.dimension === nextProps.data.dimension &&
      prevProps.data.dataPoints.length === nextProps.data.dataPoints.length &&
      prevProps.user.username === nextProps.user.username
    );
  }
);

OvertimeTrendPoster.displayName = 'OvertimeTrendPoster';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: posterTheme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: posterTheme.spacing.lg,
  },
  // 维度切换器
  dimensionContainer: {
    flexDirection: 'row',
    borderRadius: posterTheme.borderRadius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dimensionButton: {
    paddingHorizontal: posterTheme.spacing.md,
    paddingVertical: posterTheme.spacing.sm,
  },
  dimensionDivider: {
    width: 1,
  },
  dimensionText: {
    fontSize: 14,
  },
  // 图表容器
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  // 空状态
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  // 说明文字
  descriptionContainer: {
    marginTop: posterTheme.spacing.md,
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 12,
  },
});

export default OvertimeTrendPoster;

import React, {useMemo, useState, useCallback} from 'react';
import {View, StyleSheet, LayoutChangeEvent} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import Svg, {
  Path,
  Line,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {DimensionItem} from '../types';
import {AGE_GROUP_ORDER} from '../utils/dimensionStatsUtils';
import {DataBlurOverlay} from './DataBlurOverlay';

/** 格式化人数：超过1000显示为K格式 */
const formatCount = (count: number): string => {
  if (count < 1000) return String(count);
  const k = count / 1000;
  return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
};

interface PopulationPyramidProps {
  data: DimensionItem[];
  theme: 'light' | 'dark';
  blurData?: boolean;
}

// 图表布局常量（宽度通过 onLayout 动态获取，与标签页等保持一致）
const PADDING_LEFT = 42;
const PADDING_RIGHT = 30;
const PADDING_TOP = 40;
const PADDING_BOTTOM = 52;
const CHART_HEIGHT = 360;

const COLORS = {
  light: {
    overtime: '#F4664A',
    ontime: '#30BF78',
    axisLine: '#E0E0E0',
    axisText: '#999999',
    gridLine: '#F0F0F0',
  },
  dark: {
    overtime: '#FF5000',
    ontime: '#00C805',
    axisLine: '#333333',
    axisText: '#666666',
    gridLine: '#222222',
  },
};

/** 生成平滑贝塞尔曲线路径（Catmull-Rom → Cubic Bezier），Y 坐标 clamp 防止过冲 */
const smoothPath = (
  points: {x: number; y: number}[],
  minY: number,
  maxY: number,
): string => {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;
  }
  const clampY = (v: number) => Math.min(Math.max(v, minY), maxY);
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const tension = 6;
    const cp1x = p1.x + (p2.x - p0.x) / tension;
    const cp1y = clampY(p1.y + (p2.y - p0.y) / tension);
    const cp2x = p2.x - (p3.x - p1.x) / tension;
    const cp2y = clampY(p2.y - (p3.y - p1.y) / tension);
    d += `C${cp1x},${cp1y},${cp2x},${cp2y},${p2.x},${p2.y}`;
  }
  return d;
};

export const PopulationPyramid: React.FC<PopulationPyramidProps> = ({
  data,
  theme,
  blurData = false,
}) => {
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  // 动态获取容器宽度，与标签页等其他 Tab 保持一致
  const [chartWidth, setChartWidth] = useState(0);
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const {width} = event.nativeEvent.layout;
      if (width > 0 && width !== chartWidth) {
        setChartWidth(width);
      }
    },
    [chartWidth],
  );

  // 按 AGE_GROUP_ORDER 构建完整的 11 个年龄段数据
  const sortedData = useMemo(() => {
    const dataMap = new Map(data.map(item => [item.name, item]));
    return AGE_GROUP_ORDER.map(name => {
      const existing = dataMap.get(name);
      if (existing) return existing;
      return {
        id: name, name, overtimeCount: 0, onTimeCount: 0, totalCount: 0, overtimeRatio: 0,
      } as DimensionItem;
    });
  }, [data]);

  const maxCount = useMemo(() => {
    if (sortedData.length === 0) return 1;
    return Math.max(...sortedData.map(item => Math.max(item.overtimeCount, item.onTimeCount)), 1);
  }, [sortedData]);

  // 绘图区域（基于动态宽度）
  const drawWidth = chartWidth - PADDING_LEFT - PADDING_RIGHT;
  const drawHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const pointCount = sortedData.length || 1;
  const stepX = drawWidth > 0 ? drawWidth / (pointCount - 1 || 1) : 0;

  // Y轴刻度（4档）
  const yTicks = useMemo(() => {
    const rawStep = maxCount / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    const ticks: number[] = [];
    for (let v = 0; v <= maxCount; v += step) ticks.push(v);
    if (ticks[ticks.length - 1] < maxCount) ticks.push(ticks[ticks.length - 1] + step);
    return ticks;
  }, [maxCount]);

  const yMax = yTicks[yTicks.length - 1] || maxCount;
  const baseY = PADDING_TOP + drawHeight;

  // 数据点坐标
  const overtimePts = useMemo(() => sortedData.map((item, i) => ({
    x: PADDING_LEFT + i * stepX,
    y: PADDING_TOP + drawHeight - (item.overtimeCount / yMax) * drawHeight,
    value: item.overtimeCount,
  })), [sortedData, yMax, stepX, drawHeight]);

  const ontimePts = useMemo(() => sortedData.map((item, i) => ({
    x: PADDING_LEFT + i * stepX,
    y: PADDING_TOP + drawHeight - (item.onTimeCount / yMax) * drawHeight,
    value: item.onTimeCount,
  })), [sortedData, yMax, stepX, drawHeight]);

  // 曲线路径
  const overtimeLine = smoothPath(overtimePts, PADDING_TOP, baseY);
  const ontimeLine = smoothPath(ontimePts, PADDING_TOP, baseY);

  // 面积填充路径
  const overtimeArea = overtimePts.length > 0
    ? `${overtimeLine}L${overtimePts[overtimePts.length - 1].x},${baseY}L${overtimePts[0].x},${baseY}Z`
    : '';
  const ontimeArea = ontimePts.length > 0
    ? `${ontimeLine}L${ontimePts[ontimePts.length - 1].x},${baseY}L${ontimePts[0].x},${baseY}Z`
    : '';

  // X轴标签（隔一个显示）
  const xLabels = useMemo(() => sortedData.map((item, i) => ({
    x: PADDING_LEFT + i * stepX,
    label: item.name,
    show: i % 2 === 0 || i === sortedData.length - 1,
  })), [sortedData, stepX]);

  // 空数据
  if (sortedData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text size="sm" color={isDark ? '$trueGray500' : '$trueGray400'}>该时段暂无年龄数据</Text>
      </View>
    );
  }

  // 宽度未获取时先渲染空容器触发 onLayout
  const chartContent = (
    <View style={styles.container} onLayout={handleLayout}>
      {chartWidth > 0 && (
        <>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="overtimeGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.overtime} stopOpacity={0.25} />
                <Stop offset="1" stopColor={colors.overtime} stopOpacity={0.02} />
              </LinearGradient>
              <LinearGradient id="ontimeGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.ontime} stopOpacity={0.25} />
                <Stop offset="1" stopColor={colors.ontime} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>

            {/* Y轴网格线和刻度 */}
            {yTicks.map(tick => {
              const y = PADDING_TOP + drawHeight - (tick / yMax) * drawHeight;
              return (
                <React.Fragment key={`y-${tick}`}>
                  <Line x1={PADDING_LEFT} y1={y} x2={PADDING_LEFT + drawWidth} y2={y} stroke={colors.gridLine} strokeWidth={0.5} />
                  <SvgText x={PADDING_LEFT - 6} y={y + 3} fontSize={9} fill={colors.axisText} textAnchor="end">{formatCount(tick)}</SvgText>
                </React.Fragment>
              );
            })}

            {/* 面积填充 */}
            {overtimeArea ? <Path d={overtimeArea} fill="url(#overtimeGrad)" /> : null}
            {ontimeArea ? <Path d={ontimeArea} fill="url(#ontimeGrad)" /> : null}

            {/* 曲线 */}
            {overtimeLine ? <Path d={overtimeLine} stroke={colors.overtime} strokeWidth={2} fill="none" /> : null}
            {ontimeLine ? <Path d={ontimeLine} stroke={colors.ontime} strokeWidth={2} fill="none" /> : null}

            {/* 加班数据点 + 标签（点上方） */}
            {overtimePts.map((pt, i) =>
              pt.value > 0 ? (
                <React.Fragment key={`ot-${i}`}>
                  <Circle cx={pt.x} cy={pt.y} r={3} fill={colors.overtime} />
                  <SvgText x={pt.x} y={Math.max(pt.y - 14, PADDING_TOP - 2)} fontSize={8} fill={colors.overtime} textAnchor="middle" fontWeight="600">{formatCount(pt.value)}</SvgText>
                </React.Fragment>
              ) : null,
            )}
            {/* 准时数据点 + 标签（点下方） */}
            {ontimePts.map((pt, i) =>
              pt.value > 0 ? (
                <React.Fragment key={`on-${i}`}>
                  <Circle cx={pt.x} cy={pt.y} r={3} fill={colors.ontime} />
                  <SvgText x={pt.x} y={Math.min(pt.y + 18, baseY - 2)} fontSize={8} fill={colors.ontime} textAnchor="middle" fontWeight="600">{formatCount(pt.value)}</SvgText>
                </React.Fragment>
              ) : null,
            )}

            {/* X轴标签 */}
            {xLabels.map((label, i) =>
              label.show ? (
                <SvgText key={`xl-${i}`} x={label.x} y={baseY + 16} fontSize={8} fill={colors.axisText} textAnchor="middle">{label.label}</SvgText>
              ) : null,
            )}

            {/* X轴底线 */}
            <Line x1={PADDING_LEFT} y1={baseY} x2={PADDING_LEFT + drawWidth} y2={baseY} stroke={colors.axisLine} strokeWidth={0.5} />

            {/* 单位标签 */}
            <SvgText x={PADDING_LEFT - 6} y={PADDING_TOP - 16} fontSize={8} fill={colors.axisText} textAnchor="end">人</SvgText>
            <SvgText x={PADDING_LEFT + drawWidth} y={baseY + 28} fontSize={8} fill={colors.axisText} textAnchor="end">岁</SvgText>
          </Svg>

          {/* 图例 */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: colors.overtime}]} />
              <Text size="xs" color={isDark ? '$trueGray400' : '$trueGray500'}>加班</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: colors.ontime}]} />
              <Text size="xs" color={isDark ? '$trueGray400' : '$trueGray500'}>准时下班</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );

  if (blurData) {
    return (
      <DataBlurOverlay visible={true} isDark={isDark}>
        {chartContent}
      </DataBlurOverlay>
    );
  }
  return chartContent;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

import React, {useMemo, useState, useCallback} from 'react';
import {View, StyleSheet, LayoutChangeEvent} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {DimensionItem} from '../types';
import {AGE_SINGLE_ORDER, AGE_LABEL_TICKS} from '../utils/dimensionStatsUtils';

/** 格式化人数 */
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

// 固定布局常量（顶部留白与其他维度图表对齐）
const PADDING_TOP = 16;
const PADDING_BOTTOM = 32;
const CENTER_LABEL_WIDTH = 32;
const SIDE_PADDING = 10;

const COLORS = {
  light: {
    overtime: '#F4664A',
    ontime: '#30BF78',
    axisLine: '#E0E0E0',
    axisText: '#999999',
    gridLine: '#F0F0F0',
    labelText: '#666666',
  },
  dark: {
    overtime: '#FF5000',
    ontime: '#00C805',
    axisLine: '#333333',
    axisText: '#666666',
    gridLine: '#1A1A1A',
    labelText: '#888888',
  },
};

/** 生成平滑贝塞尔曲线路径（水平方向），X 坐标 clamp 防止过冲 */
const smoothPathHorizontal = (
  points: {x: number; y: number}[],
  minX: number,
  maxX: number,
): string => {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;
  }
  const clampX = (v: number) => Math.min(Math.max(v, minX), maxX);
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const tension = 6;
    const cp1x = clampX(p1.x + (p2.x - p0.x) / tension);
    const cp1y = p1.y + (p2.y - p0.y) / tension;
    const cp2x = clampX(p2.x - (p3.x - p1.x) / tension);
    const cp2y = p2.y - (p3.y - p1.y) / tension;
    d += `C${cp1x},${cp1y},${cp2x},${cp2y},${p2.x},${p2.y}`;
  }
  return d;
};

export const PopulationPyramid: React.FC<PopulationPyramidProps> = ({
  data,
  theme,
}) => {
  const isDark = theme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [chartWidth, setChartWidth] = useState(0);
  const [chartHeight, setChartHeight] = useState(0);
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const {width, height} = event.nativeEvent.layout;
      if (width > 0 && width !== chartWidth) setChartWidth(width);
      if (height > 0 && height !== chartHeight) setChartHeight(height);
    },
    [chartWidth, chartHeight],
  );

  // 按 AGE_SINGLE_ORDER 构建完整的逐岁数据
  const sortedData = useMemo(() => {
    const dataMap = new Map(data.map(item => [item.name, item]));
    return AGE_SINGLE_ORDER.map(name => {
      const existing = dataMap.get(name);
      if (existing) return existing;
      return {
        id: name, name, overtimeCount: 0, onTimeCount: 0, totalCount: 0, overtimeRatio: 0,
      } as DimensionItem;
    });
  }, [data]);

  const rowCount = sortedData.length;

  // 根据容器高度动态计算每行间距（图例约占 24px）
  const svgHeight = chartHeight > 0 ? chartHeight - 24 : 0;
  const barAreaHeight = svgHeight - PADDING_TOP - PADDING_BOTTOM;
  // 每行占用的总高度（含间距）
  const rowStep = rowCount > 1 ? barAreaHeight / (rowCount - 1) : barAreaHeight;

  // 左右两侧最大人数
  const maxCount = useMemo(() => {
    if (sortedData.length === 0) return 1;
    const innerRows = sortedData.filter(item => item.name !== '≤16' && item.name !== '≥64');
    const innerMax = Math.max(
      ...innerRows.map(item => Math.max(item.overtimeCount, item.onTimeCount)),
      0,
    );
    if (innerMax > 0) return innerMax;
    return Math.max(
      ...sortedData.map(item => Math.max(item.overtimeCount, item.onTimeCount)),
      1,
    );
  }, [sortedData]);

  // 左右绘图区域宽度
  const sideWidth = chartWidth > 0
    ? (chartWidth - CENTER_LABEL_WIDTH - SIDE_PADDING * 2) / 2
    : 0;
  const leftAreaX = SIDE_PADDING;
  const centerX = SIDE_PADDING + sideWidth;
  const rightAreaX = centerX + CENTER_LABEL_WIDTH;

  // X轴刻度（4档），强制整数避免浮点精度乱码
  const xTicks = useMemo(() => {
    if (maxCount <= 4) {
      const ticks: number[] = [];
      for (let v = 0; v <= maxCount; v += 1) ticks.push(v);
      return ticks;
    }
    const rawStep = maxCount / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.max(1, Math.ceil(rawStep / magnitude) * magnitude);
    const intStep = Math.round(step);
    const ticks: number[] = [];
    for (let v = 0; v <= maxCount; v += intStep) ticks.push(v);
    if (ticks[ticks.length - 1] < maxCount) ticks.push(ticks[ticks.length - 1] + intStep);
    return ticks;
  }, [maxCount]);

  const xMax = xTicks[xTicks.length - 1] || maxCount;

  // 每行的 Y 坐标（动态计算）
  const rowY = useCallback(
    (index: number) => PADDING_TOP + index * rowStep,
    [rowStep],
  );

  const totalBarArea = rowCount > 1 ? (rowCount - 1) * rowStep : 0;

  // 趋势线数据点
  const overtimePts = useMemo(() => sortedData.map((item, i) => ({
    x: rightAreaX + Math.min((item.overtimeCount / xMax) * sideWidth, sideWidth),
    y: rowY(i),
    value: item.overtimeCount,
  })), [sortedData, xMax, sideWidth, rightAreaX, rowY]);

  const ontimePts = useMemo(() => sortedData.map((item, i) => ({
    x: centerX - Math.min((item.onTimeCount / xMax) * sideWidth, sideWidth),
    y: rowY(i),
    value: item.onTimeCount,
  })), [sortedData, xMax, sideWidth, centerX, rowY]);

  // 趋势曲线路径
  const overtimeLine = smoothPathHorizontal(overtimePts, rightAreaX, rightAreaX + sideWidth);
  const ontimeLine = smoothPathHorizontal(ontimePts, leftAreaX, centerX);

  // 面积填充路径
  const overtimeArea = overtimePts.length > 0
    ? `${overtimeLine}L${rightAreaX},${overtimePts[overtimePts.length - 1].y}L${rightAreaX},${overtimePts[0].y}Z`
    : '';
  const ontimeArea = ontimePts.length > 0
    ? `${ontimeLine}L${centerX},${ontimePts[ontimePts.length - 1].y}L${centerX},${ontimePts[0].y}Z`
    : '';

  // 空数据
  if (sortedData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text size="sm" color={isDark ? '$trueGray500' : '$trueGray400'}>该时段暂无年龄数据</Text>
      </View>
    );
  }

  // 根据行间距动态选择字号，年龄标签和刻度数字保持协调
  const labelFontSize = Math.min(Math.max(rowStep * 0.7, 8), 11);
  const axisFontSize = 8;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {chartWidth > 0 && svgHeight > 0 && (
        <>
          <Svg width={chartWidth} height={svgHeight}>
            <Defs>
              <LinearGradient id="overtimeGradH" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.overtime} stopOpacity={0.05} />
                <Stop offset="1" stopColor={colors.overtime} stopOpacity={0.3} />
              </LinearGradient>
              <LinearGradient id="ontimeGradH" x1="1" y1="0" x2="0" y2="0">
                <Stop offset="0" stopColor={colors.ontime} stopOpacity={0.05} />
                <Stop offset="1" stopColor={colors.ontime} stopOpacity={0.3} />
              </LinearGradient>
            </Defs>

            {/* 左侧虚线参考线 */}
            {xTicks.filter(t => t > 0).map(tick => {
              const xPos = centerX - (tick / xMax) * sideWidth;
              return (
                <Line
                  key={`lg-${tick}`}
                  x1={xPos} y1={PADDING_TOP - 4}
                  x2={xPos} y2={PADDING_TOP + totalBarArea + 4}
                  stroke={colors.gridLine}
                  strokeWidth={0.5}
                  strokeDasharray="3,3"
                />
              );
            })}

            {/* 右侧虚线参考线 */}
            {xTicks.filter(t => t > 0).map(tick => {
              const xPos = rightAreaX + (tick / xMax) * sideWidth;
              return (
                <Line
                  key={`rg-${tick}`}
                  x1={xPos} y1={PADDING_TOP - 4}
                  x2={xPos} y2={PADDING_TOP + totalBarArea + 4}
                  stroke={colors.gridLine}
                  strokeWidth={0.5}
                  strokeDasharray="3,3"
                />
              );
            })}

            {/* 中轴线 */}
            <Line
              x1={centerX} y1={PADDING_TOP - 4}
              x2={centerX} y2={PADDING_TOP + totalBarArea + 4}
              stroke={colors.axisLine} strokeWidth={0.5}
            />
            <Line
              x1={centerX + CENTER_LABEL_WIDTH} y1={PADDING_TOP - 4}
              x2={centerX + CENTER_LABEL_WIDTH} y2={PADDING_TOP + totalBarArea + 4}
              stroke={colors.axisLine} strokeWidth={0.5}
            />

            {/* 面积填充 */}
            {ontimeArea ? <Path d={ontimeArea} fill="url(#ontimeGradH)" /> : null}
            {overtimeArea ? <Path d={overtimeArea} fill="url(#overtimeGradH)" /> : null}

            {/* 趋势曲线 */}
            {ontimeLine ? <Path d={ontimeLine} stroke={colors.ontime} strokeWidth={1.5} fill="none" /> : null}
            {overtimeLine ? <Path d={overtimeLine} stroke={colors.overtime} strokeWidth={1.5} fill="none" /> : null}

            {/* 中间年龄标签 */}
            {sortedData.map((item, i) => {
              if (!AGE_LABEL_TICKS.includes(item.name)) return null;
              return (
                <SvgText
                  key={`label-${i}`}
                  x={centerX + CENTER_LABEL_WIDTH / 2}
                  y={rowY(i) + labelFontSize * 0.35}
                  fontSize={labelFontSize}
                  fill={colors.labelText}
                  textAnchor="middle"
                >
                  {item.name}
                </SvgText>
              );
            })}

            {/* 底部 X 轴刻度（左侧） */}
            {xTicks.map(tick => {
              const xPos = centerX - (tick / xMax) * sideWidth;
              return (
                <SvgText
                  key={`lx-${tick}`}
                  x={xPos}
                  y={PADDING_TOP + totalBarArea + 16}
                  fontSize={axisFontSize}
                  fill={colors.axisText}
                  textAnchor="middle"
                >
                  {formatCount(tick)}
                </SvgText>
              );
            })}

            {/* 底部 X 轴刻度（右侧） */}
            {xTicks.map(tick => {
              const xPos = rightAreaX + (tick / xMax) * sideWidth;
              return (
                <SvgText
                  key={`rx-${tick}`}
                  x={xPos}
                  y={PADDING_TOP + totalBarArea + 16}
                  fontSize={axisFontSize}
                  fill={colors.axisText}
                  textAnchor="middle"
                >
                  {formatCount(tick)}
                </SvgText>
              );
            })}

            {/* 底部单位标签 */}
            <SvgText
              x={leftAreaX + sideWidth / 2}
              y={PADDING_TOP + totalBarArea + 28}
              fontSize={axisFontSize}
              fill={colors.axisText}
              textAnchor="middle"
            >
              人数
            </SvgText>
            <SvgText
              x={rightAreaX + sideWidth / 2}
              y={PADDING_TOP + totalBarArea + 28}
              fontSize={axisFontSize}
              fill={colors.axisText}
              textAnchor="middle"
            >
              人数
            </SvgText>
          </Svg>

          {/* 图例已移至 DataVisualization 统一渲染 */}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  legendRow: {},
  legendItem: {},
  legendDot: {},
});

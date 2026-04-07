import React, {useMemo, useState, useCallback} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import Svg, {Circle, Line, G, Path, Text as SvgText, TSpan} from 'react-native-svg';
import {DimensionItem} from '../types';
import {getTheme} from '../theme';
import {processTop10WithOthers} from '../utils/dimensionStatsUtils';
import {DataBlurOverlay} from './DataBlurOverlay';

/**
 * RadialJitterChart - 径向散点饼图
 * 参考 AntV G2 point-jitter-radial 样式
 * 均匀分 11 个扇形区域（前10行业 + 其他），每个区域内用小圆圈表示人数
 * 加班=浅红色圈，准时下班=浅绿色圈，同色聚在一起
 */

interface RadialJitterChartProps {
  data: DimensionItem[];
  theme: 'light' | 'dark';
  blurData?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_SIZE = SCREEN_WIDTH - 32;
// 标签区域需要额外空间（行业名按 / 分段横排）
const LABEL_PADDING = 40;
// SVG 内部坐标系尺寸（含标签空间）
const SVG_SIZE = CHART_SIZE + LABEL_PADDING * 2;
const CENTER = SVG_SIZE / 2;
// 保持图形区域大小不变：用原始 CHART_SIZE 计算半径
const OUTER_RADIUS = CHART_SIZE / 2 - 18;

// SVG 渲染尺寸：限制在屏幕宽度内，通过 viewBox 等比缩放
// 这样所有内容（图形+标签）都不会超出屏幕
const SVG_RENDER_WIDTH = Math.min(SVG_SIZE, SCREEN_WIDTH);
const SVG_RENDER_HEIGHT = SVG_RENDER_WIDTH; // 保持正方形
// 缩放比例，用于调整负 margin
const SVG_SCALE = SVG_RENDER_WIDTH / SVG_SIZE;
// viewBox 裁剪：居中显示，只裁掉多余的空白边距
const VB_OFFSET = (SVG_SIZE - SVG_SIZE * (SVG_RENDER_WIDTH / SVG_RENDER_WIDTH)) / 2;
const VIEW_BOX = `0 0 ${SVG_SIZE} ${SVG_SIZE}`;

// 估算文字宽度（SVG 中无法直接测量，用字符数 × 字号 × 系数估算）
const FONT_SIZE_LABEL = 9;
const CHAR_WIDTH_RATIO = 0.65; // 中文字符宽度约为字号的 0.65 倍
function estimateTextWidth(text: string): number {
  // 中文字符按全宽算，ASCII 按半宽算
  let width = 0;
  for (const ch of text) {
    width += ch.charCodeAt(0) > 127 ? FONT_SIZE_LABEL : FONT_SIZE_LABEL * 0.55;
  }
  return width * CHAR_WIDTH_RATIO;
}

// SVG 坐标系中的标签安全边界（viewBox 会自动缩放到屏幕内）
const SVG_LEFT_BOUND = 4;
const SVG_RIGHT_BOUND = SVG_SIZE - 4;
const INNER_RADIUS = 30;
const COLORS = {
  light: {
    overtime: '#FF8A80',
    ontime: '#69F0AE',
    divider: '#E0E0E0',
    labelText: '#8C8C8C',
    sectorBg: 'rgba(0,0,0,0.02)',
  },
  dark: {
    overtime: '#FF5000',
    ontime: '#00C805',
    divider: '#404040',
    labelText: '#8C8C8C',
    sectorBg: 'rgba(255,255,255,0.03)',
  },
};

// 每个人用一个小圆圈表示，但人数太多时需要缩放
// 人数最多的扇区显示的最大圆圈数，其他扇区按比例缩小
const MAX_DOTS_FOR_LARGEST = 50;
const DOT_RADIUS = 3;

/**
 * 格式化人数显示：超过1000用K表示，后面加"人"
 * 例如：512 → "512人"，5114 → "5.1K人"
 */
function formatCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K人`;
  }
  return `${count}人`;
}

/**
 * 在扇形区域内生成圆圈位置
 * 同色聚在一起：加班圈靠外侧，准时圈靠内侧
 * displayTotal 由外部按全局比例计算后传入，保证扇区间人数差异可见
 */
function generateDotsInSector(
  overtimeCount: number,
  onTimeCount: number,
  sectorStartAngle: number,
  sectorEndAngle: number,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  displayTotal: number,
): Array<{x: number; y: number; isOvertime: boolean}> {
  const total = overtimeCount + onTimeCount;
  if (total === 0 || displayTotal === 0) return [];

  // 按加班/准时比例分配显示圆圈数
  let displayOvertime = Math.round(displayTotal * (overtimeCount / total));
  let displayOntime = displayTotal - displayOvertime;

  const dots: Array<{x: number; y: number; isOvertime: boolean}> = [];
  const midAngle = (sectorStartAngle + sectorEndAngle) / 2;
  const angleSpan = sectorEndAngle - sectorStartAngle;
  // 留一点边距
  const usableAngleSpan = angleSpan * 0.7;
  const radiusSpan = outerR - innerR;

  // 使用确定性种子的伪随机
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  let dotIndex = 0;

  // 加班圈靠外侧
  for (let i = 0; i < displayOvertime; i++) {
    const r1 = seededRandom(dotIndex * 7 + 1);
    const r2 = seededRandom(dotIndex * 13 + 3);
    // 外侧 60%~100% 的半径范围
    const r = innerR + radiusSpan * (0.55 + r1 * 0.4);
    const angle = midAngle + (r2 - 0.5) * usableAngleSpan;
    dots.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      isOvertime: true,
    });
    dotIndex++;
  }

  // 准时圈靠内侧
  for (let i = 0; i < displayOntime; i++) {
    const r1 = seededRandom(dotIndex * 7 + 1);
    const r2 = seededRandom(dotIndex * 13 + 3);
    // 内侧 10%~55% 的半径范围
    const r = innerR + radiusSpan * (0.1 + r1 * 0.45);
    const angle = midAngle + (r2 - 0.5) * usableAngleSpan;
    dots.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      isOvertime: false,
    });
    dotIndex++;
  }

  return dots;
}

export const RadialJitterChart: React.FC<RadialJitterChartProps> = ({
  data,
  theme,
  blurData = false,
}) => {
  const isDark = theme === 'dark';
  const tc = getTheme(theme).colors;
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const processedData = useMemo(() => processTop10WithOthers(data), [data]);

  // 确保恰好 11 个区域
  const SECTOR_COUNT = 11;
  const sectorAngle = (Math.PI * 2) / SECTOR_COUNT;

  const handleSectorPress = useCallback((index: number) => {
    setSelectedIndex(prev => (prev === index ? null : index));
  }, []);

  // 生成扇形 Path（用于透明点击热区）
  const getSectorPath = useCallback(
    (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
      const x1 = CENTER + outerR * Math.cos(startAngle);
      const y1 = CENTER + outerR * Math.sin(startAngle);
      const x2 = CENTER + outerR * Math.cos(endAngle);
      const y2 = CENTER + outerR * Math.sin(endAngle);
      const x3 = CENTER + innerR * Math.cos(endAngle);
      const y3 = CENTER + innerR * Math.sin(endAngle);
      const x4 = CENTER + innerR * Math.cos(startAngle);
      const y4 = CENTER + innerR * Math.sin(startAngle);
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    },
    [],
  );

  // 计算所有扇区的圆圈（按全局比例分配圆圈数，保留人数差异）
  const sectors = useMemo(() => {
    const items = processedData.slice(0, SECTOR_COUNT);
    // 找到人数最多的扇区，作为缩放基准
    const maxTotal = Math.max(...items.map(item => item.totalCount), 1);
    const scale = MAX_DOTS_FOR_LARGEST / maxTotal;

    return items.map((item, index) => {
      const startAngle = -Math.PI / 2 + index * sectorAngle;
      const endAngle = startAngle + sectorAngle;
      // 按比例计算该扇区应显示的圆圈总数（最少 1 个，有数据时）
      const displayTotal = item.totalCount > 0
        ? Math.max(1, Math.round(item.totalCount * scale))
        : 0;
      const dots = generateDotsInSector(
        item.overtimeCount,
        item.onTimeCount,
        startAngle,
        endAngle,
        CENTER,
        CENTER,
        INNER_RADIUS,
        OUTER_RADIUS - 16,
        displayTotal,
      );
      return {item, index, startAngle, endAngle, dots};
    });
  }, [processedData, sectorAngle]);

  // 空数据
  if (processedData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text size="sm" color={isDark ? '$trueGray500' : '$trueGray400'}>
          该时段暂无行业数据
        </Text>
      </View>
    );
  }

  const chartContent = (
    <View style={styles.container}>
      <Svg
        width={SVG_RENDER_WIDTH}
        height={SVG_RENDER_HEIGHT}
        viewBox={VIEW_BOX}>
        {/* 分隔线 */}
        {sectors.map((sector, i) => {
          const x1 = CENTER + INNER_RADIUS * Math.cos(sector.startAngle);
          const y1 = CENTER + INNER_RADIUS * Math.sin(sector.startAngle);
          const x2 =
            CENTER + (OUTER_RADIUS - 16) * Math.cos(sector.startAngle);
          const y2 =
            CENTER + (OUTER_RADIUS - 16) * Math.sin(sector.startAngle);
          return (
            <Line
              key={`div-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={colors.divider}
              strokeWidth={0.5}
              strokeDasharray="2,2"
            />
          );
        })}

        {/* 圆圈（纯展示，不处理点击） */}
        {sectors.map(sector =>
          sector.dots.map((dot, di) => (
            <Circle
              key={`dot-${sector.index}-${di}`}
              cx={dot.x}
              cy={dot.y}
              r={DOT_RADIUS}
              fill="none"
              stroke={dot.isOvertime ? colors.overtime : colors.ontime}
              strokeWidth={0.8}
              opacity={
                selectedIndex === null || selectedIndex === sector.index
                  ? 0.85
                  : 0.2
              }
            />
          )),
        )}

        {/* 透明扇形点击热区（覆盖整个扇区，方便点击） */}
        {sectors.map(sector => (
          <Path
            key={`hit-${sector.index}`}
            d={getSectorPath(
              sector.startAngle,
              sector.endAngle,
              INNER_RADIUS,
              OUTER_RADIUS,
            )}
            fill="transparent"
            onPress={() => handleSectorPress(sector.index)}
          />
        ))}

        {/* 行业标签 - 外圈自适应布局，以 / 为换行点多行横排，自动防止超出屏幕 */}
        {sectors.map((sector, i) => {
          const midAngle = (sector.startAngle + sector.endAngle) / 2;
          const cosA = Math.cos(midAngle);
          const sinA = Math.sin(midAngle);
          const fillColor =
            selectedIndex === null
              ? tc.text
              : selectedIndex === i
                ? tc.text
                : colors.labelText;
          const weight = selectedIndex === i ? '600' : '400';
          const name = sector.item.name;

          // 以 / 分割成多行
          const lines = name.split('/');
          const lineH = 11;
          const totalH = lines.length * lineH;

          // 左侧右对齐，右侧左对齐，顶部/底部居中
          const isLeft = cosA < -0.2;
          const isRight = cosA > 0.2;
          const anchor = isLeft ? 'end' : isRight ? 'start' : 'middle';

          // 标签半径：左右侧稍微靠近，避免超出
          const labelRadius = Math.abs(cosA) > 0.5
            ? OUTER_RADIUS - 4
            : OUTER_RADIUS + 8;

          let lx = CENTER + labelRadius * cosA;
          const ly = CENTER + labelRadius * sinA;

          // 自适应边界约束：根据最长行的估算宽度，防止超出 SVG 边界
          const maxLineWidth = Math.max(...lines.map(estimateTextWidth));
          if (anchor === 'end') {
            // 右对齐：文字向左延伸，确保左边不超出
            lx = Math.max(lx, SVG_LEFT_BOUND + maxLineWidth);
          } else if (anchor === 'start') {
            // 左对齐：文字向右延伸，确保右边不超出
            lx = Math.min(lx, SVG_RIGHT_BOUND - maxLineWidth);
          } else {
            // 居中：两侧都约束
            lx = Math.max(lx, SVG_LEFT_BOUND + maxLineWidth / 2);
            lx = Math.min(lx, SVG_RIGHT_BOUND - maxLineWidth / 2);
          }

          // 垂直居中
          const startY = ly - totalH / 2 + lineH / 2;

          return (
            <SvgText
              key={`label-${i}`}
              x={lx}
              y={startY}
              fontSize={FONT_SIZE_LABEL}
              fill={fillColor}
              fontWeight={weight}
              textAnchor={anchor}
              alignmentBaseline="middle">
              {lines.map((line, li) => (
                <TSpan key={li} x={lx} dy={li === 0 ? 0 : lineH}>
                  {line}
                </TSpan>
              ))}
            </SvgText>
          );
        })}

        {/* 中心文字 */}
        {selectedIndex !== null && processedData[selectedIndex] && (
          <G>
            <SvgText
              x={CENTER}
              y={CENTER - 8}
              fontSize={9}
              fill={colors.labelText}
              textAnchor="middle"
              alignmentBaseline="middle">
              {processedData[selectedIndex].name}
            </SvgText>
            <SvgText
              x={CENTER}
              y={CENTER + 8}
              fontSize={14}
              fill={tc.text}
              fontWeight="700"
              textAnchor="middle"
              alignmentBaseline="middle">
              {formatCount(processedData[selectedIndex].totalCount)}
            </SvgText>
          </G>
        )}
      </Svg>

      {/* 图例已移至 DataVisualization 统一渲染 */}
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
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    // 用缩放后的 LABEL_PADDING 计算负 margin，减少空白
    marginTop: -(LABEL_PADDING * SVG_SCALE) + 8,
    marginBottom: -(LABEL_PADDING * SVG_SCALE) + 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  legendRow: {},
  legendItem: {},
  legendDot: {},
});

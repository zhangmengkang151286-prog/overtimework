/**
 * 树状图组件
 * 使用 react-native-svg 绘制矩形，集成 squarified treemap 布局算法、颜色分配和文字自适应
 * "其他"色块点击弹出详情框
 * 需求: 1.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 8.4
 */

import React, {useMemo, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Svg, {Rect, Text as SvgText, G, ClipPath, Defs} from 'react-native-svg';
import {TagProportionItem} from '../types/tag-proportion';
import {computeTreemapLayout, computeTextLayout, splitTagName} from '../utils/treemapLayout';
import {assignTreemapColors} from '../utils/treemapColors';
import {Theme} from '../theme';
import {typography} from '../theme/typography';

interface TreemapChartProps {
  data: TagProportionItem[];
  width: number;
  height: number;
  theme: Theme;
}

// 矩形之间的间距（像素）
const GAP = 1.5;

/**
 * "其他"标签详情弹窗
 */
const OtherDetailsModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  item: TagProportionItem | null;
  theme: Theme;
}> = ({visible, onClose, item, theme}) => {
  const isDark = theme.isDark;
  const modalBg = isDark ? '#000000' : '#FFFFFF';
  const textColor = isDark ? '#E8EAED' : '#1A1A1A';
  const subTextColor = isDark ? '#9AA0A6' : '#6B7280';
  const dividerColor = isDark ? '#2C2C2E' : '#F0F0F0';
  const isOvertime = item?.isOvertime ?? true;
  const headerColor = isOvertime
    ? (isDark ? '#FF5000' : '#CC4000')
    : (isDark ? '#00C805' : '#009A04');

  if (!item?.otherDetails) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={modalStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[modalStyles.content, {backgroundColor: modalBg}]}>
          {/* 标题 */}
          <Text style={[modalStyles.title, {color: headerColor}]}>
            {isOvertime ? '其他加班标签' : '其他准时标签'}
          </Text>

          {/* 表头 */}
          <View style={[modalStyles.headerRow, {borderBottomColor: dividerColor}]}>
            <Text style={[modalStyles.headerCell, modalStyles.nameCol, {color: subTextColor}]}>
              标签
            </Text>
            <Text style={[modalStyles.headerCell, modalStyles.countCol, {color: subTextColor}]}>
              次数
            </Text>
            <Text style={[modalStyles.headerCell, modalStyles.percentCol, {color: subTextColor}]}>
              占比
            </Text>
          </View>

          {/* 详情列表 */}
          <ScrollView style={modalStyles.list} bounces={false}>
            {item.otherDetails.map((detail, index) => (
              <View
                key={`${detail.tagName}-${index}`}
                style={[
                  modalStyles.row,
                  index < item.otherDetails!.length - 1 && {borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth},
                ]}
              >
                <Text style={[modalStyles.cell, modalStyles.nameCol, {color: textColor}]} numberOfLines={1}>
                  {detail.tagName}
                </Text>
                <Text style={[modalStyles.cell, modalStyles.countCol, {color: textColor}]}>
                  {detail.count}
                </Text>
                <Text style={[modalStyles.cell, modalStyles.percentCol, {color: subTextColor}]}>
                  {detail.percentage}%
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* 关闭按钮 */}
          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
            <Text style={[modalStyles.closeText, {color: subTextColor}]}>关闭</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: 300,
    maxHeight: 400,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  headerCell: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  nameCol: {
    flex: 1,
  },
  countCol: {
    width: 50,
    textAlign: 'right',
  },
  percentCol: {
    width: 50,
    textAlign: 'right',
  },
  list: {
    maxHeight: 260,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  cell: {
    fontSize: typography.fontSize.base,
  },
  closeButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
});

/**
 * TreemapChart 树状图组件
 * 需求: 1.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 8.4
 */
export const TreemapChart: React.FC<TreemapChartProps> = ({
  data,
  width,
  height,
  theme,
}) => {
  const isDark = theme.isDark;
  const [selectedOther, setSelectedOther] = useState<TagProportionItem | null>(null);

  // 处理"其他"色块点击
  const handleOtherPress = useCallback((item: TagProportionItem) => {
    if (item.otherDetails && item.otherDetails.length > 0) {
      setSelectedOther(item);
    }
  }, []);

  // 计算布局、颜色和文字
  const rects = useMemo(() => {
    if (data.length === 0 || width <= 0 || height <= 0) return [];

    // 1. 计算 treemap 布局
    const layoutRects = computeTreemapLayout(data, width, height);
    if (layoutRects.length === 0) return [];

    // 2. 分配颜色
    const layoutItems = layoutRects.map((r) => r.item);
    const colors = assignTreemapColors(layoutItems, isDark);

    // 3. 组合布局、颜色和文字
    return layoutRects.map((rect, i) => {
      // 应用间距
      const halfGap = GAP / 2;
      const x = rect.x + halfGap;
      const y = rect.y + halfGap;
      const w = Math.max(0, rect.width - GAP);
      const h = Math.max(0, rect.height - GAP);

      const textLayout = computeTextLayout({width: w, height: h}, rect.item.tagName);
      const isOther = rect.item.tagId?.startsWith('__other_') ?? false;

      return {
        x, y,
        width: w,
        height: h,
        color: colors[i] || 'gray',
        item: rect.item,
        textLayout,
        isOther,
      };
    });
  }, [data, width, height, isDark]);

  if (rects.length === 0) return null;

  // 矩形内文字颜色
  const textColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.95)';

  return (
    <View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {rects.map((rect, index) => (
            <ClipPath id={`clip-${index}`} key={`clip-def-${index}`}>
              <Rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={2}
                ry={2}
              />
            </ClipPath>
          ))}
        </Defs>
        {rects.map((rect, index) => {
          const {textLayout} = rect;
          const fs = textLayout.fontSize;
          const cx = rect.x + rect.width / 2;
          const cy = rect.y + rect.height / 2;

          // 将标签名拆成多行
          const nameLines = splitTagName(rect.item.tagName, rect.width - 6, fs);
          const lineCount = nameLines.length;

          // 计算垂直布局：标签名多行 + 次数一行，整体居中
          const countFs = fs * 0.95;
          const lineGap = fs * 0.2;
          // 标签名总高度 = lineCount * fs + (lineCount - 1) * lineGap
          const nameTotalH = lineCount * fs + (lineCount - 1) * lineGap;
          const totalH = nameTotalH + lineGap + countFs;
          const nameStartY = cy - totalH / 2 + fs / 2;

          // 左上角百分比
          const badgeFs = Math.max(7, fs * 0.7);
          const padX = 3;
          const padY = badgeFs * 0.7;

          return (
            <G key={`treemap-${rect.item.tagId}-${index}`} clipPath={`url(#clip-${index})`}>
              {/* 矩形背景 */}
              <Rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill={rect.color}
                rx={2}
                ry={2}
              />

              {/* 左上角百分比 */}
              <SvgText
                x={rect.x + padX}
                y={rect.y + padY}
                fontSize={badgeFs}
                fill={textColor}
                textAnchor="start"
                alignmentBaseline="central"
                opacity={0.75}
              >
                {rect.item.percentage}%
              </SvgText>

              {/* 标签名（居中，支持多行） */}
              {nameLines.map((line, lineIdx) => (
                <SvgText
                  key={`name-${lineIdx}`}
                  x={cx}
                  y={nameStartY + lineIdx * (fs + lineGap)}
                  fontSize={fs}
                  fill={textColor}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fontWeight="600"
                >
                  {line}
                </SvgText>
              ))}

              {/* 次数（居中，在标签名下方） */}
              <SvgText
                x={cx}
                y={nameStartY + nameTotalH + lineGap}
                fontSize={countFs}
                fill={textColor}
                textAnchor="middle"
                alignmentBaseline="central"
                opacity={0.9}
              >
                {rect.item.count}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* "其他"色块的透明点击区域覆盖层 */}
      {rects
        .filter((r) => r.isOther && r.item.otherDetails && r.item.otherDetails.length > 0)
        .map((rect, index) => (
          <TouchableOpacity
            key={`other-touch-${index}`}
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
            }}
            activeOpacity={0.7}
            onPress={() => handleOtherPress(rect.item)}
            accessibilityLabel={`查看${rect.item.isOvertime ? '加班' : '准时'}其他标签详情`}
          />
        ))}

      {/* "其他"详情弹窗 */}
      <OtherDetailsModal
        visible={selectedOther !== null}
        onClose={() => setSelectedOther(null)}
        item={selectedOther}
        theme={theme}
      />
    </View>
  );
};

export default TreemapChart;

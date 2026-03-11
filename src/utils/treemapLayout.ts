/**
 * Squarified Treemap 布局算法
 * 目标：使矩形的长宽比尽可能接近 1:1
 * squarified 算法天然优化长宽比，通常不会超过 2:1
 */

import {TagProportionItem, TreemapRect, TextLayout} from '../types/tag-proportion';

// 内部布局矩形（不含颜色，布局阶段使用）
interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
  item: TagProportionItem;
}

// 矩形长宽比硬上限
const MAX_ASPECT_RATIO = 2;

/**
 * 计算一行中矩形的最差长宽比
 * 长宽比 = max(w/h, h/w)，越接近 1 越好
 * 超过 MAX_ASPECT_RATIO 时施加惩罚，促使算法更积极换行
 */
function worstAspectRatio(
  areas: number[],
  sideLength: number,
): number {
  if (areas.length === 0 || sideLength <= 0) return Infinity;

  const totalArea = areas.reduce((s, a) => s + a, 0);
  const rowOtherSide = totalArea / sideLength;

  let worst = 0;
  for (const area of areas) {
    if (area <= 0) continue;
    const rectSide = area / rowOtherSide;
    const ratio = Math.max(rectSide / rowOtherSide, rowOtherSide / rectSide);
    // 超过上限时施加惩罚，让算法优先避免超比例矩形
    const penalized =
      ratio > MAX_ASPECT_RATIO
        ? MAX_ASPECT_RATIO + (ratio - MAX_ASPECT_RATIO) * 3
        : ratio;
    worst = Math.max(worst, penalized);
  }
  return worst;
}

/**
 * 在指定区域内沿短边方向布局一行矩形
 */
function layoutRow(
  items: TagProportionItem[],
  areas: number[],
  rect: {x: number; y: number; width: number; height: number},
): {rects: LayoutRect[]; remaining: {x: number; y: number; width: number; height: number}} {
  const totalArea = areas.reduce((s, a) => s + a, 0);
  const isHorizontal = rect.width >= rect.height;

  const results: LayoutRect[] = [];

  if (isHorizontal) {
    // 沿左侧竖直排列，行宽 = totalArea / height
    const rowWidth = rect.height > 0 ? totalArea / rect.height : 0;
    let currentY = rect.y;
    for (let i = 0; i < items.length; i++) {
      const rectHeight = rowWidth > 0 ? areas[i] / rowWidth : 0;
      results.push({
        x: rect.x,
        y: currentY,
        width: rowWidth,
        height: rectHeight,
        item: items[i],
      });
      currentY += rectHeight;
    }
    return {
      rects: results,
      remaining: {
        x: rect.x + rowWidth,
        y: rect.y,
        width: rect.width - rowWidth,
        height: rect.height,
      },
    };
  } else {
    // 沿顶部水平排列，行高 = totalArea / width
    const rowHeight = rect.width > 0 ? totalArea / rect.width : 0;
    let currentX = rect.x;
    for (let i = 0; i < items.length; i++) {
      const rectWidth = rowHeight > 0 ? areas[i] / rowHeight : 0;
      results.push({
        x: currentX,
        y: rect.y,
        width: rectWidth,
        height: rowHeight,
        item: items[i],
      });
      currentX += rectWidth;
    }
    return {
      rects: results,
      remaining: {
        x: rect.x,
        y: rect.y + rowHeight,
        width: rect.width,
        height: rect.height - rowHeight,
      },
    };
  }
}

/**
 * Squarified treemap 布局算法
 *
 * @param items 标签占比数据（会按 percentage 降序排列）
 * @param containerWidth 容器宽度（正数）
 * @param containerHeight 容器高度（正数）
 * @returns 每个标签对应的矩形布局（不含颜色，color 为空字符串）
 */
export function computeTreemapLayout(
  items: TagProportionItem[],
  containerWidth: number,
  containerHeight: number,
): TreemapRect[] {
  if (items.length === 0 || containerWidth <= 0 || containerHeight <= 0) {
    return [];
  }

  // 按类别分组（加班在前，准时在后），同类别内按 percentage 降序
  const sorted = [...items].sort((a, b) => {
    // 先按 isOvertime 分组：加班在前
    if (a.isOvertime !== b.isOvertime) {
      return a.isOvertime ? -1 : 1;
    }
    // 同类别内按 percentage 降序
    return b.percentage - a.percentage;
  });

  // 过滤掉 percentage <= 0 的项
  const validItems = sorted.filter((item) => item.percentage > 0);
  if (validItems.length === 0) {
    return [];
  }

  const totalArea = containerWidth * containerHeight;
  const totalPercentage = validItems.reduce((s, item) => s + item.percentage, 0);

  // 计算每个项目的面积
  const areas = validItems.map(
    (item) => (item.percentage / totalPercentage) * totalArea,
  );

  // 使用 squarify 算法
  const allRects: LayoutRect[] = [];
  let currentRect = {x: 0, y: 0, width: containerWidth, height: containerHeight};
  let currentRow: {item: TagProportionItem; area: number}[] = [];

  for (let i = 0; i < validItems.length; i++) {
    const candidate = {item: validItems[i], area: areas[i]};
    const shortSide = Math.min(currentRect.width, currentRect.height);

    if (currentRow.length === 0) {
      currentRow.push(candidate);
      continue;
    }

    const currentAreas = currentRow.map((r) => r.area);
    const withCandidate = [...currentAreas, candidate.area];

    const currentWorst = worstAspectRatio(currentAreas, shortSide);
    const newWorst = worstAspectRatio(withCandidate, shortSide);

    if (newWorst <= currentWorst) {
      // 添加到当前行不会使长宽比变差
      currentRow.push(candidate);
    } else {
      // 固定当前行，开始新行
      const {rects, remaining} = layoutRow(
        currentRow.map((r) => r.item),
        currentRow.map((r) => r.area),
        currentRect,
      );
      allRects.push(...rects);
      currentRect = remaining;
      currentRow = [candidate];
    }
  }

  // 处理最后一行
  if (currentRow.length > 0) {
    const {rects} = layoutRow(
      currentRow.map((r) => r.item),
      currentRow.map((r) => r.area),
      currentRect,
    );
    allRects.push(...rects);
  }

  // 转换为 TreemapRect（颜色在后续步骤分配）
  return allRects.map((r) => ({
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    item: r.item,
    color: '',
  }));
}


// 文字显示最小面积阈值（宽 * 高）
const MIN_TEXT_AREA = 40 * 30; // 1200

/**
 * 根据矩形尺寸计算文字大小
 * 所有色块强制显示标签名、次数和百分比
 * 字号根据面积自适应缩放
 *
 * @param rect 树状图矩形（需要 width 和 height）
 * @returns 文字布局结果
 */
export function computeTextLayout(
  rect: {width: number; height: number},
): TextLayout {
  const area = rect.width * rect.height;

  // 极小面积时用最小字号，但仍然强制显示
  if (area < MIN_TEXT_AREA) {
    return {fontSize: 9, showText: true, showCount: true, showPercentage: true};
  }

  // 面积阈值划分
  const SMALL_THRESHOLD = 3000;
  const MEDIUM_THRESHOLD = 8000;
  const maxArea = 50000;

  let fontSize: number;
  if (area < SMALL_THRESHOLD) {
    fontSize = 9 + Math.min(3, ((area - MIN_TEXT_AREA) / (SMALL_THRESHOLD - MIN_TEXT_AREA)) * 3);
  } else if (area < MEDIUM_THRESHOLD) {
    fontSize = 12 + ((area - SMALL_THRESHOLD) / (MEDIUM_THRESHOLD - SMALL_THRESHOLD)) * 3;
  } else {
    const t = Math.min(1, (area - MEDIUM_THRESHOLD) / (maxArea - MEDIUM_THRESHOLD));
    fontSize = 15 + t * 5;
  }

  return {
    fontSize: Math.round(fontSize * 10) / 10,
    showText: true,
    showCount: true,
    showPercentage: true,
  };
}

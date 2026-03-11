/**
 * 树状图颜色分配函数
 * 加班标签：红色系（色相 0-15°），70% 透明度
 * 准时标签：绿色系（色相 120-155°），70% 透明度
 * 同类别内按索引分配不同色相和亮度，确保色差
 */

import {TagProportionItem} from '../types/tag-proportion';

/**
 * 为标签占比数据分配树状图颜色
 *
 * @param items 标签占比数据数组
 * @param isDark 是否为深色模式
 * @returns 与 items 等长的颜色字符串数组（HSLA 格式）
 */
export function assignTreemapColors(
  items: TagProportionItem[],
  isDark: boolean,
): string[] {
  if (items.length === 0) return [];

  // 分离加班和准时标签，记录原始索引
  const overtimeIndices: number[] = [];
  const ontimeIndices: number[] = [];

  for (let i = 0; i < items.length; i++) {
    if (items[i].isOvertime) {
      overtimeIndices.push(i);
    } else {
      ontimeIndices.push(i);
    }
  }

  const colors: string[] = new Array(items.length);

  // 加班标签：红色系，70% 透明度
  assignCategoryColors(
    overtimeIndices,
    colors,
    {hueMin: 0, hueMax: 15},         // 红色色相范围
    {satMin: 55, satMax: 75},         // 较高饱和度
    isDark ? {lightMin: 32, lightMax: 52} : {lightMin: 42, lightMax: 62},
  );

  // 准时标签：绿色系，70% 透明度
  assignCategoryColors(
    ontimeIndices,
    colors,
    {hueMin: 120, hueMax: 155},       // 绿色色相范围
    {satMin: 40, satMax: 60},         // 中等饱和度
    isDark ? {lightMin: 28, lightMax: 48} : {lightMin: 35, lightMax: 55},
  );

  return colors;
}

/**
 * 为同一类别的标签分配不同深浅的颜色
 * 按索引顺序在色相和亮度范围内均匀分配，确保色差明显
 */
function assignCategoryColors(
  indices: number[],
  colors: string[],
  hueRange: {hueMin: number; hueMax: number},
  satRange: {satMin: number; satMax: number},
  lightRange: {lightMin: number; lightMax: number},
): void {
  const count = indices.length;
  if (count === 0) return;

  for (let i = 0; i < count; i++) {
    // 色相按索引均匀分配
    const hue =
      count === 1
        ? (hueRange.hueMin + hueRange.hueMax) / 2
        : hueRange.hueMin +
          (i / (count - 1)) * (hueRange.hueMax - hueRange.hueMin);

    // 饱和度按索引均匀分配
    const saturation =
      count === 1
        ? (satRange.satMin + satRange.satMax) / 2
        : satRange.satMin +
          (i / (count - 1)) * (satRange.satMax - satRange.satMin);

    // 亮度按索引均匀分配
    const lightness =
      count === 1
        ? (lightRange.lightMin + lightRange.lightMax) / 2
        : lightRange.lightMin +
          (i / (count - 1)) * (lightRange.lightMax - lightRange.lightMin);

    colors[indices[i]] = `hsla(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%, 0.7)`;
  }
}

/**
 * 解析 HSL/HSLA 颜色字符串为数值
 * 格式: "hsl(h, s%, l%)" 或 "hsla(h, s%, l%, a)"
 *
 * @returns {hue, saturation, lightness, alpha} 或 null（解析失败时）
 */
export function parseHSL(
  hslStr: string,
): {hue: number; saturation: number; lightness: number; alpha: number} | null {
  // 尝试匹配 hsla 格式
  const hslaMatch = hslStr.match(
    /^hsla\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)\s*\)$/,
  );
  if (hslaMatch) {
    return {
      hue: parseFloat(hslaMatch[1]),
      saturation: parseFloat(hslaMatch[2]),
      lightness: parseFloat(hslaMatch[3]),
      alpha: parseFloat(hslaMatch[4]),
    };
  }
  // 尝试匹配 hsl 格式
  const hslMatch = hslStr.match(
    /^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/,
  );
  if (!hslMatch) return null;
  return {
    hue: parseFloat(hslMatch[1]),
    saturation: parseFloat(hslMatch[2]),
    lightness: parseFloat(hslMatch[3]),
    alpha: 1,
  };
}

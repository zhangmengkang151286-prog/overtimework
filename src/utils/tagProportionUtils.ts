/**
 * 标签占比工具函数
 * 包含百分比计算、序列化/反序列化、格式化/解析等功能
 */

import {TagProportionItem} from '../types/tag-proportion';

// 格式化字符串的分隔符
const FORMAT_SEPARATOR = ' ';

// 标签计数输入（用于百分比计算）
export interface TagCountInput {
  tagId: string;
  tagName: string;
  count: number;
  isOvertime: boolean;
}

/**
 * 将标签计数转换为百分比
 * 使用最大余数法（Largest Remainder Method）确保百分比之和精确等于 100
 *
 * @param tags 标签计数数组（每个 count 为正整数）
 * @returns 标签占比数据数组，总次数为 0 时返回空数组
 */
export function computePercentages(
  tags: TagCountInput[],
): TagProportionItem[] {
  // 过滤掉 count <= 0 的项
  const validTags = tags.filter((t) => t.count > 0);
  if (validTags.length === 0) {
    return [];
  }

  const totalCount = validTags.reduce((sum, t) => sum + t.count, 0);
  if (totalCount === 0) {
    return [];
  }

  // 计算精确百分比和整数部分
  const exactPercentages = validTags.map((t) => (t.count / totalCount) * 100);
  const floorValues = exactPercentages.map((p) => Math.floor(p));
  const remainders = exactPercentages.map((p, i) => p - floorValues[i]);

  // 需要分配的剩余百分比点数
  let remaining = 100 - floorValues.reduce((sum, v) => sum + v, 0);

  // 按余数从大到小排序的索引
  const indices = remainders
    .map((_, i) => i)
    .sort((a, b) => remainders[b] - remainders[a]);

  // 分配剩余点数
  const finalPercentages = [...floorValues];
  for (const idx of indices) {
    if (remaining <= 0) break;
    finalPercentages[idx] += 1;
    remaining -= 1;
  }

  return validTags.map((tag, i) => ({
    tagId: tag.tagId,
    tagName: tag.tagName,
    count: tag.count,
    percentage: finalPercentages[i],
    isOvertime: tag.isOvertime,
  }));
}

/**
 * 将标签占比数据按类别截断为前 N 名，剩余归入"其他"
 * 加班标签和准时标签分别取前 maxPerCategory 名
 * 超出的标签次数累加到"其他-加班"/"其他-准时"
 *
 * @param data 标签占比数据数组
 * @param maxPerCategory 每个类别最多保留的标签数（默认 10）
 * @returns 截断后的标签占比数据数组（最多 maxPerCategory*2 + 2 项）
 */
export function truncateWithOthers(
  data: TagProportionItem[],
  maxPerCategory: number = 4, // 前4个标签 + 1个其他 = 5
): TagProportionItem[] {
  if (data.length === 0) return [];

  // 按类别分组
  const overtime = data.filter((d) => d.isOvertime);
  const ontime = data.filter((d) => !d.isOvertime);

  // 按次数降序排列
  overtime.sort((a, b) => b.count - a.count);
  ontime.sort((a, b) => b.count - a.count);

  const result: TagProportionItem[] = [];

  // 处理加班标签
  const overtimeTop = overtime.slice(0, maxPerCategory);
  const overtimeRest = overtime.slice(maxPerCategory);
  result.push(...overtimeTop);
  if (overtimeRest.length > 0) {
    const restCount = overtimeRest.reduce((s, t) => s + t.count, 0);
    const restTotal = data.reduce((s, t) => s + t.count, 0);
    result.push({
      tagId: '__other_overtime__',
      tagName: '其他',
      count: restCount,
      percentage: 0,
      isOvertime: true,
      otherDetails: overtimeRest.map((t) => ({
        tagName: t.tagName,
        count: t.count,
        percentage: restTotal > 0 ? Math.round((t.count / restTotal) * 100) : 0,
      })),
    });
  }

  // 处理准时标签
  const ontimeTop = ontime.slice(0, maxPerCategory);
  const ontimeRest = ontime.slice(maxPerCategory);
  result.push(...ontimeTop);
  if (ontimeRest.length > 0) {
    const restCount = ontimeRest.reduce((s, t) => s + t.count, 0);
    const restTotal = data.reduce((s, t) => s + t.count, 0);
    result.push({
      tagId: '__other_ontime__',
      tagName: '其他',
      count: restCount,
      percentage: 0,
      isOvertime: false,
      otherDetails: ontimeRest.map((t) => ({
        tagName: t.tagName,
        count: t.count,
        percentage: restTotal > 0 ? Math.round((t.count / restTotal) * 100) : 0,
      })),
    });
  }

  // 重新计算百分比
  const totalCount = result.reduce((s, t) => s + t.count, 0);
  if (totalCount === 0) return [];

  // 使用 computePercentages 重新计算，但保留 otherDetails
  const recalculated = computePercentages(result);
  // 将 otherDetails 从 result 映射回 recalculated
  return recalculated.map((item) => {
    const original = result.find((r) => r.tagId === item.tagId);
    if (original?.otherDetails) {
      return {...item, otherDetails: original.otherDetails};
    }
    return item;
  });
}

/**
 * 将标签占比数据数组序列化为 JSON 字符串
 *
 * @param data 标签占比数据数组
 * @returns JSON 字符串
 */
export function serializeTagProportion(data: TagProportionItem[]): string {
  return JSON.stringify(data);
}

/**
 * 将 JSON 字符串反序列化为标签占比数据数组
 *
 * @param json JSON 字符串
 * @returns 标签占比数据数组
 */
export function deserializeTagProportion(json: string): TagProportionItem[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error('反序列化失败：数据不是数组');
  }
  return parsed.map((item: Record<string, unknown>) => ({
    tagId: String(item.tagId),
    tagName: String(item.tagName),
    count: Number(item.count),
    percentage: Number(item.percentage),
    isOvertime: Boolean(item.isOvertime),
  }));
}

/**
 * 将单个标签占比数据格式化为可读字符串
 * 格式: "标签名 次数 百分比%"
 *
 * @param item 标签占比数据项
 * @returns 格式化字符串
 */
export function formatTagProportionItem(item: TagProportionItem): string {
  return `${item.tagName}${FORMAT_SEPARATOR}${item.count}${FORMAT_SEPARATOR}${item.percentage}%`;
}

/**
 * 解析格式化字符串为标签占比数据
 * 格式: "标签名 次数 百分比%"
 * 注意：由于格式化字符串不包含 tagId 和 isOvertime，解析时 tagId 为空字符串，isOvertime 为 false
 *
 * @param str 格式化字符串
 * @returns 标签占比数据项（tagId 为空字符串，isOvertime 为 false）
 */
export function parseTagProportionItem(str: string): TagProportionItem {
  // 从右侧匹配百分比和次数，剩余部分为标签名
  const percentMatch = str.match(/\s(\d+(?:\.\d+)?)%$/);
  if (!percentMatch) {
    throw new Error(`解析失败：无法匹配百分比 "${str}"`);
  }
  const percentage = Number(percentMatch[1]);
  const beforePercent = str.slice(0, percentMatch.index!);

  const countMatch = beforePercent.match(/\s(\d+)$/);
  if (!countMatch) {
    throw new Error(`解析失败：无法匹配次数 "${str}"`);
  }
  const count = Number(countMatch[1]);
  const tagName = beforePercent.slice(0, countMatch.index!);

  if (tagName.length === 0) {
    throw new Error(`解析失败：标签名为空 "${str}"`);
  }

  return {
    tagId: '',
    tagName,
    count,
    percentage,
    isOvertime: false,
  };
}

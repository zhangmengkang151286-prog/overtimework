/**
 * 多维度统计工具函数
 * 包含色阶映射、Top10 合并、年龄段排序、职位排序、出生年份映射等
 */

import {DimensionItem, DimensionStatsMap} from '../types';

// ============================================
// 年龄段定义与排序
// ============================================

/** 年龄段预定义顺序（从年轻到年长）- 旧版分组，保留兼容 */
export const AGE_GROUP_ORDER: string[] = [
  '≤18',
  '19~23',
  '24~28',
  '29~33',
  '34~38',
  '39~43',
  '44~48',
  '49~53',
  '54~58',
  '59~63',
  '≥64',
];

/**
 * 逐岁年龄标签顺序（从小到大）：≤16, 17, 18, 19, 20, ..., 63, ≥64
 * 用于人口金字塔图表的纵坐标
 */
export const AGE_SINGLE_ORDER: string[] = [
  '≤16',
  ...Array.from({length: 47}, (_, i) => String(i + 17)), // 17~63
  '≥64',
];

/** 纵坐标需要标注的年龄刻度 */
export const AGE_LABEL_TICKS: string[] = ['≤16', '20', '25', '30', '35', '40', '45', '50', '55', '60', '≥64'];

/**
 * 将出生年份映射到逐岁标签
 * ≤16 和 ≥64 为边界合并
 */
export function birthYearToAge(birthYear: number): string {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  if (age <= 16) return '≤16';
  if (age >= 64) return '≥64';
  return String(age);
}

/**
 * 将出生年份映射到年龄段标签（旧版分组，保留兼容）
 * 基于当前年份计算年龄
 */
export function birthYearToAgeGroup(birthYear: number): string {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  if (age <= 18) return '≤18';
  if (age <= 23) return '19~23';
  if (age <= 28) return '24~28';
  if (age <= 33) return '29~33';
  if (age <= 38) return '34~38';
  if (age <= 43) return '39~43';
  if (age <= 48) return '44~48';
  if (age <= 53) return '49~53';
  if (age <= 58) return '54~58';
  if (age <= 63) return '59~63';
  return '≥64';
}

// ============================================
// 色阶映射
// ============================================

/**
 * 10 级色阶映射：将加班比率 (0~1) 映射到颜色
 * 0.0 = 深绿（全部准时）
 * 0.5 = 白色（各半）
 * 1.0 = 深红（全部加班）
 *
 * 返回合法的 CSS rgb() 颜色字符串
 */
export function ratioToColor(ratio: number): string {
  // clamp 到 [0, 1]
  const clamped = Math.max(0, Math.min(1, ratio));

  let r: number;
  let g: number;
  let b: number;

  if (clamped <= 0.5) {
    // 从深绿 (0, 128, 0) 到白色 (255, 255, 255)
    const t = clamped / 0.5; // 0 → 1
    r = Math.round(0 + t * 255);
    g = Math.round(128 + t * 127);
    b = Math.round(0 + t * 255);
  } else {
    // 从白色 (255, 255, 255) 到深红 (200, 0, 0)
    const t = (clamped - 0.5) / 0.5; // 0 → 1
    r = Math.round(255 - t * 55);
    g = Math.round(255 - t * 255);
    b = Math.round(255 - t * 255);
  }

  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================
// Top10 合并
// ============================================

/**
 * 取前 10 个行业（按 totalCount 降序），其余合并为"其余行业"
 * - 结果列表长度不超过 11（10 个行业 + 1 个"其余行业"）
 * - 前 10 项按 totalCount 降序排列
 * - "其余行业"项的各计数等于第 11 项及之后所有项之和
 * - 所有项的 totalCount 之和等于原始列表之和
 */
export function processTop10WithOthers(items: DimensionItem[]): DimensionItem[] {
  if (items.length === 0) return [];

  // 按 totalCount 降序排列
  const sorted = [...items].sort((a, b) => b.totalCount - a.totalCount);

  if (sorted.length <= 10) {
    return sorted;
  }

  const top10 = sorted.slice(0, 10);
  const rest = sorted.slice(10);

  const othersOvertimeCount = rest.reduce((sum, item) => sum + item.overtimeCount, 0);
  const othersOnTimeCount = rest.reduce((sum, item) => sum + item.onTimeCount, 0);
  const othersTotalCount = othersOvertimeCount + othersOnTimeCount;

  const othersItem: DimensionItem = {
    id: '__others__',
    name: '其余行业',
    overtimeCount: othersOvertimeCount,
    onTimeCount: othersOnTimeCount,
    totalCount: othersTotalCount,
    overtimeRatio: othersTotalCount > 0 ? othersOvertimeCount / othersTotalCount : 0,
  };

  return [...top10, othersItem];
}

// ============================================
// 排序函数
// ============================================

/**
 * 按 totalCount 降序排列
 */
export function sortByTotalCount(items: DimensionItem[]): DimensionItem[] {
  return [...items].sort((a, b) => b.totalCount - a.totalCount);
}

/**
 * 按预定义年龄段顺序排列
 */
export function sortAgeGroups(items: DimensionItem[]): DimensionItem[] {
  return [...items].sort((a, b) => {
    const indexA = AGE_GROUP_ORDER.indexOf(a.name);
    const indexB = AGE_GROUP_ORDER.indexOf(b.name);
    // 未知年龄段排到最后
    const safeA = indexA === -1 ? AGE_GROUP_ORDER.length : indexA;
    const safeB = indexB === -1 ? AGE_GROUP_ORDER.length : indexB;
    return safeA - safeB;
  });
}

// ============================================
// 序列化 / 反序列化
// ============================================

/**
 * 将 DimensionStatsMap 序列化为 JSON 字符串
 */
export function serializeDimensionStats(stats: DimensionStatsMap): string {
  return JSON.stringify(stats);
}

/**
 * 将 JSON 字符串反序列化为 DimensionStatsMap
 * overtimeRatio 通过重新计算得到，避免浮点精度问题
 */
export function deserializeDimensionStats(json: string): DimensionStatsMap {
  const parsed: DimensionStatsMap = JSON.parse(json);

  const recalcItems = (items: DimensionItem[]): DimensionItem[] =>
    items.map(item => ({
      ...item,
      overtimeRatio: item.totalCount > 0 ? item.overtimeCount / item.totalCount : 0,
    }));

  return {
    industry: recalcItems(parsed.industry),
    position: recalcItems(parsed.position),
    province: recalcItems(parsed.province),
    age: recalcItems(parsed.age),
  };
}

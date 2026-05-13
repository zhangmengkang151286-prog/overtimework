/**
 * 下班瀑布流 - 筛选与排序逻辑
 * 包含时间窗口过滤、视角筛选（属性组+类型组）、隐身过滤
 */

import {
  ClockOutEvent,
  WaterfallQueryParams,
} from '../types/clock-out-waterfall';

/**
 * 按 24 小时时间窗口过滤事件并按 effectiveClockOutMoment 降序排序
 * 仅保留 effectiveClockOutMoment ≤ now 且 > now - 24h 的事件
 *
 * @param events 事件列表
 * @param now 当前时钟（ISO 8601 格式或 Date 对象）
 * @returns 过滤并排序后的事件列表
 */
export function filterByTimeWindow(
  events: ClockOutEvent[],
  now: Date | string,
): ClockOutEvent[] {
  const nowDate = typeof now === 'string' ? new Date(now) : now;
  const nowMs = nowDate.getTime();
  const twentyFourHoursAgoMs = nowMs - 24 * 60 * 60 * 1000;

  const filtered = events.filter((event) => {
    const momentMs = new Date(event.effectiveClockOutMoment).getTime();
    return momentMs <= nowMs && momentMs > twentyFourHoursAgoMs;
  });

  // 按 effectiveClockOutMoment 降序排列（最新在前）
  filtered.sort((a, b) => {
    const timeA = new Date(a.effectiveClockOutMoment).getTime();
    const timeB = new Date(b.effectiveClockOutMoment).getTime();
    return timeB - timeA;
  });

  return filtered;
}

/**
 * 按视角筛选条件过滤事件
 * - 属性组（industry、city、position）：逻辑与，undefined 表示不限
 * - 类型组（clockOutTypes）：逻辑或，空数组或 undefined 表示不限
 * - 属性组与类型组之间：逻辑与
 *
 * @param events 事件列表
 * @param scope 筛选参数
 * @returns 过滤后的事件列表
 */
export function filterByScope(
  events: ClockOutEvent[],
  scope: WaterfallQueryParams,
): ClockOutEvent[] {
  return events.filter((event) => {
    // 属性组：逻辑与
    if (scope.industry && event.industry !== scope.industry) {
      return false;
    }
    if (scope.city && event.city !== scope.city) {
      return false;
    }
    if (scope.position && event.position !== scope.position) {
      return false;
    }

    // 类型组：逻辑或
    // 空数组或 undefined 或两项全选 → 不限制
    const types = scope.clockOutTypes;
    if (types && types.length > 0 && types.length < 2) {
      // 至少一项被勾选且未全选 → 仅保留命中类型
      if (!types.includes(event.clockOutType)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 按隐身模式过滤事件
 * - isIncognito=true 且 userId ≠ viewerUserId → 排除（其他人看不到）
 * - isIncognito=true 且 userId = viewerUserId → 保留（本人可见）
 * - isIncognito=false → 保留
 *
 * @param events 事件列表
 * @param viewerUserId 当前查看者的用户 ID
 * @returns 过滤后的事件列表
 */
export function filterByIncognito(
  events: ClockOutEvent[],
  viewerUserId: string,
): ClockOutEvent[] {
  return events.filter((event) => {
    if (event.isIncognito && event.userId !== viewerUserId) {
      return false;
    }
    return true;
  });
}

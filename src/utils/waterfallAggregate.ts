/**
 * 下班瀑布流 - 聚合横条逻辑
 * 包含聚合横条插入与聚合统计计算
 */

import {
  ClockOutEvent,
  AggregateMarker,
  AggregateStats,
  WageBracket,
} from '../types/clock-out-waterfall';

/**
 * 在卡片列表中每隔 10 张卡片插入一条聚合横条
 * 横条不计入卡片计数
 *
 * @param cards 按 effectiveClockOutMoment 降序排列的卡片列表
 * @returns 插入聚合横条后的混合列表
 */
export function insertAggregateStripes(
  cards: ClockOutEvent[],
): Array<ClockOutEvent | AggregateMarker> {
  if (cards.length === 0) return [];

  const result: Array<ClockOutEvent | AggregateMarker> = [];
  let cardCount = 0;

  for (let i = 0; i < cards.length; i++) {
    result.push(cards[i]);
    cardCount++;

    // 每 10 张卡片后插入一条聚合横条
    if (cardCount % 10 === 0 && i < cards.length - 1) {
      // 取最近 10 张卡片计算聚合统计
      const recentCards = cards.slice(i - 9, i + 1);
      const stats = computeAggregateStats(recentCards, 10);
      const marker: AggregateMarker = {
        type: 'aggregate',
        stats,
        referenceTime: cards[i].effectiveClockOutMoment,
      };
      result.push(marker);
    }
  }

  return result;
}

/**
 * 计算聚合统计数据
 * 统计指定时间窗口内的下班人数、平均下班时间、时薪区间分布
 *
 * @param events 事件列表
 * @param windowMinutes 时间窗口（分钟），用于描述统计范围
 * @returns 聚合统计
 */
export function computeAggregateStats(
  events: ClockOutEvent[],
  windowMinutes: number,
): AggregateStats {
  const clockOutCount = events.length;

  if (clockOutCount === 0) {
    return {
      clockOutCount: 0,
      averageClockOutTime: null,
      wageBracketDistribution: {},
    };
  }

  // 计算平均下班时间
  const timestamps = events.map(e => new Date(e.effectiveClockOutMoment).getTime());
  const avgTimestamp = timestamps.reduce((sum, t) => sum + t, 0) / clockOutCount;
  const averageClockOutTime = new Date(avgTimestamp).toISOString();

  // 计算时薪区间分布
  const wageBracketDistribution: Partial<Record<WageBracket, number>> = {};
  for (const event of events) {
    if (event.wageBracket) {
      wageBracketDistribution[event.wageBracket] =
        (wageBracketDistribution[event.wageBracket] || 0) + 1;
    }
  }

  return {
    clockOutCount,
    averageClockOutTime,
    wageBracketDistribution,
  };
}

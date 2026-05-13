/**
 * 下班瀑布流 - 核心工具函数
 * 包含时薪区间映射、颜色温度映射、时间分隔线判断、评论验证、反馈验证
 */

import {
  WageBracket,
  TemperatureLevel,
  ALL_REACTIONS,
} from '../types/clock-out-waterfall';

// ============ 时薪区间映射 ============

/**
 * 将精确时薪映射到预定义的十个区间之一
 * 区间：<¥20, ¥20-¥40, ¥40-¥60, ¥60-¥80, ¥80-¥100,
 *       ¥100-¥150, ¥150-¥200, ¥200-¥300, ¥300-¥500, >¥500
 *
 * @param hourlyWage 精确时薪（非负数）
 * @returns 对应的时薪区间
 */
export function mapWageToBracket(hourlyWage: number): WageBracket {
  if (hourlyWage < 20) return '<¥20';
  if (hourlyWage < 40) return '¥20-¥40';
  if (hourlyWage < 60) return '¥40-¥60';
  if (hourlyWage < 80) return '¥60-¥80';
  if (hourlyWage < 100) return '¥80-¥100';
  if (hourlyWage < 150) return '¥100-¥150';
  if (hourlyWage < 200) return '¥150-¥200';
  if (hourlyWage < 300) return '¥200-¥300';
  if (hourlyWage < 500) return '¥300-¥500';
  return '>¥500';
}

// ============ 颜色温度映射 ============

/**
 * 根据应计下班时刻映射颜色温度
 * 绿色：≤18:30
 * 黄色：18:31-20:00
 * 橙色：20:01-22:00
 * 深红：>22:00
 *
 * @param clockOutMoment ISO 8601 格式的时间字符串
 * @returns 颜色温度档位
 */
export function mapTimeToTemperature(clockOutMoment: string): TemperatureLevel {
  const date = new Date(clockOutMoment);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // 转换为当日分钟数进行比较
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes <= 18 * 60 + 30) return 'green';
  if (totalMinutes <= 20 * 60) return 'yellow';
  if (totalMinutes <= 22 * 60) return 'orange';
  return 'red';
}

// ============ 时间分隔线判断 ============

/**
 * 判断两个相邻的应计下班时刻是否跨越了一个整点
 * 用于决定是否在两张卡片之间插入时间分隔线
 *
 * @param momentA 较新的时刻（ISO 8601 格式）
 * @param momentB 较旧的时刻（ISO 8601 格式）
 * @returns 是否应插入时间分隔线
 */
export function shouldInsertTimeDivider(momentA: string, momentB: string): boolean {
  const dateA = new Date(momentA);
  const dateB = new Date(momentB);

  // A 更新（时间更晚），B 更旧（时间更早）
  // 瀑布流按降序排列，所以 A 在上方，B 在下方
  // 如果 A 和 B 的小时数不同，说明跨越了整点
  const hourA = dateA.getHours();
  const hourB = dateB.getHours();

  // 当 A 的小时 > B 的小时时，说明从 B 到 A 跨越了整点
  // 例如 B=19:58, A=20:03，hourB=19, hourA=20，跨越了 20:00
  return hourA !== hourB;
}

// ============ 评论内容验证 ============

/**
 * 验证评论内容是否合法
 * - 空或全空白：拒绝
 * - 超过 200 字符：拒绝
 * - 其他：通过
 *
 * @param content 评论内容
 * @returns 验证结果
 */
export function validateCommentContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '评论内容不能为空' };
  }
  if (content.length > 200) {
    return { valid: false, error: '评论不能超过 200 字' };
  }
  return { valid: true };
}

// ============ 反馈文案验证 ============

/**
 * 验证反馈文案是否属于预设的 20 种之一
 *
 * @param text 反馈文案
 * @returns 是否合法
 */
export function isValidReaction(text: string): boolean {
  return (ALL_REACTIONS as readonly string[]).includes(text);
}

/**
 * 加班时间点 ↔ 小时数换算工具
 * 将"预计下班到几点"与 overtime_hours 互相转换
 */

import {EndTimeError} from '../types/hourly-wage';

/**
 * 将 'HH:mm' 格式的时间字符串解析为当日的分钟数（从 00:00 起）
 */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 将分钟数格式化为 'HH:mm'
 */
function minutesToTimeString(minutes: number): string {
  // 处理跨日（超过 24h）的情况，取模
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * 用户选的"预计下班到几点" → 协议里的 overtime_hours
 * 公式：overtime_hours = (endTime - standardEndTime) 小时数，保留 2 位小数
 */
export function endTimeToOvertimeHours(
  endTime: string,
  standardEndTime: string,
): number {
  const endMinutes = parseTimeToMinutes(endTime);
  const stdMinutes = parseTimeToMinutes(standardEndTime);
  const diffMinutes = endMinutes - stdMinutes;
  // 保留 2 位小数
  return Math.round((diffMinutes / 60) * 100) / 100;
}

/**
 * 反向：已存的 overtime_hours → 展示用的"到几点" ('HH:mm')
 */
export function overtimeHoursToEndTime(
  overtimeHours: number,
  standardEndTime: string,
): string {
  const stdMinutes = parseTimeToMinutes(standardEndTime);
  // 将小时转为分钟并四舍五入到整数分钟
  const totalMinutes = stdMinutes + Math.round(overtimeHours * 60);
  return minutesToTimeString(totalMinutes);
}

/**
 * 生成 5 个快捷选项（标准下班后 +1h, +2h, +3h, +4h, +5h）
 */
export function generateQuickPicks(standardEndTime: string): string[] {
  const stdMinutes = parseTimeToMinutes(standardEndTime);
  const picks: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const pickMinutes = stdMinutes + i * 60;
    picks.push(minutesToTimeString(pickMinutes));
  }
  return picks;
}

/**
 * 校验用户选中的预计下班时间
 * - NOT_FUTURE：早于或等于当前时间
 * - EQUALS_STANDARD：等于标准下班时间（建议改选准时）
 * - null：校验通过
 */
export function validateEndTime(
  endTime: string,
  standardEndTime: string,
  now: Date,
): EndTimeError | null {
  // 构造当日的 endTime 对应的 Date
  const endMinutes = parseTimeToMinutes(endTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // 校验：早于或等于当前时间
  if (endMinutes <= nowMinutes) {
    return 'NOT_FUTURE';
  }

  // 校验：等于标准下班时间
  if (endTime === standardEndTime) {
    return 'EQUALS_STANDARD';
  }

  return null;
}

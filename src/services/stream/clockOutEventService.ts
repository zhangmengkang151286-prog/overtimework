/**
 * 下班事件生成服务
 * 负责根据用户的状态提交创建 ClockOutEvent，计算应计下班时刻等核心字段
 *
 * Requirements: 2.1, 2.2, 2.6, 2.7, 2.8, 2.9, 2.10-2.13
 */

import {
  ClockOutEvent,
  ClockOutType,
  WageBracket,
} from '../../types/clock-out-waterfall';
import { StatusRecord, User } from '../../types/index';
import { mapWageToBracket } from '../../utils/waterfallUtils';
import { birthYearToAgeGroup } from '../../utils/dimensionStatsUtils';

/**
 * 根据用户月薪和工作时长计算时薪
 * 时薪 = 月薪 / (每月工作天数 * 每日工作小时数)
 * 假设每月 21.75 个工作日
 */
function calculateHourlyWage(user: User): number | null {
  if (!user.monthlySalary || user.monthlySalary <= 0) {
    return null;
  }
  if (!user.workStartTime || !user.workEndTime) {
    return null;
  }
  const [startH, startM] = user.workStartTime.split(':').map(Number);
  const [endH, endM] = user.workEndTime.split(':').map(Number);
  const dailyHours = (endH * 60 + endM - startH * 60 - startM) / 60;
  if (dailyHours <= 0) {
    return null;
  }
  // 每月 21.75 个工作日
  return user.monthlySalary / (21.75 * dailyHours);
}

/**
 * 计算应计下班时刻（EffectiveClockOutMoment）
 *
 * - 准时下班：取用户当日的 StandardClockOutTime（即 workEndTime）
 * - 加班已下班：取 StandardClockOutTime + overtimeHours
 *
 * @param eventDate 事件日期 YYYY-MM-DD
 * @param workEndTime 用户标准下班时间 HH:mm
 * @param clockOutType 下班类型
 * @param overtimeHours 加班时长（小时）
 * @returns ISO 8601 格式的应计下班时刻
 */
function calculateEffectiveClockOutMoment(
  eventDate: string,
  workEndTime: string,
  clockOutType: ClockOutType,
  overtimeHours: number,
): string {
  const [endH, endM] = workEndTime.split(':').map(Number);
  const baseDate = new Date(`${eventDate}T00:00:00`);
  // 设置标准下班时间
  baseDate.setHours(endH, endM, 0, 0);

  if (clockOutType === 'overtime' && overtimeHours > 0) {
    // 加班：标准下班时间 + 加班时长
    const additionalMs = overtimeHours * 60 * 60 * 1000;
    baseDate.setTime(baseDate.getTime() + additionalMs);
  }

  return baseDate.toISOString();
}

/**
 * 根据用户出生年份计算年龄段标签
 */
function getAgeGroup(user: User): string {
  if (!user.birthYear) {
    return '未知';
  }
  return birthYearToAgeGroup(user.birthYear);
}

/**
 * 创建下班事件
 *
 * @param statusRecord 状态记录
 * @param user 用户信息
 * @param isIncognito 是否隐身
 * @returns ClockOutEvent 对象（不含 id 和 createdAt，由数据库生成）
 */
export function createEvent(
  statusRecord: StatusRecord,
  user: User,
  isIncognito: boolean,
): ClockOutEvent {
  const clockOutType: ClockOutType = statusRecord.isOvertime ? 'overtime' : 'ontime';
  const overtimeHours = clockOutType === 'overtime'
    ? Math.max(statusRecord.overtimeHours ?? 0, 0)
    : 0;

  const effectiveClockOutMoment = calculateEffectiveClockOutMoment(
    statusRecord.date,
    user.workEndTime,
    clockOutType,
    overtimeHours,
  );

  // 计算时薪区间
  const hourlyWage = calculateHourlyWage(user);
  const wageBracket: WageBracket | null = hourlyWage !== null
    ? mapWageToBracket(hourlyWage)
    : null;

  // 构建事件对象
  const event: ClockOutEvent = {
    id: '', // 由数据库生成
    userId: user.id,
    statusRecordId: statusRecord.id,
    eventDate: statusRecord.date,
    clockOutType,
    effectiveClockOutMoment,
    overtimeHours,
    wageBracket,
    industry: user.industry,
    city: user.city,
    position: user.position,
    ageGroup: getAgeGroup(user),
    avatar: user.avatar,
    nickname: user.username,
    isIncognito,
    createdAt: '', // 由数据库生成
  };

  return event;
}

/**
 * 根据事件和当前时间生成卡片生成提示文案
 *
 * - 当前时钟 >= EffectiveClockOutMoment → "你的下班卡片已生成"
 * - 当前时钟 < EffectiveClockOutMoment → "你的下班卡片将于 {时间} 出现在瀑布流中"
 *
 * @param event 下班事件
 * @param now 当前时间（ISO 8601 或 Date）
 * @returns 提示文案
 */
export function getCardGenerationMessage(event: ClockOutEvent, now: string | Date): string {
  const currentTime = typeof now === 'string' ? new Date(now) : now;
  const effectiveTime = new Date(event.effectiveClockOutMoment);

  if (currentTime.getTime() >= effectiveTime.getTime()) {
    return '你的下班卡片已生成';
  }

  // 格式化时间为 HH:mm
  const hours = effectiveTime.getHours().toString().padStart(2, '0');
  const minutes = effectiveTime.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  return `你的下班卡片将于 ${timeStr} 出现在瀑布流中`;
}

/**
 * 个人成就海报服务
 * 负责海报数据获取、计算和格式化
 */

import {ImageSourcePropType} from 'react-native';
import {
  AchievementPosterData,
  SerializableAchievementPosterData,
  ONTIME_ILLUSTRATIONS,
  OVERTIME_ILLUSTRATIONS,
  CAPTIONS,
  CaptionTier,
  OVERTIME_PERCENTAGE_COLOR,
  ONTIME_PERCENTAGE_COLOR,
} from '../types/achievement-poster';
import {get, rpc} from './postgrestApi';
import {supabaseService} from './supabaseService';

// ============================================================
// 纯函数：可独立测试，不依赖外部服务
// ============================================================

/**
 * 根据百分比选择插画池中的一张插画
 * 百分比 > 50% 从 ontime 池随机选，≤ 50% 从 overtime 池随机选
 */
export function selectIllustration(percentage: number): ImageSourcePropType {
  const pool =
    percentage > 50 ? ONTIME_ILLUSTRATIONS : OVERTIME_ILLUSTRATIONS;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * 根据百分比和用户实际状态选择对应分档的文案
 * 准时用户：≥70% → ontimeHigh，<70% → ontimeMid
 * 加班用户：≥30% → overtimeLow，<30% → overtimeHigh
 * 当未传入 isOnTime 时，按百分比 50% 为界自动判断（向后兼容）
 */
export function selectCaption(percentage: number, isOnTime?: boolean): string {
  // 未传入状态时按百分比推断
  const onTime = isOnTime ?? percentage > 50;

  let tier: CaptionTier;
  if (onTime) {
    tier = percentage >= 70 ? 'ontimeHigh' : 'ontimeMid';
  } else {
    tier = percentage >= 30 ? 'overtimeLow' : 'overtimeHigh';
  }
  const pool = CAPTIONS[tier];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * 获取文案所属分档（用于测试验证）
 */
export function getCaptionTier(percentage: number, isOnTime?: boolean): CaptionTier {
  const onTime = isOnTime ?? percentage > 50;
  if (onTime) {
    return percentage >= 70 ? 'ontimeHigh' : 'ontimeMid';
  }
  return percentage >= 30 ? 'overtimeLow' : 'overtimeHigh';
}


/**
 * 计算下班时间 = 基础下班时间 + 加班时长
 * @param baseHour 基础下班时间（小时，0-23）
 * @param baseMinute 基础下班时间（分钟，0-59）
 * @param overtimeHours 加班时长（小时，可为小数）
 * @returns {hour, minute} 计算后的下班时间
 */
export function computeOffWorkTime(
  baseHour: number,
  baseMinute: number,
  overtimeHours: number,
): {hour: number; minute: number} {
  const totalMinutes =
    baseHour * 60 + baseMinute + Math.round(overtimeHours * 60);
  // 允许超过 24 小时（次日凌晨）
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return {hour, minute};
}

/**
 * 根据百分比返回颜色
 * ≤ 50% 返回红色，> 50% 返回白色
 */
export function getPercentageColor(percentage: number): string {
  return percentage <= 50
    ? OVERTIME_PERCENTAGE_COLOR
    : ONTIME_PERCENTAGE_COLOR;
}

/**
 * 格式化百分比：浮点数 → 整数百分比字符串
 * 例如 70.4 → "70.4%"
 */
export function formatPercentage(value: number): string {
  // 保留一位小数，整数时显示 .0
  return `${value.toFixed(1)}%`;
}

/**
 * 格式化参与人数：添加千分位分隔符
 * 例如 1234 → "1,234"
 */
export function formatParticipantCount(count: number): string {
  return count.toLocaleString('en-US');
}

/**
 * 序列化海报数据为 JSON 字符串（不含不可序列化字段）
 */
export function serialize(data: SerializableAchievementPosterData): string {
  return JSON.stringify(data);
}

/**
 * 反序列化 JSON 字符串为海报数据
 */
export function deserialize(json: string): SerializableAchievementPosterData {
  return JSON.parse(json) as SerializableAchievementPosterData;
}

// ============================================================
// 纯函数：排名百分比计算（可独立测试的核心算法）
// ============================================================

/**
 * 根据下班时间列表计算排名百分比
 * @param allOffWorkMinutes 所有已打卡用户的下班时间（分钟数）
 * @param targetOffWorkMinutes 目标用户的下班时间（分钟数）
 * @returns 百分比（0-100），比目标用户下班晚的人数 / 总人数
 */
export function calculateRankFromTimes(
  allOffWorkMinutes: number[],
  targetOffWorkMinutes: number,
): number {
  if (allOffWorkMinutes.length === 0) return 50; // 无数据时默认 50%
  const laterCount = allOffWorkMinutes.filter(
    t => t > targetOffWorkMinutes,
  ).length;
  return (laterCount / allOffWorkMinutes.length) * 100;
}

// ============================================================
// 异步方法：依赖外部服务
// ============================================================

/**
 * 从数据库计算排名百分比
 * 使用数据库函数 calculate_rank_percentage 计算
 * 下班时间 = 用户登记的 work_end_time + 加班时长 overtime_hours
 * 排名 = 比当前用户下班晚的人数 / 总打卡人数
 */
export async function calculateRankPercentage(
  userId: string,
): Promise<{percentage: number; participantCount: number}> {
  try {
    // 计算当前统计周期的日期（06:00 为分界线，使用北京时间）
    const now = new Date();
    // 转换为北京时间（UTC+8）
    const bjOffset = 8 * 60; // 北京时间偏移分钟数
    const bjTime = new Date(now.getTime() + (bjOffset + now.getTimezoneOffset()) * 60000);
    const bjHour = bjTime.getHours();
    const bjDate = bjHour < 6 ? new Date(bjTime.getTime() - 86400000) : bjTime;
    const todayDate = `${bjDate.getFullYear()}-${String(bjDate.getMonth() + 1).padStart(2, '0')}-${String(bjDate.getDate()).padStart(2, '0')}`;

    // 调用数据库函数，在服务端完成排名计算（无分页限制）
    const result = await rpc<
      {percentage: number; participant_count: number; user_off_minutes: number}[]
    >('calculate_rank_percentage', {
      p_user_id: userId,
      p_date: todayDate,
    });

    if (result && result.length > 0) {
      return {
        percentage: Number(result[0].percentage),
        participantCount: result[0].participant_count,
      };
    }

    return {percentage: 50, participantCount: 0};
  } catch (error) {
    console.error('计算排名百分比失败:', error);
    return {percentage: 50, participantCount: 0};
  }
}

/**
 * 获取完整海报数据（主方法）
 */
export async function getPosterData(
  userId: string,
): Promise<AchievementPosterData> {
  // 1. 获取用户信息
  const user = await supabaseService.getUser(userId);
  const username = user?.username || '未知用户';
  // 数据库字段是 avatar_url，兼容两种字段名
  const avatarId = (user as any)?.avatar_url || user?.avatar || '';

  // 2. 计算排名百分比
  const {percentage, participantCount} =
    await calculateRankPercentage(userId);

  // 3. 查询用户今日实际提交的状态（准时/加班）
  // 使用北京时间计算工作日日期，与 calculateRankPercentage 保持一致
  const nowForStatus = new Date();
  const bjOffsetForStatus = 8 * 60;
  const bjTimeForStatus = new Date(nowForStatus.getTime() + (bjOffsetForStatus + nowForStatus.getTimezoneOffset()) * 60000);
  const bjHourForStatus = bjTimeForStatus.getHours();
  const bjDateForStatus = bjHourForStatus < 6 ? new Date(bjTimeForStatus.getTime() - 86400000) : bjTimeForStatus;
  const today = `${bjDateForStatus.getFullYear()}-${String(bjDateForStatus.getMonth() + 1).padStart(2, '0')}-${String(bjDateForStatus.getDate()).padStart(2, '0')}`;
  let userIsOnTime = percentage > 50; // 默认用排名推断
  try {
    const records = await get<{is_overtime: boolean}[]>('/status_records', {
      user_id: `eq.${userId}`,
      date: `eq.${today}`,
      select: 'is_overtime',
      limit: 1,
    });
    if (records && records.length > 0) {
      userIsOnTime = !records[0].is_overtime;
    }
  } catch {
    // 查询失败时用排名推断
  }

  // 4. 选择插画和文案（基于用户实际状态）
  const illustrationSource = userIsOnTime
    ? ONTIME_ILLUSTRATIONS[Math.floor(Math.random() * ONTIME_ILLUSTRATIONS.length)]
    : OVERTIME_ILLUSTRATIONS[Math.floor(Math.random() * OVERTIME_ILLUSTRATIONS.length)];
  const caption = selectCaption(percentage, userIsOnTime);

  // 5. 组装数据
  const isOnTime = userIsOnTime;
  // 文案逻辑：准时显示 percentage + "走得早"，加班显示 (100-percentage) + "走得晚"
  const displayPercentage = isOnTime ? percentage : 100 - percentage;

  return {
    username,
    avatarId,
    rankPercentage: percentage,
    participantCount,
    isOnTime,
    illustrationSource,
    caption,
    percentageText: formatPercentage(displayPercentage),
    participantText: formatParticipantCount(participantCount),
    prefixText: '你比',
    suffixText: isOnTime ? '的人走得早' : '的人走得晚',
  };
}

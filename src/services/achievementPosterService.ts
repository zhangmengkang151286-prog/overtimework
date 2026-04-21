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
import {get} from './postgrestApi';
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
 * 根据百分比选择对应分档的文案
 * ≥70%: 准时高分档
 * ≥50% && <70%: 准时中分档
 * ≥30% && <50%: 加班低分档
 * <30%: 加班高分档
 */
export function selectCaption(percentage: number): string {
  let tier: CaptionTier;
  if (percentage >= 70) {
    tier = 'ontimeHigh';
  } else if (percentage >= 50) {
    tier = 'ontimeMid';
  } else if (percentage >= 30) {
    tier = 'overtimeLow';
  } else {
    tier = 'overtimeHigh';
  }
  const pool = CAPTIONS[tier];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * 获取文案所属分档（用于测试验证）
 */
export function getCaptionTier(percentage: number): CaptionTier {
  if (percentage >= 70) return 'ontimeHigh';
  if (percentage >= 50) return 'ontimeMid';
  if (percentage >= 30) return 'overtimeLow';
  return 'overtimeHigh';
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
 * 使用 daily_history 获取准确统计数据，避免 PostgREST 分页截断
 */
export async function calculateRankPercentage(
  userId: string,
): Promise<{percentage: number; participantCount: number}> {
  try {
    // 计算当前统计周期的日期（06:00 为分界线）
    const now = new Date();
    const todayDate =
      now.getHours() < 6
        ? new Date(now.getTime() - 86400000).toISOString().split('T')[0]
        : now.toISOString().split('T')[0];

    // 1. 查询该用户今日的状态
    const userRecords = await get<
      {is_overtime: boolean; overtime_hours: number | null}[]
    >('/status_records', {
      user_id: `eq.${userId}`,
      date: `eq.${todayDate}`,
      select: 'is_overtime,overtime_hours',
      limit: 1,
    });

    // 2. 从 daily_history 获取准确的统计数据（不受分页限制）
    let totalCount = 0;
    let overtimeTotal = 0;
    let ontimeTotal = 0;

    try {
      const stats = await get<
        {participant_count: number; overtime_count: number; on_time_count: number}[]
      >('/daily_history', {
        date: `eq.${todayDate}`,
        select: 'participant_count,overtime_count,on_time_count',
        limit: 1,
      });
      if (stats && stats.length > 0) {
        totalCount = stats[0].participant_count;
        overtimeTotal = stats[0].overtime_count;
        ontimeTotal = stats[0].on_time_count;
      }
    } catch {
      // daily_history 查询失败时回退为 0
    }

    // 用户今日未提交
    if (!userRecords || userRecords.length === 0) {
      return {percentage: 50, participantCount: totalCount};
    }

    if (totalCount === 0) {
      return {percentage: 50, participantCount: 0};
    }

    const userIsOvertime = userRecords[0].is_overtime;
    const userHours = userRecords[0].overtime_hours ?? 0;

    if (!userIsOvertime) {
      // 准时下班：比所有加班的人都好
      const worseCount = overtimeTotal;
      const percentage =
        totalCount > 1
          ? Math.round((worseCount / (totalCount - 1)) * 100 * 10) / 10
          : 100;
      return {percentage, participantCount: totalCount};
    } else {
      // 加班：查询加班时长 > 用户时长的人数
      let worseCount = 0;
      try {
        const worseRecords = await get<{user_id: string}[]>(
          '/status_records',
          {
            date: `eq.${todayDate}`,
            is_overtime: 'eq.true',
            overtime_hours: `gt.${userHours}`,
            select: 'user_id',
          },
        );
        const worseSet = new Set(
          (worseRecords || []).map(r => r.user_id),
        );
        worseCount = worseSet.size;
      } catch {
        worseCount = 0;
      }

      const percentage =
        totalCount > 1
          ? Math.round((worseCount / (totalCount - 1)) * 100 * 10) / 10
          : 0;
      return {percentage, participantCount: totalCount};
    }
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
  const today = new Date().toISOString().split('T')[0];
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
  const caption = selectCaption(percentage);

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

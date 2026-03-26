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
 * 例如 70.4 → "70%"
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
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
 * 从数据库计算排名百分比（基于推算下班时间）
 * 下班时间 = work_end_time + overtime_hours
 */
export async function calculateRankPercentage(
  userId: string,
): Promise<{percentage: number; participantCount: number}> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 查询今日所有打卡记录，关联 users 表获取 work_end_time
    const records = await get<any[]>('/status_records', {
      date: `eq.${today}`,
      select: 'user_id,is_overtime,overtime_hours',
    });

    if (!records || records.length === 0) {
      return {percentage: 50, participantCount: 0};
    }

    // 获取所有参与用户的 work_end_time
    const userIds = [...new Set(records.map((r: any) => r.user_id))];
    const users = await get<any[]>('/users', {
      id: `in.(${userIds.join(',')})`,
      select: 'id,work_end_time',
    });

    // 构建 userId -> work_end_time 映射
    const workEndTimeMap: Record<string, string> = {};
    if (users) {
      for (const u of users) {
        workEndTimeMap[u.id] = u.work_end_time || '18:00:00';
      }
    }

    // 计算每个用户的推算下班时间（分钟数）
    const allMinutes = records.map((r: any) => {
      const endTime = workEndTimeMap[r.user_id] || '18:00:00';
      const [h, m] = endTime.split(':').map(Number);
      const overtimeMin = Math.round((r.overtime_hours || 0) * 60);
      return h * 60 + m + overtimeMin;
    });

    // 找到当前用户的记录
    const userRecord = records.find((r: any) => r.user_id === userId);
    if (!userRecord) {
      return await getFallbackRankData(userId, records.length);
    }

    const userEndTime = workEndTimeMap[userId] || '18:00:00';
    const [uh, um] = userEndTime.split(':').map(Number);
    const userOvertimeMin = Math.round((userRecord.overtime_hours || 0) * 60);
    const userMinutes = uh * 60 + um + userOvertimeMin;

    const percentage = calculateRankFromTimes(allMinutes, userMinutes);

    return {
      percentage,
      participantCount: records.length,
    };
  } catch (error) {
    console.error('计算排名百分比失败:', error);
    return {percentage: 50, participantCount: 0};
  }
}

/**
 * 用户本轮未打卡时的回退逻辑
 */
async function getFallbackRankData(
  userId: string,
  currentParticipantCount: number,
): Promise<{percentage: number; participantCount: number}> {
  try {
    const history = await get<any[]>('/daily_history', {
      user_id: `eq.${userId}`,
      order: 'date.desc',
      limit: '1',
    });

    if (history && history.length > 0) {
      // 使用历史记录的百分比（如果有的话），否则默认 50%
      return {
        percentage: history[0].rank_percentage || 50,
        participantCount: currentParticipantCount,
      };
    }

    return {percentage: 50, participantCount: currentParticipantCount};
  } catch {
    return {percentage: 50, participantCount: currentParticipantCount};
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
  const avatarId = user?.avatar || '';

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

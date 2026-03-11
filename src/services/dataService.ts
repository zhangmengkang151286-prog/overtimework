/**
 * 数据服务
 * 使用 PostgREST API 替代 Supabase SDK
 */

import {get, post, patch, del, rpc, handleApiError} from './postgrestApi';
import {
  User,
  Tag,
  StatusRecord,
  RealTimeStats,
  TagStats,
  DailyStatus,
} from '../types';
import {computePercentages, TagCountInput} from '../utils/tagProportionUtils';

// dataService 内部使用的提交参数类型（包含 userId 和 date）
interface SubmitStatusParams {
  userId: string;
  date: string;
  isOvertime: boolean;
  tagId?: string;
  overtimeHours?: number;
}

// ==========================================
// 用户相关
// ==========================================

/**
 * 根据手机号获取用户
 */
export async function getUserByPhone(
  phoneNumber: string,
): Promise<User | null> {
  try {
    const users = await get<User[]>('/users', {
      phone_number: `eq.${phoneNumber}`,
      limit: 1,
    });
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * 根据 ID 获取用户
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const users = await get<User[]>('/users', {
      id: `eq.${userId}`,
      limit: 1,
    });
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * 创建用户
 */
export async function createUser(userData: Partial<User>): Promise<User> {
  try {
    const users = await post<User[]>('/users', userData);
    return users[0];
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * 更新用户
 */
export async function updateUser(
  userId: string,
  updates: Partial<User>,
): Promise<User> {
  try {
    const users = await patch<User[]>('/users', updates, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return users[0];
  } catch (error) {
    throw handleApiError(error);
  }
}

// ==========================================
// 标签相关
// ==========================================

/**
 * 获取所有标签
 */
export async function getTags(): Promise<Tag[]> {
  try {
    return await get<Tag[]>('/tags', {
      is_active: 'eq.true',
      order: 'usage_count.desc,name.asc',
    });
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * 获取热门标签
 * RPC 返回下划线命名，需要映射为驼峰命名的 TagStats
 */
export async function getTopTags(limit: number = 10): Promise<TagStats[]> {
  try {
    const raw = await rpc<any[]>('get_top_tags', {limit_count: limit});
    return (raw || []).map(item => ({
      tagId: item.tag_id,
      tagName: item.tag_name,
      overtimeCount: Number(item.overtime_count),
      onTimeCount: Number(item.on_time_count),
      totalCount: Number(item.total_count),
    }));
  } catch (error) {
    throw handleApiError(error);
  }
}

// ==========================================
// 状态记录相关
// ==========================================

/**
 * 提交用户状态
 * 每个标签单独一条记录，同一用户同一天可以有多条（对应多个标签）
 */
export async function submitUserStatus(
  submission: SubmitStatusParams,
): Promise<StatusRecord> {
  try {
    const records = await post<StatusRecord[]>(
      '/status_records',
      {
        user_id: submission.userId,
        date: submission.date,
        is_overtime: submission.isOvertime,
        tag_id: submission.tagId,
        overtime_hours: submission.overtimeHours,
        submitted_at: new Date().toISOString(),
      },
    );
    return records[0];
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * 获取用户今日状态
 */
export async function getUserTodayStatus(
  userId: string,
  date: string,
): Promise<StatusRecord | null> {
  try {
    const records = await get<StatusRecord[]>('/status_records', {
      user_id: `eq.${userId}`,
      date: `eq.${date}`,
      limit: 1,
      order: 'submitted_at.desc',
    });
    return records.length > 0 ? records[0] : null;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * 获取用户历史状态
 */
export async function getUserStatusHistory(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<StatusRecord[]> {
  try {
    return await get<StatusRecord[]>('/status_records', {
      user_id: `eq.${userId}`,
      date: [`gte.${startDate}`, `lte.${endDate}`],
      order: 'date.desc',
    });
  } catch (error) {
    throw handleApiError(error);
  }
}

// ==========================================
// 实时统计相关
// ==========================================

/**
 * 获取实时统计数据
 */
export async function getRealTimeStats(): Promise<RealTimeStats> {
  try {
    const result = await rpc<RealTimeStats[]>('get_real_time_stats', {});
    return result[0];
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * 获取每日状态历史
 */
export async function getDailyStatus(days: number = 7): Promise<DailyStatus[]> {
  try {
    return await rpc<DailyStatus[]>('get_daily_status', {days});
  } catch (error) {
    throw handleApiError(error);
  }
}

// ==========================================
// 用户资料相关
// ==========================================

/**
 * 获取用户资料
 */
export async function getUserProfile(userId: string): Promise<any | null> {
  try {
    const profiles = await get<any[]>('/user_profiles', {
      id: `eq.${userId}`,
      limit: 1,
    });
    return profiles.length > 0 ? profiles[0] : null;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  userId: string,
  updates: any,
): Promise<any> {
  try {
    const profiles = await patch<any[]>('/user_profiles', updates, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return profiles[0];
  } catch (error) {
    throw handleApiError(error);
  }
}

// ==========================================
// 标签占比相关
// ==========================================

/**
 * 获取用户标签占比
 * 查询加班和准时两类记录，返回 TagProportionItem 格式（驼峰命名）
 */
export async function getUserTagProportion(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<any[]> {
  try {
    // 查询用户在指定日期范围内的所有状态记录（加班 + 准时）
    const records = await get<any[]>('/status_records', {
      user_id: `eq.${userId}`,
      date: [`gte.${startDate}`, `lte.${endDate}`],
      select: 'tag_id,is_overtime',
    });

    // 统计每个标签的使用次数和加班/准时类型
    const tagStats = new Map<string, {count: number; isOvertime: boolean}>();
    (records || []).forEach(record => {
      const tagId = record.tag_id;
      if (tagId) {
        const existing = tagStats.get(tagId);
        if (existing) {
          existing.count += 1;
        } else {
          tagStats.set(tagId, {
            count: 1,
            isOvertime: record.is_overtime,
          });
        }
      }
    });

    if (tagStats.size === 0) return [];

    // 获取标签详情
    const tags = await getTags();
    const tagMap = new Map(tags.map(tag => [tag.id, tag]));

    // 构建 TagCountInput 格式，供 computePercentages 使用
    const tagCountInputs: {tagId: string; tagName: string; count: number; isOvertime: boolean}[] = [];
    tagStats.forEach((stats, tagId) => {
      const tag = tagMap.get(tagId);
      tagCountInputs.push({
        tagId,
        tagName: tag?.name || '未知标签',
        count: stats.count,
        isOvertime: stats.isOvertime,
      });
    });

    // 使用 computePercentages 计算百分比（最大余数法，确保总和为 100）
    return computePercentages(tagCountInputs);
  } catch (error) {
    throw handleApiError(error);
  }
}

// 导出所有服务
export const dataService = {
  // 用户
  getUserByPhone,
  getUserById,
  createUser,
  updateUser,
  getUserProfile,
  updateUserProfile,

  // 标签
  getTags,
  getTopTags,

  // 状态记录
  submitUserStatus,
  getUserTodayStatus,
  getUserStatusHistory,

  // 实时统计
  getRealTimeStats,
  getDailyStatus,

  // 标签占比
  getUserTagProportion,
};

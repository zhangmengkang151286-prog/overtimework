/**
 * 数据服务（已迁移到 PostgREST API）
 * 原 supabaseService.ts 的替代版本
 */

import {dataService} from './dataService';
import {get, post, patch, del, rpc} from './postgrestApi';
import {
  User,
  Tag,
  StatusRecord,
  RealTimeStats,
  TagStats,
  DailyStatus,
} from '../types';
import {PersonalStatusRecord} from '../types/my-page';
import {TagProportionItem} from '../types/tag-proportion';

/**
 * 数据服务类
 * 封装所有与 PostgREST API 的交互
 */
class DataServiceWrapper {
  // ============================================
  // 用户相关操作
  // ============================================

  /**
   * 获取用户信息
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      return await dataService.getUserById(userId);
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * 通过手机号获取用户
   */
  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      return await dataService.getUserByPhone(phoneNumber);
    } catch (error) {
      console.error('Get user by phone error:', error);
      return null;
    }
  }

  /**
   * 创建用户
   */
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      return await dataService.createUser(userData);
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const updates = {
        ...userData,
        updated_at: new Date().toISOString(),
      };
      return await dataService.updateUser(userId, updates);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  // ============================================
  // 标签相关操作
  // ============================================

  /**
   * 获取所有标签
   */
  async getTags(
    type?: string,
    search?: string,
    limit?: number,
    category?: string,
  ): Promise<Tag[]> {
    try {
      // 构建查询参数
      const params: Record<string, any> = {
        is_active: 'eq.true',
        order: 'usage_count.desc,name.asc',
      };

      if (type) {
        params.type = `eq.${type}`;
      }

      // 注意：RDS 的 tags 表可能没有 category 字段，先尝试查询
      // 如果报错会被 catch 捕获
      if (category) {
        params.category = `eq.${category}`;
      }

      if (search) {
        params.name = `ilike.*${search}*`;
      }

      if (limit) {
        params.limit = limit;
      }

      try {
        const tags = await get<any[]>('/tags', params);
        return tags.map(this.mapDatabaseTagToTag);
      } catch (error: any) {
        // 如果是 category 字段不存在的错误，去掉 category 重试
        if (error?.message?.includes('category') && category) {
          console.warn('tags 表没有 category 字段，忽略分类过滤');
          delete params.category;
          const tags = await get<any[]>('/tags', params);
          return tags.map(this.mapDatabaseTagToTag);
        }
        throw error;
      }
    } catch (error) {
      console.error('Get tags error:', error);
      throw error;
    }
  }

  /**
   * 创建标签
   */
  async createTag(tagData: Partial<Tag>): Promise<Tag> {
    try {
      const tags = await post<any[]>('/tags', tagData);
      return this.mapDatabaseTagToTag(tags[0]);
    } catch (error) {
      console.error('Create tag error:', error);
      throw error;
    }
  }

  /**
   * 更新标签
   */
  async updateTag(tagId: string, tagData: Partial<Tag>): Promise<Tag> {
    try {
      const tags = await patch<any[]>(`/tags?id=eq.${tagId}`, tagData);
      return this.mapDatabaseTagToTag(tags[0]);
    } catch (error) {
      console.error('Update tag error:', error);
      throw error;
    }
  }

  /**
   * 删除标签（软删除）
   */
  async deleteTag(tagId: string): Promise<void> {
    try {
      await patch(`/tags?id=eq.${tagId}`, {is_active: false});
    } catch (error) {
      console.error('Delete tag error:', error);
      throw error;
    }
  }

  // ============================================
  // 状态记录相关操作
  // ============================================

  /**
   * 提交用户状态
   * 允许同一用户同一天多次提交（累计模式）
   * 兼容驼峰（isOvertime）和下划线（is_overtime）两种字段名
   */
  async submitUserStatus(statusData: any): Promise<StatusRecord> {
    try {
      const userId = statusData.userId ?? statusData.user_id;
      const date = statusData.date;
      const isOvertime = statusData.isOvertime ?? statusData.is_overtime;
      const tagId = statusData.tagId ?? statusData.tag_id;
      const overtimeHours = statusData.overtimeHours ?? statusData.overtime_hours;

      return await dataService.submitUserStatus({
        userId: userId,
        date: date,
        isOvertime: isOvertime,
        tagId,
        overtimeHours,
      });
    } catch (error) {
      console.error('Submit user status error:', error);
      throw error;
    }
  }

  /**
   * 获取用户今日状态
   */
  async getUserTodayStatus(userId: string): Promise<StatusRecord | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await dataService.getUserTodayStatus(userId, today);
    } catch (error) {
      console.error('Get user today status error:', error);
      return null;
    }
  }

  // ============================================
  // 实时统计相关操作
  // ============================================

  /**
   * 获取实时统计数据
   */
  async getRealTimeStats(): Promise<RealTimeStats> {
    try {
      const result = await rpc<any[]>('get_real_time_stats', {});

      console.log('[dataService] getRealTimeStats RPC 原始返回 - data:', JSON.stringify(result));

      if (!result || (Array.isArray(result) && result.length === 0)) {
        console.log('[dataService] 无数据，返回默认值 0');
        return {
          participantCount: 0,
          overtimeCount: 0,
          onTimeCount: 0,
          lastUpdated: new Date(),
        };
      }

      // 兼容处理：RPC 可能返回数组或单个对象
      const stats = Array.isArray(result) ? result[0] : result;
      console.log('[dataService] 解析后 stats:', JSON.stringify(stats));
      
      return {
        participantCount: Number(stats.participant_count),
        overtimeCount: Number(stats.overtime_count),
        onTimeCount: Number(stats.on_time_count),
        lastUpdated: new Date(stats.last_updated),
      };
    } catch (error) {
      console.error('Get real time stats error:', error);
      throw error;
    }
  }

  /**
   * 获取 Top N 标签统计
   */
  async getTopTags(limit: number = 10): Promise<TagStats[]> {
    try {
      return await dataService.getTopTags(limit);
    } catch (error) {
      console.error('Get top tags error:', error);
      throw error;
    }
  }

  /**
   * 获取过去 N 天的状态
   */
  async getDailyStatus(days: number = 7): Promise<DailyStatus[]> {
    try {
      const result = await rpc<any[]>('get_daily_status', {days});

      // 使用工作日逻辑计算"今天"（06:00-次日05:59）
      const now = new Date();
      const hour = now.getHours();
      const todayWork = new Date(now);
      if (hour < 6) {
        todayWork.setDate(todayWork.getDate() - 1);
      }
      const todayStr = todayWork.toISOString().split('T')[0]; // YYYY-MM-DD

      const dailyStatus = (result || []).map((item: any) => {
        // item.date 是 YYYY-MM-DD 字符串
        const itemDateStr = typeof item.date === 'string'
          ? item.date.split('T')[0]
          : new Date(item.date).toISOString().split('T')[0];

        // 判断状态
        let status: 'overtime' | 'ontime' | 'pending';
        if (itemDateStr === todayStr) {
          // 今天的工作日还没结束，始终显示 pending（黄色闪烁）
          status = 'pending';
        } else {
          // 历史数据：根据 is_overtime_dominant 判断
          if (item.participant_count === 0) {
            status = 'pending';
          } else {
            status = item.is_overtime_dominant ? 'overtime' : 'ontime';
          }
        }

        return {
          date: item.date, // 保持为字符串，避免 Redux 序列化警告
          isOvertimeDominant: item.is_overtime_dominant,
          participantCount: item.participant_count,
          overtimeCount: item.overtime_count,
          onTimeCount: item.on_time_count,
          status,
        };
      });

      // 如果数据库中没有今天的数据，手动添加一个 pending 状态
      const hasTodayData = dailyStatus.some(item => {
        const itemDateStr = typeof item.date === 'string'
          ? item.date.split('T')[0]
          : new Date(item.date).toISOString().split('T')[0];
        return itemDateStr === todayStr;
      });

      if (!hasTodayData) {
        dailyStatus.push({
          date: todayStr,
          isOvertimeDominant: false,
          participantCount: 0,
          overtimeCount: 0,
          onTimeCount: 0,
          status: 'pending' as const,
        });
      }

      return dailyStatus;
    } catch (error) {
      console.error('Get daily status error:', error);
      throw error;
    }
  }

  // ============================================
  // 历史数据查询
  // ============================================

  /**
   * 获取指定日期的历史数据
   */
  async getHistoricalDataByDate(date: string): Promise<DailyStatus | null> {
    try {
      const data = await get<any[]>('/daily_history', {
        date: `eq.${date}`,
        limit: 1,
      });

      if (!data || data.length === 0) {
        return null;
      }

      const historyData = data[0];
      const isOvertimeDominant =
        historyData.overtime_count > historyData.on_time_count;

      return {
        date: new Date(historyData.date),
        isOvertimeDominant,
        participantCount: historyData.participant_count,
        overtimeCount: historyData.overtime_count,
        onTimeCount: historyData.on_time_count,
        status: isOvertimeDominant ? 'overtime' : 'ontime',
      };
    } catch (error) {
      console.error('Get historical data by date error:', error);
      throw error;
    }
  }

  /**
   * 获取日期范围内的历史数据
   */
  async getHistoricalDataRange(
    startDate: string,
    endDate: string,
  ): Promise<DailyStatus[]> {
    try {
      const data = await get<any[]>('/daily_history', {
        date: [`gte.${startDate}`, `lte.${endDate}`],
        order: 'date.desc',
      });

      return (data || []).map(item => {
        const isOvertimeDominant = item.overtime_count > item.on_time_count;
        return {
          date: new Date(item.date),
          isOvertimeDominant,
          participantCount: item.participant_count,
          overtimeCount: item.overtime_count,
          onTimeCount: item.on_time_count,
          status: isOvertimeDominant ? 'overtime' : 'ontime',
        };
      });
    } catch (error) {
      console.error('Get historical data range error:', error);
      throw error;
    }
  }

  /**
   * 获取指定日期的标签分布
   */
  async getHistoricalTagDistribution(date: string): Promise<TagStats[]> {
    try {
      const data = await get<any[]>('/daily_history', {
        date: `eq.${date}`,
        select: 'tag_distribution',
        limit: 1,
      });

      if (!data || data.length === 0 || !data[0].tag_distribution) {
        return [];
      }

      // tag_distribution 是 JSONB 类型
      const distribution = data[0].tag_distribution as any[];
      return distribution.map(item => ({
        tagId: item.tag_id,
        tagName: item.tag_name,
        overtimeCount: Number(item.overtime_count),
        onTimeCount: Number(item.on_time_count),
        totalCount: Number(item.total_count),
      }));
    } catch (error) {
      console.error('Get historical tag distribution error:', error);
      throw error;
    }
  }

  // ============================================
  // 实时订阅（改为轮询）
  // ============================================

  /**
   * 订阅实时统计更新（使用轮询替代 Realtime）
   */
  subscribeToRealTimeStats(
    callback: (stats: RealTimeStats) => void,
  ): () => void {
    // 立即执行一次
    this.getRealTimeStats()
      .then(callback)
      .catch(error => console.error('Initial stats fetch error:', error));

    // 每 5 秒轮询一次
    const interval = setInterval(async () => {
      try {
        const stats = await this.getRealTimeStats();
        callback(stats);
      } catch (error) {
        console.error('Error fetching stats in subscription:', error);
      }
    }, 5000);

    // 返回取消订阅函数
    return () => {
      clearInterval(interval);
    };
  }

  /**
   * 订阅标签变化（使用轮询替代 Realtime）
   */
  subscribeToTags(callback: (tags: Tag[]) => void): () => void {
    // 立即执行一次
    this.getTags()
      .then(callback)
      .catch(error => console.error('Initial tags fetch error:', error));

    // 每 10 秒轮询一次（标签变化不频繁）
    const interval = setInterval(async () => {
      try {
        const tags = await this.getTags();
        callback(tags);
      } catch (error) {
        console.error('Error fetching tags in subscription:', error);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }

  // ============================================
  // 个人数据查询（我的页面）
  // ============================================

  /**
   * 获取用户指定月份的状态记录
   */
  async getUserMonthlyRecords(
    userId: string,
    year: number,
    month: number,
  ): Promise<PersonalStatusRecord[]> {
    try {
      // 计算月份的起止日期
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // 查询状态记录（包含标签信息）
      const records = await get<any[]>('/status_records', {
        user_id: `eq.${userId}`,
        date: [`gte.${startDate}`, `lte.${endDate}`],
        select: 'date,is_overtime,overtime_hours,tag_id',
        order: 'date.asc',
      });

      // 获取所有标签
      const tags = await this.getTags();
      const tagMap = new Map(tags.map(tag => [tag.id, tag]));

      // 按日期聚合记录
      const recordsByDate = new Map<string, {
        date: string;
        isOvertime: boolean;
        overtimeHours: number;
        tagIds: string[];
        tagNames: string[];
      }>();

      (records || []).forEach((record) => {
        const existing = recordsByDate.get(record.date);
        const tagId = record.tag_id;
        const tag = tagId ? tagMap.get(tagId) : null;
        const tagName = tag?.name;

        if (existing) {
          // 同一天的额外标签
          if (tagId && !existing.tagIds.includes(tagId)) {
            existing.tagIds.push(tagId);
          }
          if (tagName && !existing.tagNames.includes(tagName)) {
            existing.tagNames.push(tagName);
          }
        } else {
          // 新日期
          recordsByDate.set(record.date, {
            date: record.date,
            isOvertime: record.is_overtime,
            overtimeHours: record.is_overtime ? (Number(record.overtime_hours) || 0) : 0,
            tagIds: tagId ? [tagId] : [],
            tagNames: tagName ? [tagName] : [],
          });
        }
      });

      // 转换为数组
      return Array.from(recordsByDate.values()).map(
        (record): PersonalStatusRecord => ({
          date: record.date,
          isOvertime: record.isOvertime,
          overtimeHours: record.overtimeHours,
          tagIds: record.tagIds.length > 0 ? record.tagIds : undefined,
          tagNames: record.tagNames.length > 0 ? record.tagNames : undefined,
        }),
      );
    } catch (error) {
      console.error('获取用户月度记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户指定日期范围的状态记录（用于趋势图）
   */
  async getUserTrendData(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<PersonalStatusRecord[]> {
    try {
      const records = await get<any[]>('/status_records', {
        user_id: `eq.${userId}`,
        date: [`gte.${startDate}`, `lte.${endDate}`],
        select: 'date,is_overtime,overtime_hours',
        order: 'date.asc',
      });

      return (records || []).map(
        (record): PersonalStatusRecord => ({
          date: record.date,
          isOvertime: record.is_overtime,
          overtimeHours: record.is_overtime ? record.overtime_hours || 0 : 0,
        }),
      );
    } catch (error) {
      console.error('获取用户趋势数据失败:', error);
      throw error;
    }
  }

  // ============================================
  // 标签占比查询
  // ============================================

  /**
   * 获取用户指定月份的标签占比数据
   */
  async getUserTagProportion(
    userId: string,
    year: number,
    month: number,
  ): Promise<TagProportionItem[]> {
    try {
      // 将年月转换为日期范围
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return await dataService.getUserTagProportion(userId, startDate, endDate);
    } catch (error) {
      console.error('获取用户标签占比数据失败:', error);
      throw error;
    }
  }

  // ============================================
  // 数据映射辅助函数
  // ============================================

  /**
   * 删除用户账号及所有关联数据
   * 级联删除：status_records、sms_codes、daily_history 中该用户的记录
   */
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // 1. 删除用户的状态记录
      await del('/status_records', {user_id: userId});
      // 2. 删除用户的短信验证码记录（通过手机号关联，先获取手机号）
      const user = await this.getUser(userId);
      if (user?.phoneNumber) {
        await del('/sms_codes', {phone_number: user.phoneNumber});
      }
      // 3. 删除用户记录
      await del('/users', {id: userId});
    } catch (error) {
      console.error('Delete user account error:', error);
      throw error;
    }
  }

  private mapDatabaseTagToTag(dbTag: any): Tag {
    return {
      id: dbTag.id,
      name: dbTag.name,
      type: dbTag.type,
      category: dbTag.category || 'ontime',
      subcategory: dbTag.subcategory || undefined,
      isActive: dbTag.is_active,
      usageCount: dbTag.usage_count,
      createdAt: new Date(dbTag.created_at),
    };
  }
}

// 导出单例
export const supabaseService = new DataServiceWrapper();

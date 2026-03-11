import {supabase, handleSupabaseError, Database} from './supabase';
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
import {computePercentages, TagCountInput} from '../utils/tagProportionUtils';

/**
 * Supabase 数据服务
 * 封装所有与 Supabase 的交互
 */
class SupabaseService {
  // ============================================
  // 用户相关操作
  // ============================================

  /**
   * 获取用户信息
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const {data, error} = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw handleSupabaseError(error);

      return data
        ? this.mapDatabaseUserToUser(
            data as Database['public']['Tables']['users']['Row'],
          )
        : null;
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
      const {data, error} = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw handleSupabaseError(error);
      }

      return data
        ? this.mapDatabaseUserToUser(
            data as Database['public']['Tables']['users']['Row'],
          )
        : null;
    } catch (error) {
      console.error('Get user by phone error:', error);
      return null;
    }
  }

  /**
   * 创建用户
   */
  async createUser(
    userData: Database['public']['Tables']['users']['Insert'],
  ): Promise<User> {
    try {
      const {data, error} = await supabase
        .from('users')
        .insert(userData as any)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      return this.mapDatabaseUserToUser(
        data as Database['public']['Tables']['users']['Row'],
      );
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(
    userId: string,
    userData: Database['public']['Tables']['users']['Update'],
  ): Promise<User> {
    try {
      const updateData = {
        ...userData,
        updated_at: new Date().toISOString(),
      };

      const {data, error} = await (
        supabase.from('users').update(updateData as any) as any
      )
        .eq('id', userId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      return this.mapDatabaseUserToUser(
        data as Database['public']['Tables']['users']['Row'],
      );
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
      let query = supabase.from('tags').select('*').eq('is_active', true);

      if (type) {
        query = query.eq('type', type);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (limit) {
        query = query.limit(limit);
      }

      query = query.order('usage_count', {ascending: false});

      const {data, error} = await query;

      if (error) throw handleSupabaseError(error);

      return (data as Database['public']['Tables']['tags']['Row'][]).map(
        this.mapDatabaseTagToTag,
      );
    } catch (error) {
      console.error('Get tags error:', error);
      throw error;
    }
  }

  /**
   * 创建标签
   */
  async createTag(
    tagData: Database['public']['Tables']['tags']['Insert'],
  ): Promise<Tag> {
    try {
      const {data, error} = await supabase
        .from('tags')
        .insert(tagData as any)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      return this.mapDatabaseTagToTag(
        data as Database['public']['Tables']['tags']['Row'],
      );
    } catch (error) {
      console.error('Create tag error:', error);
      throw error;
    }
  }

  /**
   * 更新标签
   */
  async updateTag(
    tagId: string,
    tagData: Database['public']['Tables']['tags']['Update'],
  ): Promise<Tag> {
    try {
      const {data, error} = await supabase
        .from('tags')
        .update(tagData as any)
        .eq('id', tagId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      return this.mapDatabaseTagToTag(
        data as Database['public']['Tables']['tags']['Row'],
      );
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
      const {error} = await (
        supabase.from('tags').update({is_active: false} as any) as any
      ).eq('id', tagId);

      if (error) throw handleSupabaseError(error);
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
   */
  async submitUserStatus(
    statusData: Database['public']['Tables']['status_records']['Insert'],
  ): Promise<StatusRecord> {
    try {
      const {data, error} = await (
        supabase.from('status_records').insert(statusData as any) as any
      )
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      return this.mapDatabaseStatusToStatus(
        data as Database['public']['Tables']['status_records']['Row'],
      );
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

      const {data, error} = await supabase
        .from('status_records')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw handleSupabaseError(error);
      }

      return data
        ? this.mapDatabaseStatusToStatus(
            data as Database['public']['Tables']['status_records']['Row'],
          )
        : null;
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
      const {data, error} = await supabase.rpc('get_real_time_stats');

      console.log('[supabaseService] getRealTimeStats RPC 原始返回 - data:', JSON.stringify(data), 'error:', error);

      if (error) throw handleSupabaseError(error);

      if (!data || (Array.isArray(data) && (data as any[]).length === 0)) {
        console.log('[supabaseService] 无数据，返回默认值 0');
        return {
          participantCount: 0,
          overtimeCount: 0,
          onTimeCount: 0,
          lastUpdated: new Date(),
        };
      }

      // 兼容处理：RPC 可能返回数组或单个对象
      const stats = Array.isArray(data) ? (data as any[])[0] : data;
      console.log('[supabaseService] 解析后 stats:', JSON.stringify(stats));
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
      const {data, error} = await supabase.rpc('get_top_tags', {
        limit_count: limit,
      } as any);

      if (error) throw handleSupabaseError(error);

      return ((data as any[]) || []).map((item: any) => ({
        tagId: item.tag_id,
        tagName: item.tag_name,
        overtimeCount: Number(item.overtime_count),
        onTimeCount: Number(item.on_time_count),
        totalCount: Number(item.total_count),
      }));
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
      const {data, error} = await supabase.rpc('get_daily_status', {
        days,
      } as any);

      if (error) throw handleSupabaseError(error);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = ((data as any[]) || []).map((item: any) => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);

        // 判断状态
        let status: 'overtime' | 'ontime' | 'pending';
        if (itemDate.getTime() === today.getTime()) {
          // 今天：如果没有数据或数据为0，显示 pending
          if (item.participant_count === 0) {
            status = 'pending';
          } else {
            status = item.is_overtime_dominant ? 'overtime' : 'ontime';
          }
        } else {
          // 历史数据：根据 is_overtime_dominant 判断
          status = item.is_overtime_dominant ? 'overtime' : 'ontime';
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
      const hasTodayData = result.some(item => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === today.getTime();
      });

      if (!hasTodayData) {
        result.push({
          date: today.toISOString(), // 转换为 ISO 字符串
          isOvertimeDominant: false,
          participantCount: 0,
          overtimeCount: 0,
          onTimeCount: 0,
          status: 'pending',
        });
      }

      return result;
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
      const {data, error} = await supabase
        .from('daily_history')
        .select('*')
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw handleSupabaseError(error);
      }

      if (!data) {
        return null;
      }

      const historyData =
        data as Database['public']['Tables']['daily_history']['Row'];
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
      const {data, error} = await supabase
        .from('daily_history')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', {ascending: false});

      if (error) throw handleSupabaseError(error);

      return (
        (data as Database['public']['Tables']['daily_history']['Row'][]) || []
      ).map(item => {
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
      const {data, error} = await supabase
        .from('daily_history')
        .select('tag_distribution')
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw handleSupabaseError(error);
      }

      if (!data) {
        return [];
      }

      const historyData = data as {tag_distribution: any};
      if (!historyData.tag_distribution) {
        return [];
      }

      // tag_distribution 是 JSONB 类型
      const distribution = historyData.tag_distribution as any[];
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
  // 实时订阅
  // ============================================

  /**
   * 订阅实时统计更新
   */
  subscribeToRealTimeStats(
    callback: (stats: RealTimeStats) => void,
  ): () => void {
    const channel = supabase
      .channel('real_time_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'status_records',
        },
        async () => {
          // 当有新的状态记录时，重新获取统计数据
          try {
            const stats = await this.getRealTimeStats();
            callback(stats);
          } catch (error) {
            console.error('Error fetching stats in subscription:', error);
          }
        },
      )
      .subscribe();

    // 返回取消订阅函数
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * 订阅标签变化
   */
  subscribeToTags(callback: (tags: Tag[]) => void): () => void {
    const channel = supabase
      .channel('tags_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags',
        },
        async () => {
          try {
            const tags = await this.getTags();
            callback(tags);
          } catch (error) {
            console.error('Error fetching tags in subscription:', error);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // ============================================
  // 个人数据查询（我的页面）
  // ============================================

  /**
   * 获取用户指定月份的状态记录
   * 需求: 7.1, 7.2
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

      const {data, error} = await supabase
        .from('status_records')
        .select(`
          date, 
          is_overtime, 
          overtime_hours,
          tag_id,
          tags:tag_id (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', {ascending: true});

      if (error) throw handleSupabaseError(error);

      // 按日期聚合记录（同一天可能有多个标签）
      const recordsByDate = new Map<string, {
        date: string;
        isOvertime: boolean;
        overtimeHours: number;
        tagIds: string[];
        tagNames: string[];
      }>();

      ((data as any[]) || []).forEach((record) => {
        const existing = recordsByDate.get(record.date);
        const tagId = record.tag_id;
        const tagName = record.tags?.name;

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
   * 需求: 7.1, 7.2
   */
  async getUserTrendData(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<PersonalStatusRecord[]> {
    try {
      const {data, error} = await supabase
        .from('status_records')
        .select('date, is_overtime, overtime_hours')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', {ascending: true});

      if (error) throw handleSupabaseError(error);

      return ((data as any[]) || []).map(
        (record): PersonalStatusRecord => ({
          date: record.date,
          isOvertime: record.is_overtime,
          overtimeHours: record.is_overtime
            ? record.overtime_hours || 0
            : 0,
        }),
      );
    } catch (error) {
      console.error('获取用户趋势数据失败:', error);
      throw error;
    }
  }

  // ============================================
  // 标签占比查询（标签占比模块）
  // ============================================

  /**
   * 获取用户指定月份的标签占比数据
   * 从 status_records 表查询指定用户指定月份的记录，按标签分组统计次数，
   * 关联 tags 表获取标签名称和类别，计算百分比。
   * 需求: 6.1, 6.2
   */
  async getUserTagProportion(
    userId: string,
    year: number,
    month: number,
  ): Promise<TagProportionItem[]> {
    try {
      // 计算月份的起止日期
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // 查询该用户该月所有状态记录（包含 tag_id 和 is_overtime）
      const {data, error} = await supabase
        .from('status_records')
        .select('tag_id, is_overtime')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .not('tag_id', 'is', null);

      if (error) throw handleSupabaseError(error);

      const records = (data as any[]) || [];
      if (records.length === 0) {
        return [];
      }

      // 按 tag_id 分组统计次数和加班状态
      const tagCountMap = new Map<
        string,
        {count: number; isOvertime: boolean}
      >();
      for (const record of records) {
        const tagId = record.tag_id as string;
        const existing = tagCountMap.get(tagId);
        if (existing) {
          existing.count += 1;
        } else {
          tagCountMap.set(tagId, {
            count: 1,
            isOvertime: record.is_overtime as boolean,
          });
        }
      }

      // 获取所有相关标签的名称和类别
      const tagIds = Array.from(tagCountMap.keys());
      const {data: tagsData, error: tagsError} = await supabase
        .from('tags')
        .select('id, name, category')
        .in('id', tagIds);

      if (tagsError) throw handleSupabaseError(tagsError);

      // 构建标签信息映射
      const tagInfoMap = new Map<
        string,
        {name: string; category: string}
      >();
      for (const tag of (tagsData as any[]) || []) {
        tagInfoMap.set(tag.id, {
          name: tag.name,
          category: tag.category || 'ontime',
        });
      }

      // 构建 TagCountInput 数组
      const tagCounts: TagCountInput[] = [];
      for (const [tagId, info] of tagCountMap.entries()) {
        const tagInfo = tagInfoMap.get(tagId);
        tagCounts.push({
          tagId,
          tagName: tagInfo?.name || tagId,
          count: info.count,
          isOvertime: tagInfo
            ? tagInfo.category === 'overtime'
            : info.isOvertime,
        });
      }

      // 使用 computePercentages 计算百分比
      return computePercentages(tagCounts);
    } catch (error) {
      console.error('获取用户标签占比数据失败:', error);
      throw error;
    }
  }

  // ============================================
  // 数据映射辅助函数
  // ============================================

  private mapDatabaseUserToUser(
    dbUser: Database['public']['Tables']['users']['Row'],
  ): User {
    return {
      id: dbUser.id,
      phoneNumber: dbUser.phone_number || '',
      wechatId: dbUser.wechat_openid || undefined,
      avatar: dbUser.avatar_url || '',
      username: dbUser.username,
      province: dbUser.province,
      city: dbUser.city,
      industry: dbUser.industry,
      company: dbUser.company,
      position: dbUser.position,
      workStartTime: dbUser.work_start_time,
      workEndTime: dbUser.work_end_time,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
    };
  }

  private mapDatabaseTagToTag(
    dbTag: Database['public']['Tables']['tags']['Row'],
  ): Tag {
    return {
      id: dbTag.id,
      name: dbTag.name,
      type: dbTag.type,
      category: (dbTag as any).category || 'ontime',
      subcategory: (dbTag as any).subcategory || undefined,
      isActive: dbTag.is_active,
      usageCount: dbTag.usage_count,
      createdAt: new Date(dbTag.created_at),
    };
  }

  private mapDatabaseStatusToStatus(
    dbStatus: Database['public']['Tables']['status_records']['Row'],
  ): StatusRecord {
    return {
      id: dbStatus.id,
      userId: dbStatus.user_id,
      date: dbStatus.date,
      isOvertime: dbStatus.is_overtime,
      tagId: dbStatus.tag_id || undefined,
      overtimeHours: dbStatus.overtime_hours || undefined,
      submittedAt: new Date(dbStatus.submitted_at),
    };
  }
}

// 导出单例
export const supabaseService = new SupabaseService();

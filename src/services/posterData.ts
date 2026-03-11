/**
 * 海报数据服务
 * 负责获取和处理海报所需的各种数据
 */

import {supabaseService} from './supabaseService';
import {supabase} from './supabase';
import {
  UserInfo,
  TrendData,
  CalendarData,
  OvertimeTrendData,
  TagProportionData,
  TimelineDataPoint,
  TagData,
  DayStatus,
  TrendPoint,
  TagProportion,
} from '../types/poster';

/**
 * 获取树状图颜色（简化版，用于海报）
 * 为每个索引分配一个固定的颜色
 */
function getTreemapColor(index: number): string {
  const colors = [
    'hsla(0, 65%, 47%, 0.7)',    // 红色
    'hsla(120, 50%, 42%, 0.7)',  // 绿色
    'hsla(8, 70%, 52%, 0.7)',    // 橙红色
    'hsla(135, 55%, 45%, 0.7)',  // 青绿色
    'hsla(15, 65%, 50%, 0.7)',   // 橙色
    'hsla(150, 50%, 40%, 0.7)',  // 深绿色
    'hsla(5, 60%, 45%, 0.7)',    // 深红色
    'hsla(125, 45%, 38%, 0.7)',  // 墨绿色
    'hsla(10, 68%, 48%, 0.7)',   // 朱红色
    'hsla(140, 52%, 43%, 0.7)',  // 翠绿色
  ];
  return colors[index % colors.length];
}

/**
 * 海报数据服务类
 */
class PosterDataService {
  /**
   * 获取用户信息
   * 用于海报头部显示
   */
  async getUserInfo(userId: string): Promise<UserInfo> {
    try {
      const user = await supabaseService.getUser(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }

      return {
        avatar: user.avatar || '',
        username: user.username || '未知用户',
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取趋势界面数据
   * 包含实时统计、时间轴和标签分布
   */
  async getTrendData(): Promise<TrendData> {
    try {
      // 获取实时统计数据
      const stats = await supabaseService.getRealTimeStats();
      
      // 获取今日时间轴数据（每小时快照）
      const timeline = await this.getTimelineData();
      
      // 获取标签分布
      const tagDistribution = await this.getTagDistribution();

      return {
        participants: stats.participantCount,
        onTimeCount: stats.onTimeCount,
        overtimeCount: stats.overtimeCount,
        timeline,
        tagDistribution,
      };
    } catch (error) {
      console.error('获取趋势界面数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取时间轴数据（今日每小时快照）
   */
  private async getTimelineData(): Promise<TimelineDataPoint[]> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const snapshotDate = `${year}-${month}-${day}`;

      const {data, error} = await supabase
        .from('hourly_snapshots')
        .select('*')
        .eq('snapshot_date', snapshotDate)
        .order('snapshot_hour', {ascending: true});

      if (error) {
        console.error('获取时间轴数据失败:', error);
        return [];
      }

      return ((data as any[]) || []).map((snapshot) => ({
        hour: snapshot.snapshot_hour,
        onTimeCount: snapshot.on_time_count || 0,
        overtimeCount: snapshot.overtime_count || 0,
        timestamp: snapshot.snapshot_time,
      }));
    } catch (error) {
      console.error('获取时间轴数据失败:', error);
      return [];
    }
  }

  /**
   * 获取标签分布数据
   */
  private async getTagDistribution(): Promise<TagData[]> {
    try {
      const tagStats = await supabaseService.getTopTags(10);
      
      // 计算总数
      const total = tagStats.reduce((sum, tag) => sum + tag.totalCount, 0);
      
      return tagStats.map((tag, index) => ({
        tag_id: tag.tagId,
        tag_name: tag.tagName,
        count: tag.totalCount,
        percentage: total > 0 ? (tag.totalCount / total) * 100 : 0,
        color: getTreemapColor(index),
      }));
    } catch (error) {
      console.error('获取标签分布数据失败:', error);
      return [];
    }
  }

  /**
   * 获取日历数据
   * 显示指定月份的打卡记录
   */
  async getCalendarData(
    userId: string,
    year: number,
    month: number,
  ): Promise<CalendarData> {
    try {
      // 获取用户该月的状态记录
      const records = await supabaseService.getUserMonthlyRecords(
        userId,
        year,
        month,
      );

      // 转换为日历格式
      const days: DayStatus[] = records.map((record) => ({
        date: record.date,
        status: record.isOvertime ? 'overtime' : 'ontime',
        timestamp: record.date,
      }));

      return {
        year,
        month,
        days,
      };
    } catch (error) {
      console.error('获取日历数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取加班趋势数据
   * 根据不同维度（天/周/月）聚合数据
   */
  async getOvertimeTrendData(
    userId: string,
    dimension: 'day' | 'week' | 'month',
  ): Promise<OvertimeTrendData> {
    try {
      const dataPoints = await this.getTrendDataPoints(userId, dimension);

      return {
        dimension,
        dataPoints,
      };
    } catch (error) {
      console.error('获取加班趋势数据失败:', error);
      throw error;
    }
  }

  /**
   * 根据维度获取趋势数据点
   */
  private async getTrendDataPoints(
    userId: string,
    dimension: 'day' | 'week' | 'month',
  ): Promise<TrendPoint[]> {
    try {
      // 计算日期范围
      const {startDate, endDate} = this.getDateRange(dimension);

      // 获取用户趋势数据
      const records = await supabaseService.getUserTrendData(
        userId,
        startDate,
        endDate,
      );

      // 根据维度聚合数据
      if (dimension === 'day') {
        // 按天统计
        return this.aggregateByDay(records);
      } else if (dimension === 'week') {
        // 按周统计
        return this.aggregateByWeek(records);
      } else {
        // 按月统计
        return this.aggregateByMonth(records);
      }
    } catch (error) {
      console.error('获取趋势数据点失败:', error);
      return [];
    }
  }

  /**
   * 获取日期范围
   */
  private getDateRange(dimension: 'day' | 'week' | 'month'): {
    startDate: string;
    endDate: string;
  } {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate: string;

    if (dimension === 'day') {
      // 最近30天
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      startDate = start.toISOString().split('T')[0];
    } else if (dimension === 'week') {
      // 最近12周
      const start = new Date(now);
      start.setDate(start.getDate() - 12 * 7);
      startDate = start.toISOString().split('T')[0];
    } else {
      // 最近12个月
      const start = new Date(now);
      start.setMonth(start.getMonth() - 12);
      startDate = start.toISOString().split('T')[0];
    }

    return {startDate, endDate};
  }

  /**
   * 按天聚合数据
   */
  private aggregateByDay(records: any[]): TrendPoint[] {
    const dataMap = new Map<string, number>();

    records.forEach((record) => {
      const date = record.date;
      if (record.isOvertime) {
        dataMap.set(date, (dataMap.get(date) || 0) + 1);
      }
    });

    return Array.from(dataMap.entries())
      .map(([date, value]) => ({
        date,
        value,
        label: this.formatDateLabel(date, 'day'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 按周聚合数据
   */
  private aggregateByWeek(records: any[]): TrendPoint[] {
    const dataMap = new Map<string, number>();

    records.forEach((record) => {
      if (record.isOvertime) {
        const weekKey = this.getWeekKey(record.date);
        dataMap.set(weekKey, (dataMap.get(weekKey) || 0) + 1);
      }
    });

    return Array.from(dataMap.entries())
      .map(([date, value]) => ({
        date,
        value,
        label: this.formatDateLabel(date, 'week'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 按月聚合数据
   */
  private aggregateByMonth(records: any[]): TrendPoint[] {
    const dataMap = new Map<string, number>();

    records.forEach((record) => {
      if (record.isOvertime) {
        const monthKey = record.date.substring(0, 7); // YYYY-MM
        dataMap.set(monthKey, (dataMap.get(monthKey) || 0) + 1);
      }
    });

    return Array.from(dataMap.entries())
      .map(([date, value]) => ({
        date,
        value,
        label: this.formatDateLabel(date, 'month'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 获取周的键值（周一的日期）
   */
  private getWeekKey(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  /**
   * 格式化日期标签
   */
  private formatDateLabel(
    date: string,
    dimension: 'day' | 'week' | 'month',
  ): string {
    if (dimension === 'day') {
      // MM/DD
      const [, month, day] = date.split('-');
      return `${month}/${day}`;
    } else if (dimension === 'week') {
      // MM/DD (周一)
      const [, month, day] = date.split('-');
      return `${month}/${day}`;
    } else {
      // YYYY-MM
      const [year, month] = date.split('-');
      return `${year}年${month}月`;
    }
  }

  /**
   * 获取标签占比数据
   * 显示指定月份的标签使用占比
   */
  async getTagProportionData(
    userId: string,
    year: number,
    month: number,
  ): Promise<TagProportionData> {
    try {
      // 获取用户该月的标签占比
      const tagProportions = await supabaseService.getUserTagProportion(
        userId,
        year,
        month,
      );

      // 转换为海报格式，添加颜色
      const tags: TagProportion[] = tagProportions.map((item, index) => ({
        tag_id: item.tagId,
        tag_name: item.tagName,
        count: item.count,
        percentage: item.percentage,
        color: getTreemapColor(index),
      }));

      return {
        year,
        month,
        tags,
      };
    } catch (error) {
      console.error('获取标签占比数据失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const posterDataService = new PosterDataService();

import { query } from '../database/connection';
import { getCache, setCache } from '../cache/redis';
import { Statistics, TopTagsStatistics } from '../types';

const CACHE_TTL = 3; // 3秒缓存

export class StatisticsService {
  // 获取今日实时统计
  async getTodayStatistics(): Promise<Statistics> {
    const cacheKey = 'today_statistics';
    const cached = await getCache<Statistics>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const today = new Date().toISOString().split('T')[0];
    
    const result = await query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_participants,
        COUNT(CASE WHEN status = 'on_time' THEN 1 END) as on_time_count,
        COUNT(CASE WHEN status = 'overtime' THEN 1 END) as overtime_count
      FROM daily_submissions
      WHERE submission_date = $1
    `, [today]);

    const row = result.rows[0];
    const total = parseInt(row.total_participants) || 0;
    const onTime = parseInt(row.on_time_count) || 0;
    const overtime = parseInt(row.overtime_count) || 0;

    const stats: Statistics = {
      totalParticipants: total,
      onTimeCount: onTime,
      overtimeCount: overtime,
      onTimePercentage: total > 0 ? (onTime / total) * 100 : 0,
      overtimePercentage: total > 0 ? (overtime / total) * 100 : 0,
    };

    await setCache(cacheKey, stats, CACHE_TTL);
    return stats;
  }

  // 获取Top标签统计
  async getTopTagsStatistics(): Promise<TopTagsStatistics> {
    const cacheKey = 'top_tags_statistics';
    const cached = await getCache<TopTagsStatistics>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const today = new Date().toISOString().split('T')[0];

    // 获取准时下班的Top10标签
    const onTimeResult = await query(`
      SELECT t.id as tag_id, t.name, COUNT(*) as count
      FROM submission_tags st
      JOIN tags t ON st.tag_id = t.id
      JOIN daily_submissions ds ON st.submission_id = ds.id
      WHERE ds.submission_date = $1 AND ds.status = 'on_time'
      GROUP BY t.id, t.name
      ORDER BY count DESC
      LIMIT 10
    `, [today]);

    // 获取加班的Top10标签
    const overtimeResult = await query(`
      SELECT t.id as tag_id, t.name, COUNT(*) as count
      FROM submission_tags st
      JOIN tags t ON st.tag_id = t.id
      JOIN daily_submissions ds ON st.submission_id = ds.id
      WHERE ds.submission_date = $1 AND ds.status = 'overtime'
      GROUP BY t.id, t.name
      ORDER BY count DESC
      LIMIT 10
    `, [today]);

    const stats = await this.getTodayStatistics();

    const onTimeTags = onTimeResult.rows.map(row => ({
      tagId: row.tag_id,
      name: row.name,
      count: parseInt(row.count),
      percentage: stats.onTimeCount > 0 ? (parseInt(row.count) / stats.onTimeCount) * 100 : 0,
    }));

    const overtimeTags = overtimeResult.rows.map(row => ({
      tagId: row.tag_id,
      name: row.name,
      count: parseInt(row.count),
      percentage: stats.overtimeCount > 0 ? (parseInt(row.count) / stats.overtimeCount) * 100 : 0,
    }));

    const onTimeTagsTotal = onTimeTags.reduce((sum, tag) => sum + tag.count, 0);
    const overtimeTagsTotal = overtimeTags.reduce((sum, tag) => sum + tag.count, 0);

    const result: TopTagsStatistics = {
      onTimeTags,
      overtimeTags,
      otherOnTime: {
        count: stats.onTimeCount - onTimeTagsTotal,
        percentage: stats.onTimeCount > 0 ? ((stats.onTimeCount - onTimeTagsTotal) / stats.onTimeCount) * 100 : 0,
      },
      otherOvertime: {
        count: stats.overtimeCount - overtimeTagsTotal,
        percentage: stats.overtimeCount > 0 ? ((stats.overtimeCount - overtimeTagsTotal) / stats.overtimeCount) * 100 : 0,
      },
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  // 获取历史统计
  async getHistoricalStatistics(days: number = 7) {
    const result = await query(`
      SELECT 
        stat_date,
        total_participants,
        on_time_count,
        overtime_count,
        on_time_percentage,
        overtime_percentage
      FROM daily_statistics
      ORDER BY stat_date DESC
      LIMIT $1
    `, [days]);

    return result.rows.map(row => ({
      date: row.stat_date,
      totalParticipants: row.total_participants,
      onTimeCount: row.on_time_count,
      overtimeCount: row.overtime_count,
      onTimePercentage: parseFloat(row.on_time_percentage),
      overtimePercentage: parseFloat(row.overtime_percentage),
      winner: row.on_time_count > row.overtime_count ? 'on_time' : 
              row.overtime_count > row.on_time_count ? 'overtime' : 'tie',
    }));
  }
}

export const statisticsService = new StatisticsService();

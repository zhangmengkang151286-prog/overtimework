/**
 * OptionsDataService - 选项数据服务
 *
 * 负责从Supabase数据库查询行业、公司、职位、省份、城市等选项数据
 * 支持搜索过滤和排序功能,并使用缓存优化性能
 */

import {get} from '../postgrestApi';
import {cacheService} from './CacheService';

export interface SelectOption {
  id: string;
  label: string;
  value: string;
  usageCount?: number;
  category?: string; // 职位的行业分类
}

export type SortBy = 'frequency' | 'alphabetical';

export class OptionsDataService {
  private static instance: OptionsDataService;

  // 缓存TTL: 30分钟
  private readonly CACHE_TTL = 30 * 60 * 1000;

  private constructor() {}

  static getInstance(): OptionsDataService {
    if (!OptionsDataService.instance) {
      OptionsDataService.instance = new OptionsDataService();
    }
    return OptionsDataService.instance;
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(type: string, params: Record<string, any>): string {
    const paramStr = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `options:${type}:${paramStr}`;
  }

  /**
   * 获取行业列表
   * @param search 搜索关键字（可选）
   * @param sortBy 排序方式：frequency（使用频率）或 alphabetical（字母顺序）
   */
  async getIndustries(
    search?: string,
    sortBy: SortBy = 'frequency',
  ): Promise<SelectOption[]> {
    try {
      const params: any = {
        is_active: 'eq.true',
        select: 'id,name,usage_count',
      };
      if (search && search.trim()) {
        params.name = `ilike.*${search.trim()}*`;
      }
      params.order = sortBy === 'frequency' ? 'usage_count.desc' : 'name.asc';

      const data = await get<any[]>('/industries', params);
      return (data || []).map((item: any) => ({
        id: item.id,
        label: item.name,
        value: item.name,
        usageCount: item.usage_count,
      }));
    } catch (error: any) {
      console.error('获取行业列表失败:', error);
      return [];
    }
  }

  /**
   * 获取公司列表
   * @param search 搜索关键字（可选）
   * @param sortBy 排序方式：frequency（使用频率）或 alphabetical（字母顺序）
   * @param industryId 行业ID过滤（可选）
   */
  async getCompanies(
    search?: string,
    sortBy: SortBy = 'frequency',
    industryId?: string,
  ): Promise<SelectOption[]> {
    try {
      const params: any = {
        is_active: 'eq.true',
        select: 'id,name,usage_count,industry_id',
      };
      if (industryId) params.industry_id = `eq.${industryId}`;
      if (search && search.trim()) params.name = `ilike.*${search.trim()}*`;
      params.order = sortBy === 'frequency' ? 'usage_count.desc' : 'name.asc';

      const data = await get<any[]>('/companies', params);
      return (data || []).map((item: any) => ({
        id: item.id,
        label: item.name,
        value: item.name,
        usageCount: item.usage_count,
      }));
    } catch (error: any) {
      console.error('获取公司列表失败:', error);
      return [];
    }
  }

  /**
   * 获取职位列表
   * @param search 搜索关键字（可选）
   * @param sortBy 排序方式：frequency（使用频率）或 alphabetical（字母顺序）
   */
  async getPositions(
    search?: string,
    sortBy: SortBy = 'frequency',
  ): Promise<SelectOption[]> {
    try {
      const params: any = {
        is_active: 'eq.true',
        select: 'id,name,usage_count,category',
      };
      if (search && search.trim()) params.name = `ilike.*${search.trim()}*`;
      params.order = sortBy === 'frequency' ? 'usage_count.desc' : 'name.asc';

      const data = await get<any[]>('/positions', params);
      return (data || []).map((item: any) => ({
        id: item.id,
        label: item.name,
        value: item.name,
        usageCount: item.usage_count,
        category: item.category,
      }));
    } catch (error: any) {
      console.error('获取职位列表失败:', error);
      return [];
    }
  }

  /**
   * 获取省份列表
   * @param search 搜索关键字（可选）
   */
  async getProvinces(search?: string): Promise<SelectOption[]> {
    try {
      const params: any = {
        select: 'id,name,code',
        order: 'name.asc',
      };
      if (search && search.trim()) params.name = `ilike.*${search.trim()}*`;

      const data = await get<any[]>('/provinces', params);
      return (data || []).map((item: any) => ({
        id: item.id,
        label: item.name,
        value: item.name,
      }));
    } catch (error: any) {
      console.error('获取省份列表失败:', error);
      return [];
    }
  }

  /**
   * 获取城市列表
   * @param provinceId 省份ID（必填）
   * @param search 搜索关键字（可选）
   */
  async getCities(
    provinceId: string,
    search?: string,
  ): Promise<SelectOption[]> {
    try {
      const params: any = {
        province_id: `eq.${provinceId}`,
        select: 'id,name,code,province_id',
        order: 'name.asc',
      };
      if (search && search.trim()) params.name = `ilike.*${search.trim()}*`;

      const data = await get<any[]>('/cities', params);
      return (data || []).map((item: any) => ({
        id: item.id,
        label: item.name,
        value: item.name,
      }));
    } catch (error: any) {
      console.error('获取城市列表失败:', error);
      return [];
    }
  }

  /**
   * 增加选项的使用次数
   * @param table 表名
   * @param id 选项ID
   */
  async incrementUsageCount(
    table: 'industries' | 'companies' | 'positions',
    id: string,
  ): Promise<void> {
    try {
      const {rpc} = await import('../postgrestApi');
      await rpc('increment_usage_count', {
        table_name: table,
        option_id: id,
      });
    } catch (error) {
      console.error(`增加使用次数失败 ${table}:`, error);
    }
  }
}

// 导出单例实例
export const optionsDataService = OptionsDataService.getInstance();

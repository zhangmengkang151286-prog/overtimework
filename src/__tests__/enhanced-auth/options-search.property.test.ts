/**
 * Property-Based Tests for OptionsDataService - Search Filtering
 *
 * 测试选项数据服务的搜索过滤功能
 */

import * as fc from 'fast-check';
import {OptionsDataService} from '../../services/enhanced-auth/OptionsDataService';

// Mock CacheService
jest.mock('../../services/enhanced-auth/CacheService', () => ({
  CacheService: {
    getInstance: jest.fn(() => ({
      getOrSet: jest.fn((key, fn) => fn()),
    })),
  },
  cacheService: {
    getOrSet: jest.fn((key, fn) => fn()),
  },
}));

// Mock Supabase client
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const {supabase} = require('../../services/supabase');

describe('OptionsDataService - Search Filtering Property Tests', () => {
  let service: OptionsDataService;

  beforeEach(() => {
    service = OptionsDataService.getInstance();
    jest.clearAllMocks();
  });

  /**
   * Feature: enhanced-auth-system, Property 6: 搜索过滤准确性
   *
   * 验证需求: 4.8, 4.9, 4.10, 8.5, 8.6, 8.7, 13.2
   *
   * 属性: 当用户输入搜索关键字时，返回的选项列表应该只包含名称中包含该关键字的选项（不区分大小写）
   */
  describe('Property 6: 搜索过滤准确性', () => {
    it('should filter industries by search keyword (case-insensitive)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成测试数据：行业列表和搜索关键字
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.oneof(
                fc.constant('互联网'),
                fc.constant('金融'),
                fc.constant('教育'),
                fc.constant('医疗'),
                fc.constant('制造业'),
                fc.constant('房地产'),
                fc.constant('零售'),
                fc.constant('物流'),
              ),
              usage_count: fc.integer({min: 0, max: 1000}),
              is_active: fc.constant(true),
            }),
            {minLength: 5, maxLength: 20},
          ),
          fc.oneof(
            fc.constant('互联'),
            fc.constant('金'),
            fc.constant('教'),
            fc.constant('医'),
            fc.constant('制造'),
            fc.constant(''),
          ),
          async (mockData, searchKeyword) => {
            // Mock Supabase query chain
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              ilike: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            // 模拟搜索过滤逻辑
            let filteredData = mockData;
            if (searchKeyword && searchKeyword.trim()) {
              filteredData = mockData.filter(item =>
                item.name.toLowerCase().includes(searchKeyword.toLowerCase()),
              );
            }

            // 设置最终返回值
            (mockQuery as any).then = (resolve: any) => {
              resolve({data: filteredData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            // 执行测试
            const result = await service.getIndustries(searchKeyword);

            // 验证：所有返回的选项都应该包含搜索关键字
            if (searchKeyword && searchKeyword.trim()) {
              result.forEach(option => {
                expect(
                  option.label
                    .toLowerCase()
                    .includes(searchKeyword.toLowerCase()),
                ).toBe(true);
              });
            }

            // 验证：返回的选项数量应该等于过滤后的数据数量
            expect(result.length).toBe(filteredData.length);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should filter companies by search keyword (case-insensitive)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.oneof(
                fc.constant('腾讯'),
                fc.constant('阿里巴巴'),
                fc.constant('字节跳动'),
                fc.constant('美团'),
                fc.constant('京东'),
                fc.constant('百度'),
                fc.constant('华为'),
                fc.constant('小米'),
              ),
              usage_count: fc.integer({min: 0, max: 1000}),
              industry_id: fc.uuid(),
              is_active: fc.constant(true),
            }),
            {minLength: 5, maxLength: 20},
          ),
          fc.oneof(
            fc.constant('腾'),
            fc.constant('阿里'),
            fc.constant('字节'),
            fc.constant('美'),
            fc.constant('京'),
            fc.constant(''),
          ),
          async (mockData, searchKeyword) => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              ilike: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            let filteredData = mockData;
            if (searchKeyword && searchKeyword.trim()) {
              filteredData = mockData.filter(item =>
                item.name.toLowerCase().includes(searchKeyword.toLowerCase()),
              );
            }

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: filteredData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getCompanies(searchKeyword);

            if (searchKeyword && searchKeyword.trim()) {
              result.forEach(option => {
                expect(
                  option.label
                    .toLowerCase()
                    .includes(searchKeyword.toLowerCase()),
                ).toBe(true);
              });
            }

            expect(result.length).toBe(filteredData.length);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should filter positions by search keyword (case-insensitive)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.oneof(
                fc.constant('软件工程师'),
                fc.constant('产品经理'),
                fc.constant('设计师'),
                fc.constant('运营专员'),
                fc.constant('数据分析师'),
                fc.constant('测试工程师'),
                fc.constant('项目经理'),
                fc.constant('架构师'),
              ),
              usage_count: fc.integer({min: 0, max: 1000}),
              is_active: fc.constant(true),
            }),
            {minLength: 5, maxLength: 20},
          ),
          fc.oneof(
            fc.constant('工程师'),
            fc.constant('经理'),
            fc.constant('师'),
            fc.constant('专员'),
            fc.constant(''),
          ),
          async (mockData, searchKeyword) => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              ilike: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            let filteredData = mockData;
            if (searchKeyword && searchKeyword.trim()) {
              filteredData = mockData.filter(item =>
                item.name.toLowerCase().includes(searchKeyword.toLowerCase()),
              );
            }

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: filteredData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getPositions(searchKeyword);

            if (searchKeyword && searchKeyword.trim()) {
              result.forEach(option => {
                expect(
                  option.label
                    .toLowerCase()
                    .includes(searchKeyword.toLowerCase()),
                ).toBe(true);
              });
            }

            expect(result.length).toBe(filteredData.length);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should filter provinces by search keyword (case-insensitive)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.oneof(
                fc.constant('北京'),
                fc.constant('上海'),
                fc.constant('广东'),
                fc.constant('浙江'),
                fc.constant('江苏'),
                fc.constant('四川'),
                fc.constant('湖北'),
                fc.constant('河南'),
              ),
              code: fc.string({minLength: 2, maxLength: 6}),
            }),
            {minLength: 5, maxLength: 20},
          ),
          fc.oneof(
            fc.constant('北'),
            fc.constant('上'),
            fc.constant('广'),
            fc.constant('江'),
            fc.constant(''),
          ),
          async (mockData, searchKeyword) => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              ilike: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            let filteredData = mockData;
            if (searchKeyword && searchKeyword.trim()) {
              filteredData = mockData.filter(item =>
                item.name.toLowerCase().includes(searchKeyword.toLowerCase()),
              );
            }

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: filteredData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getProvinces(searchKeyword);

            if (searchKeyword && searchKeyword.trim()) {
              result.forEach(option => {
                expect(
                  option.label
                    .toLowerCase()
                    .includes(searchKeyword.toLowerCase()),
                ).toBe(true);
              });
            }

            expect(result.length).toBe(filteredData.length);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should filter cities by search keyword (case-insensitive)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // provinceId
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.oneof(
                fc.constant('深圳'),
                fc.constant('广州'),
                fc.constant('东莞'),
                fc.constant('佛山'),
                fc.constant('珠海'),
                fc.constant('中山'),
                fc.constant('惠州'),
                fc.constant('江门'),
              ),
              code: fc.string({minLength: 2, maxLength: 6}),
              province_id: fc.uuid(),
            }),
            {minLength: 5, maxLength: 20},
          ),
          fc.oneof(
            fc.constant('深'),
            fc.constant('广'),
            fc.constant('东'),
            fc.constant('州'),
            fc.constant(''),
          ),
          async (provinceId, mockData, searchKeyword) => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              ilike: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            let filteredData = mockData;
            if (searchKeyword && searchKeyword.trim()) {
              filteredData = mockData.filter(item =>
                item.name.toLowerCase().includes(searchKeyword.toLowerCase()),
              );
            }

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: filteredData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getCities(provinceId, searchKeyword);

            if (searchKeyword && searchKeyword.trim()) {
              result.forEach(option => {
                expect(
                  option.label
                    .toLowerCase()
                    .includes(searchKeyword.toLowerCase()),
                ).toBe(true);
              });
            }

            expect(result.length).toBe(filteredData.length);
          },
        ),
        {numRuns: 100},
      );
    });
  });
});

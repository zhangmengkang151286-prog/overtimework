/**
 * Property-Based Tests for OptionsDataService - Sorting
 *
 * 测试选项数据服务的排序功能
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

describe('OptionsDataService - Sorting Property Tests', () => {
  let service: OptionsDataService;

  beforeEach(() => {
    service = OptionsDataService.getInstance();
    jest.clearAllMocks();
  });

  /**
   * Feature: enhanced-auth-system, Property 17: 选项列表排序一致性
   *
   * 验证需求: 13.5
   *
   * 属性: 当按使用频率排序时，返回的选项列表应该按 usage_count 降序排列；
   *       当按字母顺序排序时，返回的选项列表应该按 name 升序排列
   */
  describe('Property 17: 选项列表排序一致性', () => {
    it('should sort industries by frequency (usage_count DESC)', async () => {
      await fc.assert(
        fc.asyncProperty(
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
          async mockData => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            // 按使用频率降序排序
            const sortedData = [...mockData].sort(
              (a, b) => b.usage_count - a.usage_count,
            );

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: sortedData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getIndustries(undefined, 'frequency');

            // 验证：返回的列表应该按 usage_count 降序排列
            for (let i = 0; i < result.length - 1; i++) {
              expect(result[i].usageCount).toBeGreaterThanOrEqual(
                result[i + 1].usageCount || 0,
              );
            }
          },
        ),
        {numRuns: 100},
      );
    });

    it('should sort industries alphabetically (name ASC)', async () => {
      await fc.assert(
        fc.asyncProperty(
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
          async mockData => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            // 按名称升序排序
            const sortedData = [...mockData].sort((a, b) =>
              a.name.localeCompare(b.name),
            );

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: sortedData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getIndustries(
              undefined,
              'alphabetical',
            );

            // 验证：返回的列表应该按 name 升序排列
            for (let i = 0; i < result.length - 1; i++) {
              expect(
                result[i].label.localeCompare(result[i + 1].label),
              ).toBeLessThanOrEqual(0);
            }
          },
        ),
        {numRuns: 100},
      );
    });

    it('should sort companies by frequency (usage_count DESC)', async () => {
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
          async mockData => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            const sortedData = [...mockData].sort(
              (a, b) => b.usage_count - a.usage_count,
            );

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: sortedData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getCompanies(undefined, 'frequency');

            for (let i = 0; i < result.length - 1; i++) {
              expect(result[i].usageCount).toBeGreaterThanOrEqual(
                result[i + 1].usageCount || 0,
              );
            }
          },
        ),
        {numRuns: 100},
      );
    });

    it('should sort companies alphabetically (name ASC)', async () => {
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
          async mockData => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            const sortedData = [...mockData].sort((a, b) =>
              a.name.localeCompare(b.name),
            );

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: sortedData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getCompanies(
              undefined,
              'alphabetical',
            );

            for (let i = 0; i < result.length - 1; i++) {
              expect(
                result[i].label.localeCompare(result[i + 1].label),
              ).toBeLessThanOrEqual(0);
            }
          },
        ),
        {numRuns: 100},
      );
    });

    it('should sort positions by frequency (usage_count DESC)', async () => {
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
          async mockData => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            const sortedData = [...mockData].sort(
              (a, b) => b.usage_count - a.usage_count,
            );

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: sortedData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getPositions(undefined, 'frequency');

            for (let i = 0; i < result.length - 1; i++) {
              expect(result[i].usageCount).toBeGreaterThanOrEqual(
                result[i + 1].usageCount || 0,
              );
            }
          },
        ),
        {numRuns: 100},
      );
    });

    it('should sort positions alphabetically (name ASC)', async () => {
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
          async mockData => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            const sortedData = [...mockData].sort((a, b) =>
              a.name.localeCompare(b.name),
            );

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: sortedData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getPositions(
              undefined,
              'alphabetical',
            );

            for (let i = 0; i < result.length - 1; i++) {
              expect(
                result[i].label.localeCompare(result[i + 1].label),
              ).toBeLessThanOrEqual(0);
            }
          },
        ),
        {numRuns: 100},
      );
    });

    it('should sort provinces alphabetically (name ASC)', async () => {
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
          async mockData => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            const sortedData = [...mockData].sort((a, b) =>
              a.name.localeCompare(b.name),
            );

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: sortedData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getProvinces();

            for (let i = 0; i < result.length - 1; i++) {
              expect(
                result[i].label.localeCompare(result[i + 1].label),
              ).toBeLessThanOrEqual(0);
            }
          },
        ),
        {numRuns: 100},
      );
    });

    it('should sort cities alphabetically (name ASC)', async () => {
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
          async (provinceId, mockData) => {
            const mockQuery = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
            };

            const sortedData = [...mockData].sort((a, b) =>
              a.name.localeCompare(b.name),
            );

            (mockQuery as any).then = (resolve: any) => {
              resolve({data: sortedData, error: null});
              return Promise.resolve();
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await service.getCities(provinceId);

            for (let i = 0; i < result.length - 1; i++) {
              expect(
                result[i].label.localeCompare(result[i + 1].label),
              ).toBeLessThanOrEqual(0);
            }
          },
        ),
        {numRuns: 100},
      );
    });
  });
});

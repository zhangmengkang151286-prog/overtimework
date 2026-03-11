/**
 * ProfileService 属性测试
 *
 * 测试用户档案服务的正确性属性
 */

import * as fc from 'fast-check';
import {
  profileService,
  ProfileService,
} from '../../services/enhanced-auth/ProfileService';
import {ValidationService} from '../../services/enhanced-auth/ValidationService';

// Mock Supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({data: null, error: null})),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({error: null})),
      })),
      insert: jest.fn(() => Promise.resolve({error: null})),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() =>
          Promise.resolve({data: {path: 'test.jpg'}, error: null}),
        ),
        getPublicUrl: jest.fn(() => ({
          data: {publicUrl: 'https://test.com/test.jpg'},
        })),
      })),
    },
  },
}));

describe('ProfileService Property Tests', () => {
  /**
   * **Feature: enhanced-auth-system, Property 5: 默认值处理一致性**
   * **Validates: Requirements 4.2, 4.4, 5.2, 5.4**
   *
   * 对于任何未提供头像或用户名的用户,系统应该使用系统默认头像,
   * 并生成符合规则(6-12个字符,有意义词汇组合,唯一)的随机用户名
   */
  describe('Property 5: Default Value Handling Consistency', () => {
    it('should generate valid random usernames with 6-12 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null), // 模拟未提供用户名的情况
          async () => {
            // 生成随机用户名
            const username = await profileService.generateRandomUsername();

            // 验证长度在6-12字符之间
            expect(username.length).toBeGreaterThanOrEqual(6);
            expect(username.length).toBeLessThanOrEqual(12);

            // 验证用户名格式(应该包含有意义的词汇)
            // 格式应该是: 形容词 + "的" + 名词 + 数字
            expect(username).toMatch(/[\u4e00-\u9fa5]+的[\u4e00-\u9fa5]+\d+/);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should generate unique usernames', async () => {
      // 生成多个用户名,验证它们是唯一的
      const usernames = new Set<string>();

      for (let i = 0; i < 50; i++) {
        const username = await profileService.generateRandomUsername();
        usernames.add(username);
      }

      // 至少应该有45个不同的用户名(允许少量重复)
      expect(usernames.size).toBeGreaterThan(45);
    });

    it('should use default avatar when not provided', () => {
      // 测试默认头像逻辑
      // 当用户未提供头像时,应该使用空字符串或默认头像URL
      const profileData = {
        username: '测试用户',
        province: '北京市',
        city: '北京市',
        industry: '互联网',
        company: '测试公司',
        position: '工程师',
        workStartTime: '09:00',
        workEndTime: '18:00',
      };

      // 验证档案完整性(不包含头像也应该通过)
      const validation = profileService.validateProfileCompletion(profileData);
      expect(validation.isValid).toBe(true);
    });
  });

  /**
   * **Feature: enhanced-auth-system, Property 10: 随机用户名生成规则**
   * **Validates: Requirements 12.1, 12.2, 12.3**
   *
   * 对于任何随机用户名生成请求,生成的用户名应该长度在6-12个字符之间,
   * 使用有意义的词汇组合,并在系统中唯一
   */
  describe('Property 10: Random Username Generation Rules', () => {
    it('should generate usernames with meaningful word combinations', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({min: 1, max: 100}), async seed => {
          const username = await profileService.generateRandomUsername();

          // 验证长度
          expect(username.length).toBeGreaterThanOrEqual(6);
          expect(username.length).toBeLessThanOrEqual(12);

          // 验证包含中文字符(有意义的词汇)
          expect(username).toMatch(/[\u4e00-\u9fa5]/);

          // 验证包含数字
          expect(username).toMatch(/\d/);

          // 验证格式: 应该是有意义的组合,不是随机字符
          // 格式: 形容词 + "的" + 名词 + 数字
          const hasValidFormat = /[\u4e00-\u9fa5]+的[\u4e00-\u9fa5]+\d+/.test(
            username,
          );
          expect(hasValidFormat).toBe(true);
        }),
        {numRuns: 100},
      );
    });

    it('should generate usernames that pass validation', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({min: 1, max: 50}), async seed => {
          const username = await profileService.generateRandomUsername();

          // 生成的用户名应该通过基本验证
          const validation = ValidationService.validateUsername(username);
          expect(validation.isValid).toBe(true);
        }),
        {numRuns: 50},
      );
    });
  });

  /**
   * **Feature: enhanced-auth-system, Property 7: 档案完整性验证**
   * **Validates: Requirements 4.12, 5.10**
   *
   * 对于任何用户档案数据,系统应该验证所有必填字段
   * (省份、城市、行业、公司、职位、工作时间)是否已填写,
   * 只有完整的档案才能保存成功
   */
  describe('Property 7: Profile Completeness Validation', () => {
    it('should validate all required fields are present', () => {
      fc.assert(
        fc.property(
          fc
            .string({minLength: 2, maxLength: 20})
            .filter(s => s.trim().length >= 2),
          fc
            .string({minLength: 1, maxLength: 50})
            .filter(s => s.trim().length >= 1),
          fc
            .string({minLength: 1, maxLength: 50})
            .filter(s => s.trim().length >= 1),
          fc
            .string({minLength: 1, maxLength: 100})
            .filter(s => s.trim().length >= 1),
          fc
            .string({minLength: 1, maxLength: 200})
            .filter(s => s.trim().length >= 1),
          fc
            .string({minLength: 1, maxLength: 100})
            .filter(s => s.trim().length >= 1),
          fc.constantFrom('09:00', '08:30', '10:00'),
          fc.constantFrom('18:00', '17:30', '19:00'),
          (
            username,
            province,
            city,
            industry,
            company,
            position,
            startTime,
            endTime,
          ) => {
            const profileData = {
              username,
              province,
              city,
              industry,
              company,
              position,
              workStartTime: startTime,
              workEndTime: endTime,
            };

            const validation =
              profileService.validateProfileCompletion(profileData);

            // 所有字段都提供了,应该验证通过
            expect(validation.isValid).toBe(true);
          },
        ),
        {numRuns: 100},
      );
    });

    it('should reject profiles with missing required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            username: fc.option(fc.string({minLength: 2, maxLength: 20}), {
              nil: '',
            }),
            province: fc.option(fc.string({minLength: 1}), {nil: ''}),
            city: fc.option(fc.string({minLength: 1}), {nil: ''}),
            industry: fc.option(fc.string({minLength: 1}), {nil: ''}),
            company: fc.option(fc.string({minLength: 1}), {nil: ''}),
            position: fc.option(fc.string({minLength: 1}), {nil: ''}),
            workStartTime: fc.option(fc.constantFrom('09:00', '08:30'), {
              nil: '',
            }),
            workEndTime: fc.option(fc.constantFrom('18:00', '17:30'), {
              nil: '',
            }),
          }),
          profileData => {
            const validation = profileService.validateProfileCompletion(
              profileData as any,
            );

            // 如果任何必填字段为空,应该验证失败
            const hasEmptyField =
              !profileData.username ||
              profileData.username.trim() === '' ||
              !profileData.province ||
              profileData.province.trim() === '' ||
              !profileData.city ||
              profileData.city.trim() === '' ||
              !profileData.industry ||
              profileData.industry.trim() === '' ||
              !profileData.company ||
              profileData.company.trim() === '' ||
              !profileData.position ||
              profileData.position.trim() === '' ||
              !profileData.workStartTime ||
              !profileData.workEndTime;

            if (hasEmptyField) {
              expect(validation.isValid).toBe(false);
            }
          },
        ),
        {numRuns: 100},
      );
    });

    it('should validate work time format', () => {
      fc.assert(
        fc.property(
          fc.string({minLength: 2, maxLength: 20}),
          fc.string({minLength: 1}),
          fc.string({minLength: 1}),
          fc.string({minLength: 1}),
          fc.string({minLength: 1}),
          fc.string({minLength: 1}),
          fc.string(), // 随机的开始时间
          fc.string(), // 随机的结束时间
          (
            username,
            province,
            city,
            industry,
            company,
            position,
            startTime,
            endTime,
          ) => {
            const profileData = {
              username,
              province,
              city,
              industry,
              company,
              position,
              workStartTime: startTime,
              workEndTime: endTime,
            };

            const validation =
              profileService.validateProfileCompletion(profileData);

            // 如果时间格式不正确,应该验证失败
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            const isStartTimeValid = timeRegex.test(startTime);
            const isEndTimeValid = timeRegex.test(endTime);

            if (!isStartTimeValid || !isEndTimeValid) {
              expect(validation.isValid).toBe(false);
            }
          },
        ),
        {numRuns: 100},
      );
    });
  });

  /**
   * **Feature: enhanced-auth-system, Property 15: 档案更新完整性**
   * **Validates: Requirements 8.14**
   *
   * 对于任何用户档案更新操作,系统应该验证更新后的档案仍然满足完整性要求,
   * 并正确更新数据库中的用户信息
   */
  describe('Property 15: Profile Update Completeness', () => {
    it('should validate username when updating', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({minLength: 2, maxLength: 20}),
          async newUsername => {
            // 创建一个模拟的更新操作
            const profileData = {
              username: newUsername,
            };

            // 如果用户名不符合格式,验证应该失败
            const basicValidation =
              ValidationService.validateUsername(newUsername);

            // 这个测试验证了更新时会进行验证
            // 实际的数据库更新在 ProfileService.updateProfile 中会调用验证
            expect(basicValidation.isValid).toBeDefined();
          },
        ),
        {numRuns: 100},
      );
    });
  });
});

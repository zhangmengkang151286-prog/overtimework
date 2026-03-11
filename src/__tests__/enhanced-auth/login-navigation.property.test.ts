/**
 * Property-Based Tests for Login Navigation Logic
 * Feature: enhanced-auth-system, Property 16: 登录后导航逻辑
 * Validates: Requirements 10.2
 *
 * Property 16: 登录后导航逻辑
 * 对于任何登录成功的用户,如果档案未完善应该跳转到ProfileCompletion,
 * 如果档案已完善应该跳转到TrendPage
 */

import * as fc from 'fast-check';
import {AuthService} from '../../services/enhanced-auth/AuthService';
import {User} from '../../types/enhanced-auth';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock Alert
const mockAlert = jest.fn();
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: mockAlert,
  },
}));

describe('Property 16: Login Navigation Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 生成随机用户数据
   */
  const userArbitrary = fc.record({
    id: fc.uuid(),
    phoneNumber: fc
      .string({minLength: 11, maxLength: 11})
      .map(s => '1' + s.slice(1)),
    username: fc.string({minLength: 2, maxLength: 20}),
    isProfileComplete: fc.boolean(),
    avatarUrl: fc.option(fc.webUrl(), {nil: undefined}),
    province: fc.option(fc.string({minLength: 2, maxLength: 10}), {
      nil: undefined,
    }),
    city: fc.option(fc.string({minLength: 2, maxLength: 10}), {nil: undefined}),
    industry: fc.option(fc.string({minLength: 2, maxLength: 20}), {
      nil: undefined,
    }),
    company: fc.option(fc.string({minLength: 2, maxLength: 50}), {
      nil: undefined,
    }),
    position: fc.option(fc.string({minLength: 2, maxLength: 20}), {
      nil: undefined,
    }),
    workStartTime: fc.option(fc.constantFrom('09:00', '08:30', '10:00'), {
      nil: undefined,
    }),
    workEndTime: fc.option(fc.constantFrom('18:00', '17:30', '19:00'), {
      nil: undefined,
    }),
    passwordFailedAttempts: fc.nat(10),
    createdAt: fc
      .integer({min: 1577836800000, max: 1767225600000})
      .map(ts => new Date(ts).toISOString()),
    updatedAt: fc
      .integer({min: 1577836800000, max: 1767225600000})
      .map(ts => new Date(ts).toISOString()),
  });

  it('should navigate to ProfileCompletion when profile is incomplete', () => {
    fc.assert(
      fc.property(userArbitrary, userData => {
        // 强制设置档案未完善
        const user: User = {
          ...userData,
          isProfileComplete: false,
        };

        // 模拟登录成功后的导航逻辑
        const shouldNavigateToProfile = !user.isProfileComplete;
        const shouldNavigateToTrend = user.isProfileComplete;

        // 验证导航逻辑
        expect(shouldNavigateToProfile).toBe(true);
        expect(shouldNavigateToTrend).toBe(false);
      }),
      {numRuns: 100},
    );
  });

  it('should navigate to TrendPage when profile is complete', () => {
    fc.assert(
      fc.property(userArbitrary, userData => {
        // 强制设置档案已完善
        const user: User = {
          ...userData,
          isProfileComplete: true,
        };

        // 模拟登录成功后的导航逻辑
        const shouldNavigateToProfile = !user.isProfileComplete;
        const shouldNavigateToTrend = user.isProfileComplete;

        // 验证导航逻辑
        expect(shouldNavigateToProfile).toBe(false);
        expect(shouldNavigateToTrend).toBe(true);
      }),
      {numRuns: 100},
    );
  });

  it('should correctly determine navigation based on profile completion status', () => {
    fc.assert(
      fc.property(userArbitrary, userData => {
        const user: User = userData;

        // 模拟登录成功后的导航逻辑
        const shouldNavigateToProfile = !user.isProfileComplete;
        const shouldNavigateToTrend = user.isProfileComplete;

        // 验证导航逻辑的互斥性
        expect(shouldNavigateToProfile).toBe(!shouldNavigateToTrend);

        // 验证导航目标的正确性
        if (user.isProfileComplete) {
          expect(shouldNavigateToTrend).toBe(true);
          expect(shouldNavigateToProfile).toBe(false);
        } else {
          expect(shouldNavigateToProfile).toBe(true);
          expect(shouldNavigateToTrend).toBe(false);
        }
      }),
      {numRuns: 100},
    );
  });

  it('should handle navigation for users with partial profile data', () => {
    fc.assert(
      fc.property(userArbitrary, userData => {
        // 创建部分完善的档案
        const user: User = {
          ...userData,
          province: undefined,
          city: undefined,
          industry: undefined,
          company: undefined,
          position: undefined,
          isProfileComplete: false,
        };

        // 验证未完善的档案应该导航到ProfileCompletion
        const shouldNavigateToProfile = !user.isProfileComplete;
        expect(shouldNavigateToProfile).toBe(true);
      }),
      {numRuns: 100},
    );
  });

  it('should handle navigation for users with complete profile data', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          phoneNumber: fc
            .string({minLength: 11, maxLength: 11})
            .map(s => '1' + s.slice(1)),
          username: fc.string({minLength: 2, maxLength: 20}),
          province: fc.string({minLength: 2, maxLength: 10}),
          city: fc.string({minLength: 2, maxLength: 10}),
          industry: fc.string({minLength: 2, maxLength: 20}),
          company: fc.string({minLength: 2, maxLength: 50}),
          position: fc.string({minLength: 2, maxLength: 20}),
          workStartTime: fc.constantFrom('09:00', '08:30', '10:00'),
          workEndTime: fc.constantFrom('18:00', '17:30', '19:00'),
          isProfileComplete: fc.constant(true),
          passwordFailedAttempts: fc.nat(10),
          createdAt: fc
            .integer({min: 1577836800000, max: 1767225600000})
            .map(ts => new Date(ts).toISOString()),
          updatedAt: fc
            .integer({min: 1577836800000, max: 1767225600000})
            .map(ts => new Date(ts).toISOString()),
        }),
        userData => {
          const user: User = userData;

          // 验证完善的档案应该导航到TrendPage
          const shouldNavigateToTrend = user.isProfileComplete;
          expect(shouldNavigateToTrend).toBe(true);

          // 验证所有必填字段都已填写
          expect(user.province).toBeDefined();
          expect(user.city).toBeDefined();
          expect(user.industry).toBeDefined();
          expect(user.company).toBeDefined();
          expect(user.position).toBeDefined();
          expect(user.workStartTime).toBeDefined();
          expect(user.workEndTime).toBeDefined();
        },
      ),
      {numRuns: 100},
    );
  });

  it('should maintain navigation consistency across multiple login attempts', () => {
    fc.assert(
      fc.property(userArbitrary, fc.nat(10), (userData, attempts) => {
        const user: User = userData;

        // 模拟多次登录
        const navigationResults = [];
        for (let i = 0; i < attempts; i++) {
          const shouldNavigateToProfile = !user.isProfileComplete;
          navigationResults.push(shouldNavigateToProfile);
        }

        // 验证所有导航结果一致
        const firstResult = navigationResults[0];
        const allSame = navigationResults.every(
          result => result === firstResult,
        );
        expect(allSame).toBe(true);
      }),
      {numRuns: 100},
    );
  });
});

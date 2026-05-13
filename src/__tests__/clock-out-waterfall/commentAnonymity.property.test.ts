/**
 * 属性测试：评论匿名性
 * **Feature: clock-out-waterfall, Property 19: 评论匿名性**
 * **Validates: Requirements 11.9**
 *
 * 对任意评论对象，其展示的作者身份应仅包含匿名字段
 * （avatar、nickname、industry、city、ageGroup），
 * 不包含 phoneNumber、realName 等敏感字段。
 */

import * as fc from 'fast-check';
import { CardComment } from '../../types/clock-out-waterfall';
import { isCommentAnonymous } from '../../services/stream/commentService';

// 生成符合 CardComment 接口的随机对象
const cardCommentArb: fc.Arbitrary<CardComment> = fc.record({
  id: fc.uuid(),
  eventId: fc.uuid(),
  userId: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 200 }),
  avatar: fc.string({ minLength: 1, maxLength: 20 }),
  nickname: fc.string({ minLength: 1, maxLength: 20 }),
  industry: fc.string({ minLength: 1, maxLength: 30 }),
  city: fc.string({ minLength: 1, maxLength: 20 }),
  ageGroup: fc.string({ minLength: 1, maxLength: 10 }),
  createdAt: fc.integer({
    min: new Date('2024-01-01T00:00:00Z').getTime(),
    max: new Date('2026-12-31T23:59:59Z').getTime(),
  }).map((ts) => new Date(ts).toISOString()),
});

// 生成带有敏感字段的"污染"评论对象
const pollutedCommentArb = fc.record({
  id: fc.uuid(),
  eventId: fc.uuid(),
  userId: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 200 }),
  avatar: fc.string({ minLength: 1, maxLength: 20 }),
  nickname: fc.string({ minLength: 1, maxLength: 20 }),
  industry: fc.string({ minLength: 1, maxLength: 30 }),
  city: fc.string({ minLength: 1, maxLength: 20 }),
  ageGroup: fc.string({ minLength: 1, maxLength: 10 }),
  createdAt: fc.integer({
    min: new Date('2024-01-01T00:00:00Z').getTime(),
    max: new Date('2026-12-31T23:59:59Z').getTime(),
  }).map((ts) => new Date(ts).toISOString()),
  // 敏感字段
  phoneNumber: fc.string({ minLength: 11, maxLength: 11 }),
  realName: fc.string({ minLength: 2, maxLength: 10 }),
});

describe('下班瀑布流 - Property 19: 评论匿名性', () => {
  it('符合 CardComment 接口的评论对象应通过匿名性检查', () => {
    fc.assert(
      fc.property(
        cardCommentArb,
        (comment: CardComment) => {
          expect(isCommentAnonymous(comment)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('包含敏感字段的对象应不通过匿名性检查', () => {
    fc.assert(
      fc.property(
        pollutedCommentArb,
        (polluted) => {
          // 将带有敏感字段的对象强制转为 CardComment 进行检查
          const comment = polluted as unknown as CardComment;
          expect(isCommentAnonymous(comment)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('CardComment 接口的键集合不包含任何敏感字段名', () => {
    fc.assert(
      fc.property(
        cardCommentArb,
        (comment: CardComment) => {
          const keys = Object.keys(comment);
          const sensitiveFields = ['phoneNumber', 'realName', 'phone_number', 'real_name', 'email'];
          for (const sensitive of sensitiveFields) {
            expect(keys).not.toContain(sensitive);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

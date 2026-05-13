/**
 * 属性测试：评论排序
 * **Feature: clock-out-waterfall, Property 18: 评论排序**
 * **Validates: Requirements 11.3**
 *
 * 对任意评论列表，按发布时间排序后应为降序（最新在前），
 * 且分页加载的每一页内部也保持降序。
 */

import * as fc from 'fast-check';
import { CardComment } from '../../types/clock-out-waterfall';
import { sortCommentsByTime } from '../../services/stream/commentService';

// 生成随机 CardComment 的 arbitrary
const cardCommentArb = fc.record({
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

describe('下班瀑布流 - Property 18: 评论排序', () => {
  it('排序后的评论列表应按 createdAt 降序排列（最新在前）', () => {
    fc.assert(
      fc.property(
        fc.array(cardCommentArb, { minLength: 0, maxLength: 50 }),
        (comments: CardComment[]) => {
          const sorted = sortCommentsByTime(comments);

          // 验证降序：每一项的 createdAt 应 >= 下一项的 createdAt
          for (let i = 0; i < sorted.length - 1; i++) {
            const currentTime = new Date(sorted[i].createdAt).getTime();
            const nextTime = new Date(sorted[i + 1].createdAt).getTime();
            expect(currentTime).toBeGreaterThanOrEqual(nextTime);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('排序不改变列表长度（不丢失、不重复）', () => {
    fc.assert(
      fc.property(
        fc.array(cardCommentArb, { minLength: 0, maxLength: 50 }),
        (comments: CardComment[]) => {
          const sorted = sortCommentsByTime(comments);
          expect(sorted.length).toBe(comments.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('分页切片后每页内部仍保持降序', () => {
    fc.assert(
      fc.property(
        fc.array(cardCommentArb, { minLength: 0, maxLength: 100 }),
        fc.integer({ min: 1, max: 20 }), // pageSize
        (comments: CardComment[], pageSize: number) => {
          const sorted = sortCommentsByTime(comments);

          // 模拟分页：将排序后的列表按 pageSize 切片
          const totalPages = Math.ceil(sorted.length / pageSize);
          for (let page = 0; page < totalPages; page++) {
            const pageSlice = sorted.slice(page * pageSize, (page + 1) * pageSize);
            // 每页内部应保持降序
            for (let i = 0; i < pageSlice.length - 1; i++) {
              const currentTime = new Date(pageSlice[i].createdAt).getTime();
              const nextTime = new Date(pageSlice[i + 1].createdAt).getTime();
              expect(currentTime).toBeGreaterThanOrEqual(nextTime);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

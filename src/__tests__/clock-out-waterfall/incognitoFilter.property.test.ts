/**
 * 属性测试：隐身事件过滤
 * **Feature: clock-out-waterfall, Property 14: 隐身事件过滤**
 * **Validates: Requirements 8.3, 8.4**
 *
 * 对任意 ClockOutEvent 列表（含隐身和非隐身事件）和查看者用户 ID，
 * 公开瀑布流结果应不包含 isIncognito=true 且 userId ≠ 查看者 ID 的事件；
 * 但应包含 isIncognito=true 且 userId = 查看者 ID 的事件（本人可见）。
 */

import * as fc from 'fast-check';
import { filterByIncognito } from '../../utils/waterfallFilter';
import { ClockOutEvent } from '../../types/clock-out-waterfall';

// 固定的用户 ID 池
const USER_IDS = ['user-a', 'user-b', 'user-c', 'user-d'];

/**
 * 生成随机 ClockOutEvent
 */
const arbEvent: fc.Arbitrary<ClockOutEvent> = fc.record({
  id: fc.uuid(),
  userId: fc.constantFrom(...USER_IDS),
  statusRecordId: fc.uuid(),
  eventDate: fc.constant('2025-06-15'),
  clockOutType: fc.constantFrom('ontime' as const, 'overtime' as const),
  effectiveClockOutMoment: fc.constant('2025-06-15T19:00:00.000Z'),
  overtimeHours: fc.nat({ max: 8 }),
  wageBracket: fc.constant(null),
  industry: fc.constant('互联网'),
  city: fc.constant('北京'),
  position: fc.constant('工程师'),
  ageGroup: fc.constant('25-30'),
  avatar: fc.constant('avatar_01'),
  nickname: fc.constant('用户'),
  isIncognito: fc.boolean(),
  createdAt: fc.constant('2025-06-15T19:00:00.000Z'),
});

describe('下班瀑布流 - Property 14: 隐身事件过滤', () => {
  it('结果不包含其他用户的隐身事件', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 30 }),
        fc.constantFrom(...USER_IDS),
        (events, viewerUserId) => {
          const result = filterByIncognito(events, viewerUserId);

          for (const event of result) {
            if (event.isIncognito) {
              // 隐身事件只能是本人的
              expect(event.userId).toBe(viewerUserId);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('结果包含本人的隐身事件', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 30 }),
        fc.constantFrom(...USER_IDS),
        (events, viewerUserId) => {
          const result = filterByIncognito(events, viewerUserId);
          const resultIds = new Set(result.map((e) => e.id));

          // 本人的隐身事件应全部保留
          for (const event of events) {
            if (event.isIncognito && event.userId === viewerUserId) {
              expect(resultIds.has(event.id)).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('非隐身事件全部保留', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 30 }),
        fc.constantFrom(...USER_IDS),
        (events, viewerUserId) => {
          const result = filterByIncognito(events, viewerUserId);
          const resultIds = new Set(result.map((e) => e.id));

          for (const event of events) {
            if (!event.isIncognito) {
              expect(resultIds.has(event.id)).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

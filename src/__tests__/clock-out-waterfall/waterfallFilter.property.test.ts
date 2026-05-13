/**
 * 属性测试：事件可见性时间过滤
 * **Feature: clock-out-waterfall, Property 3: 事件可见性时间过滤**
 * **Validates: Requirements 2.3, 2.4, 4.1**
 *
 * 对任意 ClockOutEvent 列表和当前时钟 T，经过时间过滤后的结果应仅包含
 * effectiveClockOutMoment ≤ T 且 effectiveClockOutMoment > T - 24h 的事件，
 * 且结果按 effectiveClockOutMoment 降序排列。
 */

import * as fc from 'fast-check';
import { filterByTimeWindow } from '../../utils/waterfallFilter';
import { ClockOutEvent } from '../../types/clock-out-waterfall';

/**
 * 生成一个有效的 ClockOutEvent，effectiveClockOutMoment 在指定范围内
 */
function genClockOutEvent(momentMs: number): ClockOutEvent {
  return {
    id: 'evt-' + Math.random().toString(36).slice(2, 10),
    userId: 'user-1',
    statusRecordId: 'sr-1',
    eventDate: '2025-06-15',
    clockOutType: 'ontime',
    effectiveClockOutMoment: new Date(momentMs).toISOString(),
    overtimeHours: 0,
    wageBracket: null,
    industry: '互联网',
    city: '北京',
    position: '工程师',
    ageGroup: '25-30',
    avatar: 'avatar_01',
    nickname: '测试用户',
    isIncognito: false,
    createdAt: new Date(momentMs).toISOString(),
  };
}

describe('下班瀑布流 - Property 3: 事件可见性时间过滤', () => {
  // 基准时间：2025-06-15 20:00:00 UTC
  const baseNowMs = new Date('2025-06-15T20:00:00.000Z').getTime();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;

  it('过滤结果仅包含 effectiveClockOutMoment ≤ now 且 > now-24h 的事件', () => {
    fc.assert(
      fc.property(
        // 生成当前时钟偏移（±12小时范围内）
        fc.integer({ min: 0, max: 12 * 60 * 60 * 1000 }),
        // 生成事件时间偏移列表（相对于 now，范围 -30h 到 +6h）
        fc.array(
          fc.integer({ min: -30 * 60 * 60 * 1000, max: 6 * 60 * 60 * 1000 }),
          { minLength: 1, maxLength: 20 },
        ),
        (nowOffset, eventOffsets) => {
          const nowMs = baseNowMs + nowOffset;
          const now = new Date(nowMs);

          const events = eventOffsets.map((offset) =>
            genClockOutEvent(nowMs + offset),
          );

          const result = filterByTimeWindow(events, now);

          // 验证：每个结果事件的 effectiveClockOutMoment 在 (now-24h, now] 范围内
          for (const event of result) {
            const momentMs = new Date(event.effectiveClockOutMoment).getTime();
            expect(momentMs).toBeLessThanOrEqual(nowMs);
            expect(momentMs).toBeGreaterThan(nowMs - twentyFourHoursMs);
          }

          // 验证：原列表中满足条件的事件都在结果中
          const expectedIds = events
            .filter((e) => {
              const ms = new Date(e.effectiveClockOutMoment).getTime();
              return ms <= nowMs && ms > nowMs - twentyFourHoursMs;
            })
            .map((e) => e.id);
          const resultIds = result.map((e) => e.id);
          expect(resultIds.sort()).toEqual(expectedIds.sort());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('过滤结果按 effectiveClockOutMoment 降序排列', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: -20 * 60 * 60 * 1000, max: 0 }),
          { minLength: 2, maxLength: 30 },
        ),
        (eventOffsets) => {
          const nowMs = baseNowMs;
          const now = new Date(nowMs);

          const events = eventOffsets.map((offset) =>
            genClockOutEvent(nowMs + offset),
          );

          const result = filterByTimeWindow(events, now);

          // 验证降序
          for (let i = 1; i < result.length; i++) {
            const prevMs = new Date(result[i - 1].effectiveClockOutMoment).getTime();
            const currMs = new Date(result[i].effectiveClockOutMoment).getTime();
            expect(prevMs).toBeGreaterThanOrEqual(currMs);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

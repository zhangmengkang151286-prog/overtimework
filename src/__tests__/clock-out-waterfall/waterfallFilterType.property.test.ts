/**
 * 属性测试：筛选逻辑 - 类型组
 * **Feature: clock-out-waterfall, Property 9: 筛选逻辑 - 类型组**
 * **Validates: Requirements 5.4, 5.5, 5.10, 5.11**
 *
 * 对任意 ClockOutEvent 列表和类型组筛选条件（onTime、overtime 各可勾选或未勾选），
 * 当至少一项被勾选且未全选时，筛选结果中的每一条事件的 clockOutType 应命中至少一个已勾选类型（逻辑或）；
 * 当全选或全未选时，不施加类型限制。
 */

import * as fc from 'fast-check';
import { filterByScope } from '../../utils/waterfallFilter';
import { ClockOutEvent, ClockOutType, WaterfallQueryParams } from '../../types/clock-out-waterfall';

/**
 * 生成随机 ClockOutEvent
 */
const arbEvent: fc.Arbitrary<ClockOutEvent> = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
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
  isIncognito: fc.constant(false),
  createdAt: fc.constant('2025-06-15T19:00:00.000Z'),
});

describe('下班瀑布流 - Property 9: 筛选逻辑 - 类型组', () => {
  it('仅勾选 ontime 时，结果只包含 ontime 事件', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 30 }),
        (events) => {
          const scope: WaterfallQueryParams = {
            clockOutTypes: ['ontime'],
          };
          const result = filterByScope(events, scope);

          for (const event of result) {
            expect(event.clockOutType).toBe('ontime');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('仅勾选 overtime 时，结果只包含 overtime 事件', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 30 }),
        (events) => {
          const scope: WaterfallQueryParams = {
            clockOutTypes: ['overtime'],
          };
          const result = filterByScope(events, scope);

          for (const event of result) {
            expect(event.clockOutType).toBe('overtime');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('全选（两项都勾选）时，不施加类型限制', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 30 }),
        (events) => {
          const scope: WaterfallQueryParams = {
            clockOutTypes: ['ontime', 'overtime'],
          };
          const result = filterByScope(events, scope);

          // 全选等于不限制，结果数量应等于原列表
          expect(result.length).toBe(events.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('全未选（空数组）时，不施加类型限制', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 30 }),
        (events) => {
          const scope: WaterfallQueryParams = {
            clockOutTypes: [],
          };
          const result = filterByScope(events, scope);

          expect(result.length).toBe(events.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('undefined 类型组时，不施加类型限制', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 30 }),
        (events) => {
          const scope: WaterfallQueryParams = {
            clockOutTypes: undefined,
          };
          const result = filterByScope(events, scope);

          expect(result.length).toBe(events.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * 属性测试：筛选逻辑 - 属性组
 * **Feature: clock-out-waterfall, Property 8: 筛选逻辑 - 属性组**
 * **Validates: Requirements 5.3, 5.6, 5.7, 5.8, 5.9**
 *
 * 对任意 ClockOutEvent 列表和属性组筛选条件（industry、city、position 各可为具体值或"全部"），
 * 筛选结果中的每一条事件应同时满足所有已指定的属性条件（逻辑与），
 * 且未指定的属性不影响结果。
 */

import * as fc from 'fast-check';
import { filterByScope } from '../../utils/waterfallFilter';
import { ClockOutEvent, WaterfallQueryParams } from '../../types/clock-out-waterfall';

// 候选值池
const INDUSTRIES = ['互联网', '金融', '教育', '医疗', '制造业'];
const CITIES = ['北京', '上海', '深圳', '杭州', '成都'];
const POSITIONS = ['工程师', '产品经理', '设计师', '运营', '销售'];

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
  industry: fc.constantFrom(...INDUSTRIES),
  city: fc.constantFrom(...CITIES),
  position: fc.constantFrom(...POSITIONS),
  ageGroup: fc.constantFrom('20-25', '25-30', '30-35'),
  avatar: fc.constant('avatar_01'),
  nickname: fc.constant('用户'),
  isIncognito: fc.constant(false),
  createdAt: fc.constant('2025-06-15T19:00:00.000Z'),
});

describe('下班瀑布流 - Property 8: 筛选逻辑 - 属性组', () => {
  it('筛选结果中每条事件同时满足所有已指定的属性条件', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 30 }),
        fc.constantFrom(undefined, ...INDUSTRIES),
        fc.constantFrom(undefined, ...CITIES),
        fc.constantFrom(undefined, ...POSITIONS),
        (events, industry, city, position) => {
          const scope: WaterfallQueryParams = {
            industry,
            city,
            position,
          };

          const result = filterByScope(events, scope);

          for (const event of result) {
            if (industry) {
              expect(event.industry).toBe(industry);
            }
            if (city) {
              expect(event.city).toBe(city);
            }
            if (position) {
              expect(event.position).toBe(position);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('未指定的属性不影响结果（不排除任何事件）', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 20 }),
        (events) => {
          // 全部为 undefined → 不施加限制，结果应等于原列表
          const scope: WaterfallQueryParams = {};
          const result = filterByScope(events, scope);
          expect(result.length).toBe(events.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('筛选结果是原列表的子集', () => {
    fc.assert(
      fc.property(
        fc.array(arbEvent, { minLength: 1, maxLength: 30 }),
        fc.constantFrom(undefined, ...INDUSTRIES),
        fc.constantFrom(undefined, ...CITIES),
        fc.constantFrom(undefined, ...POSITIONS),
        (events, industry, city, position) => {
          const scope: WaterfallQueryParams = { industry, city, position };
          const result = filterByScope(events, scope);

          const eventIds = new Set(events.map((e) => e.id));
          for (const event of result) {
            expect(eventIds.has(event.id)).toBe(true);
          }
          expect(result.length).toBeLessThanOrEqual(events.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * 属性测试：时间分隔线插入
 * **Feature: clock-out-waterfall, Property 7: 时间分隔线插入**
 * **Validates: Requirements 4.10, 4.11**
 *
 * 对任意两个相邻的应计下班时刻 A 和 B（A > B，即 A 更新），
 * 当且仅当 A 和 B 跨越了一个整点时，应在两者之间插入时间分隔线。
 */

import * as fc from 'fast-check';
import { shouldInsertTimeDivider } from '../../utils/waterfallUtils';

/**
 * 生成本地时间 ISO 字符串（不带 Z 后缀）
 */
function isoFromHourMinute(hour: number, minute: number): string {
  return `2025-06-15T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000`;
}

describe('下班瀑布流 - Property 7: 时间分隔线插入', () => {
  it('同一小时内的两个时刻不应插入分隔线', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        fc.integer({ min: 0, max: 59 }),
        (hour, minA, minB) => {
          const isoA = isoFromHourMinute(hour, minA);
          const isoB = isoFromHourMinute(hour, minB);
          expect(shouldInsertTimeDivider(isoA, isoB)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('跨越整点的两个时刻应插入分隔线', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 22 }),
        fc.integer({ min: 0, max: 59 }),
        fc.integer({ min: 0, max: 59 }),
        (hourB, minA, minB) => {
          // hourA > hourB，确保跨越整点
          const hourA = hourB + 1;
          const isoA = isoFromHourMinute(hourA, minA);
          const isoB = isoFromHourMinute(hourB, minB);
          expect(shouldInsertTimeDivider(isoA, isoB)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

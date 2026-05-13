/**
 * 加班时间点选择器 - 属性测试
 */

import * as fc from 'fast-check';
import {
  endTimeToOvertimeHours,
  overtimeHoursToEndTime,
  validateEndTime,
} from '../../utils/overtimeTimePicker';

// ============ 生成器 ============

/**
 * 生成合法的标准下班时间 HH:mm（范围 16:00 ~ 20:00，覆盖常见下班时间）
 */
function standardEndTimeArb(): fc.Arbitrary<string> {
  return fc
    .record({
      h: fc.integer({min: 16, max: 20}),
      m: fc.integer({min: 0, max: 59}),
    })
    .map(({h, m}) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
}

/**
 * 基于 standardEndTime 生成合法的 endTime（晚于 standardEndTime，且不超过 23:59）
 * 生成的 endTime 保证是整数分钟（HH:mm 格式天然如此）
 */
function validEndTimeArb(standardEndTime: string): fc.Arbitrary<string> {
  const [stdH, stdM] = standardEndTime.split(':').map(Number);
  const stdMinutes = stdH * 60 + stdM;
  // endTime 范围：stdMinutes + 1 到 23:59 (1439)
  const minEnd = stdMinutes + 1;
  const maxEnd = 23 * 60 + 59;
  if (minEnd > maxEnd) {
    // 极端情况，回退
    return fc.constant('23:59');
  }
  return fc.integer({min: minEnd, max: maxEnd}).map((minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  });
}

// ============ Property 9: 加班时间点 ↔ 小时数往返 ============

describe('overtimeTimePicker property tests', () => {
  /**
   * **Feature: hourly-wage-core, Property 9: 加班时间点 ↔ 小时数往返**
   * **Validates: Requirements 6.4, 6.7**
   *
   * 对任意合法的 endTime（HH:mm 且晚于 standardEndTime）和 standardEndTime，应有：
   * overtimeHoursToEndTime(endTimeToOvertimeHours(endTime, std), std) === endTime
   */
  it('Property 9: endTime → overtimeHours → endTime 往返恒等', () => {
    fc.assert(
      fc.property(
        standardEndTimeArb().chain((std) =>
          validEndTimeArb(std).map((endTime) => ({std, endTime})),
        ),
        ({std, endTime}) => {
          const hours = endTimeToOvertimeHours(endTime, std);
          const roundTripped = overtimeHoursToEndTime(hours, std);
          expect(roundTripped).toBe(endTime);
        },
      ),
      {numRuns: 100},
    );
  });
});


// ============ Property 10: 预计下班时间校验 ============

describe('overtimeTimePicker validateEndTime property tests', () => {
  /**
   * **Feature: hourly-wage-core, Property 10: 预计下班时间校验**
   * **Validates: Requirements 6.5, 6.6**
   *
   * 对任意 (endTime, standardEndTime, now) 三元组，validateEndTime 的结果应符合：
   * - 当 endTime <= now → 返回 'NOT_FUTURE'
   * - 当 endTime === standardEndTime → 返回 'EQUALS_STANDARD'
   * - 否则返回 null
   */
  it('Property 10: validateEndTime 返回值与输入关系一致', () => {
    fc.assert(
      fc.property(
        // 生成 standardEndTime
        standardEndTimeArb(),
        // 生成 endTime（任意合法 HH:mm，覆盖所有情况）
        fc.record({
          h: fc.integer({min: 0, max: 23}),
          m: fc.integer({min: 0, max: 59}),
        }),
        // 生成 now 的小时和分钟
        fc.record({
          h: fc.integer({min: 0, max: 23}),
          m: fc.integer({min: 0, max: 59}),
        }),
        (standardEndTime, endTimeRaw, nowRaw) => {
          const endTime = `${String(endTimeRaw.h).padStart(2, '0')}:${String(endTimeRaw.m).padStart(2, '0')}`;
          // 构造 now Date（日期无关紧要，只用 HH:mm）
          const now = new Date(2026, 0, 1, nowRaw.h, nowRaw.m, 0, 0);

          const result = validateEndTime(endTime, standardEndTime, now);

          const endMinutes = endTimeRaw.h * 60 + endTimeRaw.m;
          const nowMinutes = nowRaw.h * 60 + nowRaw.m;

          if (endMinutes <= nowMinutes) {
            expect(result).toBe('NOT_FUTURE');
          } else if (endTime === standardEndTime) {
            expect(result).toBe('EQUALS_STANDARD');
          } else {
            expect(result).toBeNull();
          }
        },
      ),
      {numRuns: 100},
    );
  });
});

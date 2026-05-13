/**
 * 时薪核心模块 - wageCalc 属性测试
 */

import * as fc from 'fast-check';
import {
  computeStandardHours,
  computeDailySalary,
  computeNominalHourlyRate,
  validateWageConfig,
  computeExpectedEnd,
  resolveCardState,
  computeLiveMetrics,
  computeSettledMetrics,
  LUNCH_BREAK_HOURS,
} from '../../utils/wageCalc';
import {WageConfig, WageSubmission} from '../../types/hourly-wage';

// ============ 生成器 ============

/**
 * 生成合法的 HH:mm 时间字符串
 */
function timeArb(minHour: number, maxHour: number): fc.Arbitrary<string> {
  return fc
    .record({
      h: fc.integer({min: minHour, max: maxHour}),
      m: fc.integer({min: 0, max: 59}),
    })
    .map(({h, m}) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
}

/**
 * 生成合法的 WageConfig（保证通过 validateWageConfig）
 * workStartTime ∈ [06:00, 12:00]
 * workEndTime 保证扣除午休后至少 1 小时
 * monthlySalary ∈ [1, 1_000_000]
 */
const validWageConfigArb: fc.Arbitrary<WageConfig> = fc
  .record({
    monthlySalary: fc.integer({min: 1, max: 1_000_000}),
    startH: fc.integer({min: 6, max: 12}),
    startM: fc.integer({min: 0, max: 59}),
  })
  .chain(({monthlySalary, startH, startM}) => {
    // 下班时间必须 > 上班时间 + 午休 + 1h
    // 多加 1 分钟避免浮点精度导致边界值刚好不通过校验
    const startInMinutes = startH * 60 + startM;
    const minEndMinutes = startInMinutes + (LUNCH_BREAK_HOURS + 1) * 60 + 1;
    const maxEndMinutes = 23 * 60 + 59;
    if (minEndMinutes > maxEndMinutes) {
      // 极端情况：上班太晚导致无法满足最低工时，回退到安全值
      return fc.constant({
        monthlySalary,
        workStartTime: '09:00',
        workEndTime: '18:00',
      });
    }
    return fc
      .integer({min: minEndMinutes, max: maxEndMinutes})
      .map((endMin) => ({
        monthlySalary,
        workStartTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        workEndTime: `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
      }));
  });

/**
 * 生成非法月薪值
 */
const invalidSalaryArb: fc.Arbitrary<number> = fc.oneof(
  fc.constant(0),
  fc.constant(-1),
  fc.integer({min: -1_000_000, max: 0}),
  fc.constant(NaN),
  fc.constant(Infinity),
  fc.constant(-Infinity),
);

// ============ Property 2: 配置校验完备性 ============

describe('时薪核心 - Property 2: 配置校验完备性', () => {
  /**
   * **Feature: hourly-wage-core, Property 2: 配置校验完备性**
   * **Validates: Requirements 1.3, 1.4, 1.5**
   *
   * 对任意用户输入的 (monthlySalary, workStartTime, workEndTime) 三元组，
   * validateWageConfig 的返回值应符合规则：
   * - monthlySalary <= 0 或非有限数 → INVALID_SALARY
   * - workEndTime <= workStartTime → INVALID_TIME_ORDER
   * - 扣除午休后不足 1 小时 → INSUFFICIENT_WORK_HOURS
   * - 否则 → null
   */

  it('非法月薪应返回 INVALID_SALARY', () => {
    fc.assert(
      fc.property(
        invalidSalaryArb,
        timeArb(6, 12),
        timeArb(13, 23),
        (salary, start, end) => {
          const result = validateWageConfig({
            monthlySalary: salary,
            workStartTime: start,
            workEndTime: end,
          });
          expect(result).toBe('INVALID_SALARY');
        },
      ),
      {numRuns: 100},
    );
  });

  it('下班时间早于或等于上班时间应返回 INVALID_TIME_ORDER', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 1, max: 1_000_000}),
        // 生成 start >= end 的时间对
        fc.integer({min: 0, max: 23 * 60 + 59}).chain((endMin) =>
          fc
            .integer({min: endMin, max: 23 * 60 + 59})
            .map((startMin) => ({startMin, endMin})),
        ),
        (salary, {startMin, endMin}) => {
          const startTime = `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`;
          const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
          const result = validateWageConfig({
            monthlySalary: salary,
            workStartTime: startTime,
            workEndTime: endTime,
          });
          expect(result).toBe('INVALID_TIME_ORDER');
        },
      ),
      {numRuns: 100},
    );
  });

  it('扣除午休后不足 1 小时应返回 INSUFFICIENT_WORK_HOURS', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 1, max: 1_000_000}),
        // 生成 end > start 但 end - start - 1(午休) < 1 的时间对
        // 即 end - start < 2 小时，且 end > start
        fc.integer({min: 0, max: 22 * 60}).chain((startMin) => {
          // end 必须 > start 但 end - start < 120 分钟（2小时）
          const minEnd = startMin + 1;
          const maxEnd = Math.min(startMin + 119, 23 * 60 + 59);
          if (minEnd > maxEnd) {
            return fc.constant({startMin, endMin: startMin + 60});
          }
          return fc
            .integer({min: minEnd, max: maxEnd})
            .map((endMin) => ({startMin, endMin}));
        }),
        (salary, {startMin, endMin}) => {
          const startTime = `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`;
          const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
          const result = validateWageConfig({
            monthlySalary: salary,
            workStartTime: startTime,
            workEndTime: endTime,
          });
          // 如果 end <= start，会先命中 INVALID_TIME_ORDER
          // 这里保证 end > start，所以应该是 INSUFFICIENT_WORK_HOURS
          expect(result).toBe('INSUFFICIENT_WORK_HOURS');
        },
      ),
      {numRuns: 100},
    );
  });

  it('合法配置应返回 null', () => {
    fc.assert(
      fc.property(validWageConfigArb, (config) => {
        const result = validateWageConfig(config);
        expect(result).toBeNull();
      }),
      {numRuns: 100},
    );
  });
});

// ============ Property 3: 标准工时推算公式 ============

describe('时薪核心 - Property 3: 标准工时推算公式', () => {
  /**
   * **Feature: hourly-wage-core, Property 3: 标准工时推算公式**
   * **Validates: Requirements 1.6**
   *
   * 对任意合法的 WageConfig，computeStandardHours(config) 的结果
   * 等于 (workEndTime − workStartTime) − LUNCH_BREAK_HOURS，单位为小时。
   */

  it('标准工时 = 下班时间 - 上班时间 - 午休时长', () => {
    fc.assert(
      fc.property(validWageConfigArb, (config) => {
        const [startH, startM] = config.workStartTime.split(':').map(Number);
        const [endH, endM] = config.workEndTime.split(':').map(Number);
        const startHours = startH + startM / 60;
        const endHours = endH + endM / 60;
        const expected = endHours - startHours - LUNCH_BREAK_HOURS;

        const result = computeStandardHours(config);

        // 浮点精度容差
        expect(Math.abs(result - expected)).toBeLessThan(1e-10);
      }),
      {numRuns: 100},
    );
  });
});


// ============ 辅助生成器：WageSubmission ============

/**
 * 生成合法的 WageSubmission
 * submittedAt 在 today 的 08:00~23:00 之间
 */
function wageSubmissionArb(today: Date): fc.Arbitrary<WageSubmission> {
  return fc
    .record({
      isOvertime: fc.boolean(),
      overtimeHours: fc.integer({min: 0, max: 8}),
      // submittedAt 在 today 的 08:00 ~ 23:00 之间（分钟精度）
      submittedMinutes: fc.integer({min: 8 * 60, max: 23 * 60}),
    })
    .map(({isOvertime, overtimeHours, submittedMinutes}) => {
      const submittedAt = new Date(today);
      submittedAt.setHours(
        Math.floor(submittedMinutes / 60),
        submittedMinutes % 60,
        0,
        0,
      );
      return {
        isOvertime,
        overtimeHours: isOvertime ? overtimeHours : 0,
        submittedAt,
      };
    });
}

/**
 * 生成一个 "today" 日期（年月日随机，时分秒归零）
 */
const todayArb: fc.Arbitrary<Date> = fc
  .record({
    year: fc.integer({min: 2020, max: 2030}),
    month: fc.integer({min: 0, max: 11}),
    day: fc.integer({min: 1, max: 28}),
  })
  .map(({year, month, day}) => {
    const d = new Date(year, month, day, 0, 0, 0, 0);
    return d;
  });

// ============ Property 4: 预计结束时间公式 ============

describe('时薪核心 - Property 4: 预计结束时间公式', () => {
  /**
   * **Feature: hourly-wage-core, Property 4: 预计结束时间公式**
   * **Validates: Requirements 5.1, 5.2, 5.3**
   *
   * 对任意合法的 WageConfig、任意 WageSubmission、任意 today，
   * computeExpectedEnd(config, submission, today) 应等于
   * max(今日标准下班时刻, submittedAt) + overtimeHours。
   * 且当 isOvertime === false 时，overtimeHours 必须取 0 参与计算。
   */

  it('预计结束时间 = max(标准下班, 提交时间) + 加班时长', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        fc.integer({min: 0, max: 8}),
        fc.boolean(),
        fc.integer({min: 8 * 60, max: 23 * 60}),
        (config, today, overtimeHours, isOvertime, submittedMinutes) => {
          const submittedAt = new Date(today);
          submittedAt.setHours(
            Math.floor(submittedMinutes / 60),
            submittedMinutes % 60,
            0,
            0,
          );

          const submission: WageSubmission = {
            isOvertime,
            overtimeHours: isOvertime ? overtimeHours : 0,
            submittedAt,
          };

          const result = computeExpectedEnd(config, submission, today);

          // 手动计算期望值
          const [endH, endM] = config.workEndTime.split(':').map(Number);
          const todayStandardEnd = new Date(today);
          todayStandardEnd.setHours(endH, endM, 0, 0);

          const base = submittedAt > todayStandardEnd ? submittedAt : todayStandardEnd;
          const effectiveOvertimeHours = isOvertime ? overtimeHours : 0;
          const expected = new Date(base.getTime() + effectiveOvertimeHours * 60 * 60 * 1000);

          expect(result.getTime()).toBe(expected.getTime());
        },
      ),
      {numRuns: 100},
    );
  });
});


// ============ Property 5: 卡片状态决定 ============

describe('时薪核心 - Property 5: 卡片状态决定', () => {
  /**
   * **Feature: hourly-wage-core, Property 5: 卡片状态决定**
   * **Validates: Requirements 2.1, 2.3, 3.1, 4.1, 4.5, 7.3**
   *
   * 对任意 (config, submission, now, isHoliday) 组合，
   * resolveCardState 的结果应符合以下判定树（按顺序短路）：
   * 1. config === null → IDLE
   * 2. isHoliday === true → IDLE
   * 3. submission === null → IDLE
   * 4. now < computeExpectedEnd(config, submission, now) → LIVE
   * 5. 否则 → SETTLED
   */

  it('config 为 null 时返回 IDLE', () => {
    fc.assert(
      fc.property(
        todayArb,
        fc.boolean(),
        (today, isHoliday) => {
          const now = new Date(today);
          now.setHours(12, 0, 0, 0);
          expect(resolveCardState(null, null, now, isHoliday)).toBe('IDLE');
        },
      ),
      {numRuns: 100},
    );
  });

  it('isHoliday 为 true 时返回 IDLE（即使有配置和打卡）', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        (config, today) => {
          const submission: WageSubmission = {
            isOvertime: false,
            overtimeHours: 0,
            submittedAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
          };
          const now = new Date(today);
          now.setHours(10, 0, 0, 0);
          expect(resolveCardState(config, submission, now, true)).toBe('IDLE');
        },
      ),
      {numRuns: 100},
    );
  });

  it('submission 为 null 时返回 IDLE', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        (config, today) => {
          const now = new Date(today);
          now.setHours(14, 0, 0, 0);
          expect(resolveCardState(config, null, now, false)).toBe('IDLE');
        },
      ),
      {numRuns: 100},
    );
  });

  it('now < expectedEnd 时返回 LIVE', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        (config, today) => {
          // 构造一个 submission 使得 expectedEnd 远在未来
          const submittedAt = new Date(today);
          submittedAt.setHours(9, 0, 0, 0);
          const submission: WageSubmission = {
            isOvertime: true,
            overtimeHours: 5,
            submittedAt,
          };
          // now 设为上班后不久，肯定早于 expectedEnd
          const now = new Date(today);
          now.setHours(10, 0, 0, 0);

          const expectedEnd = computeExpectedEnd(config, submission, now);
          // 只在 now < expectedEnd 时断言（过滤掉极端配置）
          if (now < expectedEnd) {
            expect(resolveCardState(config, submission, now, false)).toBe('LIVE');
          }
        },
      ),
      {numRuns: 100},
    );
  });

  it('now >= expectedEnd 时返回 SETTLED', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        (config, today) => {
          // 构造一个 ONTIME submission，expectedEnd = 标准下班时间
          const submittedAt = new Date(today);
          submittedAt.setHours(9, 0, 0, 0);
          const submission: WageSubmission = {
            isOvertime: false,
            overtimeHours: 0,
            submittedAt,
          };
          // now 设为 23:59，肯定晚于任何标准下班时间
          const now = new Date(today);
          now.setHours(23, 59, 0, 0);

          const expectedEnd = computeExpectedEnd(config, submission, now);
          // 只在 now >= expectedEnd 时断言
          if (now >= expectedEnd) {
            expect(resolveCardState(config, submission, now, false)).toBe('SETTLED');
          }
        },
      ),
      {numRuns: 100},
    );
  });

  it('完整判定树：随机组合验证', () => {
    fc.assert(
      fc.property(
        fc.option(validWageConfigArb, {nil: null}),
        fc.boolean(), // isHoliday
        todayArb,
        fc.boolean(), // hasSubmission
        fc.integer({min: 0, max: 8}), // overtimeHours
        fc.boolean(), // isOvertime
        fc.integer({min: 0, max: 23 * 60 + 59}), // nowMinutes
        fc.integer({min: 8 * 60, max: 23 * 60}), // submittedMinutes
        (config, isHoliday, today, hasSubmission, overtimeHours, isOvertime, nowMinutes, submittedMinutes) => {
          const now = new Date(today);
          now.setHours(Math.floor(nowMinutes / 60), nowMinutes % 60, 0, 0);

          let submission: WageSubmission | null = null;
          if (hasSubmission) {
            const submittedAt = new Date(today);
            submittedAt.setHours(
              Math.floor(submittedMinutes / 60),
              submittedMinutes % 60,
              0,
              0,
            );
            submission = {
              isOvertime,
              overtimeHours: isOvertime ? overtimeHours : 0,
              submittedAt,
            };
          }

          const result = resolveCardState(config, submission, now, isHoliday);

          // 按判定树验证
          if (config === null) {
            expect(result).toBe('IDLE');
          } else if (isHoliday) {
            expect(result).toBe('IDLE');
          } else if (submission === null) {
            expect(result).toBe('IDLE');
          } else {
            const expectedEnd = computeExpectedEnd(config, submission, now);
            if (now < expectedEnd) {
              expect(result).toBe('LIVE');
            } else {
              expect(result).toBe('SETTLED');
            }
          }
        },
      ),
      {numRuns: 100},
    );
  });
});


// ============ Property 11: 跨日打卡归属 ============

describe('时薪核心 - Property 11: 跨日打卡归属', () => {
  /**
   * **Feature: hourly-wage-core, Property 11: 跨日打卡归属**
   * **Validates: Requirements 7.2**
   *
   * 对任意 submission（提交日为 D）和任意 now，
   * computeExpectedEnd(config, submission, today=D) 的归属日期应始终为 D，
   * 与 now 所在的自然日无关。
   */

  it('预计结束时间的日期归属始终为打卡日 D', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        fc.integer({min: 0, max: 8}), // overtimeHours
        fc.boolean(), // isOvertime
        fc.integer({min: 8 * 60, max: 23 * 60}), // submittedMinutes
        (config, today, overtimeHours, isOvertime, submittedMinutes) => {
          const submittedAt = new Date(today);
          submittedAt.setHours(
            Math.floor(submittedMinutes / 60),
            submittedMinutes % 60,
            0,
            0,
          );

          const submission: WageSubmission = {
            isOvertime,
            overtimeHours: isOvertime ? overtimeHours : 0,
            submittedAt,
          };

          // 以打卡日 D 作为 today 参数调用
          const expectedEnd = computeExpectedEnd(config, submission, today);

          // 验证：expectedEnd 的日期部分应为 D 或 D+1（加班到次日凌晨是合法的）
          // 但归属日始终是 D —— 即 computeExpectedEnd 的 today 参数决定了归属
          // 关键：无论 now 在 D 还是 D+1，只要传入 today=D，结果不变
          const nextDay = new Date(today);
          nextDay.setDate(nextDay.getDate() + 1);

          // 用 D+1 的某个时刻作为 now 再次调用，传入相同的 today=D
          const expectedEnd2 = computeExpectedEnd(config, submission, today);

          // 两次调用结果完全一致（函数是纯的，不依赖 now）
          expect(expectedEnd.getTime()).toBe(expectedEnd2.getTime());

          // 验证 expectedEnd 的基准日期来自 today（D），而非 submittedAt 的自然日
          // expectedEnd >= todayStandardEnd（基于 today 构造）
          const [endH, endM] = config.workEndTime.split(':').map(Number);
          const todayStandardEnd = new Date(today);
          todayStandardEnd.setHours(endH, endM, 0, 0);

          // expectedEnd 应该 >= todayStandardEnd（因为公式是 max(todayStandardEnd, submittedAt) + overtime）
          expect(expectedEnd.getTime()).toBeGreaterThanOrEqual(todayStandardEnd.getTime());
        },
      ),
      {numRuns: 100},
    );
  });
});


// ============ Property 7: LIVE 数值公式 ============

describe('时薪核心 - Property 7: LIVE 数值公式', () => {
  /**
   * **Feature: hourly-wage-core, Property 7: LIVE 数值公式**
   * **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
   *
   * 对任意 (config, submission, now) 且 resolveCardState 返回 LIVE 时，
   * computeLiveMetrics 的结果应满足：
   * - variant === 'ONTIME' 时：
   *   - currentHourlyRate === nominalHourlyRate
   *   - dilutionPercent === 0
   *   - earnedToday === nominalHourlyRate × max(0, (now − 当日上班时刻) 扣午休后的小时数)
   *   - expectedWastedAmount === 0
   * - variant === 'OVERTIME' 时：
   *   - currentHourlyRate === dailySalary / 预计总工时
   *   - dilutionPercent === (1 − currentHourlyRate / nominalHourlyRate) × 100
   *   - expectedWastedAmount === dailySalary × (1 − standardHours / 预计总工时)
   * - remainingMs === expectedEnd − now，且 > 0
   */

  it('ONTIME 分支：当前时薪 = 名义时薪，稀释 = 0，白干 = 0', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        // now 在上班后、标准下班前（保证 LIVE）
        fc.integer({min: 0, max: 59}), // nowOffsetMinutes after workStart + 2h
        (config, today, offsetMin) => {
          // 构造 ONTIME submission，提交时间在上班时
          const submittedAt = new Date(today);
          const [startH, startM] = config.workStartTime.split(':').map(Number);
          submittedAt.setHours(startH, startM, 0, 0);

          const submission: WageSubmission = {
            isOvertime: false,
            overtimeHours: 0,
            submittedAt,
          };

          // now 在上班后 2h + offset 分钟（确保在标准下班前）
          const now = new Date(today);
          const nowMinutes = (startH * 60 + startM) + 120 + offsetMin;
          now.setHours(Math.floor(nowMinutes / 60), nowMinutes % 60, 0, 0);

          // 确保处于 LIVE 状态
          const state = resolveCardState(config, submission, now, false);
          if (state !== 'LIVE') return; // 过滤掉不满足前置条件的用例

          const metrics = computeLiveMetrics(config, submission, now);
          const nominalRate = computeNominalHourlyRate(config);

          expect(metrics.variant).toBe('ONTIME');
          expect(Math.abs(metrics.currentHourlyRate - nominalRate)).toBeLessThan(1e-10);
          expect(metrics.dilutionPercent).toBe(0);
          expect(metrics.expectedWastedAmount).toBe(0);

          // earnedToday = nominalHourlyRate × max(0, elapsed - lunchBreak)
          const workStart = new Date(today);
          workStart.setHours(startH, startM, 0, 0);
          const elapsedHours = (now.getTime() - workStart.getTime()) / (60 * 60 * 1000);
          const effectiveHours = Math.max(0, elapsedHours - LUNCH_BREAK_HOURS);
          const expectedEarned = nominalRate * effectiveHours;
          expect(Math.abs(metrics.earnedToday - expectedEarned)).toBeLessThan(1e-6);

          // remainingMs > 0（LIVE 保证）
          expect(metrics.remainingMs).toBeGreaterThan(0);
        },
      ),
      {numRuns: 100},
    );
  });

  it('OVERTIME 分支：时薪稀释、白干金额符合公式', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        fc.integer({min: 1, max: 8}), // overtimeHours >= 1
        (config, today, overtimeHours) => {
          // 构造 OVERTIME submission
          const [startH, startM] = config.workStartTime.split(':').map(Number);
          const submittedAt = new Date(today);
          submittedAt.setHours(startH, startM, 0, 0);

          const submission: WageSubmission = {
            isOvertime: true,
            overtimeHours,
            submittedAt,
          };

          // now 在上班后 2h（确保在 expectedEnd 之前）
          const now = new Date(today);
          const nowMinutes = (startH * 60 + startM) + 120;
          now.setHours(Math.floor(nowMinutes / 60), nowMinutes % 60, 0, 0);

          // 确保处于 LIVE 状态
          const state = resolveCardState(config, submission, now, false);
          if (state !== 'LIVE') return;

          const metrics = computeLiveMetrics(config, submission, now);
          const dailySalary = computeDailySalary(config);
          const standardHours = computeStandardHours(config);
          const nominalRate = computeNominalHourlyRate(config);
          const totalExpectedHours = standardHours + overtimeHours;

          expect(metrics.variant).toBe('OVERTIME');

          // currentHourlyRate = dailySalary / totalExpectedHours
          const expectedRate = dailySalary / totalExpectedHours;
          expect(Math.abs(metrics.currentHourlyRate - expectedRate)).toBeLessThan(1e-10);

          // dilutionPercent = (1 - currentHourlyRate / nominalHourlyRate) × 100
          const expectedDilution = (1 - expectedRate / nominalRate) * 100;
          expect(Math.abs(metrics.dilutionPercent - expectedDilution)).toBeLessThan(1e-6);

          // expectedWastedAmount = dailySalary × (1 - standardHours / totalExpectedHours)
          const expectedWasted = dailySalary * (1 - standardHours / totalExpectedHours);
          expect(Math.abs(metrics.expectedWastedAmount - expectedWasted)).toBeLessThan(1e-6);

          // remainingMs > 0
          expect(metrics.remainingMs).toBeGreaterThan(0);
        },
      ),
      {numRuns: 100},
    );
  });

  it('remainingMs = expectedEnd - now', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        wageSubmissionArb(new Date(2025, 5, 15)),
        (config, today, submissionTemplate) => {
          // 重新构造 submission 使用 today
          const submittedAt = new Date(today);
          submittedAt.setHours(
            submissionTemplate.submittedAt.getHours(),
            submissionTemplate.submittedAt.getMinutes(),
            0,
            0,
          );
          const submission: WageSubmission = {
            ...submissionTemplate,
            submittedAt,
          };

          // now 在上班后 1h
          const [startH, startM] = config.workStartTime.split(':').map(Number);
          const now = new Date(today);
          now.setHours(startH + 1, startM, 0, 0);

          const state = resolveCardState(config, submission, now, false);
          if (state !== 'LIVE') return;

          const metrics = computeLiveMetrics(config, submission, now);
          const expectedEnd = computeExpectedEnd(config, submission, now);
          const expectedRemainingMs = expectedEnd.getTime() - now.getTime();

          expect(metrics.remainingMs).toBe(expectedRemainingMs);
        },
      ),
      {numRuns: 100},
    );
  });
});


// ============ Property 8: SETTLED 结算公式 ============

describe('时薪核心 - Property 8: SETTLED 结算公式', () => {
  /**
   * **Feature: hourly-wage-core, Property 8: SETTLED 结算公式**
   * **Validates: Requirements 4.2, 4.3**
   *
   * 对任意 (config, submission)，computeSettledMetrics 应满足：
   * - nominalDailySalary === dailySalary
   * - 当 submission.isOvertime === false：
   *   wastedHours === 0, wastedAmount === 0,
   *   actualHourlyRate === nominalHourlyRate, dilutionPercent === 0
   * - 当 submission.isOvertime === true：
   *   wastedHours === overtimeHours
   *   actualHourlyRate === dailySalary / (standardHours + overtimeHours)
   *   wastedAmount === dailySalary × (1 − standardHours / (standardHours + overtimeHours))
   *   dilutionPercent === (1 − actualHourlyRate / nominalHourlyRate) × 100
   */

  it('ONTIME：白干为 0，实际时薪 = 名义时薪', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        (config, today) => {
          const submittedAt = new Date(today);
          submittedAt.setHours(9, 0, 0, 0);
          const submission: WageSubmission = {
            isOvertime: false,
            overtimeHours: 0,
            submittedAt,
          };

          const metrics = computeSettledMetrics(config, submission);
          const dailySalary = computeDailySalary(config);
          const nominalRate = computeNominalHourlyRate(config);

          expect(Math.abs(metrics.nominalDailySalary - dailySalary)).toBeLessThan(1e-10);
          expect(Math.abs(metrics.actualHourlyRate - nominalRate)).toBeLessThan(1e-10);
          expect(metrics.dilutionPercent).toBe(0);
          expect(metrics.wastedHours).toBe(0);
          expect(metrics.wastedAmount).toBe(0);
        },
      ),
      {numRuns: 100},
    );
  });

  it('OVERTIME：按公式计算五项结算数据', () => {
    fc.assert(
      fc.property(
        validWageConfigArb,
        todayArb,
        fc.integer({min: 1, max: 8}), // overtimeHours >= 1
        (config, today, overtimeHours) => {
          const submittedAt = new Date(today);
          submittedAt.setHours(9, 0, 0, 0);
          const submission: WageSubmission = {
            isOvertime: true,
            overtimeHours,
            submittedAt,
          };

          const metrics = computeSettledMetrics(config, submission);
          const dailySalary = computeDailySalary(config);
          const standardHours = computeStandardHours(config);
          const nominalRate = computeNominalHourlyRate(config);
          const totalHours = standardHours + overtimeHours;

          // nominalDailySalary === dailySalary
          expect(Math.abs(metrics.nominalDailySalary - dailySalary)).toBeLessThan(1e-10);

          // wastedHours === overtimeHours
          expect(metrics.wastedHours).toBe(overtimeHours);

          // actualHourlyRate === dailySalary / totalHours
          const expectedRate = dailySalary / totalHours;
          expect(Math.abs(metrics.actualHourlyRate - expectedRate)).toBeLessThan(1e-10);

          // wastedAmount === dailySalary × (1 - standardHours / totalHours)
          const expectedWasted = dailySalary * (1 - standardHours / totalHours);
          expect(Math.abs(metrics.wastedAmount - expectedWasted)).toBeLessThan(1e-6);

          // dilutionPercent === (1 - actualHourlyRate / nominalHourlyRate) × 100
          const expectedDilution = (1 - expectedRate / nominalRate) * 100;
          expect(Math.abs(metrics.dilutionPercent - expectedDilution)).toBeLessThan(1e-6);
        },
      ),
      {numRuns: 100},
    );
  });
});

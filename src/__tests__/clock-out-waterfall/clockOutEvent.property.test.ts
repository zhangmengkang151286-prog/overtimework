/**
 * 属性测试：下班事件生成
 * 包含 Property 1, 2, 4
 */

import * as fc from 'fast-check';
import { createEvent, getCardGenerationMessage } from '../../services/stream/clockOutEventService';
import { StatusRecord, User } from '../../types/index';
import { WageBracket } from '../../types/clock-out-waterfall';

// ============ 生成器 ============

/** 生成有效的 HH:mm 格式时间字符串 */
const timeStringArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 }),
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

/** 生成有效的工作时间对（确保 start < end） */
const workTimesPairArb = fc.tuple(
  fc.integer({ min: 6, max: 12 }),  // 上班时间 6:00-12:00
  fc.integer({ min: 0, max: 59 }),
  fc.integer({ min: 14, max: 22 }), // 下班时间 14:00-22:00
  fc.integer({ min: 0, max: 59 }),
).map(([startH, startM, endH, endM]) => ({
  workStartTime: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
  workEndTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
}));

/** 生成有效的日期字符串 YYYY-MM-DD */
const dateStringArb = fc.tuple(
  fc.integer({ min: 2024, max: 2026 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 }),
).map(([y, m, d]) =>
  `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
);

/** 生成有效的 User 对象 */
const userArb = fc.record({
  id: fc.uuid(),
  phoneNumber: fc.string({ minLength: 11, maxLength: 11 }),
  avatar: fc.constantFrom('avatar_01', 'avatar_02', 'avatar_03'),
  username: fc.string({ minLength: 1, maxLength: 20 }),
  birthYear: fc.integer({ min: 1960, max: 2005 }),
  province: fc.string({ minLength: 1, maxLength: 10 }),
  city: fc.string({ minLength: 1, maxLength: 10 }),
  industry: fc.string({ minLength: 1, maxLength: 20 }),
  company: fc.string({ minLength: 1, maxLength: 20 }),
  positionCategory: fc.string({ minLength: 1, maxLength: 20 }),
  position: fc.string({ minLength: 1, maxLength: 20 }),
  monthlySalary: fc.integer({ min: 3000, max: 100000 }),
  createdAt: fc.constant('2024-01-01T00:00:00Z'),
  updatedAt: fc.constant('2024-01-01T00:00:00Z'),
}).chain((base) =>
  workTimesPairArb.map((times) => ({
    ...base,
    ...times,
  } as User))
);

/** 生成准时下班的 StatusRecord */
const ontimeStatusRecordArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  date: dateStringArb,
  isOvertime: fc.constant(false),
  overtimeHours: fc.constant(undefined),
  submittedAt: fc.date(),
}).map((r) => r as unknown as StatusRecord);

/** 生成加班下班的 StatusRecord（overtimeHours > 0） */
const overtimeStatusRecordArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  date: dateStringArb,
  isOvertime: fc.constant(true),
  overtimeHours: fc.double({ min: 0.5, max: 12, noNaN: true }),
  submittedAt: fc.date(),
}).map((r) => ({
  ...r,
  overtimeHours: Math.round(r.overtimeHours * 2) / 2, // 取 0.5 的倍数
} as unknown as StatusRecord));

// ============ Property 1: 准时下班事件计算正确性 ============

describe('下班瀑布流 - Property 1: 准时下班事件计算正确性', () => {
  /**
   * **Feature: clock-out-waterfall, Property 1: 准时下班事件计算正确性**
   * **Validates: Requirements 2.1, 2.7**
   *
   * 对任意用户（具有有效的 StandardClockOutTime）提交"准时下班"，
   * 生成的 ClockOutEvent 的 effectiveClockOutMoment 应等于该用户当日的 StandardClockOutTime，
   * 且 overtimeHours 应为 0。
   */
  it('准时下班事件的 effectiveClockOutMoment 等于用户当日 StandardClockOutTime，overtimeHours 为 0', () => {
    fc.assert(
      fc.property(
        ontimeStatusRecordArb,
        userArb,
        fc.boolean(),
        (statusRecord, user, isIncognito) => {
          // 确保 statusRecord.userId 与 user.id 一致
          const record = { ...statusRecord, userId: user.id };
          const event = createEvent(record, user, isIncognito);

          // overtimeHours 应为 0
          expect(event.overtimeHours).toBe(0);
          expect(event.clockOutType).toBe('ontime');

          // effectiveClockOutMoment 应等于用户当日的 workEndTime
          const [endH, endM] = user.workEndTime.split(':').map(Number);
          const expectedDate = new Date(`${record.date}T00:00:00`);
          expectedDate.setHours(endH, endM, 0, 0);

          const actualMoment = new Date(event.effectiveClockOutMoment);
          expect(actualMoment.getTime()).toBe(expectedDate.getTime());
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============ Property 2: 加班下班事件计算正确性 ============

describe('下班瀑布流 - Property 2: 加班下班事件计算正确性', () => {
  /**
   * **Feature: clock-out-waterfall, Property 2: 加班下班事件计算正确性**
   * **Validates: Requirements 2.2, 2.6**
   *
   * 对任意用户（具有有效的 StandardClockOutTime）提交"加班已下班"并填写加班时长 H（H > 0），
   * 生成的 ClockOutEvent 的 effectiveClockOutMoment 应等于 StandardClockOutTime + H 小时，
   * 且 overtimeHours 应等于 H。
   */
  it('加班事件的 effectiveClockOutMoment 等于 StandardClockOutTime + overtimeHours，overtimeHours 等于填写值', () => {
    fc.assert(
      fc.property(
        overtimeStatusRecordArb,
        userArb,
        fc.boolean(),
        (statusRecord, user, isIncognito) => {
          const record = { ...statusRecord, userId: user.id };
          const event = createEvent(record, user, isIncognito);

          const expectedOvertimeHours = Math.round((statusRecord.overtimeHours ?? 0) * 2) / 2;

          // overtimeHours 应等于填写值
          expect(event.overtimeHours).toBe(expectedOvertimeHours);
          expect(event.clockOutType).toBe('overtime');

          // effectiveClockOutMoment 应等于 StandardClockOutTime + overtimeHours
          const [endH, endM] = user.workEndTime.split(':').map(Number);
          const expectedDate = new Date(`${record.date}T00:00:00`);
          expectedDate.setHours(endH, endM, 0, 0);
          expectedDate.setTime(expectedDate.getTime() + expectedOvertimeHours * 60 * 60 * 1000);

          const actualMoment = new Date(event.effectiveClockOutMoment);
          expect(actualMoment.getTime()).toBe(expectedDate.getTime());
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============ Property 4: 事件字段完整性 ============

describe('下班瀑布流 - Property 4: 事件字段完整性', () => {
  /**
   * **Feature: clock-out-waterfall, Property 4: 事件字段完整性**
   * **Validates: Requirements 2.8**
   *
   * 对任意有效的 StatusRecord 和 User，生成的 ClockOutEvent 应包含所有必要字段
   * （effectiveClockOutMoment、clockOutType、overtimeHours、wageBracket 或 null、
   * industry、city、position、ageGroup、avatar、nickname），且无字段为 undefined。
   */
  it('生成的事件包含所有必要字段，无 undefined', () => {
    const statusRecordArb = fc.oneof(ontimeStatusRecordArb, overtimeStatusRecordArb);

    fc.assert(
      fc.property(
        statusRecordArb,
        userArb,
        fc.boolean(),
        (statusRecord, user, isIncognito) => {
          const record = { ...statusRecord, userId: user.id };
          const event = createEvent(record, user, isIncognito);

          // 所有必要字段不为 undefined
          expect(event.effectiveClockOutMoment).toBeDefined();
          expect(event.effectiveClockOutMoment).not.toBe('');
          expect(event.clockOutType).toBeDefined();
          expect(['ontime', 'overtime']).toContain(event.clockOutType);
          expect(event.overtimeHours).toBeDefined();
          expect(typeof event.overtimeHours).toBe('number');
          expect(event.overtimeHours).toBeGreaterThanOrEqual(0);

          // wageBracket 可以为 null（未配置时薪），但不能为 undefined
          expect(event.wageBracket !== undefined).toBe(true);

          // 匿名身份字段不为 undefined 且不为空
          expect(event.industry).toBeDefined();
          expect(event.industry).not.toBe('');
          expect(event.city).toBeDefined();
          expect(event.city).not.toBe('');
          expect(event.position).toBeDefined();
          expect(event.position).not.toBe('');
          expect(event.ageGroup).toBeDefined();
          expect(event.ageGroup).not.toBe('');
          expect(event.avatar).toBeDefined();
          expect(event.avatar).not.toBe('');
          expect(event.nickname).toBeDefined();
          expect(event.nickname).not.toBe('');

          // isIncognito 应与传入参数一致
          expect(event.isIncognito).toBe(isIncognito);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('wageBracket 在用户有月薪时为有效区间值', () => {
    const VALID_BRACKETS: (WageBracket | null)[] = [
      '<¥20', '¥20-¥40', '¥40-¥60', '¥60-¥80', '¥80-¥100',
      '¥100-¥150', '¥150-¥200', '¥200-¥300', '¥300-¥500', '>¥500',
      null,
    ];

    const statusRecordArb = fc.oneof(ontimeStatusRecordArb, overtimeStatusRecordArb);

    fc.assert(
      fc.property(
        statusRecordArb,
        userArb,
        fc.boolean(),
        (statusRecord, user, isIncognito) => {
          const record = { ...statusRecord, userId: user.id };
          const event = createEvent(record, user, isIncognito);

          expect(VALID_BRACKETS).toContain(event.wageBracket);

          // 如果用户有有效月薪和工作时间，wageBracket 不应为 null
          if (user.monthlySalary > 0 && user.workStartTime && user.workEndTime) {
            expect(event.wageBracket).not.toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

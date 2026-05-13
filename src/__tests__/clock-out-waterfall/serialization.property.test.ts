/**
 * 属性测试：序列化 round trip & 反序列化容错
 * **Feature: clock-out-waterfall, Property 15: 序列化 round trip**
 * **Validates: Requirements 10.1, 10.2**
 *
 * 对任意有效的 ClockOutEvent 对象，序列化为 JSON 后再反序列化应产生与原对象数据等价的对象。
 *
 * **Feature: clock-out-waterfall, Property 16: 反序列化容错**
 * **Validates: Requirements 10.3**
 *
 * 对任意包含若干有效和若干畸形 JSON 记录的数组，批量反序列化应成功解析所有有效记录并跳过畸形记录，不抛出异常。
 */

import * as fc from 'fast-check';
import {
  serializeEvent,
  deserializeEvent,
  deserializeBatch,
} from '../../services/stream/clockOutSerializer';
import { ClockOutEvent, ClockOutType, WageBracket } from '../../types/clock-out-waterfall';

// ============ 生成器 ============

/** 有效的下班类型生成器 */
const clockOutTypeArb: fc.Arbitrary<ClockOutType> = fc.constantFrom('ontime', 'overtime');

/** 有效的时薪区间生成器（含 null） */
const wageBracketArb: fc.Arbitrary<WageBracket | null> = fc.constantFrom(
  null,
  '<¥20', '¥20-¥40', '¥40-¥60', '¥60-¥80', '¥80-¥100',
  '¥100-¥150', '¥150-¥200', '¥200-¥300', '¥300-¥500', '>¥500',
);

/** 非空字符串生成器 */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.length > 0);

/** UUID 风格字符串生成器 */
const uuidArb = fc.uuid();

/** ISO 日期字符串生成器（使用整数时间戳避免无效日期） */
const isoDateArb = fc.integer({
  min: new Date('2024-01-01').getTime(),
  max: new Date('2026-12-31').getTime(),
}).map(ts => new Date(ts).toISOString());

/** 事件日期生成器（YYYY-MM-DD） */
const eventDateArb = fc.integer({
  min: new Date('2024-01-01').getTime(),
  max: new Date('2026-12-31').getTime(),
}).map(ts => new Date(ts).toISOString().slice(0, 10));

/** 有效的 ClockOutEvent 生成器 */
const clockOutEventArb: fc.Arbitrary<ClockOutEvent> = fc.record({
  id: uuidArb,
  userId: uuidArb,
  statusRecordId: uuidArb,
  eventDate: eventDateArb,
  clockOutType: clockOutTypeArb,
  effectiveClockOutMoment: isoDateArb,
  overtimeHours: fc.double({ min: 0, max: 12, noNaN: true }),
  wageBracket: wageBracketArb,
  industry: nonEmptyStringArb,
  city: nonEmptyStringArb,
  position: nonEmptyStringArb,
  ageGroup: nonEmptyStringArb,
  avatar: nonEmptyStringArb,
  nickname: nonEmptyStringArb,
  isIncognito: fc.boolean(),
  createdAt: isoDateArb,
});

// ============ Property 15: 序列化 round trip ============

describe('下班瀑布流 - Property 15: 序列化 round trip', () => {
  it('任意有效 ClockOutEvent 序列化后再反序列化应产生等价对象', () => {
    fc.assert(
      fc.property(clockOutEventArb, (event) => {
        const json = serializeEvent(event);
        const restored = deserializeEvent(json);
        expect(restored).not.toBeNull();
        expect(restored).toEqual(event);
      }),
      { numRuns: 100 },
    );
  });

  it('序列化结果为有效的 JSON 字符串', () => {
    fc.assert(
      fc.property(clockOutEventArb, (event) => {
        const json = serializeEvent(event);
        expect(() => JSON.parse(json)).not.toThrow();
      }),
      { numRuns: 100 },
    );
  });
});

// ============ Property 16: 反序列化容错 ============

/** 畸形记录生成器 */
const malformedRecordArb = fc.oneof(
  // 完全无效的值
  fc.constantFrom(null, undefined, 42, 'not-json-object', true, []),
  // 缺少必要字段的对象
  fc.record({
    id: uuidArb,
    // 缺少其他字段
  }),
  // 字段类型错误的对象
  fc.record({
    id: fc.constant(12345), // 应为 string
    userId: uuidArb,
    statusRecordId: uuidArb,
    eventDate: eventDateArb,
    clockOutType: fc.constant('invalid_type'),
    effectiveClockOutMoment: isoDateArb,
    overtimeHours: fc.constant(-1), // 负数
    wageBracket: fc.constant('invalid_bracket'),
    industry: nonEmptyStringArb,
    city: nonEmptyStringArb,
    position: nonEmptyStringArb,
    ageGroup: nonEmptyStringArb,
    avatar: nonEmptyStringArb,
    nickname: nonEmptyStringArb,
    isIncognito: fc.constant('not_boolean'),
    createdAt: isoDateArb,
  }),
);

describe('下班瀑布流 - Property 16: 反序列化容错', () => {
  it('包含有效和畸形记录的数组，批量反序列化应仅返回有效记录', () => {
    fc.assert(
      fc.property(
        fc.array(clockOutEventArb, { minLength: 1, maxLength: 10 }),
        fc.array(malformedRecordArb, { minLength: 1, maxLength: 10 }),
        (validEvents, malformedItems) => {
          // 将有效和畸形记录混合
          const mixed = [...validEvents, ...malformedItems];
          // 随机打乱顺序
          const shuffled = mixed.sort(() => Math.random() - 0.5);
          const jsonArray = JSON.stringify(shuffled);

          const result = deserializeBatch(jsonArray);

          // 不应抛出异常（到这里已经证明了）
          // 结果数量应等于有效记录数量
          expect(result.length).toBe(validEvents.length);
          // 结果中的每一条应与某个有效事件匹配
          for (const event of validEvents) {
            expect(result).toContainEqual(event);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('无效 JSON 字符串不应抛出异常', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        (randomStr) => {
          // 不应抛出异常
          const result = deserializeEvent(randomStr);
          // 结果为 null 或有效对象
          if (result !== null) {
            expect(result.id).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('非数组 JSON 批量反序列化返回空数组', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('{}'),
          fc.constant('"hello"'),
          fc.constant('123'),
          fc.constant('null'),
          fc.constant('true'),
        ),
        (jsonStr) => {
          const result = deserializeBatch(jsonStr);
          expect(result).toEqual([]);
        },
      ),
      { numRuns: 100 },
    );
  });
});

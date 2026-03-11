/**
 * 属性测试：趋势数据序列化
 *
 * 使用 fast-check 验证趋势数据序列化/反序列化的 round-trip 正确性
 */

import * as fc from 'fast-check';
import {
  serializeTrendData,
  deserializeTrendData,
  formatTrendDataPoint,
  parseTrendDataPoint,
} from '../../utils/trendDataUtils';
import {TrendDataPoint} from '../../types/my-page';

/**
 * 生成有效的 TrendDataPoint 的 arbitrary
 * label 不包含 '|' 字符（因为 formatTrendDataPoint 使用 '|' 作为分隔符）
 */
const trendDataPointArb: fc.Arbitrary<TrendDataPoint> = fc.record({
  label: fc
    .string({minLength: 1, maxLength: 20})
    .filter((s) => !s.includes('|')),
  date: fc
    .record({
      year: fc.integer({min: 2020, max: 2030}),
      month: fc.integer({min: 1, max: 12}),
      day: fc.integer({min: 1, max: 28}),
    })
    .map(({year, month, day}) => {
      const m = month.toString().padStart(2, '0');
      const d = day.toString().padStart(2, '0');
      return `${year}-${m}-${d}`;
    }),
  avgOvertimeHours: fc.double({min: 0, max: 12, noNaN: true, noDefaultInfinity: true}),
  recordCount: fc.integer({min: 1, max: 100}),
});

const trendDataArrayArb = fc.array(trendDataPointArb, {
  minLength: 0,
  maxLength: 30,
});

describe('MyPage - 趋势数据序列化属性测试', () => {
  /**
   * **Feature: my-page-calendar-trend, Property 7: 趋势数据序列化 round-trip**
   * **Validates: Requirements 9.1, 9.2**
   *
   * 对于任意有效的 TrendDataPoint 数组，serializeTrendData 后再 deserializeTrendData
   * 应产生与原始数据等价的数组。
   */
  it('序列化后反序列化应还原原始数据', () => {
    fc.assert(
      fc.property(trendDataArrayArb, (data) => {
        const serialized = serializeTrendData(data);
        const deserialized = deserializeTrendData(serialized);

        expect(deserialized.length).toBe(data.length);
        for (let i = 0; i < data.length; i++) {
          expect(deserialized[i].label).toBe(data[i].label);
          expect(deserialized[i].date).toBe(data[i].date);
          expect(deserialized[i].avgOvertimeHours).toBeCloseTo(
            data[i].avgOvertimeHours,
            10,
          );
          expect(deserialized[i].recordCount).toBe(data[i].recordCount);
        }
      }),
      {numRuns: 100},
    );
  });

  /**
   * **Feature: my-page-calendar-trend, Property 8: 趋势数据点格式化 round-trip**
   * **Validates: Requirements 9.3**
   *
   * 对于任意有效的 TrendDataPoint，formatTrendDataPoint 后再 parseTrendDataPoint
   * 应产生与原始数据点等价的对象。
   */
  it('格式化后解析应还原原始数据点', () => {
    fc.assert(
      fc.property(trendDataPointArb, (point) => {
        const formatted = formatTrendDataPoint(point);
        const parsed = parseTrendDataPoint(formatted);

        expect(parsed.label).toBe(point.label);
        expect(parsed.date).toBe(point.date);
        expect(parsed.avgOvertimeHours).toBeCloseTo(
          point.avgOvertimeHours,
          10,
        );
        expect(parsed.recordCount).toBe(point.recordCount);
      }),
      {numRuns: 100},
    );
  });
});

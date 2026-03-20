/**
 * 属性测试：维度数据序列化 round-trip
 *
 * **Feature: multi-dimension-stats, Property 5: 维度数据序列化 round-trip**
 * **Validates: Requirements 6.3, 6.4**
 *
 * 对于任意有效的 DimensionStatsMap 对象，将其序列化为 JSON 字符串再反序列化后，
 * 得到的对象应与原始对象在所有字段上相等（overtimeRatio 通过重新计算得到）
 */

import * as fc from 'fast-check';
import {
  serializeDimensionStats,
  deserializeDimensionStats,
} from '../../utils/dimensionStatsUtils';
import {DimensionItem, DimensionStatsMap} from '../../types';

// 生成有效的 DimensionItem（确保 totalCount = overtimeCount + onTimeCount）
const dimensionItemArb: fc.Arbitrary<DimensionItem> = fc
  .record({
    id: fc.uuid(),
    name: fc.string({minLength: 1, maxLength: 20}),
    overtimeCount: fc.integer({min: 0, max: 1000}),
    onTimeCount: fc.integer({min: 0, max: 1000}),
  })
  .map(({id, name, overtimeCount, onTimeCount}) => {
    const totalCount = overtimeCount + onTimeCount;
    return {
      id,
      name,
      overtimeCount,
      onTimeCount,
      totalCount,
      overtimeRatio: totalCount > 0 ? overtimeCount / totalCount : 0,
    };
  });

const dimensionItemsArb = fc.array(dimensionItemArb, {minLength: 0, maxLength: 10});

// 生成有效的 DimensionStatsMap
const dimensionStatsMapArb: fc.Arbitrary<DimensionStatsMap> = fc.record({
  industry: dimensionItemsArb,
  position: dimensionItemsArb,
  province: dimensionItemsArb,
  age: dimensionItemsArb,
});

describe('多维度统计 - 维度数据序列化 round-trip 属性测试', () => {
  /**
   * **Feature: multi-dimension-stats, Property 5: 维度数据序列化 round-trip**
   * **Validates: Requirements 6.3, 6.4**
   */
  it('序列化再反序列化后数据一致', () => {
    fc.assert(
      fc.property(dimensionStatsMapArb, (original) => {
        const json = serializeDimensionStats(original);
        const restored = deserializeDimensionStats(json);

        // 检查四个维度
        const dimensions: (keyof DimensionStatsMap)[] = ['industry', 'position', 'province', 'age'];

        for (const dim of dimensions) {
          expect(restored[dim].length).toBe(original[dim].length);

          for (let i = 0; i < original[dim].length; i++) {
            const orig = original[dim][i];
            const rest = restored[dim][i];

            // 非计算字段完全相等
            expect(rest.id).toBe(orig.id);
            expect(rest.name).toBe(orig.name);
            expect(rest.overtimeCount).toBe(orig.overtimeCount);
            expect(rest.onTimeCount).toBe(orig.onTimeCount);
            expect(rest.totalCount).toBe(orig.totalCount);

            // overtimeRatio 通过重新计算得到，应与原始值一致
            const expectedRatio = orig.totalCount > 0 ? orig.overtimeCount / orig.totalCount : 0;
            expect(rest.overtimeRatio).toBeCloseTo(expectedRatio, 10);
          }
        }
      }),
      {numRuns: 100},
    );
  });
});

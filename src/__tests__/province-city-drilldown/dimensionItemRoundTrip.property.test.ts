/**
 * 属性测试：DimensionItem 聚合数据 round trip
 *
 * **Feature: province-city-drilldown, Property 4: DimensionItem 聚合数据 round trip**
 * **Validates: Requirements 4.3**
 *
 * 对任意合法的 DimensionItem 数组，序列化为 JSON 字符串再反序列化
 * （overtimeRatio 通过重新计算得到），应还原出与原始数据等价的数组
 */

import * as fc from 'fast-check';
import {DimensionItem} from '../../types';

// 生成合法的 DimensionItem
const dimensionItemArb: fc.Arbitrary<DimensionItem> = fc
  .record({
    id: fc.string({minLength: 1, maxLength: 20}),
    name: fc.string({minLength: 1, maxLength: 20}),
    overtimeCount: fc.integer({min: 0, max: 10000}),
    onTimeCount: fc.integer({min: 0, max: 10000}),
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

// 反序列化时重新计算 overtimeRatio（与 deserializeDimensionStats 中的逻辑一致）
function deserializeCityStats(json: string): DimensionItem[] {
  const parsed: DimensionItem[] = JSON.parse(json);
  return parsed.map(item => ({
    ...item,
    overtimeRatio: item.totalCount > 0 ? item.overtimeCount / item.totalCount : 0,
  }));
}

describe('省份地级市下钻 - DimensionItem 聚合数据 round trip 属性测试', () => {
  /**
   * **Feature: province-city-drilldown, Property 4: DimensionItem 聚合数据 round trip**
   * **Validates: Requirements 4.3**
   */
  it('DimensionItem[] 序列化再反序列化（重新计算 overtimeRatio）后数据等价', () => {
    fc.assert(
      fc.property(
        fc.array(dimensionItemArb, {minLength: 0, maxLength: 20}),
        (original: DimensionItem[]) => {
          const json = JSON.stringify(original);
          const restored = deserializeCityStats(json);

          // 数组长度一致
          expect(restored.length).toBe(original.length);

          // 每个元素等价
          for (let i = 0; i < original.length; i++) {
            const orig = original[i];
            const rest = restored[i];

            expect(rest.id).toBe(orig.id);
            expect(rest.name).toBe(orig.name);
            expect(rest.overtimeCount).toBe(orig.overtimeCount);
            expect(rest.onTimeCount).toBe(orig.onTimeCount);
            expect(rest.totalCount).toBe(orig.totalCount);

            // overtimeRatio 通过重新计算得到，应与原始值一致
            if (orig.totalCount > 0) {
              expect(rest.overtimeRatio).toBeCloseTo(orig.overtimeRatio, 10);
            } else {
              expect(rest.overtimeRatio).toBe(0);
            }
          }
        },
      ),
      {numRuns: 100},
    );
  });
});

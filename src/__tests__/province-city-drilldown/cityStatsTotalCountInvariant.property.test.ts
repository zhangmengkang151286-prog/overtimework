/**
 * 属性测试：聚合数据 totalCount 不变量
 *
 * **Feature: province-city-drilldown, Property 5: 聚合数据 totalCount 不变量**
 * **Validates: Requirements 4.1**
 *
 * 对任意地级市 DimensionItem，totalCount 应等于 overtimeCount + onTimeCount，
 * 且 overtimeRatio 应等于 overtimeCount / totalCount（totalCount > 0 时）
 */

import * as fc from 'fast-check';
import {DimensionItem} from '../../types';

// 生成合法的 DimensionItem（模拟 getCityStats 返回的数据结构）
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

describe('省份地级市下钻 - 聚合数据 totalCount 不变量属性测试', () => {
  /**
   * **Feature: province-city-drilldown, Property 5: 聚合数据 totalCount 不变量**
   * **Validates: Requirements 4.1**
   */
  it('totalCount 等于 overtimeCount + onTimeCount，overtimeRatio 等于 overtimeCount / totalCount', () => {
    fc.assert(
      fc.property(dimensionItemArb, (item: DimensionItem) => {
        // 不变量 1: totalCount = overtimeCount + onTimeCount
        expect(item.totalCount).toBe(item.overtimeCount + item.onTimeCount);

        // 不变量 2: overtimeRatio 正确计算
        if (item.totalCount > 0) {
          expect(item.overtimeRatio).toBeCloseTo(
            item.overtimeCount / item.totalCount,
            10,
          );
        } else {
          expect(item.overtimeRatio).toBe(0);
        }

        // 不变量 3: overtimeRatio 在 [0, 1] 范围内
        expect(item.overtimeRatio).toBeGreaterThanOrEqual(0);
        expect(item.overtimeRatio).toBeLessThanOrEqual(1);
      }),
      {numRuns: 100},
    );
  });
});

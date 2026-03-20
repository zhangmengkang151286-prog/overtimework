/**
 * 属性测试：职位按人数降序排列
 *
 * **Feature: multi-dimension-stats, Property 3: 职位按人数降序排列**
 * **Validates: Requirements 3.2**
 *
 * 对于任意职位维度数据列表，排序后列表中每个元素的 totalCount
 * 应大于等于其后一个元素的 totalCount
 */

import * as fc from 'fast-check';
import {sortByTotalCount} from '../../utils/dimensionStatsUtils';
import {DimensionItem} from '../../types';

// 生成有效的 DimensionItem
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

const dimensionItemsArb = fc.array(dimensionItemArb, {minLength: 0, maxLength: 30});

describe('多维度统计 - 职位按人数降序排列属性测试', () => {
  /**
   * **Feature: multi-dimension-stats, Property 3: 职位按人数降序排列**
   * **Validates: Requirements 3.2**
   */
  it('排序后每个元素的 totalCount 大于等于后一个元素', () => {
    fc.assert(
      fc.property(dimensionItemsArb, (items) => {
        const sorted = sortByTotalCount(items);

        // 长度不变
        expect(sorted.length).toBe(items.length);

        // 降序排列
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i - 1].totalCount).toBeGreaterThanOrEqual(sorted[i].totalCount);
        }
      }),
      {numRuns: 100},
    );
  });
});

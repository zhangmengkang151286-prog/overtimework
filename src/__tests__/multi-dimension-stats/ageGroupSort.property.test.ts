/**
 * 属性测试：年龄段按预定义顺序排列
 *
 * **Feature: multi-dimension-stats, Property 4: 年龄段按预定义顺序排列**
 * **Validates: Requirements 5.2**
 *
 * 对于任意年龄段维度数据列表，排序后的年龄段顺序应严格遵循预定义顺序
 * （10后及以后 → 00后 → 95后 → 90后 → 85后 → 80后 → 75后 → 70后及以前），不存在乱序
 */

import * as fc from 'fast-check';
import {sortAgeGroups, AGE_GROUP_ORDER} from '../../utils/dimensionStatsUtils';
import {DimensionItem} from '../../types';

// 从预定义年龄段中随机选取子集生成 DimensionItem 列表
const ageGroupItemArb: fc.Arbitrary<DimensionItem> = fc
  .record({
    name: fc.constantFrom(...AGE_GROUP_ORDER),
    overtimeCount: fc.integer({min: 0, max: 500}),
    onTimeCount: fc.integer({min: 0, max: 500}),
  })
  .map(({name, overtimeCount, onTimeCount}) => {
    const totalCount = overtimeCount + onTimeCount;
    return {
      id: name,
      name,
      overtimeCount,
      onTimeCount,
      totalCount,
      overtimeRatio: totalCount > 0 ? overtimeCount / totalCount : 0,
    };
  });

// 生成不重复年龄段名称的列表
const uniqueAgeGroupsArb: fc.Arbitrary<DimensionItem[]> = fc
  .shuffledSubarray(AGE_GROUP_ORDER, {minLength: 1})
  .chain((names) =>
    fc.tuple(
      ...names.map((name) =>
        fc.record({
          overtimeCount: fc.integer({min: 0, max: 500}),
          onTimeCount: fc.integer({min: 0, max: 500}),
        }).map(({overtimeCount, onTimeCount}) => {
          const totalCount = overtimeCount + onTimeCount;
          return {
            id: name,
            name,
            overtimeCount,
            onTimeCount,
            totalCount,
            overtimeRatio: totalCount > 0 ? overtimeCount / totalCount : 0,
          } as DimensionItem;
        }),
      ),
    ),
  );

describe('多维度统计 - 年龄段按预定义顺序排列属性测试', () => {
  /**
   * **Feature: multi-dimension-stats, Property 4: 年龄段按预定义顺序排列**
   * **Validates: Requirements 5.2**
   */
  it('排序后年龄段严格遵循预定义顺序', () => {
    fc.assert(
      fc.property(uniqueAgeGroupsArb, (items) => {
        const sorted = sortAgeGroups(items);

        // 长度不变
        expect(sorted.length).toBe(items.length);

        // 排序后的顺序应与 AGE_GROUP_ORDER 中的相对顺序一致
        for (let i = 1; i < sorted.length; i++) {
          const prevIndex = AGE_GROUP_ORDER.indexOf(sorted[i - 1].name);
          const currIndex = AGE_GROUP_ORDER.indexOf(sorted[i].name);
          expect(prevIndex).toBeLessThan(currIndex);
        }
      }),
      {numRuns: 100},
    );
  });
});

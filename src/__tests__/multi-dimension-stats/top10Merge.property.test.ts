/**
 * 属性测试：行业 Top10 合并正确性
 *
 * **Feature: multi-dimension-stats, Property 1: 行业 Top10 合并正确性**
 * **Validates: Requirements 2.1**
 *
 * 对于任意行业维度数据列表，经过 Top10 处理后：
 * - 结果列表长度不超过 11（10 个行业 + 1 个"其他"）
 * - 前 10 项按 totalCount 降序排列（"其他"项除外）
 * - 若原始列表超过 10 项，"其他"项的 totalCount 等于第 11 项及之后所有项的 totalCount 之和
 * - 所有项的 totalCount 之和等于原始列表所有项的 totalCount 之和
 */

import * as fc from 'fast-check';
import {processTop10WithOthers} from '../../utils/dimensionStatsUtils';
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

// 生成非空列表
const dimensionItemsArb = fc.array(dimensionItemArb, {minLength: 1, maxLength: 30});

describe('多维度统计 - 行业 Top10 合并正确性属性测试', () => {
  /**
   * **Feature: multi-dimension-stats, Property 1: 行业 Top10 合并正确性**
   * **Validates: Requirements 2.1**
   */
  it('Top10 合并后结果长度不超过 11，总数守恒，前 10 项降序排列', () => {
    fc.assert(
      fc.property(dimensionItemsArb, (items) => {
        const result = processTop10WithOthers(items);

        // 1. 结果长度不超过 11
        expect(result.length).toBeLessThanOrEqual(11);

        // 2. 所有项的 totalCount 之和等于原始列表之和
        const originalSum = items.reduce((s, i) => s + i.totalCount, 0);
        const resultSum = result.reduce((s, i) => s + i.totalCount, 0);
        expect(resultSum).toBe(originalSum);

        // 3. 前 10 项（不含"其他"）按 totalCount 降序排列
        const nonOthers = result.filter(i => i.id !== '__others__');
        for (let i = 1; i < nonOthers.length; i++) {
          expect(nonOthers[i - 1].totalCount).toBeGreaterThanOrEqual(nonOthers[i].totalCount);
        }

        // 4. 若原始列表超过 10 项，"其他"项存在且 totalCount 正确
        if (items.length > 10) {
          const othersItem = result.find(i => i.id === '__others__');
          expect(othersItem).toBeDefined();

          // 按 totalCount 降序排列原始列表，取第 11 项及之后的 totalCount 之和
          const sorted = [...items].sort((a, b) => b.totalCount - a.totalCount);
          const restSum = sorted.slice(10).reduce((s, i) => s + i.totalCount, 0);
          expect(othersItem!.totalCount).toBe(restSum);
        }
      }),
      {numRuns: 100},
    );
  });
});

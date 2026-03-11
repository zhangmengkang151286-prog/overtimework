/**
 * 属性测试：百分比之和等于 100
 *
 * **Feature: tag-proportion-treemap, Property 6: 百分比之和等于 100**
 * **Validates: Requirements 6.2**
 *
 * 对于任意一组标签计数数据（每个计数为正整数），
 * 计算百分比后所有百分比之和应等于 100（允许浮点误差 ±0.1）。
 */

import * as fc from 'fast-check';
import {computePercentages, TagCountInput} from '../../utils/tagProportionUtils';

// 生成有效的标签计数输入
const tagCountInputArb: fc.Arbitrary<TagCountInput> = fc.record({
  tagId: fc.uuid(),
  tagName: fc.string({minLength: 1, maxLength: 10}),
  count: fc.integer({min: 1, max: 1000}),
  isOvertime: fc.boolean(),
});

const tagCountArrayArb = fc.array(tagCountInputArb, {
  minLength: 1,
  maxLength: 20,
});

describe('标签占比 - 百分比之和属性测试', () => {
  /**
   * **Feature: tag-proportion-treemap, Property 6: 百分比之和等于 100**
   * **Validates: Requirements 6.2**
   */
  it('百分比之和应精确等于 100', () => {
    fc.assert(
      fc.property(tagCountArrayArb, (tags) => {
        const result = computePercentages(tags);

        // 结果不为空（因为输入至少有 1 项且 count >= 1）
        expect(result.length).toBeGreaterThan(0);

        // 百分比之和应等于 100
        const sum = result.reduce((s, item) => s + item.percentage, 0);
        expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.1);
      }),
      {numRuns: 100},
    );
  });
});

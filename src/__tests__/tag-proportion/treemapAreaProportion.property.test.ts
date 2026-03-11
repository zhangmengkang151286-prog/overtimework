/**
 * 属性测试：矩形面积与占比成正比
 *
 * **Feature: tag-proportion-treemap, Property 1: 矩形面积与占比成正比**
 * **Validates: Requirements 3.1**
 *
 * 对于任意一组有效的标签占比数据（至少 1 项，百分比之和为 100）和任意有效的容器尺寸，
 * 布局后每个矩形的面积与其百分比的比值应相等（允许浮点误差 ±1%）。
 */

import * as fc from 'fast-check';
import {computeTreemapLayout} from '../../utils/treemapLayout';
import {TagProportionItem} from '../../types/tag-proportion';
import {computePercentages, TagCountInput} from '../../utils/tagProportionUtils';

// 生成有效的标签占比数据（通过 computePercentages 确保百分比之和为 100）
const tagCountInputArb: fc.Arbitrary<TagCountInput> = fc.record({
  tagId: fc.uuid(),
  tagName: fc.string({minLength: 1, maxLength: 10}),
  count: fc.integer({min: 1, max: 100}),
  isOvertime: fc.boolean(),
});

const validItemsArb: fc.Arbitrary<TagProportionItem[]> = fc
  .array(tagCountInputArb, {minLength: 1, maxLength: 10})
  .map((tags) => computePercentages(tags))
  .filter((items) => items.length > 0 && items.every((item) => item.percentage > 0));

// 容器尺寸
const containerSizeArb = fc.record({
  width: fc.integer({min: 50, max: 500}),
  height: fc.integer({min: 50, max: 500}),
});

describe('标签占比 - 矩形面积与占比成正比属性测试', () => {
  /**
   * **Feature: tag-proportion-treemap, Property 1: 矩形面积与占比成正比**
   * **Validates: Requirements 3.1**
   */
  it('每个矩形的面积与其百分比的比值应相等', () => {
    fc.assert(
      fc.property(validItemsArb, containerSizeArb, (items, size) => {
        const rects = computeTreemapLayout(items, size.width, size.height);

        // 结果数量应与输入一致
        expect(rects.length).toBe(items.length);

        if (rects.length <= 1) return;

        // 计算每个矩形的 area / percentage 比值
        const ratios = rects.map((r) => {
          const area = r.width * r.height;
          return area / r.item.percentage;
        });

        // 所有比值应相近（允许 ±1% 的相对误差）
        const avgRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length;
        for (const ratio of ratios) {
          const relativeError = Math.abs(ratio - avgRatio) / avgRatio;
          expect(relativeError).toBeLessThanOrEqual(0.01);
        }
      }),
      {numRuns: 100},
    );
  });
});

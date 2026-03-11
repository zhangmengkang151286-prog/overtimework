/**
 * 属性测试：矩形面积之和等于容器总面积
 *
 * **Feature: tag-proportion-treemap, Property 2: 矩形面积之和等于容器总面积**
 * **Validates: Requirements 3.2**
 *
 * 对于任意一组有效的标签占比数据和任意有效的容器尺寸，
 * 布局后所有矩形的面积之和应等于容器的总面积（允许浮点误差 ±1%）。
 */

import * as fc from 'fast-check';
import {computeTreemapLayout} from '../../utils/treemapLayout';
import {TagProportionItem} from '../../types/tag-proportion';
import {computePercentages, TagCountInput} from '../../utils/tagProportionUtils';

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

const containerSizeArb = fc.record({
  width: fc.integer({min: 50, max: 500}),
  height: fc.integer({min: 50, max: 500}),
});

describe('标签占比 - 矩形面积之和等于容器总面积属性测试', () => {
  /**
   * **Feature: tag-proportion-treemap, Property 2: 矩形面积之和等于容器总面积**
   * **Validates: Requirements 3.2**
   */
  it('所有矩形面积之和应等于容器总面积', () => {
    fc.assert(
      fc.property(validItemsArb, containerSizeArb, (items, size) => {
        const rects = computeTreemapLayout(items, size.width, size.height);
        const containerArea = size.width * size.height;
        const totalRectArea = rects.reduce(
          (sum, r) => sum + r.width * r.height,
          0,
        );

        // 允许 ±1% 的浮点误差
        const relativeError = Math.abs(totalRectArea - containerArea) / containerArea;
        expect(relativeError).toBeLessThanOrEqual(0.01);
      }),
      {numRuns: 100},
    );
  });
});

/**
 * 属性测试：布局有效性
 *
 * **Feature: tag-proportion-treemap, Property 3: 布局有效性**
 * **Validates: Requirements 3.3, 7.2**
 *
 * 对于任意一组有效的标签占比数据和任意有效的容器尺寸，
 * 布局后每个矩形的宽度和高度均为正数，且任意两个矩形之间无重叠。
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

/**
 * 检查两个矩形是否重叠（允许边界接触，使用小容差）
 */
function rectsOverlap(
  a: {x: number; y: number; width: number; height: number},
  b: {x: number; y: number; width: number; height: number},
): boolean {
  const eps = 0.001; // 浮点容差
  const noOverlap =
    a.x + a.width <= b.x + eps ||
    b.x + b.width <= a.x + eps ||
    a.y + a.height <= b.y + eps ||
    b.y + b.height <= a.y + eps;
  return !noOverlap;
}

describe('标签占比 - 布局有效性属性测试', () => {
  /**
   * **Feature: tag-proportion-treemap, Property 3: 布局有效性**
   * **Validates: Requirements 3.3, 7.2**
   */
  it('每个矩形宽高为正数且无重叠', () => {
    fc.assert(
      fc.property(validItemsArb, containerSizeArb, (items, size) => {
        const rects = computeTreemapLayout(items, size.width, size.height);

        // 每个矩形的宽度和高度均为正数
        for (const rect of rects) {
          expect(rect.width).toBeGreaterThan(0);
          expect(rect.height).toBeGreaterThan(0);
        }

        // 任意两个矩形之间无重叠
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            expect(rectsOverlap(rects[i], rects[j])).toBe(false);
          }
        }
      }),
      {numRuns: 100},
    );
  });
});

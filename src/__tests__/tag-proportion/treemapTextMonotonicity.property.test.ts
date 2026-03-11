/**
 * 属性测试：文字大小单调性
 *
 * **Feature: tag-proportion-treemap, Property 5: 文字大小单调性**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 *
 * 对于任意两个矩形 A 和 B，若 A 的面积大于 B 的面积，
 * 则 computeTextLayout(A).fontSize >= computeTextLayout(B).fontSize。
 * 且当矩形面积低于最小阈值时，showText 为 false。
 */

import * as fc from 'fast-check';
import {computeTextLayout} from '../../utils/treemapLayout';

// 生成正数尺寸的矩形（宽高均 > 0）
const rectArb = fc.record({
  width: fc.float({min: 1, max: 500, noNaN: true}),
  height: fc.float({min: 1, max: 500, noNaN: true}),
});

describe('标签占比 - 文字大小单调性属性测试', () => {
  /**
   * **Feature: tag-proportion-treemap, Property 5: 文字大小单调性**
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
   */
  it('面积更大的矩形字号应大于等于面积更小的矩形字号，面积过小时不显示文字', () => {
    fc.assert(
      fc.property(rectArb, rectArb, (rectA, rectB) => {
        const areaA = rectA.width * rectA.height;
        const areaB = rectB.width * rectB.height;
        const layoutA = computeTextLayout(rectA);
        const layoutB = computeTextLayout(rectB);

        // 单调性：面积更大 => 字号更大或相等
        if (areaA > areaB) {
          expect(layoutA.fontSize).toBeGreaterThanOrEqual(layoutB.fontSize);
        } else if (areaB > areaA) {
          expect(layoutB.fontSize).toBeGreaterThanOrEqual(layoutA.fontSize);
        }

        // 面积过小时 showText 为 false
        const MIN_TEXT_AREA = 40 * 30; // 1200
        if (areaA < MIN_TEXT_AREA) {
          expect(layoutA.showText).toBe(false);
        }
        if (areaB < MIN_TEXT_AREA) {
          expect(layoutB.showText).toBe(false);
        }
      }),
      {numRuns: 100},
    );
  });
});

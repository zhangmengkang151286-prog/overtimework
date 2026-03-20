/**
 * **Feature: drawer-refactor, Property 4: 遮罩透明度线性插值**
 * **Validates: Requirements 5.3**
 *
 * 对于任意 translateX 值（范围 [-DRAWER_WIDTH, 0]），
 * computeBackdropOpacity 的返回值应等于 0.5 * (translateX + DRAWER_WIDTH) / DRAWER_WIDTH，
 * 且结果在 [0, 0.5] 范围内
 */
import * as fc from 'fast-check';
import {computeBackdropOpacity, DRAWER_WIDTH} from '../../utils/drawerUtils';

describe('Property 4: 遮罩透明度线性插值', () => {
  it('computeBackdropOpacity 应返回正确的线性插值结果', () => {
    fc.assert(
      fc.property(
        // translateX 范围 [-DRAWER_WIDTH, 0]
        fc.double({min: -DRAWER_WIDTH, max: 0, noNaN: true}),
        (translateX) => {
          const result = computeBackdropOpacity(translateX, DRAWER_WIDTH);
          const expected = 0.5 * (translateX + DRAWER_WIDTH) / DRAWER_WIDTH;

          // 结果在 [0, 0.5] 范围内
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(0.5);

          // 与预期值一致（浮点精度容差）
          expect(result).toBeCloseTo(expected, 10);
        },
      ),
      {numRuns: 200},
    );
  });
});

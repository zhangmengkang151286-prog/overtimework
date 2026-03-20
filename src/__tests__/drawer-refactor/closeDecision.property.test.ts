/**
 * **Feature: drawer-refactor, Property 1: 关闭决策正确性**
 * **Validates: Requirements 2.1, 2.2, 2.3**
 *
 * 对于任意 translateX 值（范围 [-DRAWER_WIDTH, 0]）和任意 velocityX 值，
 * shouldCloseDrawer 的返回值应等于 velocityX < -300 || Math.abs(translateX) > DRAWER_WIDTH * 0.35
 */
import * as fc from 'fast-check';
import {shouldCloseDrawer, DRAWER_WIDTH} from '../../utils/drawerUtils';

describe('Property 1: 关闭决策正确性', () => {
  it('shouldCloseDrawer 的返回值应与规范定义的条件一致', () => {
    fc.assert(
      fc.property(
        // translateX 范围 [-DRAWER_WIDTH, 0]
        fc.double({min: -DRAWER_WIDTH, max: 0, noNaN: true}),
        // velocityX 任意合理范围
        fc.double({min: -2000, max: 2000, noNaN: true}),
        (translateX, velocityX) => {
          const result = shouldCloseDrawer(translateX, velocityX, DRAWER_WIDTH);
          const expected =
            velocityX < -300 ||
            Math.abs(translateX) > DRAWER_WIDTH * 0.35;
          expect(result).toBe(expected);
        },
      ),
      {numRuns: 200},
    );
  });
});

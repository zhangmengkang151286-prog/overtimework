/**
 * **Feature: drawer-refactor, Property 2: 打开决策正确性**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 *
 * 对于任意 translationX 值（从 -DRAWER_WIDTH 开始的位移）和任意 velocityX 值，
 * shouldOpenDrawer 的返回值应等于 velocityX > 500 || translationX > DRAWER_WIDTH * 0.5
 */
import * as fc from 'fast-check';
import {shouldOpenDrawer, DRAWER_WIDTH} from '../../utils/drawerUtils';

describe('Property 2: 打开决策正确性', () => {
  it('shouldOpenDrawer 的返回值应与规范定义的条件一致', () => {
    fc.assert(
      fc.property(
        // translationX：从关闭位置开始的位移，范围 [0, DRAWER_WIDTH]
        fc.double({min: 0, max: DRAWER_WIDTH, noNaN: true}),
        // velocityX 任意合理范围
        fc.double({min: -2000, max: 2000, noNaN: true}),
        (translationX, velocityX) => {
          const result = shouldOpenDrawer(translationX, velocityX, DRAWER_WIDTH);
          const expected =
            velocityX > 500 ||
            translationX > DRAWER_WIDTH * 0.5;
          expect(result).toBe(expected);
        },
      ),
      {numRuns: 200},
    );
  });
});

/**
 * **Feature: drawer-refactor, Property 6: isOpen prop 驱动的目标位置一致性**
 * **Validates: Requirements 4.1, 4.2, 4.5**
 *
 * 对于任意 isOpen 布尔值，当 isOpen 为 true 时目标 translateX 应为 0，
 * 当 isOpen 为 false 时目标 translateX 应为 -DRAWER_WIDTH
 */
import * as fc from 'fast-check';
import {getTargetTranslateX, DRAWER_WIDTH} from '../../utils/drawerUtils';

describe('Property 6: isOpen prop 驱动的目标位置一致性', () => {
  it('getTargetTranslateX 应根据 isOpen 返回正确的目标位置', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        // 使用任意正数作为 drawerWidth，确保通用性
        fc.double({min: 1, max: 2000, noNaN: true}),
        (isOpen, drawerWidth) => {
          const target = getTargetTranslateX(isOpen, drawerWidth);
          if (isOpen) {
            expect(target).toBe(0);
          } else {
            expect(target).toBe(-drawerWidth);
          }
        },
      ),
      {numRuns: 200},
    );
  });
});

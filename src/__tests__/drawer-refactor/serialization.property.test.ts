/**
 * **Feature: drawer-refactor, Property 5: 状态序列化 round-trip**
 * **Validates: Requirements 6.1, 6.2**
 *
 * 对于任意有效的 DrawerState 对象（translateX 在 [-DRAWER_WIDTH, 0] 范围内，isOpen 为布尔值），
 * deserializeDrawerState(serializeDrawerState(state)) 应等于原始 state
 */
import * as fc from 'fast-check';
import {
  serializeDrawerState,
  deserializeDrawerState,
  DRAWER_WIDTH,
  DrawerState,
} from '../../utils/drawerUtils';

describe('Property 5: 状态序列化 round-trip', () => {
  it('序列化后反序列化应还原出等价的 DrawerState', () => {
    fc.assert(
      fc.property(
        fc.record({
          translateX: fc.double({min: -DRAWER_WIDTH, max: 0, noNaN: true, noDefaultInfinity: true}),
          isOpen: fc.boolean(),
        }) as fc.Arbitrary<DrawerState>,
        (state) => {
          const json = serializeDrawerState(state);
          const restored = deserializeDrawerState(json);
          expect(restored.translateX).toBeCloseTo(state.translateX, 10);
          expect(restored.isOpen).toBe(state.isOpen);
        },
      ),
      {numRuns: 200},
    );
  });
});

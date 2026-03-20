/**
 * **Feature: drawer-refactor, Property 3: 拖拽跟踪 — translateX 始终在有效范围内**
 * **Validates: Requirements 2.4**
 *
 * 对于任意起始位置 startX（范围 [-DRAWER_WIDTH, 0]）和任意拖拽位移 delta，
 * clampTranslateX 计算后的值应始终满足 -DRAWER_WIDTH <= translateX <= 0
 */
import * as fc from 'fast-check';
import {clampTranslateX, DRAWER_WIDTH} from '../../utils/drawerUtils';

describe('Property 3: translateX 范围有效性', () => {
  it('clampTranslateX 的结果始终在 [-DRAWER_WIDTH, 0] 范围内', () => {
    fc.assert(
      fc.property(
        // startX 范围 [-DRAWER_WIDTH, 0]
        fc.double({min: -DRAWER_WIDTH, max: 0, noNaN: true}),
        // delta 任意大范围位移
        fc.double({min: -2000, max: 2000, noNaN: true}),
        (startX, delta) => {
          const raw = startX + delta;
          const clamped = clampTranslateX(raw, DRAWER_WIDTH);
          expect(clamped).toBeGreaterThanOrEqual(-DRAWER_WIDTH);
          expect(clamped).toBeLessThanOrEqual(0);
        },
      ),
      {numRuns: 200},
    );
  });
});

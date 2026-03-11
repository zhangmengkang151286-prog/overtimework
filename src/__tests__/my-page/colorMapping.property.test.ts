/**
 * 属性测试：颜色映射
 *
 * 使用 fast-check 验证颜色映射函数的正确性属性
 */

import * as fc from 'fast-check';
import {
  getOvertimeColor,
  getStatusColor,
  extractOpacity,
} from '../../utils/calendarUtils';

describe('MyPage - 颜色映射属性测试', () => {
  /**
   * **Feature: my-page-calendar-trend, Property 2: 加班颜色单调性**
   * **Validates: Requirements 3.2, 3.4**
   *
   * 对于任意两个加班时长 h1 和 h2（1 ≤ h1 < h2 ≤ 12），
   * getOvertimeColor(h1) 的透明度应严格小于 getOvertimeColor(h2) 的透明度。
   * 即加班时长越长，红色越深。
   */
  it('加班时长越长，红色透明度越高（单调递增）', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 1, max: 11}), // h1: 1-11
        fc.boolean(), // isDark
        (h1, isDark) => {
          const h2 = h1 + 1; // h2 > h1，且 h2 <= 12
          const color1 = getOvertimeColor(h1, isDark);
          const color2 = getOvertimeColor(h2, isDark);
          const opacity1 = extractOpacity(color1);
          const opacity2 = extractOpacity(color2);

          // h1 < h2 => opacity1 < opacity2（严格单调递增）
          expect(opacity1).toBeLessThan(opacity2);
        },
      ),
      {numRuns: 100},
    );
  });

  /**
   * **Feature: my-page-calendar-trend, Property 3: 状态颜色映射完备性**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   *
   * 对于任意个人状态记录，颜色映射函数应满足：
   * 准时下班映射为绿色系，加班映射为红色系，无记录映射为灰色系。
   * 三种状态的颜色类型互不相同。
   */
  it('三种状态映射到不同的颜色类型', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 1, max: 12}), // 加班时长
        fc.boolean(), // isDark
        (overtimeHours, isDark) => {
          const ontimeResult = getStatusColor('ontime', 0, isDark);
          const overtimeResult = getStatusColor('overtime', overtimeHours, isDark);
          const noneResult = getStatusColor('none', 0, isDark);

          // 三种状态的颜色类型互不相同
          expect(ontimeResult.type).toBe('green');
          expect(overtimeResult.type).toBe('red');
          expect(noneResult.type).toBe('gray');

          // 颜色值不为空
          expect(ontimeResult.color).toBeTruthy();
          expect(overtimeResult.color).toBeTruthy();
          expect(noneResult.color).toBeTruthy();

          // 三种颜色互不相同
          const colors = new Set([
            ontimeResult.color,
            overtimeResult.color,
            noneResult.color,
          ]);
          expect(colors.size).toBe(3);
        },
      ),
      {numRuns: 100},
    );
  });
});

/**
 * 属性测试：时薪区间映射
 * **Feature: clock-out-waterfall, Property 5: 时薪区间映射**
 * **Validates: Requirements 3.2, 9.1, 9.2**
 *
 * 对任意非负精确时薪值，映射函数应返回十个预定义区间之一，
 * 且映射结果与时薪值的大小关系一致（更高的时薪映射到更高的区间）。
 */

import * as fc from 'fast-check';
import { mapWageToBracket } from '../../utils/waterfallUtils';
import { WageBracket } from '../../types/clock-out-waterfall';

// 所有区间按从低到高排列
const ORDERED_BRACKETS: WageBracket[] = [
  '<¥20',
  '¥20-¥40',
  '¥40-¥60',
  '¥60-¥80',
  '¥80-¥100',
  '¥100-¥150',
  '¥150-¥200',
  '¥200-¥300',
  '¥300-¥500',
  '>¥500',
];

/**
 * 获取区间的序号（用于比较大小关系）
 */
function bracketIndex(bracket: WageBracket): number {
  return ORDERED_BRACKETS.indexOf(bracket);
}

describe('下班瀑布流 - Property 5: 时薪区间映射', () => {
  it('任意非负时薪应映射到十个预定义区间之一', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10000, noNaN: true }),
        (wage) => {
          const result = mapWageToBracket(wage);
          expect(ORDERED_BRACKETS).toContain(result);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('更高的时薪应映射到更高或相同的区间（单调性）', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10000, noNaN: true }),
        fc.double({ min: 0, max: 10000, noNaN: true }),
        (wageA, wageB) => {
          const bracketA = mapWageToBracket(wageA);
          const bracketB = mapWageToBracket(wageB);
          if (wageA <= wageB) {
            expect(bracketIndex(bracketA)).toBeLessThanOrEqual(bracketIndex(bracketB));
          } else {
            expect(bracketIndex(bracketA)).toBeGreaterThanOrEqual(bracketIndex(bracketB));
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('区间边界值映射正确', () => {
    // 边界值验证：每个区间的下界应映射到该区间
    const boundaries: Array<{ wage: number; expected: WageBracket }> = [
      { wage: 0, expected: '<¥20' },
      { wage: 19.99, expected: '<¥20' },
      { wage: 20, expected: '¥20-¥40' },
      { wage: 40, expected: '¥40-¥60' },
      { wage: 60, expected: '¥60-¥80' },
      { wage: 80, expected: '¥80-¥100' },
      { wage: 100, expected: '¥100-¥150' },
      { wage: 150, expected: '¥150-¥200' },
      { wage: 200, expected: '¥200-¥300' },
      { wage: 300, expected: '¥300-¥500' },
      { wage: 500, expected: '>¥500' },
    ];

    for (const { wage, expected } of boundaries) {
      expect(mapWageToBracket(wage)).toBe(expected);
    }
  });
});

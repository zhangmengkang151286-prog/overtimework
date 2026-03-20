/**
 * 属性测试：色阶映射有效性
 *
 * **Feature: multi-dimension-stats, Property 2: 色阶映射有效性**
 * **Validates: Requirements 2.3, 4.2**
 *
 * 对于任意 0 到 1 之间的加班比率值，色阶映射函数应返回一个有效的颜色字符串，且：
 * - 比率为 0 时返回深绿色
 * - 比率为 0.5 时返回白色
 * - 比率为 1.0 时返回深红色
 * - 比率越大，红色分量越大或绿色分量越小
 * - 返回的颜色值始终是合法的 CSS rgb() 颜色字符串
 */

import * as fc from 'fast-check';
import {ratioToColor} from '../../utils/dimensionStatsUtils';

// 解析 rgb(r, g, b) 字符串
function parseRgb(color: string): {r: number; g: number; b: number} | null {
  const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return null;
  return {r: Number(match[1]), g: Number(match[2]), b: Number(match[3])};
}

describe('多维度统计 - 色阶映射有效性属性测试', () => {
  /**
   * **Feature: multi-dimension-stats, Property 2: 色阶映射有效性**
   * **Validates: Requirements 2.3, 4.2**
   */
  it('任意 [0,1] 比率返回合法 rgb 颜色，且单调性成立', () => {
    fc.assert(
      fc.property(fc.double({min: 0, max: 1, noNaN: true}), (ratio) => {
        const color = ratioToColor(ratio);

        // 1. 返回合法的 CSS rgb() 字符串
        const parsed = parseRgb(color);
        expect(parsed).not.toBeNull();

        // 2. RGB 分量在 [0, 255] 范围内
        expect(parsed!.r).toBeGreaterThanOrEqual(0);
        expect(parsed!.r).toBeLessThanOrEqual(255);
        expect(parsed!.g).toBeGreaterThanOrEqual(0);
        expect(parsed!.g).toBeLessThanOrEqual(255);
        expect(parsed!.b).toBeGreaterThanOrEqual(0);
        expect(parsed!.b).toBeLessThanOrEqual(255);
      }),
      {numRuns: 100},
    );
  });

  it('边界值：0 为深绿，0.5 为白色，1.0 为深红', () => {
    // 比率 0 → 深绿 rgb(0, 128, 0)
    const green = parseRgb(ratioToColor(0));
    expect(green).toEqual({r: 0, g: 128, b: 0});

    // 比率 0.5 → 白色 rgb(255, 255, 255)
    const white = parseRgb(ratioToColor(0.5));
    expect(white).toEqual({r: 255, g: 255, b: 255});

    // 比率 1.0 → 深红 rgb(200, 0, 0)
    const red = parseRgb(ratioToColor(1.0));
    expect(red).toEqual({r: 200, g: 0, b: 0});
  });

  it('单调性：比率越大，绿色分量越小（在 0.5~1.0 区间）', () => {
    fc.assert(
      fc.property(
        fc.double({min: 0.5, max: 1, noNaN: true}),
        fc.double({min: 0.5, max: 1, noNaN: true}),
        (r1, r2) => {
          if (r1 >= r2) return; // 只测试 r1 < r2 的情况
          const c1 = parseRgb(ratioToColor(r1))!;
          const c2 = parseRgb(ratioToColor(r2))!;
          // 比率越大，绿色分量越小或相等
          expect(c2.g).toBeLessThanOrEqual(c1.g);
        },
      ),
      {numRuns: 100},
    );
  });
});

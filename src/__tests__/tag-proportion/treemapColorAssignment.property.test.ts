/**
 * 属性测试：颜色分配正确性
 *
 * **Feature: tag-proportion-treemap, Property 4: 颜色分配正确性**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 *
 * 对于任意一组标签占比数据（包含加班和准时标签的混合），
 * 颜色分配函数应满足：
 * - 加班标签的颜色 HSL 色相在红棕色范围（0-15°）
 * - 准时标签的颜色 HSL 色相在青色范围（180-200°）
 * - 所有颜色的饱和度低于 50%
 * - 同类别内任意两个标签的颜色不相同
 */

import * as fc from 'fast-check';
import {TagProportionItem} from '../../types/tag-proportion';
import {assignTreemapColors, parseHSL} from '../../utils/treemapColors';

// 生成有效的标签占比数据项
const tagProportionItemArb = (isOvertime: boolean): fc.Arbitrary<TagProportionItem> =>
  fc.record({
    tagId: fc.uuid(),
    tagName: fc.string({minLength: 1, maxLength: 10}),
    count: fc.integer({min: 1, max: 100}),
    percentage: fc.integer({min: 1, max: 100}),
    isOvertime: fc.constant(isOvertime),
  });

// 生成混合标签数组（至少 1 项）
const mixedTagsArb: fc.Arbitrary<TagProportionItem[]> = fc
  .tuple(
    fc.array(tagProportionItemArb(true), {minLength: 0, maxLength: 10}),
    fc.array(tagProportionItemArb(false), {minLength: 0, maxLength: 10}),
  )
  .filter(([overtime, ontime]) => overtime.length + ontime.length >= 1)
  .map(([overtime, ontime]) => [...overtime, ...ontime]);

describe('标签占比 - 颜色分配正确性属性测试', () => {
  /**
   * **Feature: tag-proportion-treemap, Property 4: 颜色分配正确性**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
   */
  it('颜色分配应满足色相范围、饱和度限制和同类别色差要求', () => {
    fc.assert(
      fc.property(mixedTagsArb, fc.boolean(), (items, isDark) => {
        const colors = assignTreemapColors(items, isDark);

        // 颜色数量应与输入数量一致
        expect(colors.length).toBe(items.length);

        // 收集同类别颜色用于唯一性检查
        const overtimeColors: string[] = [];
        const ontimeColors: string[] = [];

        for (let i = 0; i < items.length; i++) {
          const parsed = parseHSL(colors[i]);
          expect(parsed).not.toBeNull();
          if (!parsed) continue;

          if (items[i].isOvertime) {
            // 加班标签：色相在红棕色范围 0-15°
            expect(parsed.hue).toBeGreaterThanOrEqual(0);
            expect(parsed.hue).toBeLessThanOrEqual(15);
            overtimeColors.push(colors[i]);
          } else {
            // 准时标签：色相在青色范围 180-200°
            expect(parsed.hue).toBeGreaterThanOrEqual(180);
            expect(parsed.hue).toBeLessThanOrEqual(200);
            ontimeColors.push(colors[i]);
          }

          // 所有颜色饱和度低于 50%
          expect(parsed.saturation).toBeLessThan(50);
        }

        // 同类别内颜色不相同（当同类别有多个标签时）
        if (overtimeColors.length > 1) {
          const uniqueOvertime = new Set(overtimeColors);
          expect(uniqueOvertime.size).toBe(overtimeColors.length);
        }
        if (ontimeColors.length > 1) {
          const uniqueOntime = new Set(ontimeColors);
          expect(uniqueOntime.size).toBe(ontimeColors.length);
        }
      }),
      {numRuns: 100},
    );
  });
});

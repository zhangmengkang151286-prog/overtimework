/**
 * 属性测试：标签占比数据格式化 round-trip
 *
 * **Feature: tag-proportion-treemap, Property 8: 标签占比数据格式化 round-trip**
 * **Validates: Requirements 10.1, 10.2**
 *
 * 对于任意有效的 TagProportionItem，
 * formatTagProportionItem 后再 parseTagProportionItem 应产生与原始数据等价的对象
 * （tagName、count、percentage 字段等价）。
 */

import * as fc from 'fast-check';
import {
  formatTagProportionItem,
  parseTagProportionItem,
} from '../../utils/tagProportionUtils';
import {TagProportionItem} from '../../types/tag-proportion';

// 生成有效的 TagProportionItem
// 标签名不能包含纯数字结尾后跟空格的模式，避免解析歧义
// 标签名至少 1 个字符，不以空格开头或结尾
const safeTagNameArb = fc
  .string({minLength: 1, maxLength: 20})
  .filter((s) => {
    // 标签名不能为空或纯空白
    if (s.trim().length === 0) return false;
    // 标签名不能以空格开头或结尾（避免解析歧义）
    if (s !== s.trim()) return false;
    // 标签名不能以数字结尾（避免与次数字段混淆）
    if (/\d$/.test(s)) return false;
    return true;
  });

const tagProportionItemArb: fc.Arbitrary<TagProportionItem> = fc.record({
  tagId: fc.uuid(),
  tagName: safeTagNameArb,
  count: fc.integer({min: 0, max: 10000}),
  percentage: fc.integer({min: 0, max: 100}),
  isOvertime: fc.boolean(),
});

describe('标签占比 - 格式化 round-trip 属性测试', () => {
  /**
   * **Feature: tag-proportion-treemap, Property 8: 标签占比数据格式化 round-trip**
   * **Validates: Requirements 10.1, 10.2**
   */
  it('格式化后解析应还原 tagName、count、percentage', () => {
    fc.assert(
      fc.property(tagProportionItemArb, (item) => {
        const formatted = formatTagProportionItem(item);
        const parsed = parseTagProportionItem(formatted);

        // tagName、count、percentage 应等价
        expect(parsed.tagName).toBe(item.tagName);
        expect(parsed.count).toBe(item.count);
        expect(parsed.percentage).toBe(item.percentage);
      }),
      {numRuns: 100},
    );
  });
});

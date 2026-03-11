/**
 * 属性测试：标签占比数据序列化 round-trip
 *
 * **Feature: tag-proportion-treemap, Property 7: 标签占比数据序列化 round-trip**
 * **Validates: Requirements 9.1, 9.2**
 *
 * 对于任意有效的 TagProportionItem 数组，
 * serializeTagProportion 后再 deserializeTagProportion 应产生与原始数据等价的数组。
 */

import * as fc from 'fast-check';
import {
  serializeTagProportion,
  deserializeTagProportion,
} from '../../utils/tagProportionUtils';
import {TagProportionItem} from '../../types/tag-proportion';

// 生成有效的 TagProportionItem
const tagProportionItemArb: fc.Arbitrary<TagProportionItem> = fc.record({
  tagId: fc.uuid(),
  tagName: fc.string({minLength: 1, maxLength: 20}),
  count: fc.integer({min: 0, max: 10000}),
  percentage: fc.integer({min: 0, max: 100}),
  isOvertime: fc.boolean(),
});

const tagProportionArrayArb = fc.array(tagProportionItemArb, {
  minLength: 0,
  maxLength: 20,
});

describe('标签占比 - 序列化 round-trip 属性测试', () => {
  /**
   * **Feature: tag-proportion-treemap, Property 7: 标签占比数据序列化 round-trip**
   * **Validates: Requirements 9.1, 9.2**
   */
  it('序列化后反序列化应产生与原始数据等价的数组', () => {
    fc.assert(
      fc.property(tagProportionArrayArb, (data) => {
        const serialized = serializeTagProportion(data);
        const deserialized = deserializeTagProportion(serialized);

        expect(deserialized).toHaveLength(data.length);
        for (let i = 0; i < data.length; i++) {
          expect(deserialized[i].tagId).toBe(data[i].tagId);
          expect(deserialized[i].tagName).toBe(data[i].tagName);
          expect(deserialized[i].count).toBe(data[i].count);
          expect(deserialized[i].percentage).toBe(data[i].percentage);
          expect(deserialized[i].isOvertime).toBe(data[i].isOvertime);
        }
      }),
      {numRuns: 100},
    );
  });
});

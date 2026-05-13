/**
 * 属性测试：评论内容验证
 * **Feature: clock-out-waterfall, Property 17: 评论内容验证**
 * **Validates: Requirements 11.5, 11.6**
 *
 * 对任意字符串 S，当 S 为空、全空白、或长度超过 200 字符时，
 * 评论验证函数应返回拒绝；当 S 非空且长度 ≤ 200 时应返回通过。
 */

import * as fc from 'fast-check';
import { validateCommentContent } from '../../utils/waterfallUtils';

describe('下班瀑布流 - Property 17: 评论内容验证', () => {
  it('非空且长度 ≤ 200 的非纯空白字符串应通过验证', () => {
    fc.assert(
      fc.property(
        // 生成 1-200 长度的字符串，至少包含一个非空白字符
        fc.string({ minLength: 1, maxLength: 200 }).filter(
          (s) => s.trim().length > 0,
        ),
        (content) => {
          const result = validateCommentContent(content);
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('纯空白字符串应被拒绝', () => {
    fc.assert(
      fc.property(
        // 生成纯空白字符串
        fc.nat({ max: 50 }).map((len) => ' '.repeat(len)),
        (content) => {
          const result = validateCommentContent(content);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('评论内容不能为空');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('超过 200 字符的字符串应被拒绝', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 201, maxLength: 500 }),
        (content) => {
          const result = validateCommentContent(content);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('评论不能超过 200 字');
        },
      ),
      { numRuns: 100 },
    );
  });
});

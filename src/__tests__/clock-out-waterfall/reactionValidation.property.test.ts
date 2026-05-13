/**
 * 属性测试：反馈文案验证
 * **Feature: clock-out-waterfall, Property 12: 反馈文案验证**
 * **Validates: Requirements 6.7**
 *
 * 对任意字符串 S，当 S 不属于预设的 20 种反馈文案时，
 * 反馈验证函数应返回 false/拒绝。
 */

import * as fc from 'fast-check';
import { isValidReaction } from '../../utils/waterfallUtils';
import { ALL_REACTIONS } from '../../types/clock-out-waterfall';

describe('下班瀑布流 - Property 12: 反馈文案验证', () => {
  it('预设的 20 种反馈文案应全部通过验证', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_REACTIONS),
        (reaction) => {
          expect(isValidReaction(reaction)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('不属于预设文案的任意字符串应被拒绝', () => {
    const reactionsSet = new Set<string>(ALL_REACTIONS as unknown as string[]);
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }).filter(
          (s) => !reactionsSet.has(s),
        ),
        (text) => {
          expect(isValidReaction(text)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

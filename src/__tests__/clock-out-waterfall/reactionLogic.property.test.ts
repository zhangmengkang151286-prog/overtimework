/**
 * 属性测试：热门反馈排序 & 反馈唯一性约束
 * **Feature: clock-out-waterfall, Property 10: 热门反馈排序**
 * **Validates: Requirements 6.1**
 *
 * 对任意反馈聚合（20 种反馈各有计数），取 top 5 的结果应按计数降序排列，
 * 且结果中的每一项计数应大于等于未入选项的计数。
 */

import * as fc from 'fast-check';
import { getTopReactions, applyReaction } from '../../services/stream/reactionService';
import { ALL_REACTIONS, ReactionAggregate } from '../../types/clock-out-waterfall';

// 生成器：生成一个合法的 ReactionAggregate（每种反馈有 0~100 的计数）
const aggregateArb = fc.tuple(
  ...ALL_REACTIONS.map(() => fc.integer({ min: 0, max: 100 })),
).map((counts) => {
  const aggregate: ReactionAggregate = {};
  ALL_REACTIONS.forEach((text, i) => {
    aggregate[text] = counts[i];
  });
  return aggregate;
});

describe('下班瀑布流 - Property 10: 热门反馈排序', () => {
  it('top 5 结果应按计数降序排列', () => {
    fc.assert(
      fc.property(aggregateArb, (aggregate) => {
        const top5 = getTopReactions(aggregate, 5);

        // 结果长度应为 5
        expect(top5.length).toBe(5);

        // 应按计数降序排列
        for (let i = 0; i < top5.length - 1; i++) {
          expect(top5[i].count).toBeGreaterThanOrEqual(top5[i + 1].count);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('top 5 中每一项的计数应大于等于未入选项的计数', () => {
    fc.assert(
      fc.property(aggregateArb, (aggregate) => {
        const top5 = getTopReactions(aggregate, 5);
        const top5Texts = new Set(top5.map((r) => r.text));

        // 获取未入选项的最大计数
        const excludedCounts = Object.entries(aggregate)
          .filter(([text]) => !top5Texts.has(text))
          .map(([, count]) => count);

        if (excludedCounts.length === 0) return;

        const maxExcluded = Math.max(...excludedCounts);
        const minIncluded = Math.min(...top5.map((r) => r.count));

        // top5 中最小计数应 >= 未入选中最大计数
        expect(minIncluded).toBeGreaterThanOrEqual(maxExcluded);
      }),
      { numRuns: 100 },
    );
  });

  it('当所有计数为 0 时，应返回默认顺序的前 5 种', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const aggregate: ReactionAggregate = {};
        ALL_REACTIONS.forEach((text) => {
          aggregate[text] = 0;
        });

        const top5 = getTopReactions(aggregate, 5);

        expect(top5.length).toBe(5);
        // 应按 ALL_REACTIONS 默认顺序
        for (let i = 0; i < 5; i++) {
          expect(top5[i].text).toBe(ALL_REACTIONS[i]);
          expect(top5[i].count).toBe(0);
        }
      }),
      { numRuns: 1 },
    );
  });
});


/**
 * **Feature: clock-out-waterfall, Property 11: 反馈唯一性约束**
 * **Validates: Requirements 6.4, 6.5**
 *
 * 对任意用户对同一张卡片的反馈操作序列，最终状态应满足：
 * - 该用户对该卡片最多持有一种反馈
 * - 重复点击同一反馈等于取消
 * - 切换反馈等于先撤销再添加
 */
describe('下班瀑布流 - Property 11: 反馈唯一性约束', () => {
  // 生成器：从 ALL_REACTIONS 中随机选一个反馈
  const reactionArb = fc.constantFrom(...ALL_REACTIONS);

  it('无反馈时点击 → 添加该反馈', () => {
    fc.assert(
      fc.property(reactionArb, (reaction) => {
        const result = applyReaction(null, reaction);
        expect(result.add).toBe(reaction);
        expect(result.remove).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it('重复点击同一反馈 → 取消（移除）', () => {
    fc.assert(
      fc.property(reactionArb, (reaction) => {
        const result = applyReaction(reaction, reaction);
        expect(result.remove).toBe(reaction);
        expect(result.add).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it('切换到不同反馈 → 先移除旧的再添加新的', () => {
    fc.assert(
      fc.property(
        reactionArb,
        reactionArb.filter((r) => true), // 第二个反馈
        (current, newReaction) => {
          // 只测试不同反馈的情况
          fc.pre(current !== newReaction);

          const result = applyReaction(current, newReaction);
          expect(result.remove).toBe(current);
          expect(result.add).toBe(newReaction);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('任意操作序列后最多持有一种反馈', () => {
    // 模拟一系列反馈操作，验证最终状态的一致性
    const operationSeqArb = fc.array(reactionArb, { minLength: 1, maxLength: 20 });

    fc.assert(
      fc.property(operationSeqArb, (operations) => {
        let currentReaction: string | null = null;

        for (const clickedReaction of operations) {
          const result = applyReaction(currentReaction, clickedReaction);

          // 应用操作结果，模拟状态变更
          if (result.remove && result.add) {
            // 切换：移除旧的，添加新的
            currentReaction = result.add;
          } else if (result.add) {
            // 添加
            currentReaction = result.add;
          } else if (result.remove) {
            // 取消
            currentReaction = null;
          }
        }

        // 最终状态：要么为 null（无反馈），要么为 ALL_REACTIONS 中的一种
        if (currentReaction !== null) {
          expect((ALL_REACTIONS as readonly string[]).includes(currentReaction)).toBe(true);
        }
        // 无论如何，最多持有一种反馈（currentReaction 是单个值或 null）
        // 这个断言本身由类型系统保证（string | null），但我们显式验证
        expect(typeof currentReaction === 'string' || currentReaction === null).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

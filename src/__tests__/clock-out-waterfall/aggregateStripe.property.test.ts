/**
 * 属性测试：聚合横条插入位置
 * **Feature: clock-out-waterfall, Property 13: 聚合横条插入位置**
 * **Validates: Requirements 7.1**
 *
 * 对任意长度为 N 的卡片列表，聚合横条应出现在第 10、20、30... 张卡片之后
 * （即每 10 张卡片后插入一条），且横条不计入卡片计数。
 */

import * as fc from 'fast-check';
import { insertAggregateStripes } from '../../utils/waterfallAggregate';
import { ClockOutEvent, AggregateMarker } from '../../types/clock-out-waterfall';

/**
 * 生成一个最小化的 ClockOutEvent 用于测试
 */
function makeEvent(index: number): ClockOutEvent {
  const hour = 18 + Math.floor(index / 10);
  const minute = index % 60;
  return {
    id: `event-${index}`,
    userId: `user-${index}`,
    statusRecordId: `record-${index}`,
    eventDate: '2025-06-15',
    clockOutType: index % 2 === 0 ? 'ontime' : 'overtime',
    effectiveClockOutMoment: `2025-06-15T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`,
    overtimeHours: index % 2 === 0 ? 0 : 1.5,
    wageBracket: '¥40-¥60',
    industry: '互联网',
    city: '北京',
    position: '工程师',
    ageGroup: '25-30',
    avatar: 'avatar_01',
    nickname: `用户${index}`,
    isIncognito: false,
    createdAt: '2025-06-15T18:00:00.000Z',
  };
}

/**
 * 判断列表项是否为聚合横条
 */
function isAggregateMarker(item: ClockOutEvent | AggregateMarker): item is AggregateMarker {
  return (item as AggregateMarker).type === 'aggregate';
}

describe('下班瀑布流 - Property 13: 聚合横条插入位置', () => {
  it('每 10 张卡片后应插入一条聚合横条，横条不计入卡片计数', () => {
    fc.assert(
      fc.property(
        // 生成 1 到 55 张卡片的列表长度
        fc.integer({ min: 1, max: 55 }),
        (n) => {
          const cards = Array.from({ length: n }, (_, i) => makeEvent(i));
          const result = insertAggregateStripes(cards);

          // 验证：遍历结果，卡片计数每到 10 的倍数后应紧跟一条横条
          let cardCount = 0;
          for (let i = 0; i < result.length; i++) {
            const item = result[i];
            if (isAggregateMarker(item)) {
              // 横条前面应该恰好有 cardCount 张卡片，且 cardCount 是 10 的倍数
              expect(cardCount % 10).toBe(0);
              expect(cardCount).toBeGreaterThan(0);
            } else {
              cardCount++;
            }
          }

          // 验证：结果中的卡片总数应等于输入卡片数
          const totalCards = result.filter(item => !isAggregateMarker(item)).length;
          expect(totalCards).toBe(n);

          // 验证：横条数量应等于 floor(n/10)（最后一组不满 10 张不插入横条，
          // 但如果恰好是 10 的倍数且是最后一张，也不插入）
          const totalMarkers = result.filter(item => isAggregateMarker(item)).length;
          // 横条在第 10 张后插入，但不在列表末尾插入
          // 即只有当第 10k 张卡片后面还有更多卡片时才插入
          let expectedMarkers = 0;
          for (let k = 10; k <= n; k += 10) {
            if (k < n) {
              expectedMarkers++;
            }
          }
          expect(totalMarkers).toBe(expectedMarkers);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('空列表不应产生任何横条', () => {
    const result = insertAggregateStripes([]);
    expect(result).toHaveLength(0);
  });

  it('横条出现的位置应紧跟在第 10k 张卡片之后', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 11, max: 50 }),
        (n) => {
          const cards = Array.from({ length: n }, (_, i) => makeEvent(i));
          const result = insertAggregateStripes(cards);

          // 收集所有横条在结果数组中的索引
          const markerIndices: number[] = [];
          for (let i = 0; i < result.length; i++) {
            if (isAggregateMarker(result[i])) {
              markerIndices.push(i);
            }
          }

          // 每个横条前面应恰好有 10k 张卡片（k=1,2,3...）
          for (let m = 0; m < markerIndices.length; m++) {
            const idx = markerIndices[m];
            // 横条之前的所有项中，卡片数量应为 (m+1)*10
            const itemsBefore = result.slice(0, idx);
            const cardsBefore = itemsBefore.filter(item => !isAggregateMarker(item)).length;
            expect(cardsBefore).toBe((m + 1) * 10);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

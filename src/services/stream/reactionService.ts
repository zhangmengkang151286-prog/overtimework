/**
 * 反馈服务（Reaction Service）
 * 负责情绪反馈的查询、添加、移除以及热门排序逻辑
 *
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */

import { ReactionAggregate, ALL_REACTIONS } from '../../types/clock-out-waterfall';
import { isValidReaction } from '../../utils/waterfallUtils';
import * as postgrestApi from '../postgrestApi';

// ============ 纯逻辑函数（可测试） ============

/**
 * 从反馈聚合中取出计数最高的前 N 种反馈
 * 当计数全为 0 时，按 ALL_REACTIONS 的默认顺序返回前 N 种
 *
 * @param aggregate 反馈聚合对象（反馈文案 -> 计数）
 * @param count 需要返回的数量
 * @returns 按计数降序排列的前 N 种反馈
 */
export function getTopReactions(
  aggregate: ReactionAggregate,
  count: number,
): Array<{ text: string; count: number }> {
  // 检查是否所有计数都为 0
  const hasAnyReaction = Object.values(aggregate).some((c) => c > 0);

  if (!hasAnyReaction) {
    // 全为 0 时，按预设默认顺序返回前 count 种
    return ALL_REACTIONS.slice(0, count).map((text) => ({
      text,
      count: 0,
    }));
  }

  // 将聚合转为数组并按计数降序排列
  const entries = Object.entries(aggregate)
    .map(([text, c]) => ({ text, count: c }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      // 计数相同时按 ALL_REACTIONS 中的顺序排列
      const indexA = (ALL_REACTIONS as readonly string[]).indexOf(a.text);
      const indexB = (ALL_REACTIONS as readonly string[]).indexOf(b.text);
      return indexA - indexB;
    });

  // 如果有计数的反馈不足 count 个，用默认顺序补齐
  if (entries.length < count) {
    const existingTexts = new Set(entries.map((e) => e.text));
    for (const text of ALL_REACTIONS) {
      if (entries.length >= count) break;
      if (!existingTexts.has(text)) {
        entries.push({ text, count: 0 });
      }
    }
  }

  return entries.slice(0, count);
}

/**
 * 计算反馈操作的结果
 * - 当前无反馈 + 点击新反馈 → 添加
 * - 当前有反馈 + 点击相同反馈 → 取消（移除）
 * - 当前有反馈 + 点击不同反馈 → 先移除旧的，再添加新的
 *
 * @param currentReaction 用户当前对该卡片持有的反馈（null 表示无反馈）
 * @param newReaction 用户本次点击的反馈文案
 * @returns 需要执行的操作：add 表示要添加的反馈，remove 表示要移除的反馈
 */
export function applyReaction(
  currentReaction: string | null,
  newReaction: string,
): { add?: string; remove?: string } {
  if (currentReaction === null) {
    // 当前无反馈，直接添加
    return { add: newReaction };
  }

  if (currentReaction === newReaction) {
    // 重复点击同一反馈，取消
    return { remove: currentReaction };
  }

  // 切换到另一种反馈：先移除旧的，再添加新的
  return { remove: currentReaction, add: newReaction };
}

// ============ API 调用函数 ============

/**
 * 获取某张卡片的全部反馈聚合
 *
 * @param eventId 事件 ID
 * @returns 反馈聚合对象
 */
export async function getReactions(eventId: string): Promise<ReactionAggregate> {
  const reactions = await postgrestApi.get<Array<{ reaction_text: string }>>(
    '/card_reactions',
    {
      event_id: `eq.${eventId}`,
      select: 'reaction_text',
    },
  );

  // 聚合计数
  const aggregate: ReactionAggregate = {};
  for (const r of reactions) {
    aggregate[r.reaction_text] = (aggregate[r.reaction_text] || 0) + 1;
  }
  return aggregate;
}

/**
 * 获取当前用户对某张卡片的反馈
 *
 * @param eventId 事件 ID
 * @param userId 用户 ID
 * @returns 反馈文案，无反馈时返回 null
 */
export async function getMyReaction(
  eventId: string,
  userId: string,
): Promise<string | null> {
  const results = await postgrestApi.get<Array<{ reaction_text: string }>>(
    '/card_reactions',
    {
      event_id: `eq.${eventId}`,
      user_id: `eq.${userId}`,
      select: 'reaction_text',
    },
  );

  if (results.length === 0) return null;
  return results[0].reaction_text;
}

/**
 * 添加反馈
 * 使用 upsert 确保每用户每卡片最多一条反馈
 *
 * @param eventId 事件 ID
 * @param userId 用户 ID
 * @param reactionText 反馈文案
 */
export async function addReaction(
  eventId: string,
  userId: string,
  reactionText: string,
): Promise<void> {
  if (!isValidReaction(reactionText)) {
    console.warn('⚠️ [ReactionService] 非法反馈文案:', reactionText);
    throw new Error('非法反馈文案');
  }

  await postgrestApi.post('/card_reactions', {
    event_id: eventId,
    user_id: userId,
    reaction_text: reactionText,
  }, {
    headers: {
      Prefer: 'resolution=merge-duplicates',
    },
  });
}

/**
 * 移除反馈
 *
 * @param eventId 事件 ID
 * @param userId 用户 ID
 */
export async function removeReaction(
  eventId: string,
  userId: string,
): Promise<void> {
  await postgrestApi.del('/card_reactions', {
    event_id: eventId,
    user_id: userId,
  });
}

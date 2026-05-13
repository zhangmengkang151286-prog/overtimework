/**
 * 评论服务（Comment Service）
 * 负责卡片评论的查询、添加、删除
 *
 * Requirements: 11.3, 11.4, 11.8
 */

import { CardComment } from '../../types/clock-out-waterfall';
import { validateCommentContent } from '../../utils/waterfallUtils';
import * as postgrestApi from '../postgrestApi';

// ============ 纯逻辑函数（可测试） ============

/**
 * 对评论列表按发布时间降序排序（最新在前）
 *
 * @param comments 评论列表
 * @returns 排序后的评论列表（新数组）
 */
export function sortCommentsByTime(comments: CardComment[]): CardComment[] {
  return [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * 验证评论对象是否仅包含匿名字段，不包含敏感信息
 * 匿名字段：avatar、nickname、industry、city、ageGroup
 * 敏感字段：phoneNumber、realName 等不应出现
 *
 * @param comment 评论对象
 * @returns 是否符合匿名性要求
 */
export function isCommentAnonymous(comment: CardComment): boolean {
  const obj = comment as unknown as Record<string, unknown>;
  // 检查不应存在的敏感字段
  const sensitiveFields = ['phoneNumber', 'realName', 'phone_number', 'real_name', 'email'];
  return sensitiveFields.every((field) => !(field in obj));
}

// ============ API 调用函数 ============

/**
 * 获取某张卡片的评论列表（分页，按时间降序）
 *
 * @param eventId 事件 ID
 * @param page 页码（从 1 开始）
 * @param pageSize 每页数量，默认 20
 * @returns 评论列表
 */
export async function getComments(
  eventId: string,
  page: number,
  pageSize: number = 20,
): Promise<CardComment[]> {
  const offset = (page - 1) * pageSize;

  const results = await postgrestApi.get<Array<Record<string, unknown>>>(
    '/card_comments',
    {
      event_id: `eq.${eventId}`,
      order: 'created_at.desc',
      limit: String(pageSize),
      offset: String(offset),
      select: 'id,event_id,user_id,content,avatar,nickname,industry,city,age_group,created_at',
    },
  );

  // 将数据库字段映射为 TypeScript 接口
  return results.map(mapDbRowToComment);
}

/**
 * 添加评论
 *
 * @param eventId 事件 ID
 * @param userId 用户 ID
 * @param content 评论正文
 * @param user 用户匿名身份信息
 * @returns 新创建的评论
 */
export async function addComment(
  eventId: string,
  userId: string,
  content: string,
  user: { avatar: string; nickname: string; industry: string; city: string; ageGroup: string },
): Promise<CardComment> {
  // 验证评论内容
  const validation = validateCommentContent(content);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const results = await postgrestApi.post<Array<Record<string, unknown>>>(
    '/card_comments',
    {
      event_id: eventId,
      user_id: userId,
      content: content,
      avatar: user.avatar,
      nickname: user.nickname,
      industry: user.industry,
      city: user.city,
      age_group: user.ageGroup,
    },
  );

  if (!results || results.length === 0) {
    throw new Error('评论创建失败');
  }

  return mapDbRowToComment(results[0]);
}

/**
 * 删除评论（仅允许评论作者删除）
 *
 * @param commentId 评论 ID
 * @param userId 当前用户 ID（用于权限校验）
 */
export async function deleteComment(
  commentId: string,
  userId: string,
): Promise<void> {
  await postgrestApi.del('/card_comments', {
    id: commentId,
    user_id: userId,
  });
}

// ============ 内部辅助函数 ============

/**
 * 将数据库行映射为 CardComment 接口
 */
function mapDbRowToComment(row: Record<string, unknown>): CardComment {
  return {
    id: row.id as string,
    eventId: (row.event_id as string) || '',
    userId: (row.user_id as string) || '',
    content: (row.content as string) || '',
    avatar: (row.avatar as string) || '',
    nickname: (row.nickname as string) || '',
    industry: (row.industry as string) || '',
    city: (row.city as string) || '',
    ageGroup: (row.age_group as string) || '',
    createdAt: (row.created_at as string) || '',
  };
}

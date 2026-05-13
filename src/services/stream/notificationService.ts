/**
 * 通知服务（Notification Service）
 * 负责互动通知的查询、创建、标记已读
 *
 * Requirements: 13.1-13.7
 */

import { InteractionNotification, NotificationType } from '../../types/clock-out-waterfall';
import * as postgrestApi from '../postgrestApi';

// ============ API 调用函数 ============

/**
 * 获取用户的通知列表（分页，按时间降序）
 *
 * @param userId 用户 ID
 * @param page 页码（从 1 开始）
 * @param pageSize 每页数量，默认 20
 * @returns 通知列表
 */
export async function getNotifications(
  userId: string,
  page: number,
  pageSize: number = 20,
): Promise<InteractionNotification[]> {
  const offset = (page - 1) * pageSize;

  const results = await postgrestApi.get<Array<Record<string, unknown>>>(
    '/interaction_notifications',
    {
      recipient_user_id: `eq.${userId}`,
      order: 'created_at.desc',
      limit: String(pageSize),
      offset: String(offset),
      select: 'id,recipient_user_id,event_id,actor_nickname,notification_type,content_preview,is_read,created_at',
    },
  );

  return results.map(mapDbRowToNotification);
}

/**
 * 获取用户的未读通知数量
 *
 * @param userId 用户 ID
 * @returns 未读通知数量
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const results = await postgrestApi.get<Array<Record<string, unknown>>>(
    '/interaction_notifications',
    {
      recipient_user_id: `eq.${userId}`,
      is_read: 'eq.false',
      select: 'id',
    },
  );

  return results.length;
}

/**
 * 将单条通知标记为已读
 *
 * @param notificationId 通知 ID
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await postgrestApi.patch(
    `/interaction_notifications?id=eq.${notificationId}`,
    { is_read: true },
  );
}

/**
 * 创建一条互动通知
 * 当其他用户对卡片发送反馈或评论时调用
 *
 * @param recipientId 接收者用户 ID（卡片所有者）
 * @param eventId 关联的事件 ID
 * @param actorNickname 操作者昵称
 * @param type 通知类型（reaction 或 comment）
 * @param preview 内容预览（反馈文案或评论前 50 字）
 */
export async function createNotification(
  recipientId: string,
  eventId: string,
  actorNickname: string,
  type: NotificationType,
  preview: string | null,
): Promise<void> {
  // 截取预览内容，最多 50 字
  const contentPreview = preview ? preview.slice(0, 50) : null;

  await postgrestApi.post(
    '/interaction_notifications',
    {
      recipient_user_id: recipientId,
      event_id: eventId,
      actor_nickname: actorNickname,
      notification_type: type,
      content_preview: contentPreview,
      is_read: false,
    },
  );
}

// ============ 内部辅助函数 ============

/**
 * 将数据库行映射为 InteractionNotification 接口
 */
function mapDbRowToNotification(row: Record<string, unknown>): InteractionNotification {
  return {
    id: row.id as string,
    recipientUserId: (row.recipient_user_id as string) || '',
    eventId: (row.event_id as string) || '',
    actorNickname: (row.actor_nickname as string) || '',
    notificationType: (row.notification_type as NotificationType) || 'reaction',
    contentPreview: (row.content_preview as string) || null,
    isRead: (row.is_read as boolean) || false,
    createdAt: (row.created_at as string) || '',
  };
}

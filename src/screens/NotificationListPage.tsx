/**
 * 通知列表页（NotificationListPage）
 * 展示用户的互动通知列表，点击跳转详情页并标记已读
 *
 * Requirements: 13.4, 13.5
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {Text, HStack, VStack, Box} from '@gluestack-ui/themed';
import {useTheme} from '../hooks/useTheme';
import {typography} from '../theme/typography';
import {useAppSelector} from '../hooks/redux';
import {InteractionNotification} from '../types/clock-out-waterfall';
import * as notificationService from '../services/stream/notificationService';
import * as streamService from '../services/stream/streamService';

interface NotificationListPageProps {
  navigation?: any;
}

export const NotificationListPage: React.FC<NotificationListPageProps> = ({navigation}) => {
  const theme = useTheme();
  const currentUser = useAppSelector((state: any) => state.user.currentUser);

  const [notifications, setNotifications] = useState<InteractionNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 加载通知列表
   */
  const loadNotifications = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (!currentUser?.id) return;
    if (loading) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(currentUser.id, pageNum, 20);
      if (reset) {
        setNotifications(data);
      } else {
        setNotifications(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('[NotificationListPage] 加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, loading]);

  /**
   * 下拉刷新
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (currentUser?.id) {
        const data = await notificationService.getNotifications(currentUser.id, 1, 20);
        setNotifications(data);
        setHasMore(data.length === 20);
        setPage(1);
      }
    } catch (error) {
      console.error('[NotificationListPage] 刷新失败:', error);
    } finally {
      setRefreshing(false);
    }
  }, [currentUser?.id]);

  /**
   * 加载更多
   */
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadNotifications(page + 1);
    }
  }, [hasMore, loading, page, loadNotifications]);

  /**
   * 点击通知 - 标记已读并跳转到卡片详情页
   * Requirements: 13.5
   */
  const handleNotificationPress = useCallback(async (notification: InteractionNotification) => {
    // 标记已读
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        // 更新本地状态
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? {...n, isRead: true} : n),
        );
      } catch (error) {
        console.error('[NotificationListPage] 标记已读失败:', error);
      }
    }

    // 跳转到卡片详情页
    try {
      // 获取关联的事件数据
      const events = await streamService.fetchEvents({limit: 1});
      // 通过 eventId 查找事件（简化处理：直接导航并传递 eventId）
      navigation?.navigate('CardDetail', {
        eventId: notification.eventId,
        event: {id: notification.eventId} as any,
      });
    } catch (error) {
      // 即使获取事件失败也尝试导航
      navigation?.navigate('CardDetail', {
        eventId: notification.eventId,
        event: {id: notification.eventId} as any,
      });
    }
  }, [navigation]);

  // 初始加载
  useEffect(() => {
    loadNotifications(1, true);
  }, [currentUser?.id]);

  /**
   * 格式化通知时间
   */
  const formatTime = (isoString: string): string => {
    const now = new Date();
    const target = new Date(isoString);
    const diffMs = now.getTime() - target.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}小时前`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}天前`;
    const month = target.getMonth() + 1;
    const day = target.getDate();
    return `${month}月${day}日`;
  };

  /**
   * 渲染单条通知
   */
  const renderNotificationItem = ({item}: {item: InteractionNotification}) => {
    const isReaction = item.notificationType === 'reaction';
    const actionText = isReaction ? '对你的卡片发送了反馈' : '评论了你的卡片';
    const previewText = item.contentPreview || '';

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.isRead
              ? theme.colors.background
              : theme.colors.backgroundSecondary || theme.colors.background,
            borderBottomColor: theme.colors.backgroundTertiary,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        accessibilityLabel={`${item.actorNickname}${actionText}：${previewText}`}>
        <HStack space="sm" alignItems="flex-start">
          {/* 未读指示点 */}
          {!item.isRead && (
            <View style={styles.unreadDot} />
          )}
          <VStack flex={1} space="xs">
            <HStack space="xs" alignItems="center">
              <Text
                style={[styles.actorName, {color: theme.colors.text}]}
                numberOfLines={1}>
                {item.actorNickname}
              </Text>
              <Text style={[styles.actionText, {color: theme.colors.textSecondary}]}>
                {actionText}
              </Text>
            </HStack>
            {previewText ? (
              <Text
                style={[styles.previewText, {color: theme.colors.textSecondary}]}
                numberOfLines={2}>
                {isReaction ? `"${previewText}"` : previewText}
              </Text>
            ) : null}
            <Text style={[styles.timeText, {color: theme.colors.textTertiary}]}>
              {formatTime(item.createdAt)}
            </Text>
          </VStack>
        </HStack>
      </TouchableOpacity>
    );
  };

  /**
   * 渲染列表底部
   */
  const renderFooter = () => {
    if (loading && notifications.length > 0) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={theme.colors.textTertiary} />
        </View>
      );
    }
    if (!hasMore && notifications.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={[styles.footerText, {color: theme.colors.textTertiary}]}>
            没有更多通知了
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* 顶部导航栏 */}
      <View style={[styles.navBar, {borderBottomColor: theme.colors.backgroundTertiary}]}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
          accessibilityLabel="返回">
          <Text style={[styles.backText, {color: theme.colors.text}]}>← 返回</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, {color: theme.colors.text}]}>消息</Text>
        <View style={styles.navPlaceholder} />
      </View>

      {/* 通知列表 */}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderNotificationItem}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, {color: theme.colors.textTertiary}]}>
                暂无消息
              </Text>
              <Text style={[styles.emptySubText, {color: theme.colors.textTertiary}]}>
                当有人对你的下班卡片发送反馈或评论时，你会在这里收到通知
              </Text>
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: typography.fontSize.base,
  },
  navTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  navPlaceholder: {
    width: 60,
  },
  notificationItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginTop: 6,
    marginRight: 4,
  },
  actorName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    flexShrink: 1,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
  },
  previewText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.xs,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});

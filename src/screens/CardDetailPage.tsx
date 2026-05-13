/**
 * 卡片详情页（CardDetailPage）
 * 展示下班卡片完整信息、全部 20 种反馈及计数、评论列表与评论输入框
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.7, 11.8, 11.9, 11.10
 */

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Text, HStack, VStack, Box} from '@gluestack-ui/themed';
import {useTheme} from '../hooks/useTheme';
import {typography} from '../theme/typography';
import {useAppSelector} from '../hooks/redux';
import {
  ClockOutEvent,
  CardComment,
  ReactionAggregate,
  OVERTIME_REACTIONS,
  ONTIME_REACTIONS,
} from '../types/clock-out-waterfall';
import {mapTimeToTemperature} from '../utils/waterfallUtils';
import {validateCommentContent} from '../utils/waterfallUtils';
import {getReactions, applyReaction, addReaction, removeReaction, getMyReaction} from '../services/stream/reactionService';
import {getComments, addComment, deleteComment} from '../services/stream/commentService';
import {createNotification} from '../services/stream/notificationService';
import {Avatar} from '../data/builtInAvatars';

// 颜色温度映射
const TEMPERATURE_COLORS = {
  green: {bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.2)'},
  yellow: {bg: 'rgba(234, 179, 8, 0.08)', border: 'rgba(234, 179, 8, 0.2)'},
  orange: {bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.2)'},
  red: {bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)'},
};

interface CardDetailPageProps {
  route?: {params: {eventId: string; event: ClockOutEvent}};
  navigation?: any;
}

export const CardDetailPage: React.FC<CardDetailPageProps> = ({route, navigation}) => {
  const {event} = route!.params;
  const theme = useTheme();
  const currentUser = useAppSelector((state: any) => state.user.currentUser);

  // 是否是自己的卡片
  const isOwnCard = currentUser?.id === event.userId;

  // 反馈状态
  const [reactions, setReactions] = useState<ReactionAggregate>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);

  // 评论状态
  const [comments, setComments] = useState<CardComment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

  // 评论输入
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // 颜色温度
  const temperature = mapTimeToTemperature(event.effectiveClockOutMoment);
  const tempColor = TEMPERATURE_COLORS[temperature];

  /**
   * 加载反馈数据
   */
  const loadReactions = useCallback(async () => {
    try {
      const data = await getReactions(event.id);
      setReactions(data);
      if (currentUser?.id) {
        const my = await getMyReaction(event.id, currentUser.id);
        setMyReaction(my);
      }
    } catch (error) {
      console.error('[CardDetailPage] 加载反馈失败:', error);
    }
  }, [event.id, currentUser?.id]);

  /**
   * 加载评论列表
   */
  const loadComments = useCallback(async (page: number, reset: boolean = false) => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const data = await getComments(event.id, page, 20);
      if (reset) {
        setComments(data);
      } else {
        setComments(prev => [...prev, ...data]);
      }
      setHasMoreComments(data.length === 20);
      setCommentPage(page);
    } catch (error) {
      console.error('[CardDetailPage] 加载评论失败:', error);
    } finally {
      setLoadingComments(false);
    }
  }, [event.id, loadingComments]);

  // 初始加载
  useEffect(() => {
    loadReactions();
    loadComments(1, true);
  }, []);

  /**
   * 处理反馈点击
   */
  const handleReactionPress = useCallback(async (reactionText: string) => {
    if (!currentUser?.id || isOwnCard) return;

    const action = applyReaction(myReaction, reactionText);

    // 乐观更新
    const newReactions = {...reactions};
    if (action.remove) {
      newReactions[action.remove] = Math.max(0, (newReactions[action.remove] || 0) - 1);
    }
    if (action.add) {
      newReactions[action.add] = (newReactions[action.add] || 0) + 1;
    }
    setReactions(newReactions);
    setMyReaction(action.add || null);

    // 异步写入
    try {
      if (action.remove) {
        await removeReaction(event.id, currentUser.id);
      }
      if (action.add) {
        await addReaction(event.id, currentUser.id, action.add);
        // 发送通知给卡片所有者（非自己的卡片）
        if (!isOwnCard) {
          await createNotification(
            event.userId,
            event.id,
            currentUser.nickname || '匿名用户',
            'reaction',
            action.add,
          ).catch(() => {});
        }
      }
    } catch (error) {
      // 回滚
      setReactions(reactions);
      setMyReaction(myReaction);
    }
  }, [currentUser?.id, event.id, event.userId, isOwnCard, myReaction, reactions]);

  /**
   * 提交评论
   */
  const handleSubmitComment = useCallback(async () => {
    if (!currentUser?.id) return;

    const validation = validateCommentContent(commentText);
    if (!validation.valid) {
      Alert.alert('提示', validation.error || '评论内容无效');
      return;
    }

    setSubmitting(true);
    try {
      const newComment = await addComment(event.id, currentUser.id, commentText.trim(), {
        avatar: currentUser.avatar || 'avatar_01',
        nickname: currentUser.nickname || '匿名用户',
        industry: currentUser.industry || '',
        city: currentUser.city || '',
        ageGroup: currentUser.ageGroup || '',
      });
      // 插入到列表顶部
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      inputRef.current?.blur();

      // 发送通知给卡片所有者（非自己的卡片）
      if (!isOwnCard) {
        await createNotification(
          event.userId,
          event.id,
          currentUser.nickname || '匿名用户',
          'comment',
          commentText.trim().slice(0, 50),
        ).catch(() => {});
      }
    } catch (error) {
      Alert.alert('提示', error instanceof Error ? error.message : '评论发送失败');
    } finally {
      setSubmitting(false);
    }
  }, [currentUser, event.id, event.userId, isOwnCard, commentText]);

  /**
   * 删除评论（长按自己的评论）
   */
  const handleDeleteComment = useCallback((comment: CardComment) => {
    if (comment.userId !== currentUser?.id) return;

    Alert.alert('删除评论', '确定要删除这条评论吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(comment.id, currentUser.id);
            setComments(prev => prev.filter(c => c.id !== comment.id));
          } catch (error) {
            Alert.alert('提示', '删除失败，请重试');
          }
        },
      },
    ]);
  }, [currentUser?.id]);

  /**
   * 加载更多评论
   */
  const handleLoadMore = useCallback(() => {
    if (hasMoreComments && !loadingComments) {
      loadComments(commentPage + 1);
    }
  }, [hasMoreComments, loadingComments, commentPage, loadComments]);

  /**
   * 渲染卡片信息头部
   */
  const renderCardHeader = () => (
    <View style={[styles.cardSection, {backgroundColor: tempColor.bg, borderColor: tempColor.border}]}>
      {/* 匿名身份 */}
      <HStack space="sm" alignItems="center" style={styles.identityRow}>
        <Avatar avatarId={event.avatar} size={40} />
        <VStack flex={1}>
          <HStack space="xs" alignItems="center">
            <Text style={[styles.nickname, {color: theme.colors.text}]}>
              {event.nickname}
            </Text>
            <Text style={[styles.typeBadge, {
              color: event.clockOutType === 'ontime' ? '#22c55e' : '#f97316',
              backgroundColor: event.clockOutType === 'ontime' ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)',
            }]}>
              {event.clockOutType === 'ontime' ? '准时下班' : '加班已下班'}
            </Text>
          </HStack>
          <Text style={[styles.metaText, {color: theme.colors.textTertiary}]}>
            {[event.industry, event.city, event.ageGroup].filter(Boolean).join(' · ')}
          </Text>
        </VStack>
      </HStack>

      {/* 事件数据 */}
      <VStack space="xs" style={styles.dataSection}>
        <HStack space="md" alignItems="center">
          <Text style={[styles.clockOutTime, {color: theme.colors.text}]}>
            {formatClockOutTime(event.effectiveClockOutMoment)}
          </Text>
          {event.overtimeHours > 0 ? (
            <Text style={[styles.overtimeLabel, {color: '#f97316'}]}>
              加班 {event.overtimeHours}h
            </Text>
          ) : (
            <Text style={[styles.overtimeLabel, {color: '#22c55e'}]}>
              准时下班
            </Text>
          )}
        </HStack>
        {event.wageBracket && (
          <Text style={[styles.wageText, {color: theme.colors.textSecondary}]}>
            时薪区间：{event.wageBracket}
          </Text>
        )}
      </VStack>
    </View>
  );

  /**
   * 渲染反馈区域（全部 20 种）
   * Requirements: 11.2, 11.7 - 自己的卡片隐藏反馈按钮
   */
  const renderReactionsSection = () => {
    if (isOwnCard) {
      return (
        <View style={[styles.section, {borderBottomColor: theme.colors.backgroundTertiary}]}>
          <Text style={[styles.sectionHint, {color: theme.colors.textTertiary}]}>
            这是你的卡片，无法对自己的卡片发送反馈
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.section, {borderBottomColor: theme.colors.backgroundTertiary}]}>
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>反馈</Text>

        {/* 加班向 */}
        <Text style={[styles.groupLabel, {color: theme.colors.textTertiary}]}>加班向</Text>
        <View style={styles.reactionGrid}>
          {OVERTIME_REACTIONS.map(text => (
            <TouchableOpacity
              key={text}
              style={[
                styles.reactionItem,
                {
                  backgroundColor: myReaction === text
                    ? theme.colors.text + '12'
                    : theme.colors.backgroundTertiary,
                  borderColor: myReaction === text ? theme.colors.text : 'transparent',
                },
              ]}
              onPress={() => handleReactionPress(text)}
              accessibilityLabel={`${text}，${reactions[text] || 0}次`}>
              <Text style={[styles.reactionText, {color: theme.colors.text}]}>{text}</Text>
              <Text style={[styles.reactionCount, {color: theme.colors.textTertiary}]}>
                {reactions[text] || 0}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 准时下班向 */}
        <Text style={[styles.groupLabel, {color: theme.colors.textTertiary}]}>准时下班向</Text>
        <View style={styles.reactionGrid}>
          {ONTIME_REACTIONS.map(text => (
            <TouchableOpacity
              key={text}
              style={[
                styles.reactionItem,
                {
                  backgroundColor: myReaction === text
                    ? theme.colors.text + '12'
                    : theme.colors.backgroundTertiary,
                  borderColor: myReaction === text ? theme.colors.text : 'transparent',
                },
              ]}
              onPress={() => handleReactionPress(text)}
              accessibilityLabel={`${text}，${reactions[text] || 0}次`}>
              <Text style={[styles.reactionText, {color: theme.colors.text}]}>{text}</Text>
              <Text style={[styles.reactionCount, {color: theme.colors.textTertiary}]}>
                {reactions[text] || 0}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  /**
   * 渲染评论列表头部（包含卡片信息和反馈区）
   */
  const renderListHeader = () => (
    <View>
      {renderCardHeader()}
      {renderReactionsSection()}
      <View style={styles.commentHeader}>
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>评论</Text>
      </View>
    </View>
  );

  /**
   * 渲染单条评论
   * Requirements: 11.9 - 仅展示匿名身份
   */
  const renderCommentItem = ({item}: {item: CardComment}) => {
    const isMyComment = item.userId === currentUser?.id;

    return (
      <TouchableOpacity
        style={[styles.commentItem, {borderBottomColor: theme.colors.backgroundTertiary}]}
        onLongPress={() => isMyComment && handleDeleteComment(item)}
        delayLongPress={500}
        activeOpacity={isMyComment ? 0.7 : 1}
        accessibilityLabel={`${item.nickname}的评论：${item.content}`}>
        <HStack space="sm" alignItems="flex-start">
          <Avatar avatarId={item.avatar} size={28} />
          <VStack flex={1}>
            <HStack space="xs" alignItems="center">
              <Text style={[styles.commentNickname, {color: theme.colors.text}]}>
                {item.nickname}
              </Text>
              <Text style={[styles.commentMeta, {color: theme.colors.textTertiary}]}>
                {[item.industry, item.city, item.ageGroup].filter(Boolean).join(' · ')}
              </Text>
            </HStack>
            <Text style={[styles.commentContent, {color: theme.colors.text}]}>
              {item.content}
            </Text>
            <Text style={[styles.commentTime, {color: theme.colors.textTertiary}]}>
              {formatCommentTime(item.createdAt)}
            </Text>
          </VStack>
        </HStack>
      </TouchableOpacity>
    );
  };

  /**
   * 渲染列表底部加载指示器
   */
  const renderListFooter = () => {
    if (loadingComments) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={theme.colors.textTertiary} />
        </View>
      );
    }
    if (!hasMoreComments && comments.length > 0) {
      return (
        <View style={styles.loadingFooter}>
          <Text style={[styles.noMoreText, {color: theme.colors.textTertiary}]}>
            没有更多评论了
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
      {/* 顶部导航栏 */}
      <View style={[styles.navBar, {borderBottomColor: theme.colors.backgroundTertiary}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="返回">
          <Text style={[styles.backText, {color: theme.colors.text}]}>← 返回</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, {color: theme.colors.text}]}>卡片详情</Text>
        <View style={styles.navPlaceholder} />
      </View>

      {/* 评论列表（包含卡片信息和反馈区作为 header） */}
      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        renderItem={renderCommentItem}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={
          !loadingComments ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, {color: theme.colors.textTertiary}]}>
                暂无评论，来说点什么吧
              </Text>
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* 评论输入框 */}
      <View style={[styles.inputBar, {
        backgroundColor: theme.colors.background,
        borderTopColor: theme.colors.backgroundTertiary,
      }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, {
            color: theme.colors.text,
            backgroundColor: theme.colors.backgroundTertiary,
          }]}
          placeholder="写一条评论..."
          placeholderTextColor={theme.colors.textTertiary}
          value={commentText}
          onChangeText={setCommentText}
          maxLength={200}
          multiline
          returnKeyType="send"
          accessibilityLabel="评论输入框"
        />
        <TouchableOpacity
          style={[styles.sendButton, {
            opacity: commentText.trim().length > 0 ? 1 : 0.4,
          }]}
          onPress={handleSubmitComment}
          disabled={submitting || commentText.trim().length === 0}
          accessibilityLabel="发送评论">
          {submitting ? (
            <ActivityIndicator size="small" color={theme.colors.text} />
          ) : (
            <Text style={[styles.sendText, {color: theme.colors.text}]}>发送</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ============ 辅助函数 ============

/**
 * 格式化下班时间为 HH:mm
 */
function formatClockOutTime(isoString: string): string {
  const date = new Date(isoString);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * 格式化评论时间
 */
function formatCommentTime(isoString: string): string {
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
  // 超过 7 天显示日期
  const month = target.getMonth() + 1;
  const day = target.getDate();
  return `${month}月${day}日`;
}

// ============ 样式 ============

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
  listContent: {
    paddingBottom: 16,
  },
  cardSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  identityRow: {
    marginBottom: 12,
  },
  nickname: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  typeBadge: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  dataSection: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  clockOutTime: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  overtimeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  wageText: {
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingVertical: 8,
  },
  groupLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: 8,
    marginBottom: 6,
  },
  reactionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reactionText: {
    fontSize: typography.fontSize.sm,
  },
  reactionCount: {
    fontSize: typography.fontSize.xs,
    marginLeft: 6,
  },
  commentHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  commentItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentNickname: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  commentMeta: {
    fontSize: 10,
  },
  commentContent: {
    fontSize: typography.fontSize.sm,
    marginTop: 4,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 10,
    marginTop: 4,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noMoreText: {
    fontSize: typography.fontSize.xs,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: typography.fontSize.sm,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sendText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});

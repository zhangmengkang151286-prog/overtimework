/**
 * 流页面（StreamPage）
 * 承载下班瀑布流及相关玩法
 *
 * Requirements: 1.3, 1.4, 1.5, 1.6
 */

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {View, StyleSheet, AppState, AppStateStatus, TouchableOpacity} from 'react-native';
import {Text, Box, VStack, Button, ButtonText} from '@gluestack-ui/themed';
import {useAppSelector} from '../hooks/redux';
import {useTheme} from '../hooks/useTheme';
import {typography} from '../theme/typography';
import {
  ClockOutEvent,
  WaterfallQueryParams,
} from '../types/clock-out-waterfall';
import * as streamService from '../services/stream/streamService';
import * as notificationService from '../services/stream/notificationService';
import {WaterfallFilter} from '../components/stream/WaterfallFilter';
import {WaterfallList} from '../components/stream/WaterfallList';
import {NewCardsBanner} from '../components/stream/NewCardsBanner';
import {ScrollToTopButton} from '../components/stream/ScrollToTopButton';
import {LocateMyCardButton} from '../components/stream/LocateMyCardButton';

interface StreamPageProps {
  navigation?: any;
}

export const StreamPage: React.FC<StreamPageProps> = ({navigation}) => {
  const theme = useTheme();
  const currentUser = useAppSelector((state: any) => state.user.currentUser);
  const userStatus = useAppSelector((state: any) => state.user.userStatus);

  // 筛选状态
  const [filterParams, setFilterParams] = useState<WaterfallQueryParams>({});

  // 瀑布流数据
  const [events, setEvents] = useState<ClockOutEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 新卡片暂存（用户不在顶部时暂存）
  const [pendingEvents, setPendingEvents] = useState<ClockOutEvent[]>([]);

  // 滚动位置状态
  const [isAtTop, setIsAtTop] = useState(true);
  const isAtTopRef = useRef(true);

  // 轮询定时器
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchTimeRef = useRef<string>(new Date().toISOString());

  // 列表 ref（用于滚动定位）
  const listRef = useRef<any>(null);

  // 当前用户今日事件
  const [myTodayEvent, setMyTodayEvent] = useState<ClockOutEvent | null>(null);

  // 高亮卡片 ID
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);

  // 未读通知数量
  const [unreadCount, setUnreadCount] = useState(0);

  // 判断用户是否已登录
  const isLoggedIn = !!currentUser?.id;

  // 判断用户是否已提交今日状态
  const hasSubmittedToday = userStatus?.hasSubmittedToday ?? false;

  // 是否解锁瀑布流
  const isUnlocked = isLoggedIn && hasSubmittedToday;

  /**
   * 加载瀑布流数据
   */
  const loadEvents = useCallback(async (params?: WaterfallQueryParams) => {
    if (!isUnlocked) return;
    setLoading(true);
    try {
      const queryParams = params || filterParams;
      const data = await streamService.fetchEvents({...queryParams, limit: 50});
      setEvents(data);
      lastFetchTimeRef.current = new Date().toISOString();
    } catch (error) {
      console.error('[StreamPage] 加载事件失败:', error);
    } finally {
      setLoading(false);
    }
  }, [isUnlocked, filterParams]);

  /**
   * 下拉刷新
   */
  const handleRefresh = useCallback(async () => {
    if (!isUnlocked) return;
    setRefreshing(true);
    try {
      const data = await streamService.fetchEvents({...filterParams, limit: 50});
      setEvents(data);
      setPendingEvents([]);
      lastFetchTimeRef.current = new Date().toISOString();
    } catch (error) {
      console.error('[StreamPage] 刷新失败:', error);
    } finally {
      setRefreshing(false);
    }
  }, [isUnlocked, filterParams]);

  /**
   * 增量轮询
   * 使用 isAtTopRef 避免 stale closure，防止 interval 因 isAtTop 变化频繁重建
   */
  const pollNewEvents = useCallback(async () => {
    if (!isUnlocked) return;
    try {
      const newEvents = await streamService.fetchIncrementalEvents({
        ...filterParams,
        after: lastFetchTimeRef.current,
      });
      if (newEvents.length > 0) {
        lastFetchTimeRef.current = new Date().toISOString();
        if (isAtTopRef.current) {
          // 在顶部：直接插入
          setEvents(prev => [...newEvents, ...prev]);
        } else {
          // 不在顶部：暂存
          setPendingEvents(prev => [...newEvents, ...prev]);
        }
      }
    } catch (error) {
      console.error('[StreamPage] 轮询失败:', error);
    }
  }, [isUnlocked, filterParams]);

  /**
   * 滚动位置变更处理
   * 同步更新 state 和 ref，ref 用于轮询回调避免 stale closure
   */
  const handleScrollPositionChange = useCallback((atTop: boolean) => {
    setIsAtTop(atTop);
    isAtTopRef.current = atTop;
  }, []);

  /**
   * 筛选变更
   */
  const handleFilterChange = useCallback((params: WaterfallQueryParams) => {
    setFilterParams(params);
    setPendingEvents([]);
    setEvents([]);
    // 重新加载
    loadEvents(params);
  }, [loadEvents]);

  /**
   * 点击"有 N 条新动态"
   */
  const handleInsertPending = useCallback(() => {
    setEvents(prev => [...pendingEvents, ...prev]);
    setPendingEvents([]);
    // 滚动到顶部
    listRef.current?.scrollToOffset?.({offset: 0, animated: true});
  }, [pendingEvents]);

  /**
   * 回到顶部
   */
  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset?.({offset: 0, animated: true});
  }, []);

  /**
   * 定位到我的卡片
   * Requirements: 12.3, 12.4
   * 点击后滚动定位到当前用户当日最新下班卡片，高亮 2 秒后恢复
   */
  const handleLocateMyCard = useCallback(() => {
    if (!myTodayEvent) return;
    // 使用 WaterfallList 暴露的 scrollToEventId 方法
    // 该方法会在包含聚合横条和时间分隔线的 listData 中查找正确索引
    const found = listRef.current?.scrollToEventId?.(myTodayEvent.id);
    if (found) {
      setHighlightedCardId(myTodayEvent.id);
      setTimeout(() => setHighlightedCardId(null), 2000);
    } else {
      // 卡片不在当前加载范围内，先重新加载包含该卡片的数据
      loadEvents().then(() => {
        // 重新加载后再尝试定位
        setTimeout(() => {
          const retryFound = listRef.current?.scrollToEventId?.(myTodayEvent.id);
          if (retryFound) {
            setHighlightedCardId(myTodayEvent.id);
            setTimeout(() => setHighlightedCardId(null), 2000);
          }
        }, 300);
      });
    }
  }, [myTodayEvent, loadEvents]);

  /**
   * 获取当前用户今日事件
   */
  const fetchMyTodayEvent = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const event = await streamService.getMyTodayEvent(currentUser.id);
      setMyTodayEvent(event);
    } catch (error) {
      console.error('[StreamPage] 获取今日事件失败:', error);
    }
  }, [currentUser?.id]);

  /**
   * 获取未读通知数量
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const count = await notificationService.getUnreadCount(currentUser.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('[StreamPage] 获取未读通知数失败:', error);
    }
  }, [currentUser?.id]);

  // 初始加载
  useEffect(() => {
    if (isUnlocked) {
      loadEvents();
      fetchMyTodayEvent();
      fetchUnreadCount();
    }
  }, [isUnlocked]);

  // 30 秒轮询（前台可见时）
  useEffect(() => {
    if (!isUnlocked) return;

    const startPolling = () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(pollNewEvents, 30000);
    };

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    // 监听应用前后台切换
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [isUnlocked, pollNewEvents]);

  // 判断"定位到我"按钮是否可见
  const showLocateButton = useMemo(() => {
    if (!myTodayEvent) return false;
    const now = new Date();
    const momentTime = new Date(myTodayEvent.effectiveClockOutMoment);
    return momentTime <= now;
  }, [myTodayEvent]);

  // ============ 未登录状态 ============
  if (!isLoggedIn) {
    return (
      <Box flex={1} bg={theme.colors.background} alignItems="center" justifyContent="center" p="$6">
        <VStack space="md" alignItems="center">
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: '600',
              color: theme.colors.text,
            }}>
            登录后查看下班瀑布流
          </Text>
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}>
            看看全国打工人今天几点下班
          </Text>
          <Button
            variant="solid"
            bg={theme.colors.text}
            size="lg"
            mt="$4"
            onPress={() => navigation?.navigate('Login')}
            accessibilityLabel="去登录">
            <ButtonText color={theme.colors.background}>去登录</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  // ============ 未提交状态 ============
  if (!hasSubmittedToday) {
    return (
      <Box flex={1} bg={theme.colors.background} alignItems="center" justifyContent="center" p="$6">
        <VStack space="md" alignItems="center">
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: '600',
              color: theme.colors.text,
            }}>
            提交今日状态后解锁瀑布流
          </Text>
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}>
            先在趋势页提交你的下班状态，即可查看全国打工人的实时下班动态
          </Text>
        </VStack>
      </Box>
    );
  }

  // ============ 正常瀑布流 ============
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* 筛选组件（含通知铃铛） */}
      <WaterfallFilter
        onFilterChange={handleFilterChange}
        onNotificationPress={() => navigation?.navigate('NotificationList')}
        unreadCount={unreadCount}
      />

      {/* 新动态提示条 */}
      {pendingEvents.length > 0 && (
        <NewCardsBanner count={pendingEvents.length} onPress={handleInsertPending} />
      )}

      {/* 瀑布流列表 */}
      <WaterfallList
        ref={listRef}
        events={events}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onScrollPositionChange={handleScrollPositionChange}
        highlightedCardId={highlightedCardId}
        currentUserId={currentUser?.id}
        navigation={navigation}
      />

      {/* 回到顶部按钮 */}
      {!isAtTop && (
        <ScrollToTopButton onPress={handleScrollToTop} />
      )}

      {/* 定位到我按钮 */}
      {showLocateButton && (
        <LocateMyCardButton onPress={handleLocateMyCard} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notificationBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});

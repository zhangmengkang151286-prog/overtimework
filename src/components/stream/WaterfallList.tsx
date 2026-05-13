/**
 * 瀑布流列表组件（WaterfallList）
 * FlatList 虚拟化渲染，插入时间分隔线和聚合横条
 *
 * Requirements: 4.1, 4.7, 4.8, 4.9, 4.10, 4.11
 */

import React, {useMemo, useCallback, forwardRef, useImperativeHandle, useRef} from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {Text, Box} from '@gluestack-ui/themed';
import {useTheme} from '../../hooks/useTheme';
import {typography} from '../../theme/typography';
import {
  ClockOutEvent,
  AggregateMarker,
  TimeDividerMarker,
  WaterfallListItem,
} from '../../types/clock-out-waterfall';
import {shouldInsertTimeDivider} from '../../utils/waterfallUtils';
import {insertAggregateStripes} from '../../utils/waterfallAggregate';
import {ClockOutCard} from './ClockOutCard';

interface WaterfallListProps {
  events: ClockOutEvent[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onScrollPositionChange: (isAtTop: boolean) => void;
  highlightedCardId: string | null;
  currentUserId?: string;
  navigation?: any;
}

// 最大可见卡片数
const MAX_VISIBLE_CARDS = 200;

export const WaterfallList = forwardRef<any, WaterfallListProps>(({
  events,
  loading,
  refreshing,
  onRefresh,
  onScrollPositionChange,
  highlightedCardId,
  currentUserId,
  navigation,
}, ref) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);

  /**
   * 构建列表数据：插入时间分隔线和聚合横条，限制最大 200 条
   */
  const listData = useMemo(() => {
    // 回收超出 200 条的部分
    const trimmedEvents = events.slice(0, MAX_VISIBLE_CARDS);

    // 插入聚合横条
    const withAggregates = insertAggregateStripes(trimmedEvents);

    // 插入时间分隔线
    const result: WaterfallListItem[] = [];
    for (let i = 0; i < withAggregates.length; i++) {
      const item = withAggregates[i];
      result.push(item as WaterfallListItem);

      // 仅在两张卡片之间判断是否需要时间分隔线
      if ('effectiveClockOutMoment' in item) {
        // 找下一个卡片（跳过聚合横条）
        let nextCardIndex = -1;
        for (let j = i + 1; j < withAggregates.length; j++) {
          if ('effectiveClockOutMoment' in withAggregates[j]) {
            nextCardIndex = j;
            break;
          }
        }
        if (nextCardIndex >= 0) {
          const nextCard = withAggregates[nextCardIndex] as ClockOutEvent;
          if (shouldInsertTimeDivider(item.effectiveClockOutMoment, nextCard.effectiveClockOutMoment)) {
            // A 更新（时间更晚），B 更旧（时间更早），列表降序排列
            // 分隔线显示两者之间的整点：即 B 的下一个整点 = A 的小时:00
            // 例如 A=20:03, B=19:58 → 分隔线为 "20:00"
            const hourA = new Date(item.effectiveClockOutMoment).getHours();
            const label = `${String(hourA).padStart(2, '0')}:00`;
            const divider: TimeDividerMarker = {type: 'timeDivider', label};
            result.push(divider);
          }
        }
      }
    }

    return result;
  }, [events]);

  useImperativeHandle(ref, () => ({
    scrollToOffset: (params: any) => flatListRef.current?.scrollToOffset(params),
    scrollToIndex: (params: any) => flatListRef.current?.scrollToIndex(params),
    /**
     * 根据事件 ID 滚动到对应卡片位置
     * 在 listData 中查找正确的索引（考虑聚合横条和时间分隔线的偏移）
     */
    scrollToEventId: (eventId: string) => {
      const index = listData.findIndex(
        item => !('type' in item) && (item as ClockOutEvent).id === eventId,
      );
      if (index >= 0) {
        flatListRef.current?.scrollToIndex({index, animated: true, viewPosition: 0.3});
      }
      return index >= 0;
    },
  }), [listData]);

  /**
   * 滚动事件处理
   */
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    onScrollPositionChange(offsetY <= 10);
  }, [onScrollPositionChange]);

  /**
   * 列表项 key
   */
  const keyExtractor = useCallback((item: WaterfallListItem, index: number) => {
    if ('type' in item) {
      if (item.type === 'aggregate') return `agg-${index}`;
      if (item.type === 'timeDivider') return `div-${index}`;
    }
    return (item as ClockOutEvent).id || `card-${index}`;
  }, []);

  /**
   * 渲染列表项
   */
  const renderItem = useCallback(({item}: {item: WaterfallListItem}) => {
    // 聚合横条
    if ('type' in item && item.type === 'aggregate') {
      const marker = item as AggregateMarker;
      return <AggregateStripeView stats={marker.stats} />;
    }

    // 时间分隔线
    if ('type' in item && item.type === 'timeDivider') {
      const divider = item as TimeDividerMarker;
      return <TimeDividerView label={divider.label} />;
    }

    // 下班卡片
    const event = item as ClockOutEvent;
    return (
      <ClockOutCard
        event={event}
        isHighlighted={highlightedCardId === event.id}
        isOwnCard={currentUserId === event.userId}
        navigation={navigation}
      />
    );
  }, [highlightedCardId, currentUserId, navigation]);

  /**
   * 空状态
   */
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <Box flex={1} alignItems="center" justifyContent="center" py="$16">
        <Text style={{fontSize: typography.fontSize.md, color: theme.colors.textSecondary}}>
          此刻安静
        </Text>
        <Text style={{fontSize: typography.fontSize.xs, color: theme.colors.textTertiary, marginTop: 4}}>
          最近 30 分钟内没有下班动态
        </Text>
      </Box>
    );
  }, [loading, theme]);

  return (
    <FlatList
      ref={flatListRef}
      data={listData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={renderEmpty}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.text}
        />
      }
      contentContainerStyle={listData.length === 0 ? styles.emptyContainer : undefined}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
      onScrollToIndexFailed={(info) => {
        // 当目标索引尚未渲染时，先滚动到最近的已渲染位置，再重试
        flatListRef.current?.scrollToOffset({offset: info.averageItemLength * info.index, animated: true});
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({index: info.index, animated: true, viewPosition: 0.3});
        }, 200);
      }}
    />
  );
});

WaterfallList.displayName = 'WaterfallList';

/**
 * 聚合横条视图
 */
const AggregateStripeView: React.FC<{stats: AggregateMarker['stats']}> = React.memo(({stats}) => {
  const theme = useTheme();
  const avgTime = stats.averageClockOutTime
    ? new Date(stats.averageClockOutTime).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
    : '--:--';

  if (stats.clockOutCount === 0) {
    return (
      <View style={[styles.aggregateStripe, {backgroundColor: theme.colors.backgroundTertiary}]}>
        <Text style={[styles.aggregateText, {color: theme.colors.textTertiary}]}>
          最近10分钟静悄悄
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.aggregateStripe, {backgroundColor: theme.colors.backgroundTertiary}]}>
      <Text style={[styles.aggregateText, {color: theme.colors.textSecondary}]}>
        最近 {stats.clockOutCount} 人下班 · 平均 {avgTime}
      </Text>
    </View>
  );
});

/**
 * 时间分隔线视图
 */
const TimeDividerView: React.FC<{label: string}> = React.memo(({label}) => {
  const theme = useTheme();
  return (
    <View style={styles.timeDivider}>
      <View style={[styles.dividerLine, {backgroundColor: theme.colors.border}]} />
      <Text style={[styles.dividerLabel, {color: theme.colors.textTertiary, backgroundColor: theme.colors.background}]}>
        {label}
      </Text>
      <View style={[styles.dividerLine, {backgroundColor: theme.colors.border}]} />
    </View>
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
  },
  aggregateStripe: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  aggregateText: {
    fontSize: typography.fontSize.xs,
  },
  timeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: {
    fontSize: typography.fontSize.xs,
    paddingHorizontal: 8,
  },
});

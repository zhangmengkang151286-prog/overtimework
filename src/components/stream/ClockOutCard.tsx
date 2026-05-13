/**
 * 下班卡片组件（ClockOutCard）
 * 展示匿名身份与事件数据、颜色温度背景、底部热门反馈区
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.6, 11.1
 */

import React, {useState, useEffect, useCallback} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text, HStack, VStack} from '@gluestack-ui/themed';
import {useTheme} from '../../hooks/useTheme';
import {typography} from '../../theme/typography';
import {ClockOutEvent, ReactionAggregate} from '../../types/clock-out-waterfall';
import {mapTimeToTemperature} from '../../utils/waterfallUtils';
import {Avatar} from '../../data/builtInAvatars';
import {ReactionBar} from './ReactionBar';
import {getReactions} from '../../services/stream/reactionService';

// 颜色温度映射到实际颜色
const TEMPERATURE_COLORS = {
  green: {bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.2)'},
  yellow: {bg: 'rgba(234, 179, 8, 0.08)', border: 'rgba(234, 179, 8, 0.2)'},
  orange: {bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.2)'},
  red: {bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)'},
};

interface ClockOutCardProps {
  event: ClockOutEvent;
  isHighlighted: boolean;
  isOwnCard: boolean;
  navigation?: any;
}

export const ClockOutCard: React.FC<ClockOutCardProps> = React.memo(({
  event,
  isHighlighted,
  isOwnCard,
  navigation,
}) => {
  const theme = useTheme();
  const [reactions, setReactions] = useState<ReactionAggregate>({});

  // 颜色温度
  const temperature = mapTimeToTemperature(event.effectiveClockOutMoment);
  const tempColor = TEMPERATURE_COLORS[temperature];

  // 相对时间描述
  const relativeTime = getRelativeTime(event.effectiveClockOutMoment);

  // 加载反馈数据
  useEffect(() => {
    getReactions(event.id).then(setReactions).catch(() => {});
  }, [event.id]);

  // 点击卡片跳转详情页
  const handlePress = useCallback(() => {
    navigation?.navigate('CardDetail', {eventId: event.id, event});
  }, [navigation, event]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: tempColor.bg,
          borderColor: isHighlighted ? theme.colors.text : tempColor.border,
          borderWidth: isHighlighted ? 2 : StyleSheet.hairlineWidth,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel={`${event.nickname}的下班卡片`}>
      {/* 匿名身份区 */}
      <HStack space="sm" alignItems="center" style={styles.header}>
        <Avatar avatarId={event.avatar} size={32} />
        <VStack flex={1}>
          <HStack space="xs" alignItems="center">
            <Text style={[styles.nickname, {color: theme.colors.text}]}>
              {event.nickname}
            </Text>
            <Text style={[styles.badge, {
              color: event.clockOutType === 'ontime' ? '#22c55e' : '#f97316',
              backgroundColor: event.clockOutType === 'ontime' ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)',
            }]}>
              {event.clockOutType === 'ontime' ? '准时下班' : '加班已下班'}
            </Text>
          </HStack>
          <Text style={[styles.meta, {color: theme.colors.textTertiary}]} numberOfLines={1}>
            {[event.industry, event.city, event.ageGroup].filter(Boolean).join(' · ')}
          </Text>
        </VStack>
      </HStack>

      {/* 事件数据区 */}
      <HStack style={styles.dataRow} space="md">
        <Text style={[styles.time, {color: theme.colors.text}]}>
          {formatClockOutTime(event.effectiveClockOutMoment)}
        </Text>
        <Text style={[styles.relativeTime, {color: theme.colors.textSecondary}]}>
          {relativeTime}
        </Text>
        {event.overtimeHours > 0 ? (
          <Text style={[styles.overtime, {color: '#f97316'}]}>
            加班 {event.overtimeHours}h
          </Text>
        ) : (
          <Text style={[styles.overtime, {color: '#22c55e'}]}>
            准时下班
          </Text>
        )}
        {event.wageBracket && (
          <Text style={[styles.wage, {color: theme.colors.textSecondary}]}>
            {event.wageBracket}
          </Text>
        )}
      </HStack>

      {/* 底部反馈区 */}
      {isOwnCard ? (
        <View style={styles.ownCardHint}>
          <Text style={[styles.ownCardText, {color: theme.colors.textTertiary}]}>
            这是你的卡片
          </Text>
        </View>
      ) : (
        <ReactionBar
          eventId={event.id}
          reactions={reactions}
          onReactionsChange={setReactions}
        />
      )}
    </TouchableOpacity>
  );
});

ClockOutCard.displayName = 'ClockOutCard';

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
 * 计算相对时间描述
 */
function getRelativeTime(isoString: string): string {
  const now = new Date();
  const target = new Date(isoString);
  const diffMs = now.getTime() - target.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  return '1天前';
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 12,
    padding: 12,
  },
  header: {
    marginBottom: 8,
  },
  nickname: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  badge: {
    fontSize: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meta: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  dataRow: {
    marginBottom: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  time: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  relativeTime: {
    fontSize: typography.fontSize.xs,
  },
  overtime: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  wage: {
    fontSize: typography.fontSize.xs,
  },
  ownCardHint: {
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  ownCardText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
});

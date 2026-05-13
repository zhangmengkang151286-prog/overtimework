/**
 * 卡片底部热门反馈区（ReactionBar）
 * 展示前 5 种热门反馈及"更多"入口
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React, {useState, useCallback, useMemo} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text, HStack} from '@gluestack-ui/themed';
import {useTheme} from '../../hooks/useTheme';
import {typography} from '../../theme/typography';
import {ReactionAggregate} from '../../types/clock-out-waterfall';
import {getTopReactions, applyReaction, addReaction, removeReaction} from '../../services/stream/reactionService';
import {useAppSelector} from '../../hooks/redux';
import {ReactionDrawer} from './ReactionDrawer';

interface ReactionBarProps {
  eventId: string;
  reactions: ReactionAggregate;
  onReactionsChange: (reactions: ReactionAggregate) => void;
}

export const ReactionBar: React.FC<ReactionBarProps> = React.memo(({
  eventId,
  reactions,
  onReactionsChange,
}) => {
  const theme = useTheme();
  const currentUser = useAppSelector((state: any) => state.user.currentUser);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 热门反馈前 5
  const topReactions = useMemo(() => getTopReactions(reactions, 5), [reactions]);

  /**
   * 处理反馈点击
   */
  const handleReactionPress = useCallback(async (reactionText: string) => {
    if (!currentUser?.id) return;

    const action = applyReaction(myReaction, reactionText);

    // 乐观更新
    const newReactions = {...reactions};
    if (action.remove) {
      newReactions[action.remove] = Math.max(0, (newReactions[action.remove] || 0) - 1);
    }
    if (action.add) {
      newReactions[action.add] = (newReactions[action.add] || 0) + 1;
    }
    onReactionsChange(newReactions);
    setMyReaction(action.add || null);

    // 异步写入
    try {
      if (action.remove) {
        await removeReaction(eventId, currentUser.id);
      }
      if (action.add) {
        await addReaction(eventId, currentUser.id, action.add);
      }
    } catch (error) {
      // 回滚
      onReactionsChange(reactions);
      setMyReaction(myReaction);
    }
  }, [currentUser?.id, eventId, myReaction, reactions, onReactionsChange]);

  return (
    <View style={styles.container}>
      <HStack space="xs" style={styles.row}>
        {topReactions.map(({text, count}) => (
          <TouchableOpacity
            key={text}
            style={[
              styles.reactionChip,
              {
                backgroundColor: myReaction === text
                  ? theme.colors.text + '15'
                  : theme.colors.backgroundTertiary,
                borderColor: myReaction === text ? theme.colors.text : 'transparent',
              },
            ]}
            onPress={() => handleReactionPress(text)}
            accessibilityLabel={`反馈：${text}，${count}次`}>
            <Text style={[styles.reactionText, {color: theme.colors.text}]}>
              {text}
            </Text>
            {count > 0 && (
              <Text style={[styles.reactionCount, {color: theme.colors.textTertiary}]}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.moreButton, {backgroundColor: theme.colors.backgroundTertiary}]}
          onPress={() => setDrawerVisible(true)}
          accessibilityLabel="查看更多反馈">
          <Text style={[styles.moreText, {color: theme.colors.textSecondary}]}>更多</Text>
        </TouchableOpacity>
      </HStack>

      {/* 反馈抽屉 */}
      <ReactionDrawer
        visible={drawerVisible}
        reactions={reactions}
        myReaction={myReaction}
        onSelect={handleReactionPress}
        onClose={() => setDrawerVisible(false)}
      />
    </View>
  );
});

ReactionBar.displayName = 'ReactionBar';

const styles = StyleSheet.create({
  container: {
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  row: {
    flexWrap: 'wrap',
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  reactionText: {
    fontSize: 11,
  },
  reactionCount: {
    fontSize: 10,
    marginLeft: 3,
  },
  moreButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  moreText: {
    fontSize: 11,
  },
});

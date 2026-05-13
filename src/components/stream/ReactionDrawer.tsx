/**
 * 反馈抽屉组件（ReactionDrawer）
 * 展示全部 20 种情绪反馈及其计数
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable} from 'react-native';
import {Text, VStack, HStack} from '@gluestack-ui/themed';
import {useTheme} from '../../hooks/useTheme';
import {typography} from '../../theme/typography';
import {
  ReactionAggregate,
  OVERTIME_REACTIONS,
  ONTIME_REACTIONS,
} from '../../types/clock-out-waterfall';

interface ReactionDrawerProps {
  visible: boolean;
  reactions: ReactionAggregate;
  myReaction: string | null;
  onSelect: (text: string) => void;
  onClose: () => void;
}

export const ReactionDrawer: React.FC<ReactionDrawerProps> = React.memo(({
  visible,
  reactions,
  myReaction,
  onSelect,
  onClose,
}) => {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.drawer, {backgroundColor: theme.colors.background}]}>
          {/* 标题 */}
          <HStack justifyContent="space-between" alignItems="center" style={styles.header}>
            <Text style={{fontSize: typography.fontSize.md, fontWeight: '600', color: theme.colors.text}}>
              全部反馈
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{fontSize: typography.fontSize.base, color: theme.colors.textSecondary}}>关闭</Text>
            </TouchableOpacity>
          </HStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 加班向反馈 */}
            <VStack style={styles.section}>
              <Text style={[styles.sectionTitle, {color: theme.colors.textTertiary}]}>加班向</Text>
              <View style={styles.grid}>
                {OVERTIME_REACTIONS.map(text => (
                  <ReactionItem
                    key={text}
                    text={text}
                    count={reactions[text] || 0}
                    isSelected={myReaction === text}
                    onPress={() => { onSelect(text); onClose(); }}
                    theme={theme}
                  />
                ))}
              </View>
            </VStack>

            {/* 准时下班向反馈 */}
            <VStack style={styles.section}>
              <Text style={[styles.sectionTitle, {color: theme.colors.textTertiary}]}>准时下班向</Text>
              <View style={styles.grid}>
                {ONTIME_REACTIONS.map(text => (
                  <ReactionItem
                    key={text}
                    text={text}
                    count={reactions[text] || 0}
                    isSelected={myReaction === text}
                    onPress={() => { onSelect(text); onClose(); }}
                    theme={theme}
                  />
                ))}
              </View>
            </VStack>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

ReactionDrawer.displayName = 'ReactionDrawer';

/**
 * 单个反馈项
 */
const ReactionItem: React.FC<{
  text: string;
  count: number;
  isSelected: boolean;
  onPress: () => void;
  theme: any;
}> = React.memo(({text, count, isSelected, onPress, theme}) => (
  <TouchableOpacity
    style={[
      styles.item,
      {
        backgroundColor: isSelected ? theme.colors.text + '12' : theme.colors.backgroundTertiary,
        borderColor: isSelected ? theme.colors.text : 'transparent',
      },
    ]}
    onPress={onPress}
    accessibilityLabel={`${text}，${count}次`}>
    <Text style={[styles.itemText, {color: theme.colors.text}]}>{text}</Text>
    <Text style={[styles.itemCount, {color: theme.colors.textTertiary}]}>{count}</Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  drawer: {
    maxHeight: '60%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: typography.fontSize.sm,
  },
  itemCount: {
    fontSize: typography.fontSize.xs,
    marginLeft: 6,
  },
});

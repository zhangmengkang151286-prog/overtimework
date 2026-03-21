import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TagDistribution} from '../types';
import {typography} from '../theme/typography';

/**
 * TagRankingList - 标签排名列表组件
 * 3列布局显示前25个标签的占比
 */

const NUM_COLUMNS = 3;
const TOP_COUNT = 25;

interface TagRankingListProps {
  tagDistribution: TagDistribution[];
  totalCount: number;
  theme?: 'light' | 'dark';
}

export const TagRankingList: React.FC<TagRankingListProps> = ({
  tagDistribution,
  totalCount,
  theme = 'light',
}) => {
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const secondaryTextColor = theme === 'dark' ? '#cccccc' : '#666666';
  const borderColor = theme === 'dark' ? '#333333' : '#e0e0e0';

  // 取前25个标签
  const topTags = tagDistribution.slice(0, TOP_COUNT);

  if (topTags.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.emptyText, {color: secondaryTextColor}]}>
          暂无标签数据
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: secondaryTextColor}]}>
        标签占比 TOP {topTags.length}
      </Text>
      <View style={styles.grid}>
        {topTags.map((tag, index) => {
          const percentage = totalCount > 0 ? (tag.count / totalCount) * 100 : 0;
          return (
            <View
              key={tag.tagId}
              style={[
                styles.cell,
                {borderBottomColor: borderColor},
              ]}>
              <View style={styles.cellRow}>
                <Text style={[styles.rank, {color: secondaryTextColor}]}>
                  {index + 1}
                </Text>
                <View style={[styles.colorDot, {backgroundColor: tag.color}]} />
                <Text
                  style={[styles.tagName, {color: textColor}]}
                  numberOfLines={1}>
                  {tag.tagName}
                </Text>
                <Text style={[styles.percentage, {color: secondaryTextColor}]}>
                  {Math.round(percentage)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    paddingVertical: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / NUM_COLUMNS}%` as any,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cellRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    width: 18,
    textAlign: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  tagName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    flex: 1,
  },
  percentage: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginLeft: 2,
  },
});

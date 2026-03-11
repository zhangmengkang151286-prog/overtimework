import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TagDistribution} from '../types';

/**
 * TagRankingList - 标签排名列表组件
 * 显示前10个标签的占比
 */

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
  const borderColor = theme === 'dark' ? '#444444' : '#e0e0e0';

  // 取前10个标签
  const top10Tags = tagDistribution.slice(0, 10);

  // 如果没有数据
  if (top10Tags.length === 0) {
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
        标签占比 TOP 10
      </Text>
      {top10Tags.map((tag, index) => {
        const percentage = totalCount > 0 ? (tag.count / totalCount) * 100 : 0;
        return (
          <View
            key={tag.tagId}
            style={[styles.row, {borderBottomColor: borderColor}]}>
            <View style={styles.leftSection}>
              <Text style={[styles.rank, {color: secondaryTextColor}]}>
                {index + 1}
              </Text>
              <View style={[styles.colorDot, {backgroundColor: tag.color}]} />
              <Text
                style={[styles.tagName, {color: textColor}]}
                numberOfLines={1}>
                {tag.tagName}
              </Text>
            </View>
            <View style={styles.rightSection}>
              <Text style={[styles.percentage, {color: textColor}]}>
                {Math.round(percentage)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rank: {
    fontSize: 14,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
});

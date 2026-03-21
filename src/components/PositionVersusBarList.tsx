import React, {useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {DimensionItem} from '../types';
import {sortByTotalCount} from '../utils/dimensionStatsUtils';
import {typography} from '../theme/typography';

/**
 * PositionVersusBarList - 职位对抗条列表组件
 * 每个职位一行：职位名称 （绿色人数 / 红色人数） + 窄条形图
 * 显示所有有数据的职位
 */

interface PositionVersusBarListProps {
  data: DimensionItem[];
  theme: 'light' | 'dark';
  blurData?: boolean;
}

// 条形图高度：原始 8px 的 20% ≈ 2px，最小保证可见
const BAR_HEIGHT = 2;

export const PositionVersusBarList: React.FC<PositionVersusBarListProps> = ({
  data,
  theme,
  blurData = false,
}) => {
  const isDark = theme === 'dark';

  // 按 totalCount 降序排列，显示所有有数据的职位
  const sortedData = useMemo(() => sortByTotalCount(data), [data]);

  // 最大总人数，用于计算条形图长度比例
  const maxTotal = useMemo(
    () => Math.max(...sortedData.map(d => d.totalCount), 1),
    [sortedData],
  );

  if (sortedData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text size="sm" color={isDark ? '$trueGray500' : '$trueGray400'}>
          该时段暂无职位数据
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sortedData.map(item => {
        const total = item.totalCount;
        const onTimeRatio = total > 0 ? item.onTimeCount / total : 0.5;
        const overtimeRatio = total > 0 ? item.overtimeCount / total : 0.5;
        // 条形图长度按总人数占最大值的比例
        const barWidthPercent = (total / maxTotal) * 100;

        return (
          <View
            key={item.id}
            style={styles.itemContainer}>
            {/* 职位名称 + 人数：职位名称 （ 绿色数字 / 红色数字 ） */}
            <View style={styles.nameRow}>
              <Text
                size="xs"
                color={isDark ? '$white' : '$trueGray900'}
                numberOfLines={1}
                style={styles.positionName}>
                {item.name}
              </Text>
              <Text
                size="xs"
                color={isDark ? '$white' : '$trueGray900'}
                style={styles.bracket}>
                {'（ '}
              </Text>
              <Text
                size="xs"
                style={[styles.countInline, {color: '#00C805'}]}>
                {item.onTimeCount}
              </Text>
              <Text
                size="xs"
                color={isDark ? '$white' : '$trueGray900'}
                style={styles.separator}>
                {' / '}
              </Text>
              <Text
                size="xs"
                style={[styles.countInline, {color: '#FF5000'}]}>
                {item.overtimeCount}
              </Text>
              <Text
                size="xs"
                color={isDark ? '$white' : '$trueGray900'}
                style={styles.bracket}>
                {' ）'}
              </Text>
            </View>

            {/* 条形图：高度为原来的20%，长度按总人数比例 */}
            <View style={[styles.barRow, {width: `${barWidthPercent}%`}]}>
              <View
                style={[
                  styles.barContainer,
                  {height: BAR_HEIGHT},
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.05)',
                  },
                ]}>
                {/* 准时部分（左侧绿色） */}
                <View
                  style={[
                    styles.barSegment,
                    {width: `${onTimeRatio * 100}%`, backgroundColor: '#00C805'},
                  ]}
                />
                {/* 加班部分（右侧红色） */}
                <View
                  style={[
                    styles.barSegment,
                    {width: `${overtimeRatio * 100}%`, backgroundColor: '#FF5000'},
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  itemContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  positionName: {
    // 职位名称不设固定宽度，自适应
  },
  bracket: {
    fontSize: typography.fontSize.xxs,
  },
  countInline: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '600',
  },
  separator: {
    fontSize: typography.fontSize.xxs,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});

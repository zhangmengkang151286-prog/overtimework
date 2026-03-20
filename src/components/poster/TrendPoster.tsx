/**
 * 趋势界面海报组件
 * UI 和趋势页面保持一致：
 * - 7个圆点 = HistoricalStatusIndicator 风格
 * - 准时/加班对比条 = VersusBar 风格
 * - 标签分布网格 = GridChart 风格
 */

import React, {forwardRef, useMemo, useCallback} from 'react';
import {View, StyleSheet, Dimensions, LayoutChangeEvent} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {PosterTemplate} from './PosterTemplate';
import {posterTheme, getPosterTheme} from '../../theme/posterTheme';
import {TrendData, UserInfo} from '../../types/poster';
import {useThemeToggle} from '../../hooks/useThemeToggle';

export interface TrendPosterProps {
  data: TrendData;
  user: UserInfo;
  date: string;
}

// 网格配置 - 和 GridChart 保持一致
const GRID_ITEM_SIZE = 16;
const GRID_GAP = 2;
const GRID_ROWS = 15;

export const TrendPoster = React.memo(
  forwardRef<View, TrendPosterProps>(({data, user, date}, ref) => {
    const {isDark} = useThemeToggle();
    const colors = useMemo(() => getPosterTheme(isDark), [isDark]);

    // 计算网格列数（和 GridChart 一样根据容器宽度动态计算）
    const [containerWidth, setContainerWidth] = React.useState(0);
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
      const {width} = event.nativeEvent.layout;
      if (width > 0) setContainerWidth(width);
    }, []);

    const columns = containerWidth > 0
      ? Math.floor((containerWidth + GRID_GAP) / (GRID_ITEM_SIZE + GRID_GAP))
      : 0;
    const totalGrids = columns * GRID_ROWS;
    const actualItemSize = columns > 0
      ? (containerWidth - (columns - 1) * GRID_GAP) / columns
      : GRID_ITEM_SIZE;

    // 网格数据 - 和 GridChart 逻辑一致
    const gridData = useMemo(() => {
      if (totalGrids === 0) return [];

      const cells: Array<{color: string; tagName: string}> = [];

      if (data.tagDistribution.length === 0 || data.participants === 0) {
        for (let i = 0; i < totalGrids; i++) {
          cells.push({color: '#18181B', tagName: ''});
        }
        return cells;
      }

      const totalCount = data.tagDistribution.reduce((sum, t) => sum + (t.count || 0), 0);
      if (totalCount === 0) {
        for (let i = 0; i < totalGrids; i++) {
          cells.push({color: '#18181B', tagName: ''});
        }
        return cells;
      }

      // 按比例分配方格数
      const allocations = data.tagDistribution.map(tag => {
        const exact = (tag.count / totalCount) * totalGrids;
        return {
          tag,
          allocated: Math.max(1, Math.floor(exact)),
          remainder: exact - Math.floor(exact),
        };
      });

      let totalAllocated = allocations.reduce((s, a) => s + a.allocated, 0);
      // 补齐不足
      if (totalAllocated < totalGrids) {
        allocations.sort((a, b) => b.remainder - a.remainder);
        let i = 0;
        while (totalAllocated < totalGrids) {
          allocations[i % allocations.length].allocated++;
          totalAllocated++;
          i++;
        }
      }
      // 削减超出
      while (totalAllocated > totalGrids) {
        allocations.sort((a, b) => b.allocated - a.allocated);
        for (const a of allocations) {
          if (a.allocated > 1 && totalAllocated > totalGrids) {
            a.allocated--;
            totalAllocated--;
            break;
          }
        }
      }

      allocations.forEach(({tag, allocated}) => {
        for (let i = 0; i < allocated; i++) {
          cells.push({
            color: tag.color || colors.primary,
            tagName: tag.tag_name,
          });
        }
      });

      return cells.slice(0, totalGrids);
    }, [data.tagDistribution, data.participants, totalGrids, colors]);

    // 图例 - 和 GridChart 一样显示所有标签
    const legend = useMemo(() => {
      const totalCount = data.tagDistribution.reduce((s, t) => s + (t.count || 0), 0);
      return data.tagDistribution.map(tag => ({
        name: tag.tag_name,
        color: tag.color || colors.primary,
        percentage: totalCount > 0 ? Math.round((tag.count / totalCount) * 100) : 0,
      }));
    }, [data.tagDistribution, colors]);

    return (
      <PosterTemplate ref={ref} user={user} date={date} title="此刻">
        {/* 参与人数 - 大数字居中 */}
        <View style={styles.section}>
          <Text style={[styles.subLabel, {color: colors.textSecondary}]}>
            本轮参与人数
          </Text>
          <Text
            style={[styles.bigNumber, {
              color: colors.text,
              fontFamily: posterTheme.typography.number.fontFamily,
            }]}>
            {data.participants.toLocaleString()}
          </Text>
        </View>

        {/* 准时/加班对比条 - 和 VersusBar 保持一致 */}
        <View style={styles.section}>
          {/* 上方文字标签 */}
          <View style={styles.versusLabels}>
            <Text style={[styles.versusText, {color: '#FFFFFF'}]}>
              准时下班 {data.onTimeCount}
            </Text>
            <Text style={[styles.versusText, {color: '#FFFFFF'}]}>
              加班 {data.overtimeCount}
            </Text>
          </View>
          {/* 进度条 - 和 VersusBar 一样高度8px，圆角 */}
          <View style={[styles.versusBar, {backgroundColor: colors.border}]}>
            {(() => {
              const total = data.onTimeCount + data.overtimeCount;
              const onPct = total > 0 ? (data.onTimeCount / total) * 100 : 50;
              return (
                <>
                  <View style={[styles.versusOnTime, {width: `${onPct}%`}]} />
                  <View style={styles.versusOvertime} />
                </>
              );
            })()}
          </View>
        </View>

        {/* 标签分布 - 和 GridChart 保持一致 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
            标签分布
          </Text>
          <View style={{width: '100%'}} onLayout={handleLayout}>
            {columns > 0 && (
              <>
                {/* 网格 - 和 GridChart 一样 flexWrap 平铺 */}
                <View style={styles.gridContainer}>
                  {gridData.map((cell, index) => {
                    const colIndex = index % columns;
                    const isLastCol = colIndex === columns - 1;
                    const rowIndex = Math.floor(index / columns);
                    const isLastRow = rowIndex === GRID_ROWS - 1;
                    return (
                      <View
                        key={index}
                        style={{
                          width: actualItemSize,
                          height: actualItemSize,
                          borderRadius: 4,
                          backgroundColor: cell.color,
                          marginRight: isLastCol ? 0 : GRID_GAP,
                          marginBottom: isLastRow ? 0 : GRID_GAP,
                        }}
                      />
                    );
                  })}
                </View>
                {/* 图例 - 和 GridChart 一样 */}
                {legend.length > 0 && (
                  <View style={styles.legendContainer}>
                    {legend.map((item, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View
                          style={[styles.legendDot, {backgroundColor: item.color}]}
                        />
                        <Text style={[styles.legendText, {color: colors.textSecondary}]}>
                          {item.name} {item.percentage}%
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </PosterTemplate>
    );
  }),
  (prevProps, nextProps) => {
    return (
      prevProps.data.participants === nextProps.data.participants &&
      prevProps.data.onTimeCount === nextProps.data.onTimeCount &&
      prevProps.data.overtimeCount === nextProps.data.overtimeCount &&
      prevProps.data.timeline.length === nextProps.data.timeline.length &&
      prevProps.data.tagDistribution.length === nextProps.data.tagDistribution.length &&
      prevProps.user.username === nextProps.user.username &&
      prevProps.date === nextProps.date
    );
  },
);

TrendPoster.displayName = 'TrendPoster';

const styles = StyleSheet.create({
  // 通用区块
  section: {
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 2,
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 56,
  },
  // 对比条 - 和 VersusBar 一致
  versusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  versusText: {
    fontSize: 13,
  },
  versusBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  versusOnTime: {
    height: '100%',
    backgroundColor: '#00C805',
  },
  versusOvertime: {
    flex: 1,
    height: '100%',
    backgroundColor: '#FF5000',
  },
  // 标签分布 - 和 GridChart 一致
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
  },
});

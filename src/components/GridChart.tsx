import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {StyleSheet, Pressable, View, LayoutChangeEvent} from 'react-native';
import {Box, HStack, Text} from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {duration as animDuration, easing as animEasing} from '../theme/animations';
import {TagDistribution} from '../types';
import {greenScale, redScale} from '../theme/colors';
import {BlurView} from 'expo-blur';

/**
 * GridChart - GitHub风格的网格图组件（使用 gluestack-ui）
 * 使用小方格展示标签分布，红色系表示加班，蓝色系表示准时下班
 *
 * gluestack-ui 迁移完成：
 * - 使用 VStack 和 HStack 布局
 * - 使用 Box 组件创建网格单元
 * - 使用 gluestack-ui 的 spacing tokens (space="xs")
 * - 使用 gluestack-ui 的颜色 tokens
 *
 * 验证需求: 6.2, 6.5
 */

interface GridChartProps {
  tagDistribution: TagDistribution[];
  overtimeCount: number;
  onTimeCount: number;
  theme?: 'light' | 'dark';
  animationDuration?: number;
  /** 是否遮挡标签名称和比例 */
  blurLegend?: boolean;
  /** 是否在内部渲染毛玻璃遮罩（解决外部遮罩被 Animated.View 原生层覆盖的问题） */
  showBlurOverlay?: boolean;
}

export interface GridChartRef {
  clearSelection: () => void;
}

interface GridItem {
  id: string;
  tagName: string;
  color: string;
  isOvertime: boolean;
  count: number;
}

// 网格配置
const GRID_ITEM_SIZE = 16; // 方格尺寸
const GRID_GAP = 2; // 方格间距（对应 gluestack-ui 的 space="xs"）
const GRID_ROWS = 15; // 固定行数

/**
 * 生成渐变色系 - 使用 Robinhood 风格 20 级色阶
 * @param count 需要生成的颜色数量
 * @param isRed 是否是红色系（true=红色/加班，false=绿色/准时）
 *
 * 颜色设计：
 * - 红色系：色相19°，从暗到 #FF5000
 * - 绿色系：色相122°，从暗到 #00C805
 * - 使用预生成的 20 级色阶，按需采样
 */
const generateGradientColors = (count: number, isRed: boolean): string[] => {
  const scale = isRed ? redScale : greenScale;
  if (count <= 0) return [];
  if (count === 1) return [scale[Math.floor(scale.length / 2)]];

  // 从色阶中均匀采样
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.round((i / (count - 1)) * (scale.length - 1));
    colors.push(scale[idx]);
  }
  return colors;
};

/**
 * 处理Top10标签
 * 验证需求: 9.4, 9.5
 * 
 * 逻辑：
 * 1. 直接使用传入的标签数据（已经在TrendPage中处理过Top10和颜色分配）
 * 2. 不再重新生成颜色，使用传入的color字段
 */
const processTagDistribution = (
  tagDistribution: TagDistribution[],
): GridItem[] => {
  // 过滤掉count为0的标签
  const validTags = tagDistribution.filter(tag => tag.count > 0);

  // 直接使用传入的数据，不需要排序和取Top10（已经在TrendPage中处理过）
  const result: GridItem[] = validTags.map(tag => {
    const color = tag.color || '#666666'; // 使用传入的颜色，如果没有则使用默认灰色
    return {
      id: tag.tagId,
      tagName: tag.tagName,
      color,
      isOvertime: tag.isOvertime,
      count: tag.count,
    };
  });

  return result;
};

/**
 * 计算每个标签应该占用的方格数量
 * 使用改进的分配算法，确保分配总数严格等于 totalGrids
 */
const calculateGridAllocation = (
  items: GridItem[],
  totalCount: number,
  totalGrids: number,
): Map<string, number> => {
  const allocation = new Map<string, number>();

  if (totalCount === 0 || items.length === 0 || totalGrids === 0) {
    return allocation;
  }

  // 第一步：按比例计算精确值，向下取整，每个至少1格
  const allocations: Array<{
    id: string;
    exact: number;
    allocated: number;
    remainder: number;
  }> = items.map(item => {
    const exact = (item.count / totalCount) * totalGrids;
    const floored = Math.floor(exact);
    return {
      id: item.id,
      exact,
      allocated: Math.max(1, floored),
      remainder: exact - floored,
    };
  });

  // 第二步：用 while 循环强制修正，直到总数严格等于 totalGrids
  let totalAllocated = allocations.reduce((sum, a) => sum + a.allocated, 0);

  // 不够 → 按余数从大到小逐个+1
  if (totalAllocated < totalGrids) {
    allocations.sort((a, b) => b.remainder - a.remainder);
    let i = 0;
    while (totalAllocated < totalGrids) {
      allocations[i % allocations.length].allocated++;
      totalAllocated++;
      i++;
    }
  }
  // 超了 → 从分配最多的项逐个-1（保底1格）
  else if (totalAllocated > totalGrids) {
    while (totalAllocated > totalGrids) {
      // 每轮重新排序，从最大的开始减
      allocations.sort((a, b) => b.allocated - a.allocated);
      let reduced = false;
      for (const a of allocations) {
        if (a.allocated > 1 && totalAllocated > totalGrids) {
          a.allocated--;
          totalAllocated--;
          reduced = true;
          break;
        }
      }
      // 如果所有项都是1，无法再减，强制退出防止死循环
      if (!reduced) break;
    }
  }

  // 第三步：构建最终的分配映射
  allocations.forEach(a => {
    allocation.set(a.id, a.allocated);
  });

  return allocation;
};

/**
 * GridSquare - 单个网格方块（gluestack-ui 风格）
 *
 * gluestack-ui 设计规范：
 * - 使用 gluestack-ui 的 borderRadius tokens
 * - 快速线性动画（100ms）
 * - 选中时使用 gluestack-ui 的 primary 颜色边框
 */
const GridSquare: React.FC<{
  color: string;
  delay: number;
  animationDuration: number;
  isSelected: boolean;
  isDimmed: boolean;
  size: number;
  isDark: boolean;
}> = React.memo(({color, delay, animationDuration, isSelected, isDimmed, size, isDark}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: animDuration.fast, // 100ms 快速动画
      easing: animEasing.linear,
    });
  }, [color]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: 4,
          backgroundColor: color,
        },
        animatedStyle,
        isDimmed && styles.gridSquareDimmed,
        isSelected && {borderWidth: 0.5, borderColor: isDark ? '#FFFFFF' : '#000000'},
      ]}
    />
  );
});

export const GridChart = forwardRef<GridChartRef, GridChartProps>(
  (
    {
      tagDistribution,
      overtimeCount,
      onTimeCount,
      theme = 'light',
      animationDuration = 800,
      blurLegend = false,
      showBlurOverlay = false,
    },
    ref,
  ) => {
    // 使用 onLayout 获取实际容器宽度，避免手动计算 padding
    const [containerWidth, setContainerWidth] = useState(0);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
      const {width} = event.nativeEvent.layout;
      if (width > 0 && width !== containerWidth) {
        setContainerWidth(width);
      }
    }, [containerWidth]);

    // 选中的标签 ID
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

    // 暴露清除选中的方法给父组件
    useImperativeHandle(ref, () => ({
      clearSelection: () => {
        setSelectedTagId(null);
      },
    }));

    // 动态计算列数和方格尺寸，确保填满容器宽度
    const columns = containerWidth > 0
      ? Math.floor((containerWidth + GRID_GAP) / (GRID_ITEM_SIZE + GRID_GAP))
      : 0;
    const rows = GRID_ROWS;
    const totalGrids = columns * rows;

    // 计算实际方格尺寸，让方格精确填满容器宽度（消除右侧空隙）
    const actualItemSize = columns > 0
      ? (containerWidth - (columns - 1) * GRID_GAP) / columns
      : GRID_ITEM_SIZE;

    // 处理标签分布
    const processedItems = useMemo(
      () => processTagDistribution(tagDistribution),
      [tagDistribution],
    );

    // 网格图按标签记录数统计（一个人可提交多个标签）
    // overtimeCount/onTimeCount 是按人数统计的，不适用于网格分配
    const totalCount = useMemo(
      () => processedItems.reduce((sum, item) => sum + item.count, 0),
      [processedItems],
    );

    // 分配方格
    const gridAllocation = useMemo(
      () => calculateGridAllocation(processedItems, totalCount, totalGrids),
      [processedItems, totalCount, totalGrids],
    );

    // 生成网格数据（添加 tagId 字段用于识别标签）
    const gridData = useMemo(() => {
      const data: Array<{
        id: string;
        color: string;
        index: number;
        tagId: string;
      }> = [];

      // 无数据时的默认颜色跟随主题
      const emptyColor = theme === 'dark' ? '#18181B' : '#E4E4E7';

      // 无数据时：用灰色方格填满整个网格
      if (processedItems.length === 0 || totalCount === 0) {
        for (let i = 0; i < totalGrids; i++) {
          data.push({
            id: `empty-${i}`,
            color: emptyColor,
            index: i,
            tagId: 'empty',
          });
        }
        return data;
      }

      let currentIndex = 0;

      processedItems.forEach(item => {
        const count = gridAllocation.get(item.id) || 0;
        for (let i = 0; i < count && currentIndex < totalGrids; i++) {
          data.push({
            id: `${item.id}-${i}`,
            color: item.color,
            index: currentIndex,
            tagId: item.id,
          });
          currentIndex++;
        }
      });

      return data;
    }, [processedItems, gridAllocation, totalGrids, totalCount]);

    // 生成图例（显示所有标签，包含人数和占比）
    const legend = useMemo(() => {
      const legendItems = processedItems.map(item => {
        const percentage =
          totalCount > 0 ? String(Math.round((item.count / totalCount) * 100)) : '0';
        return {
          id: item.id,
          name: item.tagName,
          color: item.color,
          count: item.count,
          percentage,
        };
      });
      return legendItems;
    }, [processedItems, totalCount]);

    // 处理格子点击
    const handleGridItemPress = (tagId: string) => {
      if (tagId === 'empty') {
        // 空格子点击 = 点击空白处，取消选中
        if (selectedTagId !== null) {
          setSelectedTagId(null);
        }
        return;
      }
      setSelectedTagId(selectedTagId === tagId ? null : tagId); // 切换选中状态
    };

    // 处理图例点击
    const handleLegendPress = (itemId: string) => {
      setSelectedTagId(selectedTagId === itemId ? null : itemId);
    };

    return (
      <View style={{width: '100%', position: 'relative'}} onLayout={handleLayout}>
        {columns > 0 && (
          <>
            {/* 
              网格容器 - 用 flexWrap 平铺所有格子
              每个格子固定尺寸 + marginRight + marginBottom
              最后一列不加 marginRight，确保不超出容器宽度
              这样每行间距完全一致，最后一行也自然对齐
            */}
            <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
              {gridData.map((item, idx) => {
                const isSelected = selectedTagId === item.tagId;
                const isDimmed = selectedTagId !== null && !isSelected;
                const colIndex = item.index % columns;
                const isLastCol = colIndex === columns - 1;
                const rowIndex = Math.floor(item.index / columns);
                const isLastRow = rowIndex === rows - 1;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleGridItemPress(item.tagId)}
                    style={{
                      marginRight: isLastCol ? 0 : GRID_GAP,
                      marginBottom: isLastRow ? 0 : GRID_GAP,
                    }}>
                    <GridSquare
                      color={item.color}
                      delay={item.index * 10}
                      animationDuration={animationDuration}
                      isSelected={isSelected}
                      isDimmed={isDimmed}
                      size={actualItemSize}
                      isDark={theme === 'dark'}
                    />
                  </Pressable>
                );
              })}
            </View>

        {legend.length > 0 && (
          <View style={{position: 'relative'}}>
            <View style={styles.legendContainer}>
              {legend.map(item => {
                const isSelected = selectedTagId === item.id;
                const isDimmed = selectedTagId !== null && !isSelected;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleLegendPress(item.id)}
                    disabled={blurLegend}
                    style={styles.legendItem}>
                    <HStack
                      alignItems="center"
                      p="$1"
                      opacity={isDimmed ? 0.4 : 1}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="$xs"
                        bg={item.color}
                        mr="$1"
                      />
                      <Text
                        size="2xs"
                        color={theme === 'dark' ? '$textDark0' : '$textLight900'}
                        fontWeight={isSelected ? '$semibold' : '$normal'}
                        numberOfLines={1}>
                        {blurLegend ? '●●● **%' : `${item.name} ${item.percentage}%`}
                      </Text>
                    </HStack>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
            {/* 内部毛玻璃遮罩 - 在网格和图例之后渲染，确保覆盖 Animated.View 原生层 */}
            {showBlurOverlay && (
              <View style={styles.internalOverlay}>
                <BlurView
                  intensity={30}
                  tint={theme === 'dark' ? 'dark' : 'light'}
                  experimentalBlurMethod="dimezisBlurView"
                  style={StyleSheet.absoluteFillObject}
                />
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor: theme === 'dark'
                        ? 'rgba(0, 0, 0, 0.35)'
                        : 'rgba(255, 255, 255, 0.35)',
                    },
                  ]}
                />
              </View>
            )}
          </>
        )}
      </View>
    );
  },
);

GridChart.displayName = 'GridChart';

const styles = StyleSheet.create({
  gridSquareDimmed: {
    opacity: 0.3,
  },
  gridSquareSelected: {},
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 16,
  },
  legendItem: {
    width: '33.33%',
  },
  // 内部毛玻璃遮罩，覆盖整个 GridChart 内容区域，无圆角避免小方格角漏出
  internalOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    overflow: 'hidden',
    zIndex: 999,
    elevation: 999,
  },
});

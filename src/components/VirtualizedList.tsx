/**
 * 虚拟滚动列表组件
 *
 * 优化长列表性能,只渲染可见区域的项目
 */

import React, {useMemo} from 'react';
import {FlatList, FlatListProps, StyleSheet} from 'react-native';

export interface VirtualizedListProps<T> extends Omit<
  FlatListProps<T>,
  'getItemLayout'
> {
  data: T[];
  renderItem: FlatListProps<T>['renderItem'];
  itemHeight?: number;
  estimatedItemHeight?: number;
  keyExtractor?: (item: T, index: number) => string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

/**
 * 虚拟滚动列表组件
 * 使用FlatList的优化特性实现高性能长列表
 */
export function VirtualizedList<T>({
  data,
  renderItem,
  itemHeight,
  estimatedItemHeight = 50,
  keyExtractor,
  onEndReached,
  onEndReachedThreshold = 0.5,
  ...restProps
}: VirtualizedListProps<T>) {
  // 如果提供了固定高度,使用getItemLayout优化
  const getItemLayout = useMemo(() => {
    if (itemHeight) {
      return (_data: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }
    return undefined;
  }, [itemHeight]);

  // 默认的key提取器
  const defaultKeyExtractor = (item: T, index: number) => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    // 尝试使用item的id属性
    if (item && typeof item === 'object' && 'id' in item) {
      return String((item as any).id);
    }
    return String(index);
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={defaultKeyExtractor}
      getItemLayout={getItemLayout}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      // 性能优化配置
      removeClippedSubviews={true} // 移除屏幕外的视图
      maxToRenderPerBatch={10} // 每批最多渲染10个
      updateCellsBatchingPeriod={50} // 批量更新间隔50ms
      initialNumToRender={10} // 初始渲染10个
      windowSize={5} // 渲染窗口大小
      // 估算项目高度(如果没有固定高度)
      {...(!itemHeight && {getItemLayout: undefined})}
      {...restProps}
    />
  );
}

/**
 * 分组虚拟滚动列表
 * 支持分组标题的虚拟滚动列表
 */
export interface SectionData<T> {
  title: string;
  data: T[];
}

export interface VirtualizedSectionListProps<T> {
  sections: SectionData<T>[];
  renderItem: (
    item: T,
    index: number,
    section: SectionData<T>,
  ) => React.ReactElement;
  renderSectionHeader?: (section: SectionData<T>) => React.ReactElement;
  itemHeight?: number;
  sectionHeaderHeight?: number;
  keyExtractor?: (item: T, index: number) => string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

export function VirtualizedSectionList<T>({
  sections,
  renderItem,
  renderSectionHeader,
  itemHeight,
  sectionHeaderHeight = 40,
  keyExtractor,
  onEndReached,
  onEndReachedThreshold = 0.5,
}: VirtualizedSectionListProps<T>) {
  // 将分组数据扁平化为单一列表
  const flatData = useMemo(() => {
    const result: Array<{
      type: 'header' | 'item';
      section: SectionData<T>;
      item?: T;
      index?: number;
    }> = [];

    sections.forEach(section => {
      // 添加分组标题
      result.push({type: 'header', section});

      // 添加分组项目
      section.data.forEach((item, index) => {
        result.push({type: 'item', section, item, index});
      });
    });

    return result;
  }, [sections]);

  // 渲染项目
  const renderFlatItem = ({item}: {item: (typeof flatData)[0]}) => {
    if (item.type === 'header') {
      return renderSectionHeader ? renderSectionHeader(item.section) : null;
    }

    return renderItem(item.item!, item.index!, item.section);
  };

  // 获取项目布局(如果提供了固定高度)
  const getItemLayout = useMemo(() => {
    if (itemHeight && sectionHeaderHeight) {
      return (_data: any, index: number) => {
        // 计算到当前索引为止有多少个header
        let headerCount = 0;
        let itemCount = 0;

        for (let i = 0; i <= index && i < flatData.length; i++) {
          if (flatData[i].type === 'header') {
            headerCount++;
          } else {
            itemCount++;
          }
        }

        const offset =
          headerCount * sectionHeaderHeight + itemCount * itemHeight;
        const length =
          flatData[index].type === 'header' ? sectionHeaderHeight : itemHeight;

        return {length, offset, index};
      };
    }
    return undefined;
  }, [itemHeight, sectionHeaderHeight, flatData]);

  // Key提取器
  const flatKeyExtractor = (item: (typeof flatData)[0], index: number) => {
    if (item.type === 'header') {
      return `header-${item.section.title}`;
    }

    if (keyExtractor && item.item) {
      return keyExtractor(item.item, item.index!);
    }

    return `item-${index}`;
  };

  return (
    <FlatList
      data={flatData}
      renderItem={renderFlatItem}
      keyExtractor={flatKeyExtractor}
      getItemLayout={getItemLayout}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  // 可以添加默认样式
});

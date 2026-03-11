import React, {forwardRef} from 'react';
import {View, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {VersusBar} from './VersusBar';
import {GridChart, GridChartRef} from './GridChart';
import {TagDistribution} from '../types';

/**
 * DataVisualization - 数据可视化主组件
 * 整合对抗条和网格图，展示实时统计数据
 * 验证需求: 4.5, 5.1-5.5
 */

interface DataVisualizationProps {
  overtimeCount: number;
  onTimeCount: number;
  tagDistribution: TagDistribution[];
  theme?: 'light' | 'dark';
  animationDuration?: number;
  /** 是否遮挡敏感数据（数字和标签名称比例） */
  blurData?: boolean;
}

export interface DataVisualizationRef {
  clearGridSelection: () => void;
}

export const DataVisualization = forwardRef<
  DataVisualizationRef,
  DataVisualizationProps
>(
  (
    {
      overtimeCount,
      onTimeCount,
      tagDistribution,
      theme = 'light',
      animationDuration = 1000,
      blurData = false,
    },
    ref,
  ) => {
    const gridChartRef = React.useRef<GridChartRef>(null);
    const secondaryTextColor = theme === 'dark' ? '#cccccc' : '#666666';

    // 暴露清除网格选中的方法
    React.useImperativeHandle(ref, () => ({
      clearGridSelection: () => {
        gridChartRef.current?.clearSelection();
      },
    }));

    return (
      <View style={styles.container}>
        {/* 对抗条部分 - 删除标题 */}
        <View style={styles.section}>
          <VersusBar
            overtimeCount={overtimeCount}
            onTimeCount={onTimeCount}
            animationDuration={animationDuration}
            blurNumbers={blurData}
          />
        </View>

        {/* 网格图部分 */}
        <View style={styles.section}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
            <Text
              style={[styles.sectionTitle, {color: secondaryTextColor, marginBottom: 0}]}
              size="sm">
              标签分布
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('标签分布说明', '展示选择人数最多的前20个标签')}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              activeOpacity={0.6}
              style={{marginLeft: 4}}>
              <View style={{width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: secondaryTextColor, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{fontSize: 8.5, color: secondaryTextColor, fontWeight: '600', lineHeight: 12}}>?</Text>
              </View>
            </TouchableOpacity>
          </View>
          <GridChart
            ref={gridChartRef}
            tagDistribution={tagDistribution}
            overtimeCount={overtimeCount}
            onTimeCount={onTimeCount}
            theme={theme}
            animationDuration={animationDuration}
            blurLegend={blurData}
          />
        </View>
      </View>
    );
  },
);

DataVisualization.displayName = 'DataVisualization';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
});

/**
 * OvertimeTrendPoster 组件验证脚本
 * 
 * 使用方法：
 * 1. 在 App.tsx 中导入此组件
 * 2. 替换默认导出为 VerifyOvertimeTrendPoster
 * 3. 运行 npx expo start
 */

import React, {useRef} from 'react';
import {View, StyleSheet, ScrollView, Button} from 'react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from './gluestack-ui.config';
import {OvertimeTrendPoster} from './src/components/poster/OvertimeTrendPoster';
import {OvertimeTrendData, UserInfo} from './src/types/poster';

// 模拟用户数据
const mockUser: UserInfo = {
  avatar: 'https://via.placeholder.com/100',
  username: '测试用户',
};

// 模拟趋势数据（天维度）
const mockDayData: OvertimeTrendData = {
  dimension: 'day',
  dataPoints: [
    {date: '2024-02-15', value: 2.5, label: '15日'},
    {date: '2024-02-16', value: 3.2, label: '16日'},
    {date: '2024-02-17', value: 1.8, label: '17日'},
    {date: '2024-02-18', value: 0, label: '18日'},
    {date: '2024-02-19', value: 4.5, label: '19日'},
    {date: '2024-02-20', value: 3.0, label: '20日'},
    {date: '2024-02-21', value: 2.2, label: '21日'},
  ],
};


// 模拟趋势数据（周维度）
const mockWeekData: OvertimeTrendData = {
  dimension: 'week',
  dataPoints: [
    {date: '2024-W06', value: 2.8, label: '第6周'},
    {date: '2024-W07', value: 3.5, label: '第7周'},
    {date: '2024-W08', value: 2.1, label: '第8周'},
  ],
};

// 模拟趋势数据（月维度）
const mockMonthData: OvertimeTrendData = {
  dimension: 'month',
  dataPoints: [
    {date: '2023-11', value: 3.2, label: '11月'},
    {date: '2023-12', value: 4.1, label: '12月'},
    {date: '2024-01', value: 2.8, label: '1月'},
    {date: '2024-02', value: 3.5, label: '2月'},
  ],
};

export const VerifyOvertimeTrendPoster: React.FC = () => {
  const posterRef = useRef<View>(null);
  const [data, setData] = React.useState(mockDayData);

  const handleDimensionChange = (dimension: 'day' | 'week' | 'month') => {
    console.log('维度切换:', dimension);
    if (dimension === 'day') {
      setData(mockDayData);
    } else if (dimension === 'week') {
      setData(mockWeekData);
    } else {
      setData(mockMonthData);
    }
  };

  return (
    <GluestackUIProvider config={config}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <OvertimeTrendPoster
            ref={posterRef}
            data={data}
            user={mockUser}
            onDimensionChange={handleDimensionChange}
          />
        </View>
      </ScrollView>
    </GluestackUIProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
});

export default VerifyOvertimeTrendPoster;

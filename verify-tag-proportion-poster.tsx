/**
 * TagProportionPoster 组件验证脚本
 * 
 * 用途：验证标签占比海报组件是否正常工作
 * 
 * 使用方法：
 * 1. 在 App.tsx 中导入此文件
 * 2. 替换 <AppNavigator /> 为 <TagProportionPosterTest />
 * 3. 运行应用查看效果
 */

import React, {useRef} from 'react';
import {View, StyleSheet, ScrollView, Button} from 'react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {TagProportionPoster} from './src/components/poster/TagProportionPoster';
import {TagProportionData, UserInfo} from './src/types/poster';

// 模拟用户数据
const mockUser: UserInfo = {
  avatar: 'https://via.placeholder.com/100',
  username: '测试用户',
};

// 模拟标签占比数据
const mockTagProportionData: TagProportionData = {
  year: 2024,
  month: 2,
  tags: [
    {
      tag_id: 'tag_1',
      tag_name: '项目加班',
      count: 45,
      percentage: 35,
      color: '#FF6B6B',
    },
    {
      tag_id: 'tag_2',
      tag_name: '会议',
      count: 30,
      percentage: 23,
      color: '#4ECDC4',
    },
    {
      tag_id: 'tag_3',
      tag_name: '临时任务',
      count: 25,
      percentage: 19,
      color: '#45B7D1',
    },
    {
      tag_id: 'tag_4',
      tag_name: '文档编写',
      count: 18,
      percentage: 14,
      color: '#FFA07A',
    },
    {
      tag_id: 'tag_5',
      tag_name: '其他',
      count: 12,
      percentage: 9,
      color: '#98D8C8',
    },
  ],
};

// 空数据测试
const emptyTagProportionData: TagProportionData = {
  year: 2024,
  month: 1,
  tags: [],
};

/**
 * TagProportionPoster 测试组件
 */
const TagProportionPosterTest: React.FC = () => {
  const posterRef = useRef<View>(null);
  const [selectedYear, setSelectedYear] = React.useState(2024);
  const [selectedMonth, setSelectedMonth] = React.useState(2);
  const [showEmpty, setShowEmpty] = React.useState(false);

  const handleYearMonthChange = (year: number, month: number) => {
    console.log('年月变更:', year, month);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const currentData = showEmpty ? emptyTagProportionData : {
    ...mockTagProportionData,
    year: selectedYear,
    month: selectedMonth,
  };

  return (
    <GluestackUIProvider config={config}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 测试说明 */}
          <View style={styles.header}>
            <Button
              title={showEmpty ? '显示数据' : '显示空状态'}
              onPress={() => setShowEmpty(!showEmpty)}
            />
          </View>

          {/* TagProportionPoster 组件 */}
          <View style={styles.posterContainer}>
            <TagProportionPoster
              ref={posterRef}
              data={currentData}
              user={mockUser}
              onYearMonthChange={handleYearMonthChange}
            />
          </View>

          {/* 测试信息 */}
          <View style={styles.info}>
            <Button
              title="打印 Ref"
              onPress={() => console.log('Poster Ref:', posterRef.current)}
            />
          </View>
        </ScrollView>
      </View>
    </GluestackUIProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  posterContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  info: {
    padding: 16,
    alignItems: 'center',
  },
});

export default TagProportionPosterTest;

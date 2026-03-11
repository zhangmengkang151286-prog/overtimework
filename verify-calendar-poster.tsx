/**
 * CalendarPoster 组件验证文件
 * 
 * 用于验证下班日历海报组件的功能
 */

import React, {useRef} from 'react';
import {View, StyleSheet, ScrollView, Button} from 'react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from './gluestack-ui.config';
import {CalendarPoster} from './src/components/poster/CalendarPoster';
import {CalendarData, UserInfo} from './src/types/poster';
import {useTheme} from './src/hooks/useTheme';

// 模拟用户数据
const mockUser: UserInfo = {
  avatar: 'https://via.placeholder.com/150',
  username: '测试用户',
};

// 模拟日历数据
const mockCalendarData: CalendarData = {
  year: 2024,
  month: 2,
  days: [
    // 2月1日 - 准时
    {date: '2024-02-01', status: 'ontime', timestamp: '2024-02-01T18:00:00Z'},
    // 2月2日 - 加班
    {date: '2024-02-02', status: 'overtime', timestamp: '2024-02-02T20:30:00Z'},
    // 2月3日 - 周六，未提交
    {date: '2024-02-03', status: 'none'},
    // 2月4日 - 周日，未提交
    {date: '2024-02-04', status: 'none'},
    // 2月5日 - 准时
    {date: '2024-02-05', status: 'ontime', timestamp: '2024-02-05T18:15:00Z'},
    // 2月6日 - 加班
    {date: '2024-02-06', status: 'overtime', timestamp: '2024-02-06T21:00:00Z'},
    // 2月7日 - 准时
    {date: '2024-02-07', status: 'ontime', timestamp: '2024-02-07T18:05:00Z'},
    // 2月8日 - 加班
    {date: '2024-02-08', status: 'overtime', timestamp: '2024-02-08T19:45:00Z'},
    // 2月9日 - 准时
    {date: '2024-02-09', status: 'ontime', timestamp: '2024-02-09T18:10:00Z'},
    // 2月10日 - 周六，未提交
    {date: '2024-02-10', status: 'none'},
    // 2月11日 - 周日，未提交
    {date: '2024-02-11', status: 'none'},
    // 2月12日 - 准时
    {date: '2024-02-12', status: 'ontime', timestamp: '2024-02-12T18:20:00Z'},
    // 2月13日 - 加班
    {date: '2024-02-13', status: 'overtime', timestamp: '2024-02-13T20:15:00Z'},
    // 2月14日 - 准时
    {date: '2024-02-14', status: 'ontime', timestamp: '2024-02-14T18:00:00Z'},
    // 2月15日 - 加班
    {date: '2024-02-15', status: 'overtime', timestamp: '2024-02-15T19:30:00Z'},
    // 2月16日 - 准时
    {date: '2024-02-16', status: 'ontime', timestamp: '2024-02-16T18:25:00Z'},
    // 2月17日 - 周六，未提交
    {date: '2024-02-17', status: 'none'},
    // 2月18日 - 周日，未提交
    {date: '2024-02-18', status: 'none'},
    // 2月19日 - 准时
    {date: '2024-02-19', status: 'ontime', timestamp: '2024-02-19T18:10:00Z'},
    // 2月20日 - 加班
    {date: '2024-02-20', status: 'overtime', timestamp: '2024-02-20T21:30:00Z'},
    // 2月21日 - 准时
    {date: '2024-02-21', status: 'ontime', timestamp: '2024-02-21T18:15:00Z'},
    // 2月22日 - 加班（今天）
    {date: '2024-02-22', status: 'overtime', timestamp: '2024-02-22T20:00:00Z'},
  ],
};

const TestComponent: React.FC = () => {
  const theme = useTheme();
  const posterRef = useRef<View>(null);

  const handleYearMonthChange = (year: number, month: number) => {
    console.log('年月变更:', year, month);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Button title="测试截图功能" onPress={() => {
            console.log('截图功能测试');
          }} />
        </View>

        <View style={styles.posterContainer}>
          <CalendarPoster
            ref={posterRef}
            data={mockCalendarData}
            user={mockUser}
            onYearMonthChange={handleYearMonthChange}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default function App() {
  return (
    <GluestackUIProvider config={config}>
      <TestComponent />
    </GluestackUIProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  posterContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

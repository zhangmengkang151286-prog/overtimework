/**
 * TrendPoster 组件验证脚本
 * 
 * 使用方法：
 * 1. 将此文件内容复制到 App.tsx
 * 2. 运行 npx expo start
 * 3. 在设备上查看效果
 */

import React from 'react';
import {View, ScrollView, Dimensions} from 'react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from './gluestack-ui.config';
import {TrendPoster} from './src/components/poster/TrendPoster';
import {TrendData, UserInfo} from './src/types/poster';

// 模拟数据
const mockUser: UserInfo = {
  avatar: 'https://via.placeholder.com/48',
  username: '张三',
};

const mockTrendData: TrendData = {
  participants: 156,
  onTimeCount: 89,
  overtimeCount: 67,
  timeline: [
    {hour: 6, onTimeCount: 0, overtimeCount: 0, timestamp: '2024-02-22T06:00:00'},
    {hour: 9, onTimeCount: 12, overtimeCount: 8, timestamp: '2024-02-22T09:00:00'},
    {hour: 12, onTimeCount: 25, overtimeCount: 15, timestamp: '2024-02-22T12:00:00'},
    {hour: 15, onTimeCount: 35, overtimeCount: 22, timestamp: '2024-02-22T15:00:00'},
    {hour: 18, onTimeCount: 45, overtimeCount: 35, timestamp: '2024-02-22T18:00:00'},
    {hour: 21, onTimeCount: 60, overtimeCount: 50, timestamp: '2024-02-22T21:00:00'},
    {hour: 0, onTimeCount: 89, overtimeCount: 67, timestamp: '2024-02-23T00:00:00'},
  ],
  tagDistribution: [
    {tag_id: '1', tag_name: '项目加班', count: 45, color: 'hsl(0, 50%, 58%)'},
    {tag_id: '2', tag_name: '会议', count: 32, color: 'hsl(3, 49%, 56%)'},
    {tag_id: '3', tag_name: '临时任务', count: 28, color: 'hsl(5, 47%, 53%)'},
    {tag_id: '4', tag_name: '正常下班', count: 56, color: 'hsl(140, 45%, 55%)'},
    {tag_id: '5', tag_name: '早退', count: 15, color: 'hsl(141, 44%, 53%)'},
  ],
};

const mockDate = '2024年2月22日';

export default function App() {
  const {width, height} = Dimensions.get('window');
  
  // 计算缩放比例以适应屏幕
  const posterWidth = 750;
  const posterHeight = 1334;
  const scale = Math.min(width / posterWidth, height / posterHeight) * 0.9;
  
  return (
    <GluestackUIProvider config={config}>
      <ScrollView
        style={{flex: 1, backgroundColor: '#F5F5F5'}}
        contentContainerStyle={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 20,
        }}>
        <View
          style={{
            transform: [{scale}],
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
          <TrendPoster
            data={mockTrendData}
            user={mockUser}
            date={mockDate}
          />
        </View>
      </ScrollView>
    </GluestackUIProvider>
  );
}

import React from 'react';
import {SafeAreaView, ScrollView} from 'react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import TimeAxis from './src/components/TimeAxis';

/**
 * TimeAxis 组件验证
 * 
 * 使用方法：
 * 1. 在 App.tsx 中导入这个文件
 * 2. 替换主组件为 VerifyTimeAxis
 * 3. 运行应用查看效果
 */
export default function VerifyTimeAxis() {
  const [selectedTime, setSelectedTime] = React.useState(new Date());

  // 创建工作日时间范围（06:00 - 次日 05:59）
  const minTime = new Date();
  minTime.setHours(6, 0, 0, 0);

  const maxTime = new Date(minTime);
  maxTime.setDate(maxTime.getDate() + 1);
  maxTime.setHours(5, 59, 0, 0);

  const handleTimeChange = (time: Date) => {
    console.log('时间变化:', time);
    setSelectedTime(time);
  };

  const handleBackToNow = () => {
    console.log('回到现在');
    setSelectedTime(new Date());
  };

  return (
    <GluestackUIProvider config={config}>
      <SafeAreaView style={{flex: 1, backgroundColor: '#000'}}>
        <ScrollView style={{flex: 1, padding: 16}}>
          <TimeAxis
            currentTime={selectedTime}
            onTimeChange={handleTimeChange}
            onBackToNow={handleBackToNow}
            minTime={minTime}
            maxTime={maxTime}
            interval={15}
            theme="dark"
          />
        </ScrollView>
      </SafeAreaView>
    </GluestackUIProvider>
  );
}

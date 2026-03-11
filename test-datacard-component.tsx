/**
 * DataCard 组件手动验证脚本
 * 
 * 用于验证 DataCard 组件的基本功能
 * 运行方式：在 App.tsx 中导入并渲染此组件
 */

import React, { useState } from 'react';
import { ScrollView, SafeAreaView } from 'react-native';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { VStack, HStack, Heading, Text } from '@gluestack-ui/themed';
import { DataCard } from './src/components/gluestack/DataCard';

export const DataCardTest: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);

  return (
    <GluestackUIProvider config={config}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView>
          <VStack space="xl" p="$4">
            <Heading size="xl">DataCard 组件测试</Heading>

            {/* 测试 1: 基础渲染 */}
            <VStack space="md">
              <Heading size="md">1. 基础渲染</Heading>
              <DataCard title="参与人数" value="1,234" />
            </VStack>

            {/* 测试 2: 带副标题 */}
            <VStack space="md">
              <Heading size="md">2. 带副标题</Heading>
              <DataCard
                title="参与人数"
                value="1,234"
                subtitle="较昨日 +12%"
              />
            </VStack>

            {/* 测试 3: 带图标 */}
            <VStack space="md">
              <Heading size="md">3. 带图标</Heading>
              <DataCard
                title="参与人数"
                value="1,234"
                subtitle="较昨日 +12%"
                icon={<Text>👥</Text>}
              />
            </VStack>

            {/* 测试 4: 无边框 */}
            <VStack space="md">
              <Heading size="md">4. 无边框</Heading>
              <DataCard
                title="参与人数"
                value="1,234"
                bordered={false}
              />
            </VStack>

            {/* 测试 5: 带阴影 */}
            <VStack space="md">
              <Heading size="md">5. 带阴影</Heading>
              <DataCard
                title="参与人数"
                value="1,234"
                subtitle="较昨日 +12%"
                elevate
              />
            </VStack>

            {/* 测试 6: 可点击 */}
            <VStack space="md">
              <Heading size="md">6. 可点击（点击计数: {clickCount}）</Heading>
              <DataCard
                title="点击计数"
                value={clickCount}
                subtitle="点击卡片增加计数"
                onPress={() => setClickCount(clickCount + 1)}
                elevate
              />
            </VStack>

            {/* 测试 7: 数字类型 value */}
            <VStack space="md">
              <Heading size="md">7. 数字类型 value</Heading>
              <DataCard title="加班人数" value={567} />
            </VStack>

            {/* 测试 8: 完整配置 */}
            <VStack space="md">
              <Heading size="md">8. 完整配置</Heading>
              <DataCard
                title="下班指数"
                value="85.6"
                subtitle="今日平均下班时间 18:30"
                icon={<Text>📊</Text>}
                bordered
                elevate
                onPress={() => console.log('查看详情')}
              />
            </VStack>

            {/* 测试 9: 数据仪表板布局 */}
            <VStack space="md">
              <Heading size="md">9. 数据仪表板布局</Heading>
              <VStack space="sm">
                <HStack space="sm">
                  <DataCard
                    title="总参与人数"
                    value="2,456"
                    subtitle="今日新增 +123"
                    icon={<Text>👥</Text>}
                    elevate
                  />
                  <DataCard
                    title="加班人数"
                    value="1,234"
                    subtitle="占比 50.2%"
                    icon={<Text>⏰</Text>}
                    elevate
                  />
                </HStack>
                <HStack space="sm">
                  <DataCard
                    title="准时下班"
                    value="1,222"
                    subtitle="占比 49.8%"
                    icon={<Text>✅</Text>}
                    elevate
                  />
                  <DataCard
                    title="平均下班时间"
                    value="18:45"
                    subtitle="较昨日晚 15 分钟"
                    icon={<Text>🕐</Text>}
                    elevate
                  />
                </HStack>
              </VStack>
            </VStack>

            {/* 测试 10: 边界情况 */}
            <VStack space="md">
              <Heading size="md">10. 边界情况</Heading>
              <DataCard title="空字符串" value="" />
              <DataCard title="零值" value={0} />
              <DataCard
                title="长标题测试：这是一个非常非常长的标题文本用于测试组件的文本处理能力"
                value="999999999"
                subtitle="长副标题测试：这是一个非常非常长的副标题文本用于测试组件的文本处理能力"
              />
            </VStack>

            <Text size="lg" color="$success500" textAlign="center" mt="$4">
              ✅ 所有测试用例已渲染
            </Text>
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </GluestackUIProvider>
  );
};

export default DataCardTest;

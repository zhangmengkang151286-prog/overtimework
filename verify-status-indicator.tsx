/**
 * StatusIndicator 组件验证文件
 * 
 * 用于验证 gluestack-ui StatusIndicator 组件是否正常工作
 * 
 * 使用方法：
 * 1. 在 App.tsx 中导入此组件
 * 2. 替换 App 组件的返回内容为 <VerifyStatusIndicator />
 * 3. 运行应用查看效果
 */

import React from 'react';
import { ScrollView, SafeAreaView } from 'react-native';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { VStack, HStack, Heading, Text, Box } from '@gluestack-ui/themed';
import { StatusIndicator } from './src/components/gluestack/StatusIndicator';
import { DataCard } from './src/components/gluestack/DataCard';

const VerifyStatusIndicator: React.FC = () => {
  return (
    <GluestackUIProvider config={config}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView>
          <VStack space="xl" p="$4">
            <Heading size="2xl">StatusIndicator 组件验证</Heading>
            <Text color="$textLight600">
              验证基于 gluestack-ui Badge 的 StatusIndicator 组件
            </Text>

            {/* 基础状态指示器（不带标签） */}
            <VStack space="md">
              <Heading size="lg">1. 基础状态指示器（圆点）</Heading>
              <Box p="$4" bg="$backgroundLight50" borderRadius="$md">
                <VStack space="sm">
                  <HStack space="md" alignItems="center">
                    <StatusIndicator status="overtime" />
                    <Text>加班（红色圆点）</Text>
                  </HStack>
                  <HStack space="md" alignItems="center">
                    <StatusIndicator status="ontime" />
                    <Text>准时下班（绿色圆点）</Text>
                  </HStack>
                  <HStack space="md" alignItems="center">
                    <StatusIndicator status="pending" />
                    <Text>待定（黄色圆点）</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>

            {/* 带标签的状态指示器 */}
            <VStack space="md">
              <Heading size="lg">2. 带标签的状态指示器</Heading>
              <Box p="$4" bg="$backgroundLight50" borderRadius="$md">
                <VStack space="sm">
                  <StatusIndicator status="overtime" showLabel />
                  <StatusIndicator status="ontime" showLabel />
                  <StatusIndicator status="pending" showLabel />
                </VStack>
              </Box>
            </VStack>

            {/* 自定义标签 */}
            <VStack space="md">
              <Heading size="lg">3. 自定义标签</Heading>
              <Box p="$4" bg="$backgroundLight50" borderRadius="$md">
                <VStack space="sm">
                  <StatusIndicator 
                    status="overtime" 
                    showLabel 
                    label="正在加班中" 
                  />
                  <StatusIndicator 
                    status="ontime" 
                    showLabel 
                    label="已准时下班" 
                  />
                  <StatusIndicator 
                    status="pending" 
                    showLabel 
                    label="状态未知" 
                  />
                </VStack>
              </Box>
            </VStack>

            {/* 不同尺寸（不带标签） */}
            <VStack space="md">
              <Heading size="lg">4. 不同尺寸（圆点）</Heading>
              <Box p="$4" bg="$backgroundLight50" borderRadius="$md">
                <HStack space="lg" alignItems="center" justifyContent="center">
                  <VStack space="xs" alignItems="center">
                    <StatusIndicator status="ontime" size="sm" />
                    <Text size="xs">小</Text>
                  </VStack>
                  <VStack space="xs" alignItems="center">
                    <StatusIndicator status="ontime" size="md" />
                    <Text size="xs">中</Text>
                  </VStack>
                  <VStack space="xs" alignItems="center">
                    <StatusIndicator status="ontime" size="lg" />
                    <Text size="xs">大</Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>

            {/* 不同尺寸（带标签） */}
            <VStack space="md">
              <Heading size="lg">5. 不同尺寸（带标签）</Heading>
              <Box p="$4" bg="$backgroundLight50" borderRadius="$md">
                <VStack space="sm">
                  <StatusIndicator status="ontime" size="sm" showLabel />
                  <StatusIndicator status="ontime" size="md" showLabel />
                  <StatusIndicator status="ontime" size="lg" showLabel />
                </VStack>
              </Box>
            </VStack>

            {/* 所有状态和尺寸组合 */}
            <VStack space="md">
              <Heading size="lg">6. 所有状态和尺寸组合</Heading>
              <Box p="$4" bg="$backgroundLight50" borderRadius="$md">
                <VStack space="sm">
                  <Text fontWeight="$bold" size="sm">加班状态：</Text>
                  <HStack space="sm" flexWrap="wrap">
                    <StatusIndicator status="overtime" size="sm" showLabel />
                    <StatusIndicator status="overtime" size="md" showLabel />
                    <StatusIndicator status="overtime" size="lg" showLabel />
                  </HStack>
                  
                  <Text fontWeight="$bold" size="sm" mt="$2">准时下班：</Text>
                  <HStack space="sm" flexWrap="wrap">
                    <StatusIndicator status="ontime" size="sm" showLabel />
                    <StatusIndicator status="ontime" size="md" showLabel />
                    <StatusIndicator status="ontime" size="lg" showLabel />
                  </HStack>
                  
                  <Text fontWeight="$bold" size="sm" mt="$2">待定状态：</Text>
                  <HStack space="sm" flexWrap="wrap">
                    <StatusIndicator status="pending" size="sm" showLabel />
                    <StatusIndicator status="pending" size="md" showLabel />
                    <StatusIndicator status="pending" size="lg" showLabel />
                  </HStack>
                </VStack>
              </Box>
            </VStack>

            {/* 实际使用示例 - 用户列表 */}
            <VStack space="md">
              <Heading size="lg">7. 实际使用 - 用户列表</Heading>
              <VStack space="sm">
                <HStack 
                  space="md" 
                  alignItems="center" 
                  p="$3" 
                  bg="$backgroundLight50" 
                  borderRadius="$md"
                >
                  <StatusIndicator status="overtime" size="md" />
                  <VStack flex={1}>
                    <Text fontWeight="$bold">张三</Text>
                    <Text size="sm" color="$textLight600">正在加班</Text>
                  </VStack>
                </HStack>
                
                <HStack 
                  space="md" 
                  alignItems="center" 
                  p="$3" 
                  bg="$backgroundLight50" 
                  borderRadius="$md"
                >
                  <StatusIndicator status="ontime" size="md" />
                  <VStack flex={1}>
                    <Text fontWeight="$bold">李四</Text>
                    <Text size="sm" color="$textLight600">准时下班</Text>
                  </VStack>
                </HStack>
                
                <HStack 
                  space="md" 
                  alignItems="center" 
                  p="$3" 
                  bg="$backgroundLight50" 
                  borderRadius="$md"
                >
                  <StatusIndicator status="pending" size="md" />
                  <VStack flex={1}>
                    <Text fontWeight="$bold">王五</Text>
                    <Text size="sm" color="$textLight600">状态待定</Text>
                  </VStack>
                </HStack>
              </VStack>
            </VStack>

            {/* 实际使用示例 - 图例 */}
            <VStack space="md">
              <Heading size="lg">8. 实际使用 - 图例</Heading>
              <HStack 
                space="lg" 
                justifyContent="center" 
                p="$4" 
                bg="$backgroundLight50" 
                borderRadius="$md"
              >
                <HStack space="xs" alignItems="center">
                  <StatusIndicator status="overtime" size="sm" />
                  <Text size="sm">加班</Text>
                </HStack>
                <HStack space="xs" alignItems="center">
                  <StatusIndicator status="ontime" size="sm" />
                  <Text size="sm">准时</Text>
                </HStack>
                <HStack space="xs" alignItems="center">
                  <StatusIndicator status="pending" size="sm" />
                  <Text size="sm">待定</Text>
                </HStack>
              </HStack>
            </VStack>

            {/* 实际使用示例 - 时间轴 */}
            <VStack space="md">
              <Heading size="lg">9. 实际使用 - 时间轴</Heading>
              <Box p="$4" bg="$backgroundLight50" borderRadius="$md">
                <VStack space="sm">
                  <HStack space="md" alignItems="center">
                    <Text size="sm" color="$textLight600" w="$16">09:00</Text>
                    <StatusIndicator status="ontime" size="sm" />
                    <Text size="sm">准时上班</Text>
                  </HStack>
                  <HStack space="md" alignItems="center">
                    <Text size="sm" color="$textLight600" w="$16">18:00</Text>
                    <StatusIndicator status="pending" size="sm" />
                    <Text size="sm">下班时间</Text>
                  </HStack>
                  <HStack space="md" alignItems="center">
                    <Text size="sm" color="$textLight600" w="$16">19:30</Text>
                    <StatusIndicator status="overtime" size="sm" />
                    <Text size="sm">实际下班</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>

            {/* 验证完成提示 */}
            <VStack space="md" mb="$8">
              <Heading size="lg">✅ 验证完成</Heading>
              <Box p="$4" bg="$success100" borderRadius="$md">
                <Text color="$success700">
                  如果以上所有示例都正常显示，说明 StatusIndicator 组件迁移成功！
                </Text>
                <Text color="$success700" mt="$2">
                  • 圆点应该显示正确的颜色（红/绿/黄）
                </Text>
                <Text color="$success700">
                  • 标签应该正确显示
                </Text>
                <Text color="$success700">
                  • 尺寸应该有明显区别
                </Text>
                <Text color="$success700">
                  • 所有组合都应该正常工作
                </Text>
              </Box>
            </VStack>
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </GluestackUIProvider>
  );
};

export default VerifyStatusIndicator;

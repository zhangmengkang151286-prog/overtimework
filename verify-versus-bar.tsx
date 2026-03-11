/**
 * VersusBar 组件验证文件
 * 
 * 使用方法：
 * 1. 将此文件内容复制到 App.tsx
 * 2. 运行 npx expo start
 * 3. 验证以下功能：
 *    - 进度条显示正确的比例
 *    - 使用 gluestack-ui 的颜色 tokens ($error500, $success500)
 *    - 使用 gluestack-ui 的圆角 token ($md)
 *    - 动画效果流畅
 *    - 标签显示正确
 *    - 深色模式支持
 */

import React, {useState, useEffect} from 'react';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  ButtonText,
  HStack,
} from '@gluestack-ui/themed';
import {VersusBar} from './src/components/VersusBar';

export default function App() {
  const [overtimeCount, setOvertimeCount] = useState(60);
  const [onTimeCount, setOnTimeCount] = useState(40);

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setOvertimeCount(prev => Math.max(0, prev + Math.floor(Math.random() * 10 - 5)));
      setOnTimeCount(prev => Math.max(0, prev + Math.floor(Math.random() * 10 - 5)));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GluestackUIProvider config={config}>
      <Box flex={1} bg="$backgroundLight0" p="$4" pt="$16">
        <VStack space="xl">
          <Heading size="xl">VersusBar 组件验证</Heading>

          {/* 测试 1: 基本显示 */}
          <VStack space="md">
            <Text size="lg" fontWeight="$bold">
              测试 1: 基本显示（实时更新）
            </Text>
            <VersusBar overtimeCount={overtimeCount} onTimeCount={onTimeCount} />
          </VStack>

          {/* 测试 2: 不显示标签 */}
          <VStack space="md">
            <Text size="lg" fontWeight="$bold">
              测试 2: 不显示标签
            </Text>
            <VersusBar
              overtimeCount={overtimeCount}
              onTimeCount={onTimeCount}
              showLabels={false}
            />
          </VStack>

          {/* 测试 3: 极端情况 - 全部加班 */}
          <VStack space="md">
            <Text size="lg" fontWeight="$bold">
              测试 3: 全部加班
            </Text>
            <VersusBar overtimeCount={100} onTimeCount={0} />
          </VStack>

          {/* 测试 4: 极端情况 - 全部准时 */}
          <VStack space="md">
            <Text size="lg" fontWeight="$bold">
              测试 4: 全部准时
            </Text>
            <VersusBar overtimeCount={0} onTimeCount={100} />
          </VStack>

          {/* 测试 5: 自定义高度 */}
          <VStack space="md">
            <Text size="lg" fontWeight="$bold">
              测试 5: 自定义高度 (24px)
            </Text>
            <VersusBar
              overtimeCount={overtimeCount}
              onTimeCount={onTimeCount}
              height={24}
            />
          </VStack>

          {/* 测试 6: 快速动画 */}
          <VStack space="md">
            <Text size="lg" fontWeight="$bold">
              测试 6: 快速动画 (100ms)
            </Text>
            <VersusBar
              overtimeCount={overtimeCount}
              onTimeCount={onTimeCount}
              animationDuration={100}
            />
          </VStack>

          {/* 控制按钮 */}
          <HStack space="md" justifyContent="center">
            <Button
              size="sm"
              action="negative"
              onPress={() => setOvertimeCount(prev => prev + 10)}>
              <ButtonText>+10 加班</ButtonText>
            </Button>
            <Button
              size="sm"
              action="positive"
              onPress={() => setOnTimeCount(prev => prev + 10)}>
              <ButtonText>+10 准时</ButtonText>
            </Button>
            <Button
              size="sm"
              action="secondary"
              onPress={() => {
                setOvertimeCount(50);
                setOnTimeCount(50);
              }}>
              <ButtonText>重置</ButtonText>
            </Button>
          </HStack>

          {/* 验证清单 */}
          <VStack space="sm" mt="$4">
            <Text size="md" fontWeight="$bold">
              验证清单：
            </Text>
            <Text size="sm">✓ 进度条使用 gluestack-ui 的 HStack 和 Box</Text>
            <Text size="sm">✓ 颜色使用 $error500 和 $success500 tokens</Text>
            <Text size="sm">✓ 圆角使用 $md token</Text>
            <Text size="sm">✓ 间距使用 $sm token</Text>
            <Text size="sm">✓ 动画效果流畅</Text>
            <Text size="sm">✓ 标签显示正确</Text>
            <Text size="sm">✓ 支持深色模式（使用 sx 属性）</Text>
            <Text size="sm">✓ 参照 gluestack-ui Progress 组件风格</Text>
          </VStack>
        </VStack>
      </Box>
    </GluestackUIProvider>
  );
}

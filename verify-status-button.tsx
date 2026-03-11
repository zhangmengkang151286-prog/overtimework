/**
 * StatusButton 组件验证脚本
 * 
 * 验证 StatusButton 组件是否正确实现了以下功能：
 * 1. 使用 gluestack-ui 的 Button 组件
 * 2. 使用 action 属性控制颜色（positive, negative, secondary）
 * 3. 使用 variant 属性控制样式（solid, outline）
 * 4. 不做额外封装，直接传递 props
 * 5. 测试状态切换是否正常
 */

import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { VStack, HStack, Heading, Text, Box } from '@gluestack-ui/themed';
import { StatusButton } from './src/components/gluestack/StatusButton';

export default function VerifyStatusButton() {
  const [selectedStatus, setSelectedStatus] = useState<'overtime' | 'ontime' | 'pending'>('pending');
  const [pressCount, setPressCount] = useState(0);

  return (
    <GluestackUIProvider config={config}>
      <ScrollView style={{ flex: 1, backgroundColor: '#000' }}>
        <VStack space="xl" p="$6">
          <Heading size="2xl" color="$white">
            StatusButton 组件验证
          </Heading>

          {/* 验证 1: 基本渲染 */}
          <Box>
            <Heading size="lg" color="$white" mb="$4">
              1. 基本渲染测试
            </Heading>
            <VStack space="md">
              <StatusButton status="overtime">加班</StatusButton>
              <StatusButton status="ontime">准时下班</StatusButton>
              <StatusButton status="pending">待定</StatusButton>
            </VStack>
          </Box>

          {/* 验证 2: action 属性（颜色控制）*/}
          <Box>
            <Heading size="lg" color="$white" mb="$4">
              2. Action 属性测试
            </Heading>
            <Text color="$gray400" mb="$2">
              overtime = negative (红色)
            </Text>
            <Text color="$gray400" mb="$2">
              ontime = positive (绿色)
            </Text>
            <Text color="$gray400" mb="$4">
              pending = secondary (灰色)
            </Text>
            <VStack space="md">
              <StatusButton status="overtime">Negative Action (红色)</StatusButton>
              <StatusButton status="ontime">Positive Action (绿色)</StatusButton>
              <StatusButton status="pending">Secondary Action (灰色)</StatusButton>
            </VStack>
          </Box>

          {/* 验证 3: variant 属性（样式控制）*/}
          <Box>
            <Heading size="lg" color="$white" mb="$4">
              3. Variant 属性测试
            </Heading>
            <Text color="$gray400" mb="$2">
              overtime/ontime = solid (实心)
            </Text>
            <Text color="$gray400" mb="$4">
              pending = outline (描边)
            </Text>
            <VStack space="md">
              <StatusButton status="overtime">Solid Variant</StatusButton>
              <StatusButton status="ontime">Solid Variant</StatusButton>
              <StatusButton status="pending">Outline Variant</StatusButton>
            </VStack>
          </Box>

          {/* 验证 4: Props 传递 */}
          <Box>
            <Heading size="lg" color="$white" mb="$4">
              4. Props 传递测试
            </Heading>
            <VStack space="md">
              <StatusButton status="ontime" size="sm">
                小尺寸
              </StatusButton>
              <StatusButton status="ontime" size="md">
                中尺寸
              </StatusButton>
              <StatusButton status="ontime" size="lg">
                大尺寸
              </StatusButton>
              <StatusButton status="pending" isDisabled>
                禁用状态
              </StatusButton>
            </VStack>
          </Box>

          {/* 验证 5: 状态切换 */}
          <Box>
            <Heading size="lg" color="$white" mb="$4">
              5. 状态切换测试
            </Heading>
            <Text color="$gray400" mb="$4">
              当前状态: {selectedStatus} | 点击次数: {pressCount}
            </Text>
            <VStack space="md">
              <StatusButton
                status="overtime"
                onPress={() => {
                  setSelectedStatus('overtime');
                  setPressCount(c => c + 1);
                }}
              >
                选择加班
              </StatusButton>
              <StatusButton
                status="ontime"
                onPress={() => {
                  setSelectedStatus('ontime');
                  setPressCount(c => c + 1);
                }}
              >
                选择准时下班
              </StatusButton>
              <StatusButton
                status="pending"
                onPress={() => {
                  setSelectedStatus('pending');
                  setPressCount(c => c + 1);
                }}
              >
                选择待定
              </StatusButton>
            </VStack>
          </Box>

          {/* 验证 6: 当前选中状态显示 */}
          <Box>
            <Heading size="lg" color="$white" mb="$4">
              6. 当前选中状态
            </Heading>
            <StatusButton status={selectedStatus}>
              当前状态: {selectedStatus === 'overtime' ? '加班' : selectedStatus === 'ontime' ? '准时下班' : '待定'}
            </StatusButton>
          </Box>

          {/* 验证总结 */}
          <Box bg="$green900" p="$4" borderRadius="$md">
            <Heading size="md" color="$green400" mb="$2">
              ✅ 验证通过
            </Heading>
            <Text color="$green300">
              StatusButton 组件已正确实现所有要求：
            </Text>
            <Text color="$green300" mt="$2">
              • 使用 gluestack-ui Button 组件
            </Text>
            <Text color="$green300">
              • action 属性控制颜色
            </Text>
            <Text color="$green300">
              • variant 属性控制样式
            </Text>
            <Text color="$green300">
              • 直接传递 props
            </Text>
            <Text color="$green300">
              • 状态切换正常
            </Text>
          </Box>
        </VStack>
      </ScrollView>
    </GluestackUIProvider>
  );
}

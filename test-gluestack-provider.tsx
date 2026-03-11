/**
 * gluestack-ui Provider 测试文件
 * 用于验证 GluestackUIProvider 是否正常工作
 */
import React from 'react';
import {View, Text as RNText} from 'react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {Box, Text, Heading, Button, ButtonText} from '@gluestack-ui/themed';

/**
 * 测试组件 - 使用 gluestack-ui 基础组件
 */
const TestGluestackComponents = () => {
  return (
    <Box flex={1} bg="$backgroundLight0" p="$4">
      <Box mb="$4">
        <Heading size="xl" mb="$2">
          gluestack-ui 测试
        </Heading>
        <Text size="md" color="$textLight600">
          如果你能看到这个页面，说明 GluestackUIProvider 配置成功！
        </Text>
      </Box>

      <Box mb="$4">
        <Heading size="md" mb="$2">
          基础组件测试
        </Heading>
        <Box
          bg="$primary500"
          p="$3"
          borderRadius="$md"
          mb="$2">
          <Text color="$white">这是一个带背景色的 Box</Text>
        </Box>
        <Button action="primary" variant="solid">
          <ButtonText>这是一个按钮</ButtonText>
        </Button>
      </Box>

      <Box>
        <Heading size="md" mb="$2">
          颜色 Tokens 测试
        </Heading>
        <Box flexDirection="row" gap="$2" flexWrap="wrap">
          <Box bg="$primary500" p="$2" borderRadius="$sm">
            <Text color="$white" size="xs">Primary</Text>
          </Box>
          <Box bg="$secondary500" p="$2" borderRadius="$sm">
            <Text color="$white" size="xs">Secondary</Text>
          </Box>
          <Box bg="$success500" p="$2" borderRadius="$sm">
            <Text color="$white" size="xs">Success</Text>
          </Box>
          <Box bg="$error500" p="$2" borderRadius="$sm">
            <Text color="$white" size="xs">Error</Text>
          </Box>
          <Box bg="$warning500" p="$2" borderRadius="$sm">
            <Text color="$white" size="xs">Warning</Text>
          </Box>
          <Box bg="$info500" p="$2" borderRadius="$sm">
            <Text color="$white" size="xs">Info</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * 测试应用
 */
export default function TestGluestackProvider() {
  try {
    return (
      <GluestackUIProvider config={config}>
        <TestGluestackComponents />
      </GluestackUIProvider>
    );
  } catch (error) {
    console.error('GluestackUIProvider 初始化失败:', error);
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
        <RNText style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
          GluestackUIProvider 初始化失败
        </RNText>
        <RNText style={{fontSize: 14, color: '#666', textAlign: 'center'}}>
          {error instanceof Error ? error.message : '未知错误'}
        </RNText>
      </View>
    );
  }
}

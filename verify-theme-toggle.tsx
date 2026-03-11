/**
 * 主题切换功能验证脚本
 * 
 * 使用方法：
 * 1. 将此文件内容复制到 App.tsx 临时替换
 * 2. 运行 npx expo start
 * 3. 测试主题切换功能
 * 4. 验证完成后恢复原 App.tsx
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Provider } from 'react-redux';
import { GluestackUIProvider, Box, VStack, HStack, Button, ButtonText, Switch, Heading } from '@gluestack-ui/themed';
import { config as gluestackConfig } from '@gluestack-ui/config';
import { store } from './src/store';
import { useThemeToggle } from './src/hooks/useThemeToggle';

// 主题切换测试组件
const ThemeToggleTest = () => {
  const { theme, isDark, toggleTheme, setTheme, gluestackColorMode, isLoading } = useThemeToggle();

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text>加载中...</Text>
      </Box>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <VStack space="lg" p="$6">
          {/* 标题 */}
          <Heading size="2xl" textAlign="center" mb="$4">
            主题切换功能测试
          </Heading>

          {/* 当前主题信息 */}
          <Box
            bg="$backgroundLight100"
            p="$4"
            borderRadius="$lg"
            borderWidth={1}
            borderColor="$borderLight300">
            <VStack space="md">
              <Heading size="md">当前主题信息</Heading>
              <HStack justifyContent="space-between">
                <Text>主题模式:</Text>
                <Text fontWeight="$bold">{theme}</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text>是否深色:</Text>
                <Text fontWeight="$bold">{isDark ? '是' : '否'}</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text>gluestack colorMode:</Text>
                <Text fontWeight="$bold">{gluestackColorMode}</Text>
              </HStack>
            </VStack>
          </Box>

          {/* 主题切换开关 */}
          <Box
            bg="$backgroundLight100"
            p="$4"
            borderRadius="$lg"
            borderWidth={1}
            borderColor="$borderLight300">
            <HStack justifyContent="space-between" alignItems="center">
              <HStack alignItems="center" space="md" flex={1}>
                <Text fontSize="$2xl">{isDark ? '🌙' : '☀️'}</Text>
                <VStack>
                  <Heading size="md">深色模式</Heading>
                  <Text size="sm" color="$textLight600">
                    {isDark ? '当前为深色主题' : '当前为浅色主题'}
                  </Text>
                </VStack>
              </HStack>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                size="md"
              />
            </HStack>
          </Box>

          {/* 快速切换按钮 */}
          <Box
            bg="$backgroundLight100"
            p="$4"
            borderRadius="$lg"
            borderWidth={1}
            borderColor="$borderLight300">
            <VStack space="md">
              <Heading size="md">快速切换</Heading>
              <HStack space="md">
                <Button
                  flex={1}
                  action="primary"
                  onPress={() => setTheme('dark')}
                  isDisabled={theme === 'dark'}>
                  <ButtonText>深色模式</ButtonText>
                </Button>
                <Button
                  flex={1}
                  action="secondary"
                  onPress={() => setTheme('light')}
                  isDisabled={theme === 'light'}>
                  <ButtonText>浅色模式</ButtonText>
                </Button>
              </HStack>
              <Button
                action="positive"
                onPress={toggleTheme}>
                <ButtonText>切换主题</ButtonText>
              </Button>
            </VStack>
          </Box>

          {/* gluestack-ui 组件测试 */}
          <Box
            bg="$backgroundLight100"
            p="$4"
            borderRadius="$lg"
            borderWidth={1}
            borderColor="$borderLight300">
            <VStack space="md">
              <Heading size="md">gluestack-ui 组件测试</Heading>
              <Text>这些组件应该根据主题自动调整颜色：</Text>
              
              <HStack space="md">
                <Button action="primary" size="sm">
                  <ButtonText>Primary</ButtonText>
                </Button>
                <Button action="secondary" size="sm">
                  <ButtonText>Secondary</ButtonText>
                </Button>
                <Button action="positive" size="sm">
                  <ButtonText>Positive</ButtonText>
                </Button>
                <Button action="negative" size="sm">
                  <ButtonText>Negative</ButtonText>
                </Button>
              </HStack>

              <Box
                bg="$primary500"
                p="$3"
                borderRadius="$md">
                <Text color="$white">Primary 背景色</Text>
              </Box>

              <Box
                bg="$secondary500"
                p="$3"
                borderRadius="$md">
                <Text color="$white">Secondary 背景色</Text>
              </Box>
            </VStack>
          </Box>

          {/* 测试说明 */}
          <Box
            bg="$info100"
            p="$4"
            borderRadius="$lg"
            borderWidth={1}
            borderColor="$info300">
            <VStack space="sm">
              <Heading size="sm">测试步骤</Heading>
              <Text>1. 使用开关切换主题</Text>
              <Text>2. 观察所有组件颜色是否正确更新</Text>
              <Text>3. 使用快速切换按钮测试</Text>
              <Text>4. 重启应用，验证主题是否被保存</Text>
              <Text>5. 检查 gluestack-ui 组件是否正确响应主题</Text>
            </VStack>
          </Box>

          {/* 预期结果 */}
          <Box
            bg="$success100"
            p="$4"
            borderRadius="$lg"
            borderWidth={1}
            borderColor="$success300">
            <VStack space="sm">
              <Heading size="sm">预期结果</Heading>
              <Text>✅ 主题切换立即生效</Text>
              <Text>✅ 所有组件颜色正确更新</Text>
              <Text>✅ 主题选择被持久化</Text>
              <Text>✅ 重启后恢复上次的主题</Text>
              <Text>✅ gluestack-ui 和 Tamagui 组件都正确响应</Text>
            </VStack>
          </Box>
        </VStack>
      </SafeAreaView>
    </ScrollView>
  );
};

// 应用入口
export default function App() {
  return (
    <Provider store={store}>
      <GluestackUIProvider config={gluestackConfig}>
        <ThemeToggleTest />
      </GluestackUIProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

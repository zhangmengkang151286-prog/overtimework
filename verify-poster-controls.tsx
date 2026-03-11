/**
 * PosterControls 组件验证脚本
 * 
 * 用于验证 PosterControls 组件的功能：
 * - 按钮显示和点击
 * - 位置指示器显示
 * - 加载状态
 * - 主题切换
 */

import React, {useState} from 'react';
import {View, SafeAreaView, ScrollView, Alert} from 'react-native';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {Box, Text, Pressable} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';

// 导入组件
import {PosterControls} from './src/components/poster/PosterControls';

// 导入主题
import {useTheme} from './src/hooks/useTheme';

/**
 * 测试容器组件
 */
const TestContainer: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.isDark;

  // 状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const totalCount = 4;

  /**
   * 处理保存
   */
  const handleSave = () => {
    Alert.alert('保存', `保存第 ${currentIndex + 1} 个海报`);
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  /**
   * 处理分享
   */
  const handleShare = () => {
    Alert.alert('分享', `分享第 ${currentIndex + 1} 个海报`);
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  /**
   * 处理索引变化
   */
  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
    Alert.alert('切换', `切换到第 ${index + 1} 个海报`);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
      }}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16}}>
        {/* 标题 */}
        <Box marginBottom="$6">
          <Text
            color={theme.colors.text}
            fontSize="$2xl"
            fontWeight="$bold"
            marginBottom="$2">
            PosterControls 组件测试
          </Text>
          <Text
            color={theme.colors.textSecondary}
            fontSize="$sm">
            验证海报操作控制组件的功能
          </Text>
        </Box>

        {/* 当前状态 */}
        <Box
          marginBottom="$6"
          padding="$4"
          backgroundColor={isDark ? '$backgroundDark800' : '$backgroundLight50'}
          borderRadius="$lg">
          <Text
            color={theme.colors.text}
            fontSize="$md"
            fontWeight="$semibold"
            marginBottom="$2">
            当前状态
          </Text>
          <Text color={theme.colors.textSecondary} fontSize="$sm">
            当前索引: {currentIndex + 1} / {totalCount}
          </Text>
          <Text color={theme.colors.textSecondary} fontSize="$sm">
            加载状态: {loading ? '加载中' : '空闲'}
          </Text>
        </Box>

        {/* 控制按钮 */}
        <Box marginBottom="$6">
          <Text
            color={theme.colors.text}
            fontSize="$lg"
            fontWeight="$semibold"
            marginBottom="$3">
            控制按钮
          </Text>
          
          <View style={{flexDirection: 'row', gap: 12, marginBottom: 12}}>
            <Pressable
              onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                borderRadius: 8,
                alignItems: 'center',
              }}>
              <Text color={theme.colors.text}>上一个</Text>
            </Pressable>
            
            <Pressable
              onPress={() => setCurrentIndex(Math.min(totalCount - 1, currentIndex + 1))}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                borderRadius: 8,
                alignItems: 'center',
              }}>
              <Text color={theme.colors.text}>下一个</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => setLoading(!loading)}
            style={{
              padding: 12,
              backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
              borderRadius: 8,
              alignItems: 'center',
            }}>
            <Text color={theme.colors.text}>
              {loading ? '停止加载' : '开始加载'}
            </Text>
          </Pressable>
        </Box>

        {/* PosterControls 组件 */}
        <Box marginBottom="$6">
          <Text
            color={theme.colors.text}
            fontSize="$lg"
            fontWeight="$semibold"
            marginBottom="$3">
            PosterControls 组件
          </Text>
          
          <Box
            borderWidth={1}
            borderColor={theme.colors.border}
            borderRadius="$lg"
            overflow="hidden">
            <PosterControls
              currentIndex={currentIndex}
              totalCount={totalCount}
              onSave={handleSave}
              onShare={handleShare}
              onIndexChange={handleIndexChange}
              loading={loading}
            />
          </Box>
        </Box>

        {/* 测试说明 */}
        <Box
          padding="$4"
          backgroundColor={isDark ? '$backgroundDark800' : '$backgroundLight50'}
          borderRadius="$lg">
          <Text
            color={theme.colors.text}
            fontSize="$md"
            fontWeight="$semibold"
            marginBottom="$2">
            测试说明
          </Text>
          <Text
            color={theme.colors.textSecondary}
            fontSize="$sm"
            marginBottom="$1">
            1. 点击"保存到本地"按钮，应显示保存提示
          </Text>
          <Text
            color={theme.colors.textSecondary}
            fontSize="$sm"
            marginBottom="$1">
            2. 点击"分享"按钮，应显示分享提示
          </Text>
          <Text
            color={theme.colors.textSecondary}
            fontSize="$sm"
            marginBottom="$1">
            3. 点击位置指示器圆点，应切换到对应海报
          </Text>
          <Text
            color={theme.colors.textSecondary}
            fontSize="$sm"
            marginBottom="$1">
            4. 点击"开始加载"，按钮应显示加载状态
          </Text>
          <Text
            color={theme.colors.textSecondary}
            fontSize="$sm">
            5. 当前激活的圆点应该高亮显示
          </Text>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * 主应用组件
 */
export default function App() {
  return (
    <GluestackUIProvider config={config}>
      <TestContainer />
    </GluestackUIProvider>
  );
}

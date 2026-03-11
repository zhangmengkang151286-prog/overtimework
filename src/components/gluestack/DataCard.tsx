import React from 'react';
import {Box, VStack, HStack, Heading, Text} from '@gluestack-ui/themed';
import {Pressable} from 'react-native';

/**
 * DataCard 组件属性
 */
export interface DataCardProps {
  /** 卡片标题 */
  title: string;
  /** 主要数值 */
  value: string | number;
  /** 副标题/说明文字 */
  subtitle?: string;
  /** 图标元素 */
  icon?: React.ReactNode;
  /** 点击事件 */
  onPress?: () => void;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示阴影 */
  elevate?: boolean;
}

/**
 * 数据展示卡片组件
 *
 * 使用 gluestack-ui 组件重构的数据卡片，用于展示关键数据指标。
 * 支持标题、数值、副标题和图标。
 *
 * @example
 * ```tsx
 * <DataCard
 *   title="参与人数"
 *   value="1,234"
 *   subtitle="较昨日 +12%"
 *   icon={<Users size={24} />}
 *   elevate
 * />
 * ```
 */
export const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  onPress,
  bordered = true,
  elevate = false,
}) => {
  const CardContent = (
    <Box
      bg="$backgroundLight0"
      $dark-bg="$backgroundDark900"
      borderRadius="$lg"
      p="$4"
      borderWidth={bordered ? 1 : 0}
      borderColor={bordered ? '$borderLight200' : 'transparent'}
      $dark-borderColor={bordered ? '$borderDark800' : 'transparent'}
      // 使用 shadow 属性模拟 elevation 效果
      shadowColor="$black"
      shadowOffset={elevate ? {width: 0, height: 2} : undefined}
      shadowOpacity={elevate ? 0.1 : 0}
      shadowRadius={elevate ? 4 : 0}
      elevation={elevate ? 4 : 0}>
      <VStack space="md">
        {/* 标题和图标行 */}
        <HStack space="sm" alignItems="center" justifyContent="space-between">
          <Heading size="sm" color="$textLight700" $dark-color="$textDark300">
            {title}
          </Heading>
          {icon && <Box>{icon}</Box>}
        </HStack>

        {/* 数值显示 */}
        <Heading
          size="3xl"
          fontFamily="$mono"
          color="$textLight900"
          $dark-color="$textDark50">
          {value}
        </Heading>

        {/* 副标题 */}
        {subtitle && (
          <Text size="sm" color="$textLight600" $dark-color="$textDark400">
            {subtitle}
          </Text>
        )}
      </VStack>
    </Box>
  );

  // 如果有 onPress，包装在 Pressable 中
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({pressed}) => ({
          opacity: pressed ? 0.9 : 1,
          transform: [{scale: pressed ? 0.98 : 1}],
        })}>
        {CardContent}
      </Pressable>
    );
  }

  return CardContent;
};

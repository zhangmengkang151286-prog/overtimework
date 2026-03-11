import React from 'react';
import {Badge, BadgeText, HStack} from '@gluestack-ui/themed';

/**
 * 状态类型
 */
export type StatusType = 'overtime' | 'ontime' | 'pending';

/**
 * 指示器大小类型
 */
export type IndicatorSize = 'sm' | 'md' | 'lg';

/**
 * StatusIndicator 组件属性
 */
export interface StatusIndicatorProps {
  /** 状态类型 */
  status: StatusType;
  /** 指示器大小 */
  size?: IndicatorSize;
  /** 是否显示标签文字 */
  showLabel?: boolean;
  /** 自定义标签文字 */
  label?: string;
}

/**
 * 状态指示器组件（基于 gluestack-ui Badge）
 *
 * 使用 gluestack-ui 的 Badge 组件显示状态指示器。
 * 根据状态类型显示不同的颜色：
 * - overtime: 红色（error action）
 * - ontime: 绿色（success action）
 * - pending: 黄色（warning action）
 *
 * 使用 gluestack-ui 的标准 action 属性：
 * - success: 绿色（成功/准时下班）
 * - error: 红色（错误/加班）
 * - warning: 黄色（警告/待定）
 *
 * @example
 * ```tsx
 * <StatusIndicator status="overtime" size="md" showLabel />
 *
 * <StatusIndicator status="ontime" size="lg" label="准时下班" />
 *
 * <StatusIndicator status="pending" size="sm" />
 * ```
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  label,
}) => {
  /**
   * 根据状态获取对应的 gluestack-ui action
   */
  const getStatusAction = () => {
    switch (status) {
      case 'overtime':
        return 'error' as const; // 红色
      case 'ontime':
        return 'success' as const; // 绿色
      case 'pending':
        return 'warning' as const; // 黄色
      default:
        return 'info' as const;
    }
  };

  /**
   * 获取默认标签文字
   */
  const getDefaultLabel = (): string => {
    switch (status) {
      case 'overtime':
        return '加班';
      case 'ontime':
        return '准时下班';
      case 'pending':
        return '待定';
      default:
        return '';
    }
  };

  const displayLabel = label || getDefaultLabel();

  // 如果显示标签，使用 BadgeText
  if (showLabel) {
    return (
      <Badge action={getStatusAction()} size={size} variant="solid">
        <BadgeText>{displayLabel}</BadgeText>
      </Badge>
    );
  }

  // 否则只显示圆点（不带文字的 Badge）
  return (
    <Badge
      action={getStatusAction()}
      size={size}
      variant="solid"
      // 使用较小的宽度和高度来模拟圆点
      w={size === 'sm' ? '$2' : size === 'md' ? '$3' : '$4'}
      h={size === 'sm' ? '$2' : size === 'md' ? '$3' : '$4'}
      borderRadius="$full">
      <BadgeText>{''}</BadgeText>
    </Badge>
  );
};

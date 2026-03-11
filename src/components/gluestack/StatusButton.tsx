import React from 'react';
import {Button, ButtonText} from '@gluestack-ui/themed';
import type {ComponentProps} from 'react';

/**
 * 状态类型
 */
export type StatusType = 'overtime' | 'ontime' | 'pending';

/**
 * gluestack-ui Button 组件的属性类型
 */
type GluestackButtonProps = ComponentProps<typeof Button>;

/**
 * StatusButton 组件属性
 */
export interface StatusButtonProps extends Omit<
  GluestackButtonProps,
  'action' | 'variant'
> {
  /** 状态类型 */
  status: StatusType;
  /** 按钮文本内容 */
  children?: React.ReactNode;
}

/**
 * 状态按钮组件（基于 gluestack-ui）
 *
 * 根据不同的状态类型显示不同的样式：
 * - overtime: 红色主题（加班）- negative action
 * - ontime: 绿色主题（准时下班）- positive action
 * - pending: 灰色主题（待定）- secondary action
 *
 * 使用 gluestack-ui 的标准 action 属性：
 * - positive: 绿色（成功/准时）
 * - negative: 红色（危险/加班）
 * - secondary: 灰色（次要/待定）
 *
 * @example
 * ```tsx
 * <StatusButton status="overtime" onPress={handleOvertimePress}>
 *   加班
 * </StatusButton>
 *
 * <StatusButton status="ontime" onPress={handleOntimePress}>
 *   准时下班
 * </StatusButton>
 *
 * <StatusButton status="pending" isDisabled>
 *   待定
 * </StatusButton>
 * ```
 */
export const StatusButton: React.FC<StatusButtonProps> = ({
  status,
  children,
  size = 'md',
  ...props
}) => {
  /**
   * 根据状态获取对应的 gluestack-ui action
   */
  const getStatusAction = () => {
    switch (status) {
      case 'overtime':
        return 'negative' as const; // 红色
      case 'ontime':
        return 'positive' as const; // 绿色
      case 'pending':
        return 'secondary' as const; // 灰色
      default:
        return 'primary' as const;
    }
  };

  /**
   * 根据状态获取对应的 variant
   * pending 状态使用 outline，其他使用 solid
   */
  const getStatusVariant = () => {
    return status === 'pending' ? ('outline' as const) : ('solid' as const);
  };

  return (
    <Button
      size={size}
      action={getStatusAction()}
      variant={getStatusVariant()}
      {...props}>
      <ButtonText>{children}</ButtonText>
    </Button>
  );
};

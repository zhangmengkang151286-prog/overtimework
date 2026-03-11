import React from 'react';
import {Button, ButtonText, ButtonSpinner} from '@gluestack-ui/themed';
import type {ComponentProps} from 'react';

/**
 * 按钮变体类型
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * gluestack-ui Button 组件的属性类型
 */
type GluestackButtonProps = ComponentProps<typeof Button>;

/**
 * 扩展的按钮属性
 */
export interface AppButtonProps extends Omit<
  GluestackButtonProps,
  'variant' | 'action'
> {
  /** 按钮变体样式 */
  variant?: ButtonVariant;
  /** 加载状态 */
  loading?: boolean;
  /** 按钮文本内容 */
  children?: React.ReactNode;
}

/**
 * 应用统一的按钮组件（基于 gluestack-ui）
 *
 * 支持四种变体：
 * - primary: 主要操作按钮
 * - secondary: 次要操作按钮
 * - ghost: 幽灵按钮（透明背景）
 * - danger: 危险操作按钮
 *
 * 使用 gluestack-ui 的标准 API：
 * - variant: solid, outline, link
 * - action: primary, secondary, positive, negative
 * - size: xs, sm, md, lg, xl
 *
 * @example
 * ```tsx
 * <AppButton variant="primary" onPress={handleSubmit}>
 *   提交
 * </AppButton>
 *
 * <AppButton variant="danger" loading={isDeleting} onPress={handleDelete}>
 *   删除
 * </AppButton>
 * ```
 */
export const AppButton: React.FC<AppButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  size = 'md',
  ...props
}) => {
  // 将自定义 variant 映射到 gluestack-ui 的 variant 和 action
  const getGluestackProps = () => {
    switch (variant) {
      case 'primary':
        return {
          variant: 'solid' as const,
          action: 'primary' as const,
        };
      case 'secondary':
        return {
          variant: 'solid' as const,
          action: 'secondary' as const,
        };
      case 'ghost':
        return {
          variant: 'link' as const,
          action: 'primary' as const,
        };
      case 'danger':
        return {
          variant: 'solid' as const,
          action: 'negative' as const,
        };
      default:
        return {
          variant: 'solid' as const,
          action: 'primary' as const,
        };
    }
  };

  const gluestackProps = getGluestackProps();

  return (
    <Button
      size={size}
      isDisabled={disabled || loading}
      variant={gluestackProps.variant}
      action={gluestackProps.action}
      {...props}>
      {loading && <ButtonSpinner mr="$1" />}
      <ButtonText>{children}</ButtonText>
    </Button>
  );
};

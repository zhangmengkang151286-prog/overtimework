import React from 'react';
import {
  Input,
  InputField,
  InputSlot,
  InputIcon,
  VStack,
  Text,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@gluestack-ui/themed';
import {TextInputProps} from 'react-native';

/**
 * 扩展的输入框属性
 */
export interface AppInputProps extends Omit<TextInputProps, 'style'> {
  /** 错误状态 */
  error?: boolean;
  /** 错误提示信息 */
  errorMessage?: string;
  /** 输入框标签 */
  label?: string;
  /** 输入框变体 */
  variant?: 'outline' | 'underlined' | 'rounded';
  /** 输入框大小 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 是否只读 */
  isReadOnly?: boolean;
  /** 是否必填 */
  isRequired?: boolean;
}

/**
 * 应用统一的输入框组件（基于 gluestack-ui）
 *
 * 基于 gluestack-ui Input 组件，提供统一的输入框样式。
 * 支持错误状态、聚焦高亮、标签显示和图标。
 *
 * 设计规范：
 * - 使用 gluestack-ui 的默认样式系统
 * - 支持 outline、underlined、rounded 变体
 * - 支持 sm、md、lg、xl 尺寸
 * - 支持左右图标插槽
 * - 完全符合 gluestack-ui 设计规范
 *
 * @example
 * ```tsx
 * <AppInput
 *   label="手机号"
 *   placeholder="请输入手机号"
 *   error={!!errors.phone}
 *   errorMessage={errors.phone}
 *   value={phone}
 *   onChangeText={setPhone}
 * />
 * ```
 */
export const AppInput: React.FC<AppInputProps> = ({
  error = false,
  errorMessage,
  label,
  variant = 'outline',
  size = 'md',
  leftIcon,
  rightIcon,
  isDisabled = false,
  isReadOnly = false,
  isRequired = false,
  ...props
}) => {
  return (
    <FormControl
      isInvalid={error}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}>
      {/* 标签 */}
      {label && (
        <FormControlLabel mb="$1">
          <FormControlLabelText
            size={size}
            fontWeight="$medium"
            color="$textLight900"
            sx={{
              _dark: {
                color: '$textDark50',
              },
            }}>
            {label}
          </FormControlLabelText>
        </FormControlLabel>
      )}

      {/* 输入框 */}
      <Input
        variant={variant}
        size={size}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        isInvalid={error}>
        {/* 左侧图标 */}
        {leftIcon && (
          <InputSlot pl="$3">
            <InputIcon as={leftIcon} />
          </InputSlot>
        )}

        {/* 输入字段 */}
        <InputField
          color="$textLight900"
          placeholderTextColor="$textLight600"
          sx={{
            _dark: {
              color: '$textDark50',
              placeholderTextColor: '$textDark400',
            },
          }}
          {...props}
        />

        {/* 右侧图标 */}
        {rightIcon && (
          <InputSlot pr="$3">
            <InputIcon as={rightIcon} />
          </InputSlot>
        )}
      </Input>

      {/* 错误提示 */}
      {error && errorMessage && (
        <FormControlError>
          <FormControlErrorText
            size="xs"
            color="$error500"
            sx={{
              _dark: {
                color: '$error400',
              },
            }}>
            {errorMessage}
          </FormControlErrorText>
        </FormControlError>
      )}
    </FormControl>
  );
};

// 导出类型
export type {TextInputProps as GluestackInputProps};

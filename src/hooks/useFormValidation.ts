/**
 * 表单验证Hook
 *
 * 提供实时表单验证和错误提示功能
 */

import {useState, useCallback, useEffect} from 'react';

export interface ValidationRule<T = any> {
  validator: (value: T) => boolean | Promise<boolean>;
  message: string;
}

export interface FieldConfig<T = any> {
  value: T;
  rules?: ValidationRule<T>[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FieldState {
  value: any;
  error: string | null;
  touched: boolean;
  validating: boolean;
}

export interface UseFormValidationReturn {
  fields: Record<string, FieldState>;
  errors: Record<string, string | null>;
  isValid: boolean;
  isValidating: boolean;
  setValue: (fieldName: string, value: any) => void;
  setTouched: (fieldName: string, touched: boolean) => void;
  validateField: (fieldName: string) => Promise<boolean>;
  validateAll: () => Promise<boolean>;
  reset: () => void;
  getFieldProps: (fieldName: string) => {
    value: any;
    onChangeText: (text: string) => void;
    onBlur: () => void;
    error: string | null;
  };
}

/**
 * 表单验证Hook
 * @param config 字段配置
 * @returns 表单状态和控制方法
 */
export function useFormValidation(
  config: Record<string, FieldConfig>,
): UseFormValidationReturn {
  // 初始化字段状态
  const [fields, setFields] = useState<Record<string, FieldState>>(() => {
    const initialFields: Record<string, FieldState> = {};
    Object.keys(config).forEach(fieldName => {
      initialFields[fieldName] = {
        value: config[fieldName].value,
        error: null,
        touched: false,
        validating: false,
      };
    });
    return initialFields;
  });

  // 设置字段值
  const setValue = useCallback(
    (fieldName: string, value: any) => {
      setFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          value,
        },
      }));

      // 如果配置了onChange验证,立即验证
      if (config[fieldName]?.validateOnChange && fields[fieldName]?.touched) {
        validateField(fieldName);
      }
    },
    [config, fields],
  );

  // 设置字段触摸状态
  const setTouched = useCallback(
    (fieldName: string, touched: boolean) => {
      setFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          touched,
        },
      }));

      // 如果配置了onBlur验证,在失焦时验证
      if (touched && config[fieldName]?.validateOnBlur) {
        validateField(fieldName);
      }
    },
    [config],
  );

  // 验证单个字段
  const validateField = useCallback(
    async (fieldName: string): Promise<boolean> => {
      const fieldConfig = config[fieldName];
      const fieldState = fields[fieldName];

      if (!fieldConfig || !fieldState) {
        return true;
      }

      // 如果没有验证规则,直接返回true
      if (!fieldConfig.rules || fieldConfig.rules.length === 0) {
        return true;
      }

      // 设置验证中状态
      setFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          validating: true,
        },
      }));

      try {
        // 依次执行所有验证规则
        for (const rule of fieldConfig.rules) {
          const isValid = await rule.validator(fieldState.value);
          if (!isValid) {
            // 验证失败,设置错误信息
            setFields(prev => ({
              ...prev,
              [fieldName]: {
                ...prev[fieldName],
                error: rule.message,
                validating: false,
              },
            }));
            return false;
          }
        }

        // 所有规则都通过,清除错误
        setFields(prev => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            error: null,
            validating: false,
          },
        }));
        return true;
      } catch (error) {
        console.error(`验证字段 ${fieldName} 时出错:`, error);
        setFields(prev => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            error: '验证失败',
            validating: false,
          },
        }));
        return false;
      }
    },
    [config, fields],
  );

  // 验证所有字段
  const validateAll = useCallback(async (): Promise<boolean> => {
    const fieldNames = Object.keys(config);
    const results = await Promise.all(
      fieldNames.map(fieldName => validateField(fieldName)),
    );
    return results.every(result => result);
  }, [config, validateField]);

  // 重置表单
  const reset = useCallback(() => {
    const resetFields: Record<string, FieldState> = {};
    Object.keys(config).forEach(fieldName => {
      resetFields[fieldName] = {
        value: config[fieldName].value,
        error: null,
        touched: false,
        validating: false,
      };
    });
    setFields(resetFields);
  }, [config]);

  // 获取字段属性(用于绑定到输入组件)
  const getFieldProps = useCallback(
    (fieldName: string) => {
      return {
        value: fields[fieldName]?.value || '',
        onChangeText: (text: string) => setValue(fieldName, text),
        onBlur: () => setTouched(fieldName, true),
        error: fields[fieldName]?.touched ? fields[fieldName]?.error : null,
      };
    },
    [fields, setValue, setTouched],
  );

  // 计算派生状态
  const errors = Object.keys(fields).reduce(
    (acc, fieldName) => {
      acc[fieldName] = fields[fieldName].error;
      return acc;
    },
    {} as Record<string, string | null>,
  );

  const isValid = Object.values(fields).every(field => !field.error);
  const isValidating = Object.values(fields).some(field => field.validating);

  return {
    fields,
    errors,
    isValid,
    isValidating,
    setValue,
    setTouched,
    validateField,
    validateAll,
    reset,
    getFieldProps,
  };
}

// 常用验证规则
export const ValidationRules = {
  required: (message: string = '此字段为必填项'): ValidationRule => ({
    validator: (value: any) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== null && value !== undefined;
    },
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    validator: (value: string) => value.length >= length,
    message: message || `至少需要${length}个字符`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    validator: (value: string) => value.length <= length,
    message: message || `最多${length}个字符`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validator: (value: string) => regex.test(value),
    message,
  }),

  phoneNumber: (message: string = '请输入正确的手机号'): ValidationRule => ({
    validator: (value: string) => /^1\d{10}$/.test(value),
    message,
  }),

  email: (message: string = '请输入正确的邮箱地址'): ValidationRule => ({
    validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  custom: (
    validator: (value: any) => boolean | Promise<boolean>,
    message: string,
  ): ValidationRule => ({
    validator,
    message,
  }),
};

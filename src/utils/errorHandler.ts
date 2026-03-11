import {ApiError} from '../types';

/**
 * 错误处理工具
 * 提供统一的错误处理和用户友好的错误消息
 * 需求: 网络错误的友好提示和重试机制
 */

export interface ErrorHandlerConfig {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 标准化错误接口
 */
export interface StandardError {
  type: ErrorType;
  message: string;
  originalError?: any;
  retryable: boolean;
  statusCode?: number;
}

/**
 * 解析错误类型
 */
export const parseErrorType = (error: any): ErrorType => {
  // API错误
  if (error.code) {
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      return ErrorType.NETWORK;
    }
    if (error.code === 'ETIMEDOUT') {
      return ErrorType.TIMEOUT;
    }
  }

  // HTTP状态码错误
  if (error.response?.status) {
    const status = error.response.status;
    if (status === 401) return ErrorType.AUTHENTICATION;
    if (status === 403) return ErrorType.PERMISSION;
    if (status === 404) return ErrorType.NOT_FOUND;
    if (status >= 400 && status < 500) return ErrorType.CLIENT;
    if (status >= 500) return ErrorType.SERVER;
  }

  // 验证错误
  if (error.name === 'ValidationError') {
    return ErrorType.VALIDATION;
  }

  return ErrorType.UNKNOWN;
};

/**
 * 获取用户友好的错误消息
 */
export const getUserFriendlyMessage = (error: any): string => {
  const errorType = parseErrorType(error);

  switch (errorType) {
    case ErrorType.NETWORK:
      return '网络连接失败，请检查网络设置后重试';
    case ErrorType.TIMEOUT:
      return '请求超时，请稍后重试';
    case ErrorType.SERVER:
      return '服务器暂时无法响应，请稍后重试';
    case ErrorType.CLIENT:
      return error.message || '请求参数有误，请检查后重试';
    case ErrorType.VALIDATION:
      return error.message || '输入信息有误，请检查后重试';
    case ErrorType.AUTHENTICATION:
      return '登录已过期，请重新登录';
    case ErrorType.PERMISSION:
      return '您没有权限执行此操作';
    case ErrorType.NOT_FOUND:
      return '请求的资源不存在';
    default:
      return error.message || '发生未知错误，请稍后重试';
  }
};

/**
 * 判断错误是否可重试
 */
export const isRetryableError = (error: any): boolean => {
  const errorType = parseErrorType(error);

  return [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER].includes(
    errorType,
  );
};

/**
 * 标准化错误对象
 */
export const standardizeError = (error: any): StandardError => {
  const type = parseErrorType(error);
  const message = getUserFriendlyMessage(error);
  const retryable = isRetryableError(error);
  const statusCode = error.response?.status;

  return {
    type,
    message,
    originalError: error,
    retryable,
    statusCode,
  };
};

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: StandardError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 处理错误
   */
  handle(error: any, config: ErrorHandlerConfig = {}): StandardError {
    const standardError = standardizeError(error);

    // 记录错误
    if (config.logError !== false) {
      this.logError(standardError);
    }

    // 打印到控制台
    console.error('Error handled:', {
      type: standardError.type,
      message: standardError.message,
      retryable: standardError.retryable,
      statusCode: standardError.statusCode,
    });

    return standardError;
  }

  /**
   * 记录错误到内存
   */
  private logError(error: StandardError): void {
    this.errorLog.push(error);

    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  /**
   * 获取错误日志
   */
  getErrorLog(): StandardError[] {
    return [...this.errorLog];
  }

  /**
   * 清除错误日志
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * 上报错误到服务器（可选实现）
   */
  async reportError(error: StandardError): Promise<void> {
    // 这里可以实现错误上报逻辑
    // 例如发送到错误监控服务（Sentry, Bugsnag等）
    console.log('Error reported:', error);
  }
}

/**
 * 便捷的错误处理函数
 */
export const handleError = (
  error: any,
  config?: ErrorHandlerConfig,
): StandardError => {
  return ErrorHandler.getInstance().handle(error, config);
};

/**
 * 重试包装器
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: any) => void;
  } = {},
): Promise<T> => {
  const {maxAttempts = 3, delay = 1000, backoff = true, onRetry} = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 检查是否可重试
      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      // 调用重试回调
      if (onRetry) {
        onRetry(attempt, error);
      }

      // 计算延迟时间（支持指数退避）
      const retryDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;

      console.log(
        `Retry attempt ${attempt}/${maxAttempts} after ${retryDelay}ms`,
      );

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError;
};

/**
 * 电路断路器模式
 * 防止对失败服务的持续请求
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1分钟
    private resetTimeout: number = 30000, // 30秒
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // 检查是否可以尝试半开状态
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker: HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();

      // 成功后重置
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      console.log('Circuit breaker: OPEN');
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    console.log('Circuit breaker: CLOSED');
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }
}

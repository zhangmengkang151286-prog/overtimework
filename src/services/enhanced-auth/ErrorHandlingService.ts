/**
 * 错误处理服务
 *
 * 提供统一的错误处理、重试机制和用户友好的错误提示
 */

export interface ErrorHandlingOptions {
  retryCount?: number;
  retryInterval?: number;
  fallbackAction?: () => void | Promise<void>;
  userNotification?: boolean;
  logLevel?: 'error' | 'warn' | 'info';
}

export interface RetryOptions {
  maxRetries: number;
  retryInterval: number;
  shouldRetry?: (error: any) => boolean;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;

  private constructor() {}

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * 将错误转换为用户友好的提示信息
   * @param error 错误对象
   * @param context 错误上下文
   * @returns 用户友好的错误信息
   */
  public getUserFriendlyMessage(error: any, context?: string): string {
    // 网络错误
    if (this.isNetworkError(error)) {
      return '网络连接失败,请检查网络设置后重试';
    }

    // 超时错误
    if (this.isTimeoutError(error)) {
      return '请求超时,请稍后重试';
    }

    // 服务器错误
    if (this.isServerError(error)) {
      return '服务暂时不可用,请稍后重试';
    }

    // 认证错误
    if (this.isAuthError(error)) {
      return this.getAuthErrorMessage(error);
    }

    // 验证错误
    if (this.isValidationError(error)) {
      return error.message || '输入信息有误,请检查后重试';
    }

    // 微信错误
    if (this.isWeChatError(error)) {
      return this.getWeChatErrorMessage(error);
    }

    // 默认错误信息
    if (error.message) {
      return error.message;
    }

    return context ? `${context}失败,请重试` : '操作失败,请重试';
  }

  /**
   * 带重试机制的异步操作执行
   * @param operation 要执行的操作
   * @param options 重试选项
   * @returns 操作结果
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions,
  ): Promise<T> {
    let lastError: any;
    let attempt = 0;

    while (attempt <= options.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        attempt++;

        // 检查是否应该重试
        if (attempt > options.maxRetries) {
          break;
        }

        if (options.shouldRetry && !options.shouldRetry(error)) {
          break;
        }

        // 等待后重试
        await this.delay(options.retryInterval);
      }
    }

    throw lastError;
  }

  /**
   * 判断是否为网络错误
   */
  private isNetworkError(error: any): boolean {
    return (
      error.message?.includes('Network') ||
      error.message?.includes('network') ||
      error.code === 'NETWORK_ERROR' ||
      error.name === 'NetworkError'
    );
  }

  /**
   * 判断是否为超时错误
   */
  private isTimeoutError(error: any): boolean {
    return (
      error.message?.includes('timeout') ||
      error.message?.includes('Timeout') ||
      error.code === 'TIMEOUT_ERROR'
    );
  }

  /**
   * 判断是否为服务器错误
   */
  private isServerError(error: any): boolean {
    return (
      error.status >= 500 ||
      error.code === 'SERVER_ERROR' ||
      error.message?.includes('500')
    );
  }

  /**
   * 判断是否为认证错误
   */
  private isAuthError(error: any): boolean {
    return (
      error.status === 401 ||
      error.status === 403 ||
      error.code === 'AUTH_ERROR' ||
      error.message?.includes('认证') ||
      error.message?.includes('授权')
    );
  }

  /**
   * 判断是否为验证错误
   */
  private isValidationError(error: any): boolean {
    return (
      error.status === 400 ||
      error.code === 'VALIDATION_ERROR' ||
      error.message?.includes('验证') ||
      error.message?.includes('格式')
    );
  }

  /**
   * 判断是否为微信错误
   */
  private isWeChatError(error: any): boolean {
    return (
      error.errCode !== undefined ||
      error.message?.includes('微信') ||
      error.message?.includes('WeChat')
    );
  }

  /**
   * 获取认证错误的具体信息
   */
  private getAuthErrorMessage(error: any): string {
    if (error.message?.includes('验证码')) {
      return error.message;
    }
    if (error.message?.includes('密码')) {
      return error.message;
    }
    if (error.message?.includes('手机号')) {
      return error.message;
    }
    return '认证失败,请重新登录';
  }

  /**
   * 获取微信错误的具体信息
   */
  private getWeChatErrorMessage(error: any): string {
    if (error.errCode === -2) {
      return '用户取消授权';
    }
    if (error.errCode === -4) {
      return '用户拒绝授权';
    }
    if (error.message?.includes('未安装')) {
      return '请先安装微信客户端';
    }
    if (error.message?.includes('已绑定')) {
      return error.message;
    }
    return '微信授权失败,请重试';
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 记录错误日志
   */
  public logError(
    error: any,
    context?: string,
    level: 'error' | 'warn' | 'info' = 'error',
  ): void {
    const message = context
      ? `[${context}] ${error.message || error}`
      : error.message || error;

    switch (level) {
      case 'error':
        console.error(message, error);
        break;
      case 'warn':
        console.warn(message, error);
        break;
      case 'info':
        console.info(message, error);
        break;
    }
  }
}

// 导出单例实例
export const errorHandlingService = ErrorHandlingService.getInstance();

// 导出预定义的重试策略
export const RetryStrategies = {
  // 网络请求重试策略
  network: {
    maxRetries: 3,
    retryInterval: 2000,
    shouldRetry: (error: any) => {
      return (
        error.message?.includes('Network') ||
        error.message?.includes('network') ||
        error.code === 'NETWORK_ERROR'
      );
    },
  },

  // 短信发送重试策略
  sms: {
    maxRetries: 2,
    retryInterval: 5000,
    shouldRetry: (error: any) => {
      return !error.message?.includes('频率');
    },
  },

  // 微信认证重试策略
  wechat: {
    maxRetries: 1,
    retryInterval: 0,
    shouldRetry: (error: any) => {
      return error.errCode !== -2 && error.errCode !== -4; // 不重试用户取消/拒绝
    },
  },

  // 定位服务重试策略
  location: {
    maxRetries: 1,
    retryInterval: 3000,
    shouldRetry: () => true,
  },
};

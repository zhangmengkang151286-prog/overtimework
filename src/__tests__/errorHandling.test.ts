import {
  parseErrorType,
  getUserFriendlyMessage,
  isRetryableError,
  standardizeError,
  ErrorType,
  withRetry,
  CircuitBreaker,
} from '../utils/errorHandler';

describe('Error Handler', () => {
  describe('parseErrorType', () => {
    it('should identify network errors', () => {
      const error = {code: 'NETWORK_ERROR'};
      expect(parseErrorType(error)).toBe(ErrorType.NETWORK);
    });

    it('should identify timeout errors', () => {
      const error = {code: 'ETIMEDOUT'};
      expect(parseErrorType(error)).toBe(ErrorType.TIMEOUT);
    });

    it('should identify authentication errors', () => {
      const error = {response: {status: 401}};
      expect(parseErrorType(error)).toBe(ErrorType.AUTHENTICATION);
    });

    it('should identify server errors', () => {
      const error = {response: {status: 500}};
      expect(parseErrorType(error)).toBe(ErrorType.SERVER);
    });

    it('should identify client errors', () => {
      const error = {response: {status: 400}};
      expect(parseErrorType(error)).toBe(ErrorType.CLIENT);
    });

    it('should identify validation errors', () => {
      const error = {name: 'ValidationError'};
      expect(parseErrorType(error)).toBe(ErrorType.VALIDATION);
    });

    it('should default to unknown for unrecognized errors', () => {
      const error = {message: 'Something went wrong'};
      expect(parseErrorType(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return friendly message for network errors', () => {
      const error = {code: 'NETWORK_ERROR'};
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('网络连接失败');
    });

    it('should return friendly message for timeout errors', () => {
      const error = {code: 'ETIMEDOUT'};
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('请求超时');
    });

    it('should return friendly message for server errors', () => {
      const error = {response: {status: 500}};
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('服务器');
    });

    it('should return custom message if provided', () => {
      const error = {
        response: {status: 400},
        message: '自定义错误消息',
      };
      const message = getUserFriendlyMessage(error);
      expect(message).toBe('自定义错误消息');
    });
  });

  describe('isRetryableError', () => {
    it('should mark network errors as retryable', () => {
      const error = {code: 'NETWORK_ERROR'};
      expect(isRetryableError(error)).toBe(true);
    });

    it('should mark timeout errors as retryable', () => {
      const error = {code: 'ETIMEDOUT'};
      expect(isRetryableError(error)).toBe(true);
    });

    it('should mark server errors as retryable', () => {
      const error = {response: {status: 500}};
      expect(isRetryableError(error)).toBe(true);
    });

    it('should not mark client errors as retryable', () => {
      const error = {response: {status: 400}};
      expect(isRetryableError(error)).toBe(false);
    });

    it('should not mark authentication errors as retryable', () => {
      const error = {response: {status: 401}};
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('standardizeError', () => {
    it('should standardize error object', () => {
      const error = {code: 'NETWORK_ERROR', message: 'Network failed'};
      const standardError = standardizeError(error);

      expect(standardError.type).toBe(ErrorType.NETWORK);
      expect(standardError.message).toContain('网络连接失败');
      expect(standardError.retryable).toBe(true);
      expect(standardError.originalError).toBe(error);
    });

    it('should include status code if available', () => {
      const error = {response: {status: 404}};
      const standardError = standardizeError(error);

      expect(standardError.statusCode).toBe(404);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn, {maxAttempts: 3});

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({code: 'NETWORK_ERROR'})
        .mockRejectedValueOnce({code: 'NETWORK_ERROR'})
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxAttempts: 3,
        delay: 10,
        backoff: false,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const fn = jest.fn().mockRejectedValue({response: {status: 400}});

      await expect(withRetry(fn, {maxAttempts: 3, delay: 10})).rejects.toEqual({
        response: {status: 400},
      });

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({code: 'NETWORK_ERROR'})
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      await withRetry(fn, {
        maxAttempts: 3,
        delay: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledWith(1, {code: 'NETWORK_ERROR'});
    });

    it('should throw after max attempts', async () => {
      const error = {code: 'NETWORK_ERROR'};
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        withRetry(fn, {maxAttempts: 3, delay: 10, backoff: false}),
      ).rejects.toEqual(error);

      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('CircuitBreaker', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start in CLOSED state', () => {
      const breaker = new CircuitBreaker();
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should open after threshold failures', async () => {
      const breaker = new CircuitBreaker(3, 60000, 30000);
      const fn = jest.fn().mockRejectedValue(new Error('Service error'));

      // 触发3次失败
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (error) {
          // 预期的错误
        }
      }

      expect(breaker.getState()).toBe('OPEN');
    });

    it('should reject immediately when OPEN', async () => {
      const breaker = new CircuitBreaker(2, 60000, 30000);
      const fn = jest.fn().mockRejectedValue(new Error('Service error'));

      // 触发2次失败打开断路器
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(fn);
        } catch (error) {
          // 预期的错误
        }
      }

      expect(breaker.getState()).toBe('OPEN');

      // 下一次调用应该立即失败
      await expect(breaker.execute(fn)).rejects.toThrow(
        'Circuit breaker is OPEN',
      );
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const breaker = new CircuitBreaker(2, 60000, 1000); // 1秒重置超时
      const fn = jest.fn().mockRejectedValue(new Error('Service error'));

      // 触发失败打开断路器
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(fn);
        } catch (error) {
          // 预期的错误
        }
      }

      expect(breaker.getState()).toBe('OPEN');

      // 快进时间
      jest.advanceTimersByTime(1100);

      // 下一次调用应该尝试半开状态
      fn.mockResolvedValueOnce('success');
      await breaker.execute(fn);

      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should reset to CLOSED after successful execution in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker(2, 60000, 1000);
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      // 触发失败
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(fn);
        } catch (error) {
          // 预期的错误
        }
      }

      expect(breaker.getState()).toBe('OPEN');

      // 等待重置超时
      jest.advanceTimersByTime(1100);

      // 成功执行应该重置断路器
      const result = await breaker.execute(fn);
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED');
    });
  });
});

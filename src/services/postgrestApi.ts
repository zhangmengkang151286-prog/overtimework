/**
 * PostgREST API 服务
 * 直接使用 fetch 调用 PostgREST API，替代 Supabase SDK
 */

import Constants from 'expo-constants';

// 从环境变量读取 API 配置
const API_BASE_URL =
  Constants.expoConfig?.extra?.API_BASE_URL || 'https://api.gonia.net/api';

// 调试日志：确认 API 配置
console.log('🔍 [API Config] API_BASE_URL:', API_BASE_URL);
console.log(
  '🔍 [API Config] Constants.expoConfig?.extra:',
  Constants.expoConfig?.extra,
);

// API 错误类
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 请求超时时间（毫秒）- iOS 首次冷启动网络初始化较慢，给足时间
const REQUEST_TIMEOUT = 15000;

// 重试配置
const MAX_RETRIES = 2; // 最多重试 2 次（共 3 次请求）
const RETRY_DELAYS = [1000, 2000]; // 重试间隔递增：1秒、2秒

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 判断是否应该重试（只对网络错误和超时重试，HTTP 业务错误不重试）
const shouldRetry = (error: any): boolean => {
  // HTTP 业务错误（4xx/5xx）不重试
  if (error instanceof ApiError && error.statusCode) {
    return false;
  }
  // 网络错误、超时、DNS 解析失败等都重试
  return true;
};

// 单次请求（不含重试逻辑）
async function singleRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // 处理 HTTP 错误
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new ApiError(errorMessage, response.status, errorText);
    }

    // 解析响应
    const text = await response.text();
    if (!text) {
      return null as T;
    }

    return JSON.parse(text) as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    // 超时错误（React Native 中没有 DOMException，直接检查 name）
    if (error && (error as any).name === 'AbortError') {
      throw new ApiError('请求超时，请检查网络连接', 408);
    }

    // 网络错误或其他错误
    throw new ApiError(
      error instanceof Error ? error.message : '网络请求失败',
    );
  }
}

// 通用请求函数（带自动重试）
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await singleRequest<T>(url, options);
    } catch (error) {
      lastError = error;

      // 判断是否需要重试
      if (attempt < MAX_RETRIES && shouldRetry(error)) {
        const retryDelay = RETRY_DELAYS[attempt] || 2000;
        console.warn(
          `🔄 [API] 请求失败，${retryDelay / 1000}秒后第${attempt + 1}次重试: ${endpoint}`,
          error instanceof Error ? error.message : error,
        );
        await delay(retryDelay);
        continue;
      }

      // 不重试或重试次数用完，抛出错误
      break;
    }
  }

  // 所有重试都失败
  console.error('❌ [API] 请求最终失败:', endpoint, lastError);
  throw lastError;
}

// GET 请求
// params 的值支持数组，同一个 key 会 append 多次（PostgREST 日期范围等场景）
export async function get<T>(
  endpoint: string,
  params?: Record<string, any>,
): Promise<T> {
  let url = endpoint;

  // 添加查询参数
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      if (Array.isArray(value)) {
        // 数组值：同一个 key append 多次
        value.forEach(v => queryParams.append(key, String(v)));
      } else {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return request<T>(url, {method: 'GET'});
}

// POST 请求
export async function post<T>(
  endpoint: string,
  data?: any,
  options?: RequestInit,
): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
    headers: {
      Prefer: 'return=representation',
      ...options?.headers,
    },
  });
}

// PATCH 请求
export async function patch<T>(
  endpoint: string,
  data?: any,
  options?: RequestInit,
): Promise<T> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
    headers: {
      Prefer: 'return=representation',
      ...options?.headers,
    },
  });
}

// DELETE 请求
export async function del<T>(
  endpoint: string,
  params?: Record<string, any>,
): Promise<T> {
  let url = endpoint;

  // 添加查询参数（用于 WHERE 条件）
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, `eq.${value}`);
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return request<T>(url, {method: 'DELETE'});
}

// RPC 调用（调用数据库函数）
export async function rpc<T>(
  functionName: string,
  params?: Record<string, any>,
): Promise<T> {
  return post<T>(`/rpc/${functionName}`, params);
}

// 错误处理辅助函数
export const handleApiError = (error: any): Error => {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    // 根据状态码返回友好的错误信息
    switch (error.statusCode) {
      case 404:
        return new Error('数据不存在');
      case 409:
        return new Error('数据已存在');
      case 400:
        return new Error('请求参数错误');
      case 401:
        return new Error('未授权访问');
      case 403:
        return new Error('禁止访问');
      case 500:
        return new Error('服务器错误');
      default:
        return new Error(error.message || '操作失败，请稍后重试');
    }
  }

  if (error.message) {
    return new Error(error.message);
  }

  return new Error('操作失败，请稍后重试');
};

// 连接状态检查
export const checkConnection = async (): Promise<boolean> => {
  try {
    await get('/tags', {limit: 1});
    return true;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

// 导出 API 基础 URL（用于其他服务）
export {API_BASE_URL};

/**
 * PostgREST API 服务
 * 直接使用 fetch 调用 PostgREST API，替代 Supabase SDK
 */

import Constants from 'expo-constants';

// 从环境变量读取 API 配置
const API_BASE_URL =
  Constants.expoConfig?.extra?.API_BASE_URL || 'https://api.offworkindex.cn/api';

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

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 8000;

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // 创建 AbortController 用于超时控制
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
        // 如果不是 JSON，使用原始文本
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

    // 超时错误
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('请求超时，请检查网络连接', 408);
    }

    // 网络错误或其他错误
    console.error('API Request Error:', error);
    throw new ApiError(
      error instanceof Error ? error.message : '网络请求失败',
    );
  }
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

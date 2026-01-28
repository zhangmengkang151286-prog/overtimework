import axios, {AxiosInstance, AxiosResponse, AxiosError} from 'axios';
import {
  RealTimeResponse,
  HistoricalResponse,
  StatusSubmissionRequest,
  TagResponse,
  ApiResponse,
  ApiError,
} from '../types';
import {storageService} from './storage';

// API配置
const API_CONFIG = {
  baseURL: __DEV__ ? 'http://localhost:3000/api' : 'https://api.overtimeindex.com/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

class ApiClient {
  private client: AxiosInstance;
  private retryCount: Map<string, number> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      async config => {
        // 添加认证token（如果有）
        const user = await storageService.getUser();
        if (user) {
          config.headers.Authorization = `Bearer ${user.id}`;
        }
        
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      error => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      response => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async error => {
        return this.handleResponseError(error);
      }
    );
  }

  private async handleResponseError(error: AxiosError): Promise<any> {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const requestKey = `${config.method}-${config.url}`;
    const currentRetryCount = this.retryCount.get(requestKey) || 0;

    // 网络错误或5xx错误时重试
    if (
      (error.code === 'NETWORK_ERROR' || 
       error.code === 'ECONNABORTED' ||
       (error.response && error.response.status >= 500)) &&
      currentRetryCount < API_CONFIG.retryAttempts
    ) {
      this.retryCount.set(requestKey, currentRetryCount + 1);
      
      console.log(`Retrying request ${requestKey}, attempt ${currentRetryCount + 1}`);
      
      // 延迟重试
      await new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.retryDelay * (currentRetryCount + 1))
      );
      
      return this.client.request(config);
    }

    // 清除重试计数
    this.retryCount.delete(requestKey);

    // 处理特定错误
    if (error.response) {
      const apiError: ApiError = {
        code: error.response.status.toString(),
        message: (error.response.data as any)?.message || error.message,
        details: error.response.data,
      };
      
      console.error('API Error:', apiError);
      return Promise.reject(apiError);
    }

    // 网络错误
    const networkError: ApiError = {
      code: 'NETWORK_ERROR',
      message: '网络连接失败，请检查网络设置',
      details: error,
    };
    
    console.error('Network Error:', networkError);
    return Promise.reject(networkError);
  }

  // 获取实时数据
  async getRealTimeData(): Promise<RealTimeResponse> {
    try {
      const response: AxiosResponse<ApiResponse<RealTimeResponse>> = 
        await this.client.get('/realtime');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '获取实时数据失败');
      }
    } catch (error) {
      // 如果网络失败，尝试使用缓存数据
      const cachedData = await storageService.getCachedData();
      if (cachedData && !(await storageService.isCacheExpired())) {
        console.log('Using cached data due to network error');
        return {
          timestamp: cachedData.lastUpdate,
          participantCount: cachedData.data.participantCount,
          overtimeCount: cachedData.data.overtimeCount,
          onTimeCount: cachedData.data.onTimeCount,
          tagDistribution: cachedData.data.tagDistribution,
          dailyStatus: cachedData.data.dailyStatus,
        };
      }
      throw error;
    }
  }

  // 获取历史数据
  async getHistoricalData(date: string, time: string): Promise<HistoricalResponse> {
    const response: AxiosResponse<ApiResponse<HistoricalResponse>> = 
      await this.client.get(`/historical?date=${date}&time=${time}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '获取历史数据失败');
    }
  }

  // 提交用户状态
  async submitUserStatus(request: StatusSubmissionRequest): Promise<void> {
    const response: AxiosResponse<ApiResponse<any>> = 
      await this.client.post('/user/status', request);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '提交状态失败');
    }
  }

  // 获取标签列表
  async getTags(type?: string, search?: string): Promise<TagResponse[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (search) params.append('search', search);
    
    const response: AxiosResponse<ApiResponse<TagResponse[]>> = 
      await this.client.get(`/tags?${params.toString()}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '获取标签失败');
    }
  }

  // 创建标签
  async createTag(tag: Partial<TagResponse>): Promise<TagResponse> {
    const response: AxiosResponse<ApiResponse<TagResponse>> = 
      await this.client.post('/tags', tag);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '创建标签失败');
    }
  }

  // 更新标签
  async updateTag(id: string, data: Partial<TagResponse>): Promise<TagResponse> {
    const response: AxiosResponse<ApiResponse<TagResponse>> = 
      await this.client.put(`/tags/${id}`, data);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '更新标签失败');
    }
  }

  // 删除标签
  async deleteTag(id: string): Promise<void> {
    const response: AxiosResponse<ApiResponse<any>> = 
      await this.client.delete(`/tags/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '删除标签失败');
    }
  }
}

export const apiClient = new ApiClient();
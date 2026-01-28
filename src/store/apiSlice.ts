import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {
  RealTimeResponse,
  HistoricalResponse,
  StatusSubmissionRequest,
  TagResponse,
  ApiResponse,
} from '../types';

// 基础查询配置
const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, {getState}) => {
    // 这里可以添加认证token等
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// 带错误处理的基础查询
const baseQueryWithErrorHandling = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQuery(args, api, extraOptions);
  
  if (result.error) {
    // 处理网络错误
    if (result.error.status === 'FETCH_ERROR') {
      console.error('网络连接错误:', result.error);
    }
    // 处理服务器错误
    else if (typeof result.error.status === 'number' && result.error.status >= 500) {
      console.error('服务器错误:', result.error);
    }
    // 处理客户端错误
    else if (typeof result.error.status === 'number' && result.error.status >= 400) {
      console.error('客户端错误:', result.error);
    }
  }
  
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ['RealTimeData', 'HistoricalData', 'UserStatus', 'Tags'],
  endpoints: builder => ({
    // 获取实时数据
    getRealTimeData: builder.query<RealTimeResponse, void>({
      query: () => '/realtime',
      providesTags: ['RealTimeData'],
    }),

    // 获取历史数据
    getHistoricalData: builder.query<HistoricalResponse, {date: string; time: string}>({
      query: ({date, time}) => `/historical?date=${date}&time=${time}`,
      providesTags: ['HistoricalData'],
    }),

    // 提交用户状态
    submitUserStatus: builder.mutation<ApiResponse<any>, StatusSubmissionRequest>({
      query: body => ({
        url: '/user/status',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RealTimeData', 'UserStatus'],
    }),

    // 获取标签列表
    getTags: builder.query<TagResponse[], {type?: string; search?: string}>({
      query: ({type, search}) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (search) params.append('search', search);
        return `/tags?${params.toString()}`;
      },
      providesTags: ['Tags'],
    }),

    // 创建标签
    createTag: builder.mutation<ApiResponse<TagResponse>, Partial<TagResponse>>({
      query: body => ({
        url: '/tags',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tags'],
    }),

    // 更新标签
    updateTag: builder.mutation<ApiResponse<TagResponse>, {id: string; data: Partial<TagResponse>}>({
      query: ({id, data}) => ({
        url: `/tags/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Tags'],
    }),

    // 删除标签
    deleteTag: builder.mutation<ApiResponse<any>, string>({
      query: id => ({
        url: `/tags/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tags'],
    }),
  }),
});

export const {
  useGetRealTimeDataQuery,
  useGetHistoricalDataQuery,
  useSubmitUserStatusMutation,
  useGetTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = apiSlice;
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RealTimeData, HistoricalData, Tag} from '../../types';

interface DataState {
  realTimeData: RealTimeData | null;
  historicalData: HistoricalData[];
  historicalDataCache: Record<number, HistoricalData>; // 时间戳 -> 历史数据
  selectedTime: string; // ISO 字符串格式
  isViewingHistory: boolean;
  currentViewData: RealTimeData | null; // 当前查看的数据（实时或历史）
  tags: Tag[];
  isLoading: boolean;
  isLoadingHistorical: boolean;
  error: string | null;
  lastUpdateTime: string | null; // ISO 字符串格式
}

const initialState: DataState = {
  realTimeData: null,
  historicalData: [],
  historicalDataCache: {},
  selectedTime: new Date().toISOString(),
  isViewingHistory: false,
  currentViewData: null,
  tags: [],
  isLoading: false,
  isLoadingHistorical: false,
  error: null,
  lastUpdateTime: null,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setRealTimeData: (state, action: PayloadAction<RealTimeData>) => {
      state.realTimeData = action.payload;
      state.lastUpdateTime = new Date().toISOString();
      state.error = null;
      // 如果不在查看历史数据，更新当前视图数据
      if (!state.isViewingHistory) {
        state.currentViewData = action.payload;
      }
    },
    addHistoricalData: (state, action: PayloadAction<HistoricalData>) => {
      // 将 Date 对象转换为 ISO 字符串以支持序列化
      const serializedPayload = {
        ...action.payload,
        data: {
          ...action.payload.data,
          timestamp:
            action.payload.data.timestamp instanceof Date
              ? action.payload.data.timestamp.toISOString()
              : action.payload.data.timestamp,
          // 转换 dailyStatus 数组中的 date 字段
          dailyStatus:
            action.payload.data.dailyStatus?.map((status: any) => ({
              ...status,
              date:
                status.date instanceof Date
                  ? status.date.toISOString()
                  : status.date,
            })) || [],
        },
      };

      const timestamp = new Date(serializedPayload.data.timestamp).getTime();
      const existingIndex = state.historicalData.findIndex(
        item => new Date(item.data.timestamp).getTime() === timestamp,
      );
      if (existingIndex >= 0) {
        state.historicalData[existingIndex] = serializedPayload as any;
      } else {
        state.historicalData.push(serializedPayload as any);
        // 保持历史数据按时间排序
        state.historicalData.sort(
          (a, b) =>
            new Date(a.data.timestamp).getTime() -
            new Date(b.data.timestamp).getTime(),
        );
      }
      // 更新缓存
      state.historicalDataCache[timestamp] = serializedPayload as any;
    },
    addHistoricalDataBatch: (
      state,
      action: PayloadAction<HistoricalData[]>,
    ) => {
      action.payload.forEach(item => {
        // 将 Date 对象转换为 ISO 字符串以支持序列化
        const serializedItem = {
          ...item,
          data: {
            ...item.data,
            timestamp:
              item.data.timestamp instanceof Date
                ? item.data.timestamp.toISOString()
                : item.data.timestamp,
            // 转换 dailyStatus 数组中的 date 字段
            dailyStatus:
              item.data.dailyStatus?.map((status: any) => ({
                ...status,
                date:
                  status.date instanceof Date
                    ? status.date.toISOString()
                    : status.date,
              })) || [],
          },
        };

        const timestamp = new Date(serializedItem.data.timestamp).getTime();
        const existingIndex = state.historicalData.findIndex(
          existing => new Date(existing.data.timestamp).getTime() === timestamp,
        );
        if (existingIndex >= 0) {
          state.historicalData[existingIndex] = serializedItem as any;
        } else {
          state.historicalData.push(serializedItem as any);
        }
        state.historicalDataCache[timestamp] = serializedItem as any;
      });
      // 保持历史数据按时间排序
      state.historicalData.sort(
        (a, b) =>
          new Date(a.data.timestamp).getTime() -
          new Date(b.data.timestamp).getTime(),
      );
    },
    setSelectedTime: (state, action: PayloadAction<string | Date>) => {
      // 支持字符串或 Date 对象，统一转换为 ISO 字符串存储
      const timeString =
        typeof action.payload === 'string'
          ? action.payload
          : action.payload.toISOString();
      state.selectedTime = timeString;

      const selectedDate = new Date(timeString);
      const now = new Date();

      // 判断是否是今天
      const isToday =
        selectedDate.getFullYear() === now.getFullYear() &&
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getDate() === now.getDate();

      // 只有不是今天才算查看历史数据
      state.isViewingHistory = !isToday;

      // 更新当前视图数据
      if (isToday && state.realTimeData) {
        state.currentViewData = state.realTimeData;
      } else {
        // 查找最接近的历史数据
        const timestamp = selectedDate.getTime();
        const cached = state.historicalDataCache[timestamp];
        if (cached && cached.isAvailable) {
          // 将 ISO 字符串转回 Date 对象
          state.currentViewData = {
            ...cached.data,
            timestamp: new Date(cached.data.timestamp),
          } as any;
        }
      }
    },
    setCurrentViewData: (state, action: PayloadAction<RealTimeData | null>) => {
      console.log('[dataSlice] setCurrentViewData called:', {
        hasData: !!action.payload,
        participantCount: action.payload?.participantCount,
        overtimeCount: action.payload?.overtimeCount,
        onTimeCount: action.payload?.onTimeCount,
      });
      state.currentViewData = action.payload;
    },
    setViewingHistory: (state, action: PayloadAction<boolean>) => {
      state.isViewingHistory = action.payload;
      if (!action.payload) {
        state.selectedTime = new Date().toISOString();
        state.currentViewData = state.realTimeData;
      }
    },
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.tags = action.payload;
    },
    addTag: (state, action: PayloadAction<Tag>) => {
      state.tags.push(action.payload);
    },
    updateTag: (
      state,
      action: PayloadAction<{id: string; data: Partial<Tag>}>,
    ) => {
      const index = state.tags.findIndex(tag => tag.id === action.payload.id);
      if (index >= 0) {
        state.tags[index] = {...state.tags[index], ...action.payload.data};
      }
    },
    removeTag: (state, action: PayloadAction<string>) => {
      state.tags = state.tags.filter(tag => tag.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLoadingHistorical: (state, action: PayloadAction<boolean>) => {
      state.isLoadingHistorical = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetDailyData: state => {
      // 每日重置时清空实时数据
      if (state.realTimeData) {
        state.realTimeData = {
          ...state.realTimeData,
          participantCount: 0,
          overtimeCount: 0,
          onTimeCount: 0,
          tagDistribution: [],
        };
      }
      state.lastUpdateTime = new Date().toISOString();
      if (!state.isViewingHistory) {
        state.currentViewData = state.realTimeData;
      }
    },
    clearHistoricalCache: state => {
      state.historicalDataCache = {};
      state.historicalData = [];
    },
  },
});

export const {
  setRealTimeData,
  addHistoricalData,
  addHistoricalDataBatch,
  setSelectedTime,
  setCurrentViewData,
  setViewingHistory,
  setTags,
  addTag,
  updateTag,
  removeTag,
  setLoading,
  setLoadingHistorical,
  setError,
  resetDailyData,
  clearHistoricalCache,
} = dataSlice.actions;

export default dataSlice.reducer;

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RealTimeData, HistoricalData, Tag} from '../../types';

interface DataState {
  realTimeData: RealTimeData | null;
  historicalData: HistoricalData[];
  selectedTime: Date;
  isViewingHistory: boolean;
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  lastUpdateTime: Date | null;
}

const initialState: DataState = {
  realTimeData: null,
  historicalData: [],
  selectedTime: new Date(),
  isViewingHistory: false,
  tags: [],
  isLoading: false,
  error: null,
  lastUpdateTime: null,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setRealTimeData: (state, action: PayloadAction<RealTimeData>) => {
      state.realTimeData = action.payload;
      state.lastUpdateTime = new Date();
      state.error = null;
    },
    addHistoricalData: (state, action: PayloadAction<HistoricalData>) => {
      const existingIndex = state.historicalData.findIndex(
        item => item.data.timestamp.getTime() === action.payload.data.timestamp.getTime()
      );
      if (existingIndex >= 0) {
        state.historicalData[existingIndex] = action.payload;
      } else {
        state.historicalData.push(action.payload);
        // 保持历史数据按时间排序
        state.historicalData.sort((a, b) => 
          a.data.timestamp.getTime() - b.data.timestamp.getTime()
        );
      }
    },
    setSelectedTime: (state, action: PayloadAction<Date>) => {
      state.selectedTime = action.payload;
      state.isViewingHistory = action.payload.getTime() !== new Date().getTime();
    },
    setViewingHistory: (state, action: PayloadAction<boolean>) => {
      state.isViewingHistory = action.payload;
      if (!action.payload) {
        state.selectedTime = new Date();
      }
    },
    setTags: (state, action: PayloadAction<Tag[]>) => {
      state.tags = action.payload;
    },
    addTag: (state, action: PayloadAction<Tag>) => {
      state.tags.push(action.payload);
    },
    updateTag: (state, action: PayloadAction<{id: string; data: Partial<Tag>}>) => {
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
      state.lastUpdateTime = new Date();
    },
  },
});

export const {
  setRealTimeData,
  addHistoricalData,
  setSelectedTime,
  setViewingHistory,
  setTags,
  addTag,
  updateTag,
  removeTag,
  setLoading,
  setError,
  resetDailyData,
} = dataSlice.actions;

export default dataSlice.reducer;
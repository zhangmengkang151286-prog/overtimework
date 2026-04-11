import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RealTimeData, Tag} from '../../types';

interface DataState {
  realTimeData: RealTimeData | null;
  currentViewData: RealTimeData | null;
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  lastUpdateTime: string | null; // ISO 字符串格式
}

const initialState: DataState = {
  realTimeData: null,
  currentViewData: null,
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
      state.lastUpdateTime = new Date().toISOString();
      state.error = null;
      state.currentViewData = action.payload;
    },
    setCurrentViewData: (state, action: PayloadAction<RealTimeData | null>) => {
      state.currentViewData = action.payload;
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
      state.currentViewData = state.realTimeData;
    },
  },
});

export const {
  setRealTimeData,
  setCurrentViewData,
  setTags,
  addTag,
  updateTag,
  removeTag,
  setLoading,
  setError,
  resetDailyData,
} = dataSlice.actions;

export default dataSlice.reducer;

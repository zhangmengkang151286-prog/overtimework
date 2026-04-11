import {configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';
import {apiSlice} from './apiSlice';
import userReducer from './slices/userSlice';
import dataReducer from './slices/dataSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    api: apiSlice.reducer,
    user: userReducer,
    data: dataReducer,
    ui: uiReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'data/setRealTimeData',
          'data/setCurrentViewData',
          'data/setTags',
          'user/setUser',
          'user/updateUserInfo',
        ],
        ignoredPaths: [
          'data.lastUpdateTime',
          'data.realTimeData.timestamp',
          'data.realTimeData.lastUpdated',
          'data.currentViewData.timestamp',
          'data.tags',
          'user.user.createdAt',
          'user.user.updatedAt',
          'user.currentUser.createdAt',
          'user.currentUser.updatedAt',
          'user.userStatus.lastSubmission.timestamp',
        ],
      },
    }).concat(apiSlice.middleware),
  devTools: __DEV__,
});

// 启用查询/缓存生命周期的监听器
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

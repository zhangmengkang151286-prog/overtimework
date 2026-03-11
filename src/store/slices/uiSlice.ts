import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  isMenuOpen: boolean;
  isStatusSelectorVisible: boolean;
  isTagSelectorVisible: boolean;
  isLoading: boolean;
  notifications: Notification[];
  currentScreen: string;
  error: string | null;
  isRetrying: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: Date;
}

const initialState: UIState = {
  theme: 'dark', // 默认使用深色模式（金融终端风格）
  isMenuOpen: false,
  isStatusSelectorVisible: false,
  isTagSelectorVisible: false,
  isLoading: false,
  notifications: [],
  currentScreen: 'TrendPage',
  error: null,
  isRetrying: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleTheme: state => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMenuOpen = action.payload;
    },
    toggleMenu: state => {
      state.isMenuOpen = !state.isMenuOpen;
    },
    setStatusSelectorVisible: (state, action: PayloadAction<boolean>) => {
      state.isStatusSelectorVisible = action.payload;
    },
    setTagSelectorVisible: (state, action: PayloadAction<boolean>) => {
      state.isTagSelectorVisible = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>,
    ) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload,
      );
    },
    clearNotifications: state => {
      state.notifications = [];
    },
    setCurrentScreen: (state, action: PayloadAction<string>) => {
      state.currentScreen = action.payload;
    },
    showStatusSelector: state => {
      state.isStatusSelectorVisible = true;
    },
    hideStatusSelector: state => {
      state.isStatusSelectorVisible = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setRetrying: (state, action: PayloadAction<boolean>) => {
      state.isRetrying = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setMenuOpen,
  toggleMenu,
  setStatusSelectorVisible,
  setTagSelectorVisible,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setCurrentScreen,
  showStatusSelector,
  hideStatusSelector,
  setError,
  setRetrying,
} = uiSlice.actions;

export default uiSlice.reducer;

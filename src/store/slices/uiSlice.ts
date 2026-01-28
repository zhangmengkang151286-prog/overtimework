import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  isMenuOpen: boolean;
  isStatusSelectorVisible: boolean;
  isTagSelectorVisible: boolean;
  isLoading: boolean;
  notifications: Notification[];
  currentScreen: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: Date;
}

const initialState: UIState = {
  theme: 'light',
  isMenuOpen: false,
  isStatusSelectorVisible: false,
  isTagSelectorVisible: false,
  isLoading: false,
  notifications: [],
  currentScreen: 'TrendPage',
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
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
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
} = uiSlice.actions;

export default uiSlice.reducer;
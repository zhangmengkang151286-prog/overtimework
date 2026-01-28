import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {User, UserStatus, UserStatusSubmission} from '../../types';

interface UserState {
  currentUser: User | null;
  userStatus: UserStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  userStatus: {
    hasSubmittedToday: false,
  },
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearUser: state => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.userStatus = {hasSubmittedToday: false};
      state.error = null;
    },
    setUserStatus: (state, action: PayloadAction<UserStatus>) => {
      state.userStatus = action.payload;
    },
    setUserSubmission: (state, action: PayloadAction<UserStatusSubmission>) => {
      state.userStatus.hasSubmittedToday = true;
      state.userStatus.lastSubmission = action.payload;
    },
    resetDailyStatus: state => {
      state.userStatus.hasSubmittedToday = false;
      state.userStatus.lastSubmission = undefined;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateUserInfo: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = {...state.currentUser, ...action.payload};
      }
    },
  },
});

export const {
  setUser,
  clearUser,
  setUserStatus,
  setUserSubmission,
  resetDailyStatus,
  setLoading,
  setError,
  updateUserInfo,
} = userSlice.actions;

export default userSlice.reducer;
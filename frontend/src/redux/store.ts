import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import registrationReducer from './registrationSlice';
import approvalReducer from './approvalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    registration: registrationReducer,
    approval: approvalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

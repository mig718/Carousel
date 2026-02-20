import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from '../redux/authSlice';

describe('authSlice', () => {
  test('initializes with default state', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
    });

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
  });

  test('clears auth state on logout', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
    });

    store.dispatch(logout());

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
  });
});

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';
import { authService } from '../services/userService';

interface AuthState {
  isAuthenticated: boolean;
  initialized: boolean;
  user: User | null;
  token: string | null;
  email: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  initialized: false,
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: null,
  email: null,
  loading: false,
  error: null,
};

export const initializeAuthAsync = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    if (!token || !email) {
      return { authenticated: false as const };
    }

    // Restore the session from localStorage without validating
    // Individual API calls will validate the token and log out if invalid
    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;

    return {
      authenticated: true as const,
      token,
      email,
      user,
    };
  }
);

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('Login attempt:', { email, apiUrl: process.env.REACT_APP_API_URL });
      const response = await authService.login({ email, password });
      console.log('Login successful:', response);
      localStorage.setItem('token', response.token);
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('email', response.email);
      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.initialized = true;
      state.user = null;
      state.token = null;
      state.email = null;
      localStorage.removeItem('token');
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      localStorage.removeItem('user');
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.email = action.payload.email;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error = action.payload as string;
      })
      .addCase(initializeAuthAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuthAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = action.payload.authenticated;
        state.token = action.payload.authenticated ? action.payload.token : null;
        state.email = action.payload.authenticated ? action.payload.email : null;
        state.user = action.payload.authenticated ? action.payload.user : null;
      })
      .addCase(initializeAuthAsync.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = false;
        state.token = null;
        state.email = null;
        state.user = null;
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;

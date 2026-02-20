import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RegisterResponse, PendingUser } from '../types';
import { userService } from '../services/userService';

interface RegistrationState {
  response: RegisterResponse | null;
  pendingUsers: PendingUser[];
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: RegistrationState = {
  response: null,
  pendingUsers: [],
  loading: false,
  error: null,
  message: null,
};

export const registerAsync = createAsyncThunk(
  'registration/register',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await userService.register(userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const verifyEmailAsync = createAsyncThunk(
  'registration/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const message = await userService.verifyEmail(token);
      return message;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Email verification failed');
    }
  }
);

export const fetchVerifiedPendingUsersAsync = createAsyncThunk(
  'registration/fetchVerifiedPendingUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getVerifiedPendingUsers();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending users');
    }
  }
);

const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    clearMessage: (state) => {
      state.message = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.response = action.payload;
        state.message = action.payload.message;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyEmailAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmailAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(verifyEmailAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchVerifiedPendingUsersAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVerifiedPendingUsersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingUsers = action.payload;
      })
      .addCase(fetchVerifiedPendingUsersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMessage, clearError } = registrationSlice.actions;
export default registrationSlice.reducer;

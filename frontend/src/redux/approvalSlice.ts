import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApprovalRequest } from '../types';
import { approvalService } from '../services/userService';

interface ApprovalState {
  approvals: ApprovalRequest[];
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: ApprovalState = {
  approvals: [],
  loading: false,
  error: null,
  message: null,
};

export const fetchPendingApprovalsAsync = createAsyncThunk(
  'approval/fetchPendingApprovals',
  async (_, { rejectWithValue }) => {
    try {
      return await approvalService.getPendingApprovals();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch approvals');
    }
  }
);

export const approveUserAsync = createAsyncThunk(
  'approval/approveUser',
  async ({ approvalId, approverEmail }: { approvalId: string; approverEmail: string }, { rejectWithValue }) => {
    try {
      return await approvalService.approveUser(approvalId, approverEmail);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve user');
    }
  }
);

const approvalSlice = createSlice({
  name: 'approval',
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
      .addCase(fetchPendingApprovalsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingApprovalsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.approvals = action.payload;
      })
      .addCase(fetchPendingApprovalsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(approveUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
      })
      .addCase(approveUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMessage, clearError } = approvalSlice.actions;
export default approvalSlice.reducer;

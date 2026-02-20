import apiClient from './api';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  PendingUser,
  ApprovalRequest,
  User
} from '../types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  validateToken: async (token: string, email: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<boolean>('/auth/validate', { token, email });
      return response.data;
    } catch {
      return false;
    }
  },
};

export const userService = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/users/register', data);
    return response.data;
  },

  verifyEmail: async (token: string): Promise<string> => {
    const response = await apiClient.get<string>('/users/verify', { params: { token } });
    return response.data;
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  },

  getUserByEmail: async (email: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/email/${email}`);
    return response.data;
  },

  getUsersByAccessLevel: async (accessLevel: string): Promise<User[]> => {
    const response = await apiClient.get<User[]>(`/users/access-level/${accessLevel}`);
    return response.data;
  },

  getVerifiedPendingUsers: async (): Promise<PendingUser[]> => {
    const response = await apiClient.get<PendingUser[]>('/users/pending/verified');
    return response.data;
  },
};

export const approvalService = {
  createApprovalRequest: async (data: {
    pendingUserId: string;
    email: string;
    firstName: string;
    lastName: string;
    requestedAccessLevel: string;
  }): Promise<string> => {
    const response = await apiClient.post<string>('/approvals/request', data);
    return response.data;
  },

  getPendingApprovals: async (): Promise<ApprovalRequest[]> => {
    const response = await apiClient.get<ApprovalRequest[]>('/approvals/pending');
    return response.data;
  },

  approveUser: async (approvalId: string, approverEmail: string): Promise<string> => {
    const response = await apiClient.post<string>(
      `/approvals/${approvalId}/approve`,
      {},
      { params: { approverEmail } }
    );
    return response.data;
  },
};

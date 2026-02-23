import apiClient from './api';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  PendingUser,
  ApprovalRequest,
  User,
  AccessLevel,
  UpdateOwnProfileRequest,
  Role,
  RoleAssignmentRequest,
  ResourceType,
  ResourceTypeRequest,
  InventoryItem,
  InventoryItemRequest
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

  getVerifiedPendingUsers: async (): Promise<PendingUser[]> => {
    const response = await apiClient.get<PendingUser[]>('/users/pending/verified');
    return response.data;
  },

  getCurrentUser: async (email: string): Promise<User> => {
    const response = await apiClient.get<User>('/users/me', { params: { email } });
    return response.data;
  },

  updateCurrentUser: async (email: string, data: UpdateOwnProfileRequest): Promise<User> => {
    const response = await apiClient.put<User>('/users/me', data, { params: { email } });
    return response.data;
  },

  getAllUsers: async (requesterEmail: string): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users/admin/all', { params: { requesterEmail } });
    return response.data;
  },

  updateUserAdmin: async (
    userId: string,
    requesterEmail: string,
    data: { firstName: string; lastName: string; accessLevel: AccessLevel }
  ): Promise<User> => {
    const response = await apiClient.put<User>(`/users/admin/${userId}`, data, { params: { requesterEmail } });
    return response.data;
  },
};

export const approvalService = {
  createApprovalRequest: async (data: {
    pendingUserId?: string;
    targetUserId?: string;
    email: string;
    firstName: string;
    lastName: string;
    requestedAccessLevel: string;
    requestType?: 'NEW_USER' | 'ACCESS_UPGRADE';
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

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>('/roles');
    return response.data;
  },

  getCustomRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>('/roles/custom');
    return response.data;
  },

  getRolesForUser: async (email: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`/roles/user/${encodeURIComponent(email)}`);
    return response.data;
  },

  userHasRole: async (email: string, roleName: string): Promise<boolean> => {
    const response = await apiClient.get<boolean>(`/roles/user/${encodeURIComponent(email)}/has/${encodeURIComponent(roleName)}`);
    return response.data;
  },

  createRole: async (requesterEmail: string, role: Role): Promise<Role> => {
    const response = await apiClient.post<Role>('/roles', role, { params: { requesterEmail } });
    return response.data;
  },

  updateRole: async (requesterEmail: string, roleName: string, role: Role): Promise<Role> => {
    const response = await apiClient.put<Role>(`/roles/${encodeURIComponent(roleName)}`, role, { params: { requesterEmail } });
    return response.data;
  },

  deleteRole: async (requesterEmail: string, roleName: string): Promise<string> => {
    const response = await apiClient.delete<string>(`/roles/${encodeURIComponent(roleName)}`, { params: { requesterEmail } });
    return response.data;
  },

  assignRole: async (requesterEmail: string, request: RoleAssignmentRequest): Promise<string> => {
    const response = await apiClient.post<string>('/roles/assign', request, { params: { requesterEmail } });
    return response.data;
  },

  unassignRole: async (requesterEmail: string, request: RoleAssignmentRequest): Promise<string> => {
    const response = await apiClient.delete<string>('/roles/assign', { data: request, params: { requesterEmail } });
    return response.data;
  },
};

export const inventoryService = {
  getTypes: async (requesterEmail: string): Promise<ResourceType[]> => {
    const response = await apiClient.get<ResourceType[]>('/inventory/types', { params: { requesterEmail } });
    return response.data;
  },

  getIcons: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/inventory/icons');
    return response.data;
  },

  createType: async (requesterEmail: string, request: ResourceTypeRequest): Promise<ResourceType> => {
    const response = await apiClient.post<ResourceType>('/inventory/types', request, { params: { requesterEmail } });
    return response.data;
  },

  updateType: async (requesterEmail: string, typeId: string, request: ResourceTypeRequest): Promise<ResourceType> => {
    const response = await apiClient.put<ResourceType>(`/inventory/types/${encodeURIComponent(typeId)}`, request, { params: { requesterEmail } });
    return response.data;
  },

  getItems: async (requesterEmail: string): Promise<InventoryItem[]> => {
    const response = await apiClient.get<InventoryItem[]>('/inventory/items', { params: { requesterEmail } });
    return response.data;
  },

  createItem: async (requesterEmail: string, request: InventoryItemRequest): Promise<InventoryItem> => {
    const response = await apiClient.post<InventoryItem>('/inventory/items', request, { params: { requesterEmail } });
    return response.data;
  },

  updateItem: async (requesterEmail: string, itemId: string, request: InventoryItemRequest): Promise<InventoryItem> => {
    const response = await apiClient.put<InventoryItem>(`/inventory/items/${encodeURIComponent(itemId)}`, request, { params: { requesterEmail } });
    return response.data;
  },

  adjustQuantity: async (requesterEmail: string, itemId: string, quantityDelta: number): Promise<InventoryItem> => {
    const response = await apiClient.patch<InventoryItem>(`/inventory/items/${encodeURIComponent(itemId)}/quantity`, { quantityDelta }, { params: { requesterEmail } });
    return response.data;
  },
};

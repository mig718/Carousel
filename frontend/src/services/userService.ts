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
  RoleAssignment,
  RoleAssignmentRequest,
  AuditEvent,
  Resource,
  ResourceRequest,
  ResourceCatalog,
  InventoryItem,
  InventoryItemRequest,
  Style,
  StyleRequest,
  ResourceType,
  ResourceTypeRequest,
  ResourceTag,
  ResourceTagRequest,
  InventoryItemCustomTag,
  InventoryItemCustomTagRequest,
  TagGraphicOption
} from '../types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials, {
      headers: {
        'X-Login-Email': credentials.email,
      },
    });
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

  createUserAdmin: async (
    requesterEmail: string,
    data: { firstName: string; lastName: string; email: string; accessLevel: AccessLevel }
  ): Promise<User> => {
    const response = await apiClient.post<User>('/users/admin/create', data, { params: { requesterEmail } });
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
    const response = await apiClient.get<Role[]>('/roles/');
    return response.data;
  },

  getAssignments: async (requesterEmail: string): Promise<RoleAssignment[]> => {
    const response = await apiClient.get<RoleAssignment[]>('/roles/assignments', { params: { requesterEmail } });
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
    const response = await apiClient.post<Role>('/roles/', role, { params: { requesterEmail } });
    return response.data;
  },

  updateRole: async (requesterEmail: string, roleId: string, role: Role): Promise<Role> => {
    const response = await apiClient.put<Role>(`/roles/${encodeURIComponent(roleId)}`, role, { params: { requesterEmail } });
    return response.data;
  },

  deleteRole: async (requesterEmail: string, roleId: string): Promise<string> => {
    const response = await apiClient.delete<string>(`/roles/${encodeURIComponent(roleId)}`, { params: { requesterEmail } });
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
  getResourceTypes: async (requesterEmail: string): Promise<ResourceType[]> => {
    const response = await apiClient.get<ResourceType[]>('/inventory/resource-types', { params: { requesterEmail } });
    return response.data;
  },

  createResourceType: async (requesterEmail: string, request: ResourceTypeRequest): Promise<ResourceType> => {
    const response = await apiClient.post<ResourceType>('/inventory/resource-types', request, { params: { requesterEmail } });
    return response.data;
  },

  updateResourceType: async (requesterEmail: string, resourceTypeId: string, request: ResourceTypeRequest): Promise<ResourceType> => {
    const response = await apiClient.put<ResourceType>(`/inventory/resource-types/${encodeURIComponent(resourceTypeId)}`, request, { params: { requesterEmail } });
    return response.data;
  },

  deleteResourceType: async (requesterEmail: string, resourceTypeId: string): Promise<void> => {
    await apiClient.delete(`/inventory/resource-types/${encodeURIComponent(resourceTypeId)}`, { params: { requesterEmail } });
  },

  getResourceTags: async (requesterEmail: string): Promise<ResourceTag[]> => {
    const response = await apiClient.get<ResourceTag[]>('/inventory/resource-tags', { params: { requesterEmail } });
    return response.data;
  },

  createResourceTag: async (requesterEmail: string, request: ResourceTagRequest): Promise<ResourceTag> => {
    const response = await apiClient.post<ResourceTag>('/inventory/resource-tags', request, { params: { requesterEmail } });
    return response.data;
  },

  updateResourceTag: async (requesterEmail: string, resourceTagId: string, request: ResourceTagRequest): Promise<ResourceTag> => {
    const response = await apiClient.put<ResourceTag>(`/inventory/resource-tags/${encodeURIComponent(resourceTagId)}`, request, { params: { requesterEmail } });
    return response.data;
  },

  deleteResourceTag: async (requesterEmail: string, resourceTagId: string): Promise<void> => {
    await apiClient.delete(`/inventory/resource-tags/${encodeURIComponent(resourceTagId)}`, { params: { requesterEmail } });
  },

  getResourceIcons: async (requesterEmail: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/inventory/resource-icons', { params: { requesterEmail } });
    return response.data;
  },

  getTagGraphics: async (requesterEmail: string): Promise<TagGraphicOption[]> => {
    const response = await apiClient.get<TagGraphicOption[]>('/inventory/tag-graphics', { params: { requesterEmail } });
    return response.data;
  },
  getResources: async (requesterEmail: string): Promise<Resource[]> => {
    const response = await apiClient.get<Resource[]>('/inventory/resources', { params: { requesterEmail } });
    return response.data;
  },

  getResourceCatalog: async (requesterEmail: string): Promise<ResourceCatalog[]> => {
    const response = await apiClient.get<ResourceCatalog[]>('/inventory/resources/catalog', { params: { requesterEmail } });
    return response.data;
  },

  createResource: async (requesterEmail: string, request: ResourceRequest): Promise<Resource> => {
    const response = await apiClient.post<Resource>('/inventory/resources', request, { params: { requesterEmail } });
    return response.data;
  },

  updateResource: async (requesterEmail: string, resourceId: string, request: ResourceRequest): Promise<Resource> => {
    const response = await apiClient.put<Resource>(`/inventory/resources/${encodeURIComponent(resourceId)}`, request, { params: { requesterEmail } });
    return response.data;
  },

  getItems: async (requesterEmail: string): Promise<InventoryItem[]> => {
    const response = await apiClient.get<InventoryItem[]>('/inventory/items', { params: { requesterEmail } });
    return response.data;
  },

  getItemById: async (requesterEmail: string, itemId: string): Promise<InventoryItem> => {
    const response = await apiClient.get<InventoryItem>(`/inventory/items/${encodeURIComponent(itemId)}`, { params: { requesterEmail } });
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

  getItemCustomTags: async (requesterEmail: string): Promise<InventoryItemCustomTag[]> => {
    const response = await apiClient.get<InventoryItemCustomTag[]>('/inventory/item-custom-tags', { params: { requesterEmail } });
    return response.data;
  },

  createItemCustomTag: async (requesterEmail: string, request: InventoryItemCustomTagRequest): Promise<InventoryItemCustomTag> => {
    const response = await apiClient.post<InventoryItemCustomTag>('/inventory/item-custom-tags', request, { params: { requesterEmail } });
    return response.data;
  },

  updateItemCustomTag: async (requesterEmail: string, tagId: string, request: InventoryItemCustomTagRequest): Promise<InventoryItemCustomTag> => {
    const response = await apiClient.put<InventoryItemCustomTag>(`/inventory/item-custom-tags/${encodeURIComponent(tagId)}`, request, { params: { requesterEmail } });
    return response.data;
  },

  deleteItemCustomTag: async (requesterEmail: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/inventory/item-custom-tags/${encodeURIComponent(tagId)}`, { params: { requesterEmail } });
  },

  getStyles: async (requesterEmail: string): Promise<Style[]> => {
    const response = await apiClient.get<Style[]>('/inventory/styles', { params: { requesterEmail } });
    return response.data;
  },

  getStyleById: async (requesterEmail: string, styleId: string): Promise<Style> => {
    const response = await apiClient.get<Style>(`/inventory/styles/${encodeURIComponent(styleId)}`, { params: { requesterEmail } });
    return response.data;
  },

  createStyle: async (requesterEmail: string, request: StyleRequest): Promise<Style> => {
    const response = await apiClient.post<Style>('/inventory/styles', request, { params: { requesterEmail } });
    return response.data;
  },

  updateStyle: async (requesterEmail: string, styleId: string, request: StyleRequest): Promise<Style> => {
    const response = await apiClient.put<Style>(`/inventory/styles/${encodeURIComponent(styleId)}`, request, { params: { requesterEmail } });
    return response.data;
  },

  deleteStyle: async (requesterEmail: string, styleId: string): Promise<void> => {
    await apiClient.delete(`/inventory/styles/${encodeURIComponent(styleId)}`, { params: { requesterEmail } });
  },
};

export const auditService = {
  getUserHistory: async (requesterEmail: string, targetEmail: string, limit = 200): Promise<AuditEvent[]> => {
    const response = await apiClient.get<AuditEvent[]>('/audit/history', {
      params: {
        requesterEmail,
        targetEmail,
        limit,
      },
    });
    return response.data;
  },

  trackLogout: async (requesterEmail: string): Promise<void> => {
    await apiClient.post('/audit/logout', {}, {
      params: {
        requesterEmail,
      },
    });
  },
};

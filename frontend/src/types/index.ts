export enum AccessLevel {
  User = 'User',
  Admin = 'Admin'
}

export interface Role {
  name: string;
  description: string;
}

export interface RoleAssignmentRequest {
  userEmail: string;
  roleName: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accessLevel: AccessLevel;
}

export interface PendingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  requestedAccessLevel: AccessLevel;
  emailVerified: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  sessionToken: string;
  userId: string;
  email: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accessLevel: AccessLevel;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
  requiresApproval: boolean;
}

export interface ApprovalRequest {
  id: string;
  pendingUserId: string;
  targetUserId?: string;
  email: string;
  firstName: string;
  lastName: string;
  requestedAccessLevel: AccessLevel;
  requestType?: 'NEW_USER' | 'ACCESS_UPGRADE';
  createdAt?: string;
  approved: boolean;
}

export interface UpdateOwnProfileRequest {
  firstName: string;
  lastName: string;
}

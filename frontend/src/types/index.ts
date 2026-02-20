export enum AccessLevel {
  ReadOnly = 'ReadOnly',
  ReadWrite = 'ReadWrite',
  Admin = 'Admin'
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
  email: string;
  firstName: string;
  lastName: string;
  requestedAccessLevel: AccessLevel;
  approved: boolean;
}

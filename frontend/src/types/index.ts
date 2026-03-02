export enum AccessLevel {
  User = 'User',
  Admin = 'Admin'
}

export interface Role {
  id?: string;
  name: string;
  description: string;
  editable?: boolean;
}

export interface RoleAssignmentRequest {
  userId?: string;
  roleId?: string;
  userEmail?: string;
  roleName?: string;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  roleId: string;
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
  sessionToken?: string;
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

export interface Resource {
  id: string;
  category: string;
  type: string;
  subType?: string;
  resourceTypeId?: string;
  icon?: string;
  tags?: string[];
  editable?: boolean;
  description: string;
}

export interface ResourceRequest {
  resourceTypeId: string;
  tagIds?: string[];
  category: string;
  type: string;
  subType?: string;
  description: string;
}

export interface ResourceType {
  id: string;
  name: string;
  description: string;
  icon: string;
  parentTypeId?: string;
  parentTypeName?: string;
  editable: boolean;
}

export interface ResourceTypeRequest {
  name: string;
  description: string;
  icon: string;
  parentTypeId?: string;
}

export enum TagGraphic {
  Diamond = 'Diamond',
  Bullion = 'Bullion',
  Cast = 'Cast',
  Chain = 'Chain',
  Gear = 'Gear',
  Ruler = 'Ruler',
  Thread = 'Thread',
  Box = 'Box',
  Gem = 'Gem',
  Ingot = 'Ingot',
  Anvil = 'Anvil',
  Crucible = 'Crucible',
  Spark = 'Spark',
  Shield = 'Shield',
  Star = 'Star',
  Flame = 'Flame',
  Droplet = 'Droplet',
  Leaf = 'Leaf',
}

export interface TagGraphicOption {
  key: TagGraphic;
  label: string;
  icon: string;
}

export interface ResourceTag {
  id: string;
  name: string;
  description: string;
  color: string;
  graphic: TagGraphic;
  editable: boolean;
}

export interface ResourceTagRequest {
  name: string;
  description: string;
  color: string;
  graphic: TagGraphic;
}

export interface ResourceCatalogType {
  name: string;
  subTypes: string[];
}

export interface ResourceCatalog {
  category: string;
  types: ResourceCatalogType[];
}

export interface InventoryItem {
  id: string;
  resourceId: string;
  resourceCategory: string;
  resourceType: string;
  resourceSubType?: string;
  resourceTags?: string;
  resourceIcon?: string;
  resourceDescription?: string;
  customTagIds?: string[];
  customTagNames?: string[];
  availableQuantity: number;
  pendingQuantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItemRequest {
  resourceId: string;
  availableQuantity?: number;
  pendingQuantity?: number;
  customTagIds?: string[];
}

export interface InventoryItemCustomTag {
  id: string;
  name: string;
  description: string;
  color: string;
  graphic: TagGraphic;
  editable: boolean;
}

export interface InventoryItemCustomTagRequest {
  name: string;
  description: string;
  color: string;
  graphic: TagGraphic;
}

export interface AuditEvent {
  id: string;
  actorEmail: string;
  actionType: string;
  httpMethod: string;
  requestPath: string;
  resourceType: string;
  resourceId: string;
  statusCode: number;
  success: boolean;
  requestId: string;
  sessionId: string;
  details: string;
  createdAt: string;
}

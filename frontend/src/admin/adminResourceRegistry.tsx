import React from 'react';
import UsersPage from '../pages/UsersPage';
import AdminRolesPage from '../pages/AdminRolesPage';
import AdminInventoryPage from '../pages/AdminInventoryPage';
import AdminUserActivityPage from '../pages/AdminUserActivityPage';

export interface AdminResourceDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: React.ComponentType;
}

export const adminResourceRegistry: AdminResourceDefinition[] = [
  {
    id: 'users',
    title: 'Users',
    description: 'Direct user account and access-level table operations.',
    icon: '👥',
    component: UsersPage,
  },
  {
    id: 'roles',
    title: 'Roles',
    description: 'Direct role and assignment table operations.',
    icon: '🔑',
    component: AdminRolesPage,
  },
  {
    id: 'inventory',
    title: 'Inventory',
    description: 'Direct resource and item table operations.',
    icon: '📦',
    component: AdminInventoryPage,
  },
  {
    id: 'activity',
    title: 'Activity',
    description: 'User action history for login/logout and data changes.',
    icon: '🕒',
    component: AdminUserActivityPage,
  },
];

export const getAdminResourceById = (id: string): AdminResourceDefinition | undefined => {
  return adminResourceRegistry.find((resource) => resource.id === id);
};

import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { roleService, userService } from '../services/userService';
import './SettingsUsersPage.css';

const SettingsUsersPage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const email = useSelector((state: RootState) => state.auth.email) || localStorage.getItem('email') || '';
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadAccess = async () => {
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = user ?? await userService.getCurrentUser(email);
        if (isActive) {
          setIsAdmin(currentUser.accessLevel === 'Admin');
        }
      } catch {
        if (isActive) {
          setIsAdmin(false);
        }
      }

      try {
        const userRoles = await roleService.getRolesForUser(email);
        if (isActive) {
          setRoles(userRoles);
        }
      } catch {
        if (isActive) {
          setRoles([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadAccess();
    return () => {
      isActive = false;
    };
  }, [email, user]);

  const roleSet = useMemo(() => new Set(roles.map((role) => role.toLowerCase())), [roles]);
  const hasRole = (name: string) => roleSet.has(name.toLowerCase());
  const canAccess = isAdmin || hasRole('supportusers');

  if (!loading && !canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="settings-detail">
      <div className="settings-detail-header">
        <h1>User Settings</h1>
        <p>Common support actions for user management.</p>
      </div>

      <div className="settings-list">
        <div className="settings-list-item">New user</div>
        <div className="settings-list-item">Edit user</div>
        <div className="settings-list-item">Reset password</div>
        <div className="settings-list-item">Deactivate user</div>
      </div>
    </div>
  );
};

export default SettingsUsersPage;

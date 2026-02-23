import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { roleService, userService } from '../services/userService';
import './SettingsDashboard.css';

const SettingsDashboard: React.FC = () => {
  const navigate = useNavigate();
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

  const canViewSettings = isAdmin || hasRole('support');
  const showUsersCard = isAdmin || hasRole('supportusers');
  const showInventoryCard = isAdmin || hasRole('supportinventory');

  if (!loading && !canViewSettings) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="settings-dashboard">
      <div className="settings-dashboard-header">
        <h1>Settings</h1>
        <p>Manage workflows and tools by common support use cases.</p>
      </div>

      <div className="settings-card-grid">
        {showUsersCard && (
          <button className="settings-card" onClick={() => navigate('/settings/users')}>
            <div className="settings-card-icon" aria-hidden="true">🧭</div>
            <div className="settings-card-content">
              <h2>Users</h2>
              <p>Guided actions for common user support tasks.</p>
            </div>
            <span className="settings-card-action">Open</span>
          </button>
        )}

        {showInventoryCard && (
          <button className="settings-card" onClick={() => navigate('/settings/inventory')}>
            <div className="settings-card-icon" aria-hidden="true">🧰</div>
            <div className="settings-card-content">
              <h2>Inventory</h2>
              <p>Common inventory workflows and tools.</p>
            </div>
            <span className="settings-card-action">Open</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsDashboard;

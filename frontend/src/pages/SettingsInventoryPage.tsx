import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { roleService, userService } from '../services/userService';
import './SettingsInventoryPage.css';

const SettingsInventoryPage: React.FC = () => {
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
  const canAccess = isAdmin || hasRole('supportinventory');

  if (!loading && !canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="settings-detail">
      <div className="settings-detail-header">
        <h1>Inventory Settings</h1>
        <p>Common workflows for inventory support.</p>
      </div>

      <div className="settings-list">
        <div className="settings-list-item">Add item type</div>
        <div className="settings-list-item">Update inventory item</div>
        <div className="settings-list-item">Adjust stock levels</div>
        <div className="settings-list-item">Archive item</div>
      </div>
    </div>
  );
};

export default SettingsInventoryPage;

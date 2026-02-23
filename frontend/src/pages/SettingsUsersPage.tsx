import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { roleService, userService } from '../services/userService';
import NotImplementedCard from '../components/NotImplementedCard';
import { NotImplementedException } from '../types/NotImplementedException';

const SettingsUsersPage: React.FC = () => {
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
  const canAccess = isAdmin || hasRole('supportusers');

  if (!loading && !canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const onNotImplementedClick = (featureName: string) => {
    try {
      throw new NotImplementedException({
        title: featureName,
        message: 'Functionality not yet implemented',
        description: `The ${featureName.toLowerCase()} workflow is currently in development and will be available in a future release.`,
        icon: '🧭',
        variant: 'search',
      });
    } catch (error) {
      if (error instanceof NotImplementedException) {
        navigate('/not-implemented', { state: error.payload });
        return;
      }

      throw error;
    }
  };

  return (
    <NotImplementedCard
      title="User Settings"
      message="Functionality not yet implemented"
      description="Common support actions for user management."
      variant="settings-list"
      items={['New user', 'Edit user', 'Reset password', 'Deactivate user']}
      onItemClick={onNotImplementedClick}
    />
  );
};

export default SettingsUsersPage;

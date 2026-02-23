import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { roleService, userService } from '../services/userService';
import { Role, User } from '../types';
import './AdminAddRoleAssignmentPage.css';

const AdminAddRoleAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const requesterEmail = localStorage.getItem('email') || '';

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [selectedRoleName, setSelectedRoleName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [roleStatus, setRoleStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    let isActive = true;

    const loadAccess = async () => {
      if (!requesterEmail) {
        setCheckingAccess(false);
        return;
      }

      try {
        const currentUser = await userService.getCurrentUser(requesterEmail);
        if (isActive) {
          setIsAdmin(currentUser.accessLevel === 'Admin');
        }
      } catch {
        if (isActive) {
          setIsAdmin(false);
        }
      } finally {
        if (isActive) {
          setCheckingAccess(false);
        }
      }
    };

    loadAccess();
    return () => {
      isActive = false;
    };
  }, [requesterEmail]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadData = async () => {
      try {
        const rolesData = await roleService.getRoles();
        setRoles(rolesData || []);
      } catch (err) {
        console.warn('Failed to load roles dropdown data:', err);
        setRoles([]);
      }

      try {
        const usersData = await userService.getAllUsers(requesterEmail);
        setUsers(usersData || []);
      } catch (err) {
        console.warn('Failed to load users dropdown data:', err);
        setUsers([]);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [isAdmin, requesterEmail]);

  if (!checkingAccess && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const isFormValid = userStatus === 'valid' && roleStatus === 'valid' && !loading;

  const validateUser = (value: string) => value.trim().length > 0;
  const validateRole = (value: string) => value.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await roleService.assignRole(requesterEmail, {
        userEmail: selectedUserEmail,
        roleName: selectedRoleName,
      });
      navigate('/admin/roles');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create role assignment';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-add-assignment">
      <div className="admin-add-assignment-header">
        <h1>Create Role Assignment</h1>
        <p>Assign a role to a user.</p>
      </div>

      <form className="admin-add-assignment-form" onSubmit={handleSubmit}>
        {error && <div className="admin-add-assignment-error">{error}</div>}

        <div className="admin-add-assignment-field">
          <label htmlFor="userEmail">User</label>
          <div className={`validated-control ${userStatus}`}>
            <select
              id="userEmail"
              value={selectedUserEmail}
              onChange={(e) => {
                setSelectedUserEmail(e.target.value);
                setUserStatus('idle');
              }}
              onBlur={() => setUserStatus(validateUser(selectedUserEmail) ? 'valid' : 'invalid')}
              required
              disabled={dataLoading}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.email} value={user.email}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            <span className="control-icon control-icon-valid" aria-hidden="true">✓</span>
            <span className="control-icon control-icon-invalid" aria-hidden="true">✕</span>
          </div>
          {userStatus === 'invalid' && (
            <div className="field-error">Please select a user.</div>
          )}
        </div>

        <div className="admin-add-assignment-field">
          <label htmlFor="roleName">Role</label>
          <div className={`validated-control ${roleStatus}`}>
            <select
              id="roleName"
              value={selectedRoleName}
              onChange={(e) => {
                setSelectedRoleName(e.target.value);
                setRoleStatus('idle');
              }}
              onBlur={() => setRoleStatus(validateRole(selectedRoleName) ? 'valid' : 'invalid')}
              required
              disabled={dataLoading}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
            <span className="control-icon control-icon-valid" aria-hidden="true">✓</span>
            <span className="control-icon control-icon-invalid" aria-hidden="true">✕</span>
          </div>
          {roleStatus === 'invalid' && (
            <div className="field-error">Please select a role.</div>
          )}
        </div>

        <div className="admin-add-assignment-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/roles')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!isFormValid || dataLoading}>
            {loading ? 'Assigning...' : 'Assign Role'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddRoleAssignmentPage;

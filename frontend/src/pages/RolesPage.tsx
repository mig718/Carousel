import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { roleService, userService } from '../services/userService';
import { Role, User } from '../types';
import './RolesPage.css';

const RolesPage: React.FC = () => {
  const requesterEmail = localStorage.getItem('email') || '';

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [selectedRoleName, setSelectedRoleName] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isAdmin = currentUser?.accessLevel === 'Admin';

  const roleNames = useMemo(() => roles.map((role) => role.name), [roles]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, allRoles, allUsers] = await Promise.all([
        userService.getCurrentUser(requesterEmail),
        roleService.getRoles(),
        userService.getAllUsers(requesterEmail),
      ]);

      setCurrentUser(me);
      setRoles(allRoles);
      setUsers(allUsers);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load roles data');
    } finally {
      setLoading(false);
    }
  }, [requesterEmail]);

  useEffect(() => {
    if (requesterEmail) {
      loadData();
    } else {
      setLoading(false);
      setError('Missing session email');
    }
  }, [requesterEmail, loadData]);

  const handleCreateRole = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      await roleService.createRole(requesterEmail, {
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
      });

      setNewRoleName('');
      setNewRoleDescription('');
      setMessage('Role created successfully');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (role: Role) => {
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      await roleService.updateRole(requesterEmail, role.name, role);
      setMessage(`Updated role ${role.name}`);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleName: string) => {
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      await roleService.deleteRole(requesterEmail, roleName);
      setMessage(`Deleted role ${roleName}`);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete role');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRole = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      await roleService.assignRole(requesterEmail, {
        userEmail: selectedUserEmail,
        roleName: selectedRoleName,
      });

      setMessage('Role assigned successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign role');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignRole = async () => {
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      await roleService.unassignRole(requesterEmail, {
        userEmail: selectedUserEmail,
        roleName: selectedRoleName,
      });

      setMessage('Role unassigned successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unassign role');
    } finally {
      setSaving(false);
    }
  };

  const updateLocalRoleDescription = (roleName: string, description: string) => {
    setRoles((prev) => prev.map((role) => role.name === roleName ? { ...role, description } : role));
  };

  if (!loading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="roles-container">
      <div className="roles-header">
        <h1>Roles Administration</h1>
        <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {loading ? (
        <div>Loading roles...</div>
      ) : (
        <>
          <div className="roles-card">
            <h2>Create Role</h2>
            <form className="roles-form" onSubmit={handleCreateRole}>
              <input
                placeholder="Role name"
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                required
              />
              <input
                placeholder="Role description"
                value={newRoleDescription}
                onChange={(event) => setNewRoleDescription(event.target.value)}
                required
              />
              <button className="btn-primary" type="submit" disabled={saving}>Create Role</button>
            </form>
          </div>

          <div className="roles-card">
            <h2>Manage Roles</h2>
            <div className="roles-list">
              {roles.map((role) => (
                <div key={role.name} className="role-row">
                  <div className="role-name">{role.name}</div>
                  <input
                    value={role.description}
                    onChange={(event) => updateLocalRoleDescription(role.name, event.target.value)}
                  />
                  <button className="btn-primary" onClick={() => handleUpdateRole(role)} disabled={saving}>Save</button>
                  <button className="btn-danger" onClick={() => handleDeleteRole(role.name)} disabled={saving}>Delete</button>
                </div>
              ))}
            </div>
          </div>

          <div className="roles-card">
            <h2>Assign / Unassign Roles</h2>
            <form className="roles-form-inline" onSubmit={handleAssignRole}>
              <select
                value={selectedUserEmail}
                onChange={(event) => setSelectedUserEmail(event.target.value)}
                required
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.email}>{user.email}</option>
                ))}
              </select>

              <select
                value={selectedRoleName}
                onChange={(event) => setSelectedRoleName(event.target.value)}
                required
              >
                <option value="">Select role</option>
                {roleNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <button className="btn-primary" type="submit" disabled={saving}>Assign</button>
              <button className="btn-secondary" type="button" disabled={saving} onClick={() => void handleUnassignRole()}>Unassign</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default RolesPage;

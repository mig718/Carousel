import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { roleService, userService } from '../services/userService';
import { User } from '../types';
import './UsersPage.css';

const UsersPage: React.FC = () => {
  const requesterEmail = localStorage.getItem('email') || '';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  const canAccess = useMemo(
    () => roles.some((role) => role.toLowerCase() === 'support'),
    [roles]
  );

  useEffect(() => {
    const loadUsers = async () => {
      try {
        await userService.getCurrentUser(requesterEmail);

        const userRoles = await roleService.getRolesForUser(requesterEmail);
        setRoles(userRoles);
        const hasAccess = userRoles.some((role) => role.toLowerCase() === 'support');
        if (!hasAccess) {
          return;
        }

        const data = await userService.getAllUsers(requesterEmail);
        setUsers(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (requesterEmail) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [requesterEmail]);

  const updateField = (id: string, field: keyof User, value: string) => {
    setUsers((prev) => prev.map((user) => user.id === id ? { ...user, [field]: value } : user));
  };

  const saveUser = async (user: User) => {
    setError(null);
    setMessage(null);
    setSavingId(user.id);
    try {
      const updated = await userService.updateUserAdmin(user.id, requesterEmail, {
        firstName: user.firstName,
        lastName: user.lastName,
        accessLevel: user.accessLevel,
      });

      setUsers((prev) => prev.map((item) => item.id === user.id ? updated : item));
      setMessage(`Updated ${updated.firstName} ${updated.lastName}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingId(null);
    }
  };

  if (!loading && !canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>Users</h1>
        <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div className="users-list">
          {users.map((user) => (
            <div key={user.id} className="user-row">
              <input
                value={user.firstName}
                onChange={(event) => updateField(user.id, 'firstName', event.target.value)}
              />
              <input
                value={user.lastName}
                onChange={(event) => updateField(user.id, 'lastName', event.target.value)}
              />
              <input value={user.email} disabled />
              <button className="btn-primary" onClick={() => saveUser(user)} disabled={savingId === user.id}>
                {savingId === user.id ? 'Saving...' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPage;

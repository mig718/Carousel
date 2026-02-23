import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { roleService, userService } from '../services/userService';
import { AccessLevel, User } from '../types';
import DataTable from '../components/DataTable';
import './UsersPage.css';

interface EditableTextCellProps {
  value: string;
  originalValue: string;
  placeholder?: string;
  onCommit: (nextValue: string) => void;
}

const EditableTextCell: React.FC<EditableTextCellProps> = ({
  value,
  originalValue,
  placeholder,
  onCommit,
}) => {
  const [draftValue, setDraftValue] = useState(value ?? '');

  useEffect(() => {
    setDraftValue(value ?? '');
  }, [value]);

  const isDirty = value !== originalValue;

  return (
    <div className={`editable-control ${isDirty ? 'is-dirty' : ''}`}>
      <input
        type="text"
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        onBlur={() => onCommit(draftValue)}
        placeholder={placeholder}
      />
      <span className="control-check" aria-hidden="true">
        ✓
      </span>
    </div>
  );
};


const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const requesterEmail = localStorage.getItem('email') || '';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const canAccess = useMemo(
    () => isAdmin || roles.some((role) => role.toLowerCase() === 'support'),
    [isAdmin, roles]
  );

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const currentUser = await userService.getCurrentUser(requesterEmail);
        const adminAccess = currentUser.accessLevel === 'Admin';
        setIsAdmin(adminAccess);

        let hasSupportRole = false;
        try {
          const userRoles = await roleService.getRolesForUser(requesterEmail);
          setRoles(userRoles);
          hasSupportRole = userRoles.some((role) => role.toLowerCase() === 'support');
        } catch {
          setRoles([]);
        }

        const hasAccess = adminAccess || hasSupportRole;
        if (!hasAccess) {
          return;
        }

        const data = await userService.getAllUsers(requesterEmail);
        setUsers(data);
        setError(null);
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

  const handleRowUpdate = async (userId: string, updates: Partial<User>) => {
    try {
      const existingUser = users.find((user) => user.id === userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const updated = await userService.updateUserAdmin(userId, requesterEmail, {
        firstName: updates.firstName ?? existingUser.firstName,
        lastName: updates.lastName ?? existingUser.lastName,
        accessLevel: (updates.accessLevel ?? existingUser.accessLevel) as AccessLevel,
      });
      setUsers((prev) => prev.map((user) => (user.id === userId ? updated : user)));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
      throw err;
    }
  };

  if (!loading && !canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const columns = [
    {
      key: 'firstName',
      label: 'First Name',
      render: (
        value: string,
        row: User,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          placeholder="First name"
          onCommit={(nextValue) => onCommit('firstName', nextValue, originalValue || '')}
        />
      ),
    },
    {
      key: 'lastName',
      label: 'Last Name',
      render: (
        value: string,
        row: User,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          placeholder="Last name"
          onCommit={(nextValue) => onCommit('lastName', nextValue, originalValue || '')}
        />
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value: string) => (
        <span className="email-field">{value}</span>
      ),
    },
    {
      key: 'accessLevel',
      label: 'Access Level',
      render: (value: AccessLevel) => (
        <span
          className={`access-level-label ${value === AccessLevel.Admin ? 'is-admin' : ''}`}
        >
          {value || AccessLevel.User}
        </span>
      ),
    },
  ];

  return (
    <div className="users-container">
      {error && <div className="error-message">{error}</div>}

      <DataTable
        columns={columns}
        data={users}
        onRowUpdate={handleRowUpdate}
        isLoading={loading}
        error={error}
        emptyMessage="No users found"
        canAdd={isAdmin}
        addButtonLabel="+ Add User"
        onAddClick={() => navigate('/admin/users/new')}
      />
    </div>
  );
};

export default UsersPage;

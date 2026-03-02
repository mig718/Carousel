import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { roleService, userService } from '../services/userService';
import { AccessLevel, User } from '../types';
import DataTable, { CellRenderContext, DataTableHandle } from '../components/DataTable';
import './UsersPage.css';

interface EditableTextCellProps {
  value: string;
  originalValue: string;
  placeholder?: string;
  onCommit: (nextValue: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  validationFn?: (val: string) => boolean;
  fieldType?: 'email' | 'text';
  hasChanged?: boolean;
  isValid?: boolean;
  setFieldValidity?: (isValid: boolean) => void;
  onTabNext?: () => void;
  onTabPrev?: () => void;
}

// Validation functions
const validateEmail = (email: string): boolean => {
  if (!email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

const EditableTextCell: React.FC<EditableTextCellProps> = ({
  value,
  originalValue,
  placeholder,
  onCommit,
  isEditing,
  onStartEdit,
  onEndEdit,
  validationFn,
  fieldType = 'text',
  hasChanged = false,
  isValid = true,
  setFieldValidity,
  onTabNext,
  onTabPrev,
}) => {
  const [draftValue, setDraftValue] = useState(value ?? '');
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftValue(value ?? '');
  }, [value]);

  // Validate whenever draftValue changes and always report validity
  useEffect(() => {
    if (setFieldValidity) {
      let isValidValue = true;
      
      // Always validate based on field type and current value
      if (validationFn) {
        isValidValue = validationFn(draftValue);
      } else if (fieldType === 'email') {
        isValidValue = validateEmail(draftValue);
      } else {
        // For text fields, check if required (non-empty)
        isValidValue = validateRequired(draftValue);
      }
      
      // Always report validity based on current draftValue
      setFieldValidity(isValidValue);
    }
  }, [draftValue, validationFn, fieldType, setFieldValidity]);

  if (!isEditing) {
    return (
      <button
        type="button"
        className={`editable-text-read ${hasChanged ? (isValid ? 'has-changed-valid' : 'has-changed-invalid') : ''}`}
        onClick={onStartEdit}
        title="Click to edit"
      >
        {value || <span className="editable-placeholder">{placeholder || '—'}</span>}
      </button>
    );
  }

  return (
    <div className="editable-control">
      <input
        ref={inputRef}
        type={fieldType === 'email' ? 'email' : 'text'}
        autoFocus
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        onBlur={() => {
          // Validation is already being reported via useEffect
          // Just commit and end edit
          onCommit(draftValue);
          onEndEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            // Check if current value is valid
            const isDirty = draftValue !== (originalValue ?? '');
            let isValidValue = true;
            if (isDirty) {
              if (validationFn) {
                isValidValue = validationFn(draftValue);
              } else if (fieldType === 'email') {
                isValidValue = validateEmail(draftValue);
              } else {
                isValidValue = validateRequired(draftValue);
              }
            }
            
            // Only commit on Enter if valid
            if (isValidValue) {
              onCommit(draftValue);
              onEndEdit();
            }
          }

          if (e.key === 'Escape') {
            setDraftValue(value ?? '');
            onEndEdit();
          }

          if (e.key === 'Tab') {
            // Commit current value and move to next/previous cell
            onCommit(draftValue);
            onEndEdit();
            
            if (e.shiftKey) {
              // Shift+Tab: move to previous cell
              e.preventDefault();
              onTabPrev?.();
            } else {
              // Tab: move to next cell
              e.preventDefault();
              onTabNext?.();
            }
          }
        }}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="control-clear"
        onClick={(e) => {
          e.preventDefault();
          setDraftValue('');
        }}
        title="Clear"
        tabIndex={-1}
        aria-hidden="true"
      >
        ✕
      </button>
    </div>
  );
};


const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const requesterEmail = localStorage.getItem('email') || '';
  const dataTableRef = React.useRef<DataTableHandle>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
        setLoadError(null);
      } catch (err: any) {
        setLoadError(err.response?.data?.message || 'Failed to load users');
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
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update user');
      throw err;
    }
  };

  const handleRowCreate = async (data: any) => {
    try {
      // Call the user service to create a new user
      const newUser = await userService.createUserAdmin(requesterEmail, {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        accessLevel: (data.accessLevel || AccessLevel.User) as AccessLevel,
      });
      setUsers((prev) => [...prev, newUser]);
      setActionError(null);
      return newUser.id;
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create user');
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
      required: true,
      render: (
        value: string,
        row: User,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          placeholder="First name"
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
          onCommit={(nextValue) => onCommit('firstName', nextValue, originalValue || '')}
          setFieldValidity={context.setFieldValidity}
          hasChanged={context.hasChanged}
          isValid={context.isValid}
          onTabNext={context.moveToNextField}
          onTabPrev={context.moveToPreviousField}
        />
      ),
    },
    {
      key: 'lastName',
      label: 'Last Name',
      required: true,
      render: (
        value: string,
        row: User,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          placeholder="Last name"
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
          onCommit={(nextValue) => onCommit('lastName', nextValue, originalValue || '')}
          setFieldValidity={context.setFieldValidity}
          hasChanged={context.hasChanged}
          isValid={context.isValid}
          onTabNext={context.moveToNextField}
          onTabPrev={context.moveToPreviousField}
        />
      ),
    },
    {
      key: 'email',
      label: 'Email',
      required: true,
      render: (
        value: string,
        row: User,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          placeholder="Email address"
          isEditing={context.isEditing}
          onStartEdit={context.beginEdit}
          onEndEdit={context.endEdit}
          fieldType="email"
          validationFn={validateEmail}
          onCommit={(nextValue) => onCommit('email', nextValue, originalValue || '')}
          setFieldValidity={context.setFieldValidity}
          hasChanged={context.hasChanged}
          isValid={context.isValid}
          onTabNext={context.moveToNextField}
          onTabPrev={context.moveToPreviousField}
        />
      ),
    },
    {
      key: 'accessLevel',
      label: 'Access Level',
      render: (
        value: AccessLevel,
        row: User,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => {
        // Check if this is a new row (id starts with __NEW_)
        const isNewRow = row.id?.startsWith('__NEW_');
        
        if (isNewRow && context.isEditing) {
          return (
            <select
              autoFocus
              className="access-level-select"
              value={value || AccessLevel.User}
              onChange={(e) => {
                onCommit('accessLevel', e.target.value, originalValue || AccessLevel.User);
                context.setFieldValidity(true);
              }}
              onBlur={() => {
                context.endEdit();
              }}
            >
              <option value={AccessLevel.User}>User</option>
              <option value={AccessLevel.Admin}>Admin</option>
            </select>
          );
        }

        return (
          <button
            type="button"
            className={`access-level-label ${value === AccessLevel.Admin ? 'is-admin' : ''}`}
            onClick={isNewRow ? context.beginEdit : undefined}
            style={{ cursor: isNewRow ? 'pointer' : 'default' }}
            title={isNewRow ? 'Click to select access level' : undefined}
          >
            {value || AccessLevel.User}
          </button>
        );
      },
    },
  ];

  return (
    <div className="users-container">
      {actionError && <div className="error-message">{actionError}</div>}

      <DataTable
        ref={dataTableRef}
        columns={columns}
        data={users}
        onRowUpdate={handleRowUpdate}
        onRowCreate={handleRowCreate}
        isLoading={loading}
        error={loadError}
        emptyMessage="No users found"
        canAdd={isAdmin}
        onAddClick={() => dataTableRef.current?.addNewRow()}
        newRowDefaults={{
          firstName: '',
          lastName: '',
          email: '',
          accessLevel: AccessLevel.User,
        }}
      />
    </div>
  );
};

export default UsersPage;

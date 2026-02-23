import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { roleService, userService } from '../services/userService';
import { Role } from '../types';
import DataTable from '../components/DataTable';
import './AdminRolesPage.css';

interface RoleAssignment {
  id: string;
  userEmail: string;
  userName: string;
  roleName: string;
}

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

const AdminRolesPage: React.FC = () => {
  const navigate = useNavigate();
  const requesterEmail = localStorage.getItem('email') || '';

  const [customRoles, setCustomRoles] = useState<Role[]>([]); // Only custom roles
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await userService.getCurrentUser(requesterEmail);
        const adminAccess = currentUser.accessLevel === 'Admin';
        setIsAdmin(adminAccess);

        if (!adminAccess) {
          setLoading(false);
          return;
        }

        // Load custom roles (for table display)
        try {
          const customRolesData = await roleService.getCustomRoles();
          console.log('Loaded custom roles:', customRolesData || []);
          setCustomRoles(customRolesData || []);
        } catch (err) {
          console.warn('Failed to load custom roles:', err);
          setCustomRoles([]);
        }

        // Load all users and role assignments
        try {
          const usersData = await userService.getAllUsers(requesterEmail);
          console.log('Loaded users:', usersData?.length || 0);

          // Load role assignments for all users
          const assignmentsData: RoleAssignment[] = [];
          for (const user of usersData || []) {
            try {
              const userRoles = await roleService.getRolesForUser(user.email);
              userRoles.forEach((roleName) => {
                assignmentsData.push({
                  id: `${user.email}:${roleName}`,
                  userEmail: user.email,
                  userName: `${user.firstName} ${user.lastName}`,
                  roleName,
                });
              });
            } catch (err) {
              console.warn(`Failed to load roles for ${user.email}:`, err);
            }
          }
          console.log('Loaded role assignments:', assignmentsData.length);
          setAssignments(assignmentsData);
        } catch (err) {
          console.warn('Failed to load users:', err);
          setAssignments([]);
        }

        setError(null);
      } catch (err: any) {
        console.error('Failed to authenticate or check admin access:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Authentication failed';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (requesterEmail) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [requesterEmail]);

  const handleRoleUpdate = async (roleName: string, updates: Partial<Role>) => {
    try {
      const existingRole = customRoles.find((role) => role.name === roleName);
      if (!existingRole) {
        throw new Error('Role not found');
      }

      const updated = await roleService.updateRole(requesterEmail, roleName, {
        name: updates.name ?? existingRole.name,
        description: updates.description ?? existingRole.description,
      });
      setCustomRoles((prev) => prev.map((role) => (role.name === roleName ? updated : role)));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
      throw err;
    }
  };

  const handleRoleDelete = async (roleName: string) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      await roleService.deleteRole(requesterEmail, roleName);
      setCustomRoles((prev) => prev.filter((role) => role.name !== roleName));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleAssignmentDelete = async (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      return;
    }

    if (!window.confirm(`Remove role "${assignment.roleName}" from ${assignment.userName}?`)) {
      return;
    }

    try {
      await roleService.unassignRole(requesterEmail, {
        userEmail: assignment.userEmail,
        roleName: assignment.roleName,
      });
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove role assignment');
    }
  };

  if (!loading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const customRolesWithId = customRoles.map((role) => ({ ...role, id: role.name }));
  const assignmentsWithId = assignments;

  const roleColumns = [
    {
      key: 'name',
      label: 'Role Name',
      render: (
        value: string,
        row: Role,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          placeholder="Role name"
          onCommit={(nextValue) => onCommit('name', nextValue, originalValue || '')}
        />
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (
        value: string,
        row: Role,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string
      ) => (
        <EditableTextCell
          value={value || ''}
          originalValue={originalValue || ''}
          placeholder="Description"
          onCommit={(nextValue) => onCommit('description', nextValue, originalValue || '')}
        />
      ),
    },
  ];

  const assignmentColumns = [
    {
      key: 'userName',
      label: 'User',
      render: (value: string) => <span className="read-only-field">{value}</span>,
    },
    {
      key: 'userEmail',
      label: 'Email',
      render: (value: string) => <span className="email-field">{value}</span>,
    },
    {
      key: 'roleName',
      label: 'Role',
      render: (value: string) => <span className="read-only-field">{value}</span>,
    },
  ];

  return (
    <div className="admin-roles-container">
      <div className="content-wrapper">
        {error && <div className="error-message">{error}</div>}

        <div className="roles-section">
          <h2 className="section-title">Custom Roles</h2>
          <button className="btn-add-primary" onClick={() => navigate('/admin/roles/add')}>
            + Create Custom Role
          </button>
          <DataTable
            columns={roleColumns}
            data={customRolesWithId}
            onRowUpdate={(name, updates) => handleRoleUpdate(name, updates)}
            onRowDelete={(name) => handleRoleDelete(name)}
            isLoading={loading}
            emptyMessage="No entries in this table yet"
          />
        </div>

        <div className="section-separator"></div>

        <div className="assignments-section">
          <h2 className="section-title">Assignments</h2>
          <button className="btn-add-primary" onClick={() => navigate('/admin/roles/assign')}>
            + Create Role Assignment
          </button>
          <DataTable
            columns={assignmentColumns}
            data={assignmentsWithId}
            onRowDelete={(id) => handleAssignmentDelete(id)}
            isLoading={loading}
            emptyMessage="No entries in this table yet"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminRolesPage;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DataTable, { CellRenderContext, DataTableHandle } from '../components/DataTable';
import { roleService, userService } from '../services/userService';
import { Role, RoleAssignment, User } from '../types';
import './AdminRolesPage.css';

const AdminRolesPage: React.FC = () => {
  const requesterEmail = localStorage.getItem('email') || '';
  const rolesTableRef = useRef<DataTableHandle>(null);
  const assignmentsTableRef = useRef<DataTableHandle>(null);

  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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

        const [roleData, assignmentData, userData] = await Promise.all([
          roleService.getRoles(),
          roleService.getAssignments(requesterEmail),
          userService.getAllUsers(requesterEmail),
        ]);

        setRoles(roleData || []);
        setAssignments(assignmentData || []);
        setUsers(userData || []);
        setLoadError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load roles page';
        setLoadError(errorMessage);
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

  const userOptions = useMemo(
    () => users.map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName} <${u.email}>`, name: `${u.firstName} ${u.lastName}`.trim(), email: u.email })),
    [users]
  );

  const roleOptions = useMemo(
    () => roles.map((r) => ({ id: r.id || '', label: r.name })),
    [roles]
  );

  const findUserById = (id: string) => userOptions.find((option) => option.id === id);
  const findRoleById = (id: string) => roleOptions.find((option) => option.id === id);

  const getDisplayUserName = (assignment: any): string => {
    const matchingUser = users.find((user) => user.id === assignment.userId || user.email === assignment.userEmail);
    if (matchingUser) {
      return `${matchingUser.firstName || ''} ${matchingUser.lastName || ''}`.trim() || matchingUser.email || '';
    }

    const rawName = (assignment.userName || '').toString();
    const cleanedName = rawName.split('<')[0].replace(/\s+/g, ' ').trim();
    if (cleanedName) {
      return cleanedName;
    }

    return assignment.userEmail || '';
  };

  const handleRoleUpdate = async (roleId: string, updates: Partial<Role>) => {
    try {
      const existingRole = roles.find((role) => role.id === roleId);
      if (!existingRole) {
        throw new Error('Role not found');
      }
      if (!existingRole.editable) {
        throw new Error('Predefined roles cannot be edited');
      }

      const updated = await roleService.updateRole(requesterEmail, roleId, {
        name: updates.name ?? existingRole.name,
        description: updates.description ?? existingRole.description,
      });
      setRoles((prev) => prev.map((role) => (role.id === roleId ? updated : role)));
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update role');
      throw err;
    }
  };

  const handleRoleDelete = async (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role || !role.editable) {
      setActionError('Predefined roles cannot be deleted');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    try {
      await roleService.deleteRole(requesterEmail, roleId);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      setAssignments((prev) => prev.filter((a) => a.roleId !== roleId));
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleRoleCreate = async (data: any) => {
    try {
      const created = await roleService.createRole(requesterEmail, {
        name: data.name || '',
        description: data.description || '',
      });
      setRoles((prev) => [...prev, created]);
      setActionError(null);
      return created.id || created.name;
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to create role');
      throw err;
    }
  };

  const handleAssignmentCreate = async (data: any) => {
    try {
      if (!data.userId || !data.roleId) {
        throw new Error('Please select a valid user and role');
      }

      await roleService.assignRole(requesterEmail, {
        userId: data.userId,
        roleId: data.roleId,
      });

      const role = roles.find((r) => r.id === data.roleId);
      const user = users.find((u) => u.id === data.userId);

      const newAssignment: RoleAssignment = {
        id: `${data.userId}:${data.roleId}`,
        userId: data.userId,
        userEmail: user?.email || '',
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '',
        roleId: data.roleId,
        roleName: role?.name || '',
      };

      setAssignments((prev) => [...prev, newAssignment]);
      setActionError(null);
      return newAssignment.id;
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to create role assignment');
      throw err;
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
        userId: assignment.userId,
        roleId: assignment.roleId,
      });
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      setActionError(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to remove role assignment');
    }
  };

  if (!loading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const roleRows = roles.map((role) => ({ ...role, id: role.id || role.name }));

  const roleColumns = [
    {
      key: 'name',
      label: 'Role Name',
      required: true,
      render: (
        value: string,
        row: Role,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => {
        const isNewRow = String(row.id || '').startsWith('__NEW_');
        const isEditable = isNewRow || !!row.editable;

        if (!isEditable) {
          return <span className="read-only-field">{value}</span>;
        }

        if (!context.isEditing) {
          return (
            <button type="button" className="role-inline-read" onClick={context.beginEdit}>
              {value || 'Enter role name'}
            </button>
          );
        }

        return (
          <input
            autoFocus
            className="assignment-inline-input"
            value={value || ''}
            onChange={(e) => {
              onCommit('name', e.target.value, originalValue || '');
              context.setFieldValidity(e.target.value.trim().length > 0);
            }}
            onBlur={() => context.endEdit()}
          />
        );
      },
    },
    {
      key: 'description',
      label: 'Description',
      required: true,
      render: (
        value: string,
        row: Role,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => {
        const isNewRow = String(row.id || '').startsWith('__NEW_');
        const isEditable = isNewRow || !!row.editable;

        if (!isEditable) {
          return <span className="read-only-field">{value}</span>;
        }

        if (!context.isEditing) {
          return (
            <button type="button" className="role-inline-read" onClick={context.beginEdit}>
              {value || 'Enter description'}
            </button>
          );
        }

        return (
          <input
            autoFocus
            className="assignment-inline-input"
            value={value || ''}
            onChange={(e) => {
              onCommit('description', e.target.value, originalValue || '');
              context.setFieldValidity(e.target.value.trim().length > 0);
            }}
            onBlur={() => context.endEdit()}
          />
        );
      },
    },
  ];

  const assignmentColumns = [
    {
      key: 'userName',
      label: 'User',
      required: true,
      render: (
        value: string,
        row: any,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => {
        const isNewRow = String(row.id || '').startsWith('__NEW_');

        if (!isNewRow) {
          return <span className="read-only-field">{getDisplayUserName(row)}</span>;
        }

        if (!context.isEditing) {
          return (
            <button type="button" className="assignment-inline-read" onClick={context.beginEdit}>
              {row.userName || 'Select user'}
            </button>
          );
        }

        return (
          <select
            autoFocus
            className="assignment-inline-input"
            value={row.userId || ''}
            onChange={(e) => {
              const selected = findUserById(e.target.value);
              if (selected) {
                onCommit('userId', selected.id, row.userId || '');
                onCommit('userName', selected.name, row.userName || '');
                onCommit('userEmail', selected.email, row.userEmail || '');
                context.setFieldValidity(true);
              } else {
                onCommit('userId', '', row.userId || '');
                onCommit('userEmail', '', row.userEmail || '');
                onCommit('userName', '', row.userName || '');
                context.setFieldValidity(false);
              }
            }}
            onBlur={() => context.endEdit()}
          >
            <option value="">Select user</option>
              {userOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'userEmail',
      label: 'Email',
      render: (value: string, row: any) => <span className="email-field">{row.userEmail || value}</span>,
    },
    {
      key: 'roleName',
      label: 'Role',
      required: true,
      render: (
        value: string,
        row: any,
        onCommit: (field: string, value: string, originalValue: string) => void,
        isModified: boolean,
        originalValue: string,
        context: CellRenderContext
      ) => {
        const isNewRow = String(row.id || '').startsWith('__NEW_');

        if (!isNewRow) {
          return <span className="read-only-field">{row.roleName}</span>;
        }

        if (!context.isEditing) {
          return (
            <button type="button" className="assignment-inline-read" onClick={context.beginEdit}>
              {row.roleName || 'Select role'}
            </button>
          );
        }

        return (
          <select
            autoFocus
            className="assignment-inline-input"
            value={row.roleId || ''}
            onChange={(e) => {
              const selected = findRoleById(e.target.value);
              if (selected) {
                onCommit('roleId', selected.id, row.roleId || '');
                onCommit('roleName', selected.label, row.roleName || '');
                context.setFieldValidity(true);
              } else {
                onCommit('roleId', '', row.roleId || '');
                onCommit('roleName', '', row.roleName || '');
                context.setFieldValidity(false);
              }
            }}
            onBlur={() => context.endEdit()}
          >
            <option value="">Select role</option>
              {roleOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        );
      },
    },
  ];

  return (
    <div className="admin-roles-container">
      <div className="content-wrapper">
        {actionError && <div className="error-message">{actionError}</div>}

        <div className="roles-section">
          <h2 className="section-title">Roles</h2>
          <DataTable
            ref={rolesTableRef}
            columns={roleColumns}
            data={roleRows}
            onRowUpdate={handleRoleUpdate}
            onRowCreate={handleRoleCreate}
            onRowDelete={handleRoleDelete}
            isLoading={loading}
            error={loadError}
            emptyMessage="No entries in this table yet"
            canAdd
            onAddClick={() => rolesTableRef.current?.addNewRow()}
            canDeleteRow={(row) => !!row.editable}
            newRowDefaults={{
              name: '',
              description: '',
              editable: true,
            }}
          />
        </div>

        <div className="section-separator"></div>

        <div className="assignments-section">
          <h2 className="section-title">Assignments</h2>
          <DataTable
            ref={assignmentsTableRef}
            columns={assignmentColumns}
            data={assignments}
            onRowCreate={handleAssignmentCreate}
            onRowDelete={handleAssignmentDelete}
            isLoading={loading}
            error={loadError}
            emptyMessage="No entries in this table yet"
            canAdd
            onAddClick={() => assignmentsTableRef.current?.addNewRow()}
            newRowDefaults={{
              userId: '',
              userName: '',
              userEmail: '',
              roleId: '',
              roleName: '',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminRolesPage;

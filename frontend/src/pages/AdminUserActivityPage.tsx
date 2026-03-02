import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { auditService, userService } from '../services/userService';
import { AuditEvent, User } from '../types';
import './AdminUserActivityPage.css';

const AdminUserActivityPage: React.FC = () => {
  const requesterEmail = localStorage.getItem('email') || '';

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getUserDisplayName = (email: string) => {
    const found = users.find((user) => user.email === email);
    if (!found) {
      return email || 'selected user';
    }
    return `${found.firstName} ${found.lastName}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await userService.getCurrentUser(requesterEmail);
        const admin = currentUser.accessLevel === 'Admin';
        setIsAdmin(admin);

        if (!admin) {
          return;
        }

        const loadedUsers = await userService.getAllUsers(requesterEmail);
        setUsers(loadedUsers);

        if (loadedUsers.length > 0) {
          const firstEmail = loadedUsers[0].email;
          setSelectedEmail(firstEmail);
          const history = await auditService.getUserHistory(requesterEmail, firstEmail, 200);
          setEvents(history);
        }
      } catch (err: any) {
        const fallbackName = getUserDisplayName(selectedEmail);
        setError(err.response?.data?.message || `Failed to load history for ${fallbackName}`);
      } finally {
        setLoading(false);
      }
    };

    if (requesterEmail) {
      load();
    } else {
      setLoading(false);
    }
  }, [requesterEmail]);

  const selectedUserLabel = useMemo(() => {
    const found = users.find((user) => user.email === selectedEmail);
    if (!found) {
      return selectedEmail;
    }
    return `${found.firstName} ${found.lastName} <${found.email}>`;
  }, [users, selectedEmail]);

  const loadHistory = async () => {
    if (!selectedEmail) {
      setEvents([]);
      return;
    }

    setLoading(true);
    try {
      const history = await auditService.getUserHistory(requesterEmail, selectedEmail, 200);
      setEvents(history);
      setError(null);
    } catch (err: any) {
      const displayName = getUserDisplayName(selectedEmail);
      setError(err.response?.data?.message || `Failed to load history for ${displayName}`);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const toTitleCase = (value: string): string => {
    if (!value) {
      return '';
    }

    return value
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const toSingular = (value: string): string => {
    if (!value) {
      return value;
    }

    if (value.endsWith('ies') && value.length > 3) {
      return `${value.slice(0, -3)}y`;
    }

    if (value.endsWith('s') && !value.endsWith('ss') && value.length > 1) {
      return value.slice(0, -1);
    }

    return value;
  };

  const getResourceLabel = (resourceType: string): string => {
    const normalized = toSingular((resourceType || '').trim());
    return toTitleCase(normalized || 'Record');
  };

  const getActionLabel = (row: AuditEvent): string => {
    const action = (row.actionType || '').toUpperCase();
    const resourceLabel = getResourceLabel(row.resourceType || '');

    if (action === 'CREATE') {
      return `Created ${resourceLabel}`;
    }

    if (action === 'UPDATE') {
      return `Updated ${resourceLabel}`;
    }

    if (action === 'DELETE') {
      return `Deleted ${resourceLabel}`;
    }

    if (action === 'LOGIN') {
      return 'Logged In';
    }

    if (action === 'LOGOUT') {
      return 'Logged Out';
    }

    return toTitleCase(action || 'Other');
  };

  const getStatusLabel = (statusCode: number): string => {
    if (statusCode >= 200 && statusCode < 300) {
      return 'Success';
    }

    if (statusCode === 401) {
      return 'Unauthorized';
    }

    if (statusCode === 403) {
      return 'Forbidden';
    }

    return 'Fail';
  };

  const getStatusClassName = (statusCode: number): string => {
    if (statusCode >= 200 && statusCode < 300) {
      return 'admin-activity-status-success';
    }

    if (statusCode === 401 || statusCode === 403) {
      return 'admin-activity-status-unauthorized';
    }

    return 'admin-activity-status-fail';
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'When',
      render: (value: string) => <span className="admin-activity-cell">{value ? new Date(value).toLocaleString() : ''}</span>,
    },
    {
      key: 'requestPath',
      label: 'Action',
      dataKey: 'requestPath',
      displayKey: 'actionType',
      render: (_value: string, row: AuditEvent) => (
        <span className="admin-activity-cell">{getActionLabel(row)}</span>
      ),
    },
    {
      key: 'statusCode',
      label: 'Status',
      displayValue: (statusCode: number) => getStatusLabel(statusCode),
      render: (statusCode: number) => (
        <span className={`admin-activity-cell ${getStatusClassName(statusCode)}`}>
          {getStatusLabel(statusCode)}
        </span>
      ),
    },
  ];

  return (
    <div className="admin-activity-container">
      {error && <div className="admin-activity-error">{error}</div>}

      <div className="admin-activity-controls">
        <select value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)}>
          {users.map((user) => (
            <option key={user.id} value={user.email}>
              {`${user.firstName} ${user.lastName} <${user.email}>`}
            </option>
          ))}
        </select>
        <button type="button" onClick={loadHistory}>Load History</button>
      </div>

      <DataTable
        columns={columns}
        data={events}
        isLoading={loading}
        emptyMessage={selectedUserLabel ? `No tracked actions for ${selectedUserLabel}` : 'No activity found'}
      />
    </div>
  );
};

export default AdminUserActivityPage;

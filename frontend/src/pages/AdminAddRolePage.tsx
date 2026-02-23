import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { roleService, userService } from '../services/userService';
import './AdminAddRolePage.css';

const AdminAddRolePage: React.FC = () => {
  const navigate = useNavigate();
  const requesterEmail = localStorage.getItem('email') || '';

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameStatus, setNameStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [descStatus, setDescStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

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

  if (!checkingAccess && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const isFormValid = nameStatus === 'valid' && descStatus === 'valid' && !loading;

  const validateName = (value: string) => value.trim().length > 0;
  const validateDescription = (value: string) => value.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await roleService.createRole(requesterEmail, {
        name: roleName.trim(),
        description: description.trim(),
      });
      navigate('/admin/roles');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create role';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-add-role">
      <div className="admin-add-role-header">
        <h1>Create Custom Role</h1>
        <p>Define a new custom role with a name and description.</p>
      </div>

      <form className="admin-add-role-form" onSubmit={handleSubmit}>
        {error && <div className="admin-add-role-error">{error}</div>}

        <div className="admin-add-role-field">
          <label htmlFor="roleName">Role Name</label>
          <div className={`validated-control ${nameStatus}`}>
            <input
              id="roleName"
              type="text"
              value={roleName}
              onChange={(e) => {
                setRoleName(e.target.value);
                setNameStatus('idle');
              }}
              onBlur={() => setNameStatus(validateName(roleName) ? 'valid' : 'invalid')}
              placeholder="e.g., Accountant"
              required
            />
            <span className="control-icon control-icon-valid" aria-hidden="true">✓</span>
            <span className="control-icon control-icon-invalid" aria-hidden="true">✕</span>
          </div>
          {nameStatus === 'invalid' && (
            <div className="field-error">Role name is required.</div>
          )}
        </div>

        <div className="admin-add-role-field">
          <label htmlFor="description">Description</label>
          <div className={`validated-control ${descStatus}`}>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescStatus('idle');
              }}
              onBlur={() => setDescStatus(validateDescription(description) ? 'valid' : 'invalid')}
              placeholder="e.g., Financial records management"
              required
            />
            <span className="control-icon control-icon-valid" aria-hidden="true">✓</span>
            <span className="control-icon control-icon-invalid" aria-hidden="true">✕</span>
          </div>
          {descStatus === 'invalid' && (
            <div className="field-error">Description is required.</div>
          )}
        </div>

        <div className="admin-add-role-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/roles')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!isFormValid}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddRolePage;

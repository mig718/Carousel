import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { registerAsync } from '../redux/registrationSlice';
import { AccessLevel } from '../types';
import { userService } from '../services/userService';
import './AdminAddUserPage.css';

const AdminAddUserPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const email = useSelector((state: RootState) => state.auth.email) || localStorage.getItem('email') || '';
  const { loading, error, message } = useSelector((state: RootState) => state.registration);

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(AccessLevel.User);
  const [emailChecking, setEmailChecking] = useState(false);
  const [firstNameStatus, setFirstNameStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [lastNameStatus, setLastNameStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [emailErrorReason, setEmailErrorReason] = useState<'format' | 'exists' | 'unknown' | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [confirmStatus, setConfirmStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const emailCheckId = useRef(0);

  const emailPattern = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  useEffect(() => {
    let isActive = true;

    const loadAccess = async () => {
      if (!email) {
        setCheckingAccess(false);
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
  }, [email, user]);

  useEffect(() => {
    if (!isAdmin) {
      setAccessLevel(AccessLevel.User);
    }
  }, [isAdmin]);

  if (!checkingAccess && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const isFormValid =
    firstNameStatus === 'valid' &&
    lastNameStatus === 'valid' &&
    emailStatus === 'valid' &&
    passwordStatus === 'valid' &&
    confirmStatus === 'valid' &&
    !emailChecking &&
    !loading;

  const validateName = (value: string) => value.trim().length > 0;
  const validatePassword = (value: string) => value.trim().length >= 8;
  const validateConfirm = (value: string, currentPassword: string) => value.length > 0 && value === currentPassword;

  const handleEmailBlur = async () => {
    const trimmed = userEmail.trim();
    if (!emailPattern.test(trimmed)) {
      setEmailStatus('invalid');
      setEmailErrorReason('format');
      return;
    }

    const currentId = ++emailCheckId.current;
    setEmailChecking(true);
    setEmailErrorReason(null);

    try {
      await userService.getUserByEmail(trimmed);
      if (emailCheckId.current === currentId) {
        setEmailStatus('invalid');
        setEmailErrorReason('exists');
      }
    } catch (err: any) {
      if (emailCheckId.current !== currentId) {
        return;
      }

      if (err?.response?.status === 404) {
        setEmailStatus('valid');
        setEmailErrorReason(null);
      } else {
        setEmailStatus('invalid');
        setEmailErrorReason('unknown');
      }
    } finally {
      if (emailCheckId.current === currentId) {
        setEmailChecking(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await dispatch(registerAsync({
        firstName,
        lastName,
        email: userEmail,
        password,
        accessLevel,
      })).unwrap();
      navigate('/admin/users');
    } catch (err) {
      console.error('Admin add user failed:', err);
    }
  };

  return (
    <div className="admin-add-user">
      <div className="admin-add-user-header">
        <h1>Add User</h1>
        <p>Create a new account and assign access level.</p>
      </div>

      <form className="admin-add-user-form" onSubmit={handleSubmit}>
        {error && <div className="admin-add-user-error">{error}</div>}
        {message && <div className="admin-add-user-success">{message}</div>}

        <div className="admin-add-user-row">
          <div className="admin-add-user-field">
            <label htmlFor="firstName">First Name</label>
            <div className={`validated-control ${firstNameStatus}`}>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setFirstNameStatus('idle');
                }}
                onBlur={() => setFirstNameStatus(validateName(firstName) ? 'valid' : 'invalid')}
                required
              />
              <span className="control-icon control-icon-valid" aria-hidden="true">✓</span>
              <span className="control-icon control-icon-invalid" aria-hidden="true">✕</span>
            </div>
            {firstNameStatus === 'invalid' && (
              <div className="field-error">First name is required.</div>
            )}
          </div>
          <div className="admin-add-user-field">
            <label htmlFor="lastName">Last Name</label>
            <div className={`validated-control ${lastNameStatus}`}>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setLastNameStatus('idle');
                }}
                onBlur={() => setLastNameStatus(validateName(lastName) ? 'valid' : 'invalid')}
                required
              />
              <span className="control-icon control-icon-valid" aria-hidden="true">✓</span>
              <span className="control-icon control-icon-invalid" aria-hidden="true">✕</span>
            </div>
            {lastNameStatus === 'invalid' && (
              <div className="field-error">Last name is required.</div>
            )}
          </div>
        </div>

        <div className="admin-add-user-field email-field">
          <label htmlFor="userEmail">Email</label>
          <div className={`validated-control ${emailStatus} ${emailChecking ? 'is-checking' : ''}`}>
            <input
              id="userEmail"
              type="email"
              value={userEmail}
              onChange={(e) => {
                setUserEmail(e.target.value);
                setEmailStatus('idle');
                setEmailErrorReason(null);
              }}
              onBlur={handleEmailBlur}
              required
            />
            <span className="control-icon control-icon-valid" aria-hidden="true">✓</span>
            <span className="control-icon control-icon-invalid" aria-hidden="true">✕</span>
          </div>
          {emailStatus === 'invalid' && (
            <div className="field-error">
              {emailErrorReason === 'exists'
                ? 'Email already exists.'
                : emailErrorReason === 'format'
                  ? 'Enter a valid email address.'
                  : 'Unable to validate email.'}
            </div>
          )}
        </div>

        <div className="admin-add-user-row password-row">
          <div className="admin-add-user-field">
            <label htmlFor="password">Temporary Password</label>
            <div className={`validated-control ${passwordStatus}`}>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordStatus('idle');
                  setConfirmStatus('idle');
                }}
                onBlur={() => setPasswordStatus(validatePassword(password) ? 'valid' : 'invalid')}
                required
              />
              <span className="control-icon control-icon-valid" aria-hidden="true">✓</span>
              <span className="control-icon control-icon-invalid" aria-hidden="true">✕</span>
            </div>
            {passwordStatus === 'invalid' && (
              <div className="field-error">Password must be at least 8 characters.</div>
            )}
          </div>
          <div className="admin-add-user-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={`validated-control ${confirmStatus}`}>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmStatus('idle');
                }}
                onBlur={() => setConfirmStatus(validateConfirm(confirmPassword, password) ? 'valid' : 'invalid')}
                required
              />
              <span className="control-icon control-icon-valid" aria-hidden="true">✓</span>
              <span className="control-icon control-icon-invalid" aria-hidden="true">✕</span>
            </div>
            {confirmStatus === 'invalid' && (
              <div className="field-error">Passwords must match.</div>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="admin-add-user-field access-level-field">
            <label htmlFor="accessLevel">Access Level</label>
            <select
              id="accessLevel"
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
            >
              <option value={AccessLevel.User}>User</option>
              <option value={AccessLevel.Admin}>Admin</option>
            </select>
          </div>
        )}

        <div className="admin-add-user-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/users')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!isFormValid}>
            {loading ? 'Saving...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddUserPage;

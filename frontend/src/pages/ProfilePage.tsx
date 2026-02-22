import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/authSlice';
import { AppDispatch } from '../redux/store';
import { userService } from '../services/userService';
import { User } from '../types';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const email = localStorage.getItem('email') || '';

  const [user, setLocalUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = await userService.getCurrentUser(email);
        setLocalUser(currentUser);
        setFirstName(currentUser.firstName);
        setLastName(currentUser.lastName);
        dispatch(setUser(currentUser));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [dispatch, email]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      const updated = await userService.updateCurrentUser(email, { firstName, lastName });
      setLocalUser(updated);
      dispatch(setUser(updated));
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-container">Loading profile...</div>;
  }

  if (!user) {
    return <div className="profile-container">Unable to load profile.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Profile</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="profile-card">
        <h2>Registration Details</h2>
        <form onSubmit={handleSaveProfile} className="profile-form">
          <div className="form-row">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label>Email</label>
            <input value={user.email} disabled />
          </div>

          <div className="form-row">
            <label>Current Access Level</label>
            <input value={user.accessLevel} disabled />
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default ProfilePage;

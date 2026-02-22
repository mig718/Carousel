import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerAsync } from '../redux/registrationSlice';
import { AppDispatch, RootState } from '../redux/store';
import { AccessLevel } from '../types';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(AccessLevel.User);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector((state: RootState) => state.registration);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await dispatch(registerAsync({
        firstName,
        lastName,
        email,
        password,
        accessLevel,
      })).unwrap();
      
      if (accessLevel === AccessLevel.User) {
        navigate('/verify');
      } else {
        navigate('/pending-approval');
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h1>Carousel Registration</h1>
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '60px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="show-password-btn"
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: '60px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="show-password-btn"
                tabIndex={-1}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="accessLevel">Account Type</label>
            <select
              id="accessLevel"
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
            >
              <option value={AccessLevel.User}>User (No Approval Required)</option>
              <option value={AccessLevel.Admin}>Admin (Requires Approval)</option>
            </select>
            <small className="access-level-info">
              {accessLevel === AccessLevel.User
                ? 'User access is immediately available after email verification'
                : 'Admin access requires approval from an existing Admin'}
            </small>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;


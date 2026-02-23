import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import { AppDispatch, RootState } from '../redux/store';
import './CommonHeader.css';

const CommonHeader: React.FC = () => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const email = useSelector((state: RootState) => state.auth.email);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileMenuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleEditProfile = () => {
    navigate('/profile');
    setProfileMenuOpen(false);
  };

  return (
    <header className="common-header">
      <button className="logo-container" onClick={() => navigate('/home')}>
        <img src="/carousel-logo.svg" alt="Carousel" className="carousel-icon-img" />
        <h1 className="carousel-title">carousel</h1>
      </button>

      <div className="header-spacer"></div>

      <div className="header-profile">
        <div className="profile-menu-container" ref={profileMenuRef}>
          <button
            className="profile-icon-btn"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          >
            <svg className="profile-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </button>
          
          {profileMenuOpen && (
            <div className="profile-dropdown">
              <div className="profile-email">{email}</div>
              <button className="dropdown-item" onClick={handleEditProfile}>
                ✎ Edit Profile
              </button>
              <button className="dropdown-item logout" onClick={handleLogout}>
                ← Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CommonHeader;

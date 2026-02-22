import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import { AppDispatch, RootState } from '../redux/store';
import './CommonHeader.css';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const CommonHeader: React.FC = () => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
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

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/dashboard' }
    ];

    const labelMap: { [key: string]: string } = {
      'approvals': 'Pending Approvals',
      'profile': 'Profile',
      'users': 'Users',
      'roles': 'Roles',
      'pending-approval': 'Pending Approval',
      'verify': 'Verify Email'
    };

    pathSegments.forEach((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      if (path !== '/dashboard') {
        breadcrumbs.push({ label, path });
      }
    });

    return breadcrumbs;
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleEditProfile = () => {
    navigate('/profile');
    setProfileMenuOpen(false);
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <header className="common-header">
      <div className="header-breadcrumbs">
        {breadcrumbs.map((item, index) => (
          <div key={index} className="breadcrumb-item">
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            {index < breadcrumbs.length - 1 ? (
              <a href={item.path} onClick={(e) => { e.preventDefault(); navigate(item.path); }}>
                {item.label}
              </a>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      <div className="header-center">
        <div className="logo-container">
          <span className="carousel-icon">🎠</span>
          <h1 className="carousel-title">Carousel</h1>
        </div>
      </div>

      <div className="header-profile">
        <div className="profile-menu-container" ref={profileMenuRef}>
          <button
            className="profile-icon-btn"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          >
            <span className="profile-icon">👤</span>
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

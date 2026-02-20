import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import { AppDispatch } from '../redux/store';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const email = localStorage.getItem('email') || '';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleApprovals = () => {
    navigate('/approvals');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h1>Carousel Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {email}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h2>Main Menu</h2>
        <div className="menu-grid">
          <div className="menu-card">
            <h3>View Pending Approvals</h3>
            <p>Review and approve pending user requests</p>
            <button onClick={handleApprovals} className="btn-primary">
              Go to Approvals
            </button>
          </div>
          
          <div className="menu-card">
            <h3>Profile</h3>
            <p>View and manage your profile information</p>
            <button className="btn-primary" disabled>
              Coming Soon
            </button>
          </div>

          <div className="menu-card">
            <h3>Users</h3>
            <p>View system users and their access levels</p>
            <button className="btn-primary" disabled>
              Coming Soon
            </button>
          </div>

          <div className="menu-card">
            <h3>Settings</h3>
            <p>Configure account and system settings</p>
            <button className="btn-primary" disabled>
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


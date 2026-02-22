import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, setUser } from '../redux/authSlice';
import { AppDispatch } from '../redux/store';
import { roleService, userService } from '../services/userService';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const email = localStorage.getItem('email') || '';
  const [canManageUsers, setCanManageUsers] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!email) {
        return;
      }

      let isCurrentUserAdmin = false;

      try {
        const currentUser = await userService.getCurrentUser(email);
        dispatch(setUser(currentUser));
        isCurrentUserAdmin = currentUser.accessLevel === 'Admin';
        setIsAdmin(isCurrentUserAdmin);
        setCanManageUsers(isCurrentUserAdmin);
      } catch {
        setCanManageUsers(false);
        setIsAdmin(false);
        return;
      }

      try {
        const roles = await roleService.getRolesForUser(email);
        const hasSupportRole = roles.some((role) => role.toLowerCase() === 'support');
        setCanManageUsers(isCurrentUserAdmin || hasSupportRole);
      } catch {
        setCanManageUsers(isCurrentUserAdmin);
      }
    };

    loadCurrentUser();
  }, [dispatch, email]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleApprovals = () => {
    navigate('/approvals');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleUsers = () => {
    navigate('/users');
  };

  const handleRoles = () => {
    navigate('/roles');
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
            <button onClick={handleProfile} className="btn-primary">
              Open Profile
            </button>
          </div>

          <div className="menu-card">
            <h3>Users</h3>
            <p>View system users and update registration details</p>
            <button className="btn-primary" disabled={!canManageUsers} onClick={handleUsers}>
              {canManageUsers ? 'Open Users' : 'Support/Admin only'}
            </button>
          </div>

          <div className="menu-card">
            <h3>Settings</h3>
            <p>Configure account and system settings</p>
            <button className="btn-primary" disabled>
              Coming Soon
            </button>
          </div>

          <div className="menu-card">
            <h3>Roles</h3>
            <p>Create, edit, delete and assign roles</p>
            <button className="btn-primary" disabled={!isAdmin} onClick={handleRoles}>
              {isAdmin ? 'Open Roles' : 'Admin only'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


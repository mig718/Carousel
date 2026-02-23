import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { userService } from '../services/userService';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const email = useSelector((state: RootState) => state.auth.email) || localStorage.getItem('email') || '';
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadAccess = async () => {
      if (!email) {
        setLoading(false);
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
          setLoading(false);
        }
      }
    };

    loadAccess();
    return () => {
      isActive = false;
    };
  }, [email, user]);

  if (!loading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>Admin</h1>
        <p>Direct access to system tables and inventory data.</p>
      </div>

      <div className="admin-card-grid">
        <button className="admin-card" onClick={() => navigate('/admin/users')}>
          <div className="admin-card-icon" aria-hidden="true">👥</div>
          <div className="admin-card-content">
            <h2>Users</h2>
            <p>View and manage user accounts and access levels.</p>
          </div>
          <span className="admin-card-action">Open</span>
        </button>

        <button className="admin-card" onClick={() => navigate('/admin/roles')}>
          <div className="admin-card-icon" aria-hidden="true">🔑</div>
          <div className="admin-card-content">
            <h2>Roles</h2>
            <p>Manage roles and their user assignments.</p>
          </div>
          <span className="admin-card-action">Open</span>
        </button>

        <button className="admin-card" onClick={() => navigate('/admin/inventory')}>
          <div className="admin-card-icon" aria-hidden="true">📦</div>
          <div className="admin-card-content">
            <h2>Inventory</h2>
            <p>Maintain inventory items and quantities.</p>
          </div>
          <span className="admin-card-action">Open</span>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;

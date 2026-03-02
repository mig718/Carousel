import React from 'react';
import { useNavigate } from 'react-router-dom';
import { adminResourceRegistry } from '../admin/adminResourceRegistry';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>Admin</h1>
        <p>Direct access to system tables and inventory data.</p>
      </div>

      <div className="admin-card-grid">
        {adminResourceRegistry.map((resource) => (
          <button key={resource.id} className="admin-card" onClick={() => navigate(`/admin/${resource.id}`)}>
            <div className="admin-card-icon" aria-hidden="true">{resource.icon}</div>
            <div className="admin-card-content">
              <h2>{resource.title}</h2>
              <p>{resource.description}</p>
            </div>
            <span className="admin-card-action">Open</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;

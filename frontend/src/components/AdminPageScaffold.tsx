import React from 'react';
import './AdminPageScaffold.css';

interface AdminPageScaffoldProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const AdminPageScaffold: React.FC<AdminPageScaffoldProps> = ({ title, description, children }) => {
  return (
    <div className="admin-page-scaffold">
      <div className="admin-page-header">
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="admin-page-note">Direct table access mode: intended for experienced administrators.</div>
      </div>
      <div className="admin-page-content">{children}</div>
    </div>
  );
};

export default AdminPageScaffold;

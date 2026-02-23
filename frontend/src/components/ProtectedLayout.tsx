import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CommonHeader from './CommonHeader';
import SideMenu from './SideMenu';
import './ProtectedLayout.css';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

interface BreadcrumbItem {
  label: string;
  path: string;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children, footerContent }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/home' }
    ];

    const labelMap: { [key: string]: string } = {
      'approvals': 'Approvals',
      'admin': 'Admin',
      'profile': 'Profile',
      'users': 'Users',
      'roles': 'Roles',
      'inventory': 'Inventory',
      'search': 'Search',
      'settings': 'Settings',
      'new': 'New User',
      'pending-approval': 'Pending Approval',
      'verify': 'Verify Email'
    };

    pathSegments.forEach((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      if (path !== '/home' && path !== '/') {
        breadcrumbs.push({ label, path });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <div className="protected-layout">
      <CommonHeader />
      <div className="layout-shell">
        <SideMenu />
        <div className="main-area">
          <div className="breadcrumb-container">
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
          <main className="layout-content">
            {children}
          </main>
          {footerContent && (
            <div className="layout-footer">
              {footerContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProtectedLayout;

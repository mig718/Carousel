import React from 'react';
import CommonHeader from './CommonHeader';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  return (
    <div className="protected-layout">
      <CommonHeader />
      <main className="layout-content">
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import DashboardPage from './pages/DashboardPage';
import ApprovalsPage from './pages/ApprovalsPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import HomePage from './pages/HomePage';
import InventoryPage from './pages/InventoryPage';
import SearchPage from './pages/SearchPage';
import AdminDashboard from './pages/AdminDashboard';
import SettingsDashboard from './pages/SettingsDashboard';
import SettingsUsersPage from './pages/SettingsUsersPage';
import SettingsInventoryPage from './pages/SettingsInventoryPage';
import AdminAddUserPage from './pages/AdminAddUserPage';
import ProtectedLayout from './components/ProtectedLayout';

import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyEmailPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <ApprovalsPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <ProfilePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <UsersPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <RolesPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <HomePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <AdminDashboard />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <UsersPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/new"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <AdminAddUserPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <SettingsDashboard />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/users"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <SettingsUsersPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/inventory"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <SettingsInventoryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <SearchPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/home" />} />
      </Routes>
    </Router>
  );
};

export default App;

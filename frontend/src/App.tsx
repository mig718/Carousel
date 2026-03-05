import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './redux/store';
import { AppDispatch } from './redux/store';
import { initializeAuthAsync } from './redux/authSlice';

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
import InventoryItemDetailsPage from './pages/InventoryItemDetailsPage';
import InventoryCreateResourcePage from './pages/InventoryCreateResourcePage';
import StylesPage from './pages/StylesPage';
import StyleDetailsPage from './pages/StyleDetailsPage';
import FlowsPage from './pages/FlowsPage';
import CreateFlowPage from './pages/CreateFlowPage';
import FlowActionsPage from './pages/FlowActionsPage';
import SearchPage from './pages/SearchPage';
import NotImplementedPage from './pages/NotImplementedPage';
import AdminDashboard from './pages/AdminDashboard';
import SettingsDashboard from './pages/SettingsDashboard';
import SettingsUsersPage from './pages/SettingsUsersPage';
import SettingsInventoryPage from './pages/SettingsInventoryPage';
import AdminAddUserPage from './pages/AdminAddUserPage';
import AdminAddRolePage from './pages/AdminAddRolePage';
import AdminAddRoleAssignmentPage from './pages/AdminAddRoleAssignmentPage';
import ProtectedLayout from './components/ProtectedLayout';
import AdminOnlyRoute from './components/AdminOnlyRoute';
import AdminPageScaffold from './components/AdminPageScaffold';
import { adminResourceRegistry } from './admin/adminResourceRegistry';

import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const initialized = useSelector((state: RootState) => state.auth.initialized);

  if (!initialized) {
    return null;
  }

  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  React.useEffect(() => {
    dispatch(initializeAuthAsync());
  }, [dispatch]);

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
          path="/inventory/dashboard/:resourceTypeName"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/new"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InventoryCreateResourcePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/items/:itemId"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InventoryItemDetailsPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/styles"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <StylesPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/styles/:styleId"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <StyleDetailsPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/flows"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <FlowsPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/flows/create"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <CreateFlowPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/flows/actions"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <FlowActionsPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <AdminOnlyRoute>
                  <AdminDashboard />
                </AdminOnlyRoute>
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        {adminResourceRegistry.map((resource) => {
          const ResourceComponent = resource.component;
          return (
            <Route
              key={resource.id}
              path={`/admin/${resource.id}`}
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <AdminOnlyRoute>
                      <AdminPageScaffold title={resource.title} description={resource.description}>
                        <ResourceComponent />
                      </AdminPageScaffold>
                    </AdminOnlyRoute>
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
          );
        })}
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
          path="/admin/roles/add"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <AdminAddRolePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles/assign"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <AdminAddRoleAssignmentPage />
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
        <Route
          path="/not-implemented"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <NotImplementedPage />
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

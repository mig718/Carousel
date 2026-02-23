import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { logout } from '../redux/authSlice';
import { roleService, userService } from '../services/userService';
import './SideMenu.css';

const SideMenu: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const email = useSelector((state: RootState) => state.auth.email) || localStorage.getItem('email') || '';
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleExit = () => {
    dispatch(logout());
    window.close();
    setTimeout(() => {
      navigate('/login');
    }, 100);
  };

  useEffect(() => {
    let isActive = true;

    const loadAccess = async () => {
      if (!email) return;

      try {
        const currentUser = user ?? await userService.getCurrentUser(email);
        if (isActive) {
          setIsAdmin(currentUser.accessLevel === 'Admin');
        }
      } catch {
        if (isActive) {
          setIsAdmin(false);
        }
      }

      try {
        const userRoles = await roleService.getRolesForUser(email);
        if (isActive) {
          setRoles(userRoles);
        }
      } catch {
        if (isActive) {
          setRoles([]);
        }
      }
    };

    loadAccess();
    return () => {
      isActive = false;
    };
  }, [email, user]);

  const roleSet = useMemo(() => new Set(roles.map((role) => role.toLowerCase())), [roles]);
  const hasRole = (roleName: string) => roleSet.has(roleName.toLowerCase());

  const showAdmin = isAdmin;
  const showSettings = isAdmin || hasRole('support');

  const iconHome = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 10.5L12 4l8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
    </svg>
  );

  const iconSearch = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="6.5" />
      <line x1="16.2" y1="16.2" x2="20" y2="20" />
    </svg>
  );

  const iconAdmin = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3l7 3v5c0 5-3.2 8-7 10-3.8-2-7-5-7-10V6l7-3z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );

  const iconSettings = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.2-2-3.4-2.3.8a7.2 7.2 0 0 0-1.7-1l-.3-2.4H9.4l-.3 2.4a7.2 7.2 0 0 0-1.7 1L5 6.4 3 9.8l2 1.2a7 7 0 0 0 0 2l-2 1.2L5 17.6l2.3-.8a7.2 7.2 0 0 0 1.7 1l.3 2.4h5.2l.3-2.4a7.2 7.2 0 0 0 1.7-1l2.3.8 2-3.4-2-1.2c.1-.3.1-.7.1-1z" />
    </svg>
  );

  const iconExit = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10 4H5v16h5" />
      <path d="M13 8l4 4-4 4" />
      <line x1="9" y1="12" x2="17" y2="12" />
    </svg>
  );

  return (
    <aside className="side-menu">
      <nav>
        <div className="menu-section">
          <NavLink to="/home" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">{iconHome}</span>
            <span className="menu-text">Home</span>
          </NavLink>
        </div>

        <div className="menu-divider"></div>

        <div className="menu-section">
          <NavLink to="/search" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">{iconSearch}</span>
            <span className="menu-text">Search</span>
          </NavLink>
        </div>

        <div className="menu-divider"></div>

        <div className="menu-section">
          {showAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              <span className="menu-icon">{iconAdmin}</span>
              <span className="menu-text">Admin</span>
            </NavLink>
          )}
          {showSettings && (
            <NavLink to="/settings" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              <span className="menu-icon">{iconSettings}</span>
              <span className="menu-text">Settings</span>
            </NavLink>
          )}
        </div>

        <div className="menu-spacer"></div>

        <div className="menu-divider"></div>

        <div className="menu-section menu-bottom">
          <button className="menu-exit" onClick={handleExit}>
            <span className="menu-icon">{iconExit}</span>
            <span className="menu-text">Exit</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default SideMenu;

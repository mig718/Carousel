import React from 'react';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="home-container">
        <div className="welcome-section">
          <h1>Welcome to Carousel</h1>
          <p className="subtitle">Jewelry Management & Approval System</p>
        </div>

        <div className="features-section">
          <h2>Main Functionality</h2>
          <ul className="features-list">
            <li>
              <span className="feature-icon">👥</span>
              <span className="feature-title">User Registration & Management</span>
              <span className="feature-desc">Register new users and manage user profiles with role-based access control</span>
            </li>
            <li>
              <span className="feature-icon">✅</span>
              <span className="feature-title">Approval Workflows</span>
              <span className="feature-desc">Submit user registrations for approval and manage pending requests</span>
            </li>
            <li>
              <span className="feature-icon">🔐</span>
              <span className="feature-title">Role-Based Access Control</span>
              <span className="feature-desc">Assign roles including Support, PowerUser, ReadOnly, InventoryManager, and InventoryAdmin</span>
            </li>
            <li>
              <span className="feature-icon">💎</span>
              <span className="feature-title">Inventory Management</span>
              <span className="feature-desc">Track jewelry resources with hierarchical types (Stone, Metal, Casting) and manage quantities</span>
            </li>
            <li>
              <span className="feature-icon">📊</span>
              <span className="feature-title">Resource Type Hierarchy</span>
              <span className="feature-desc">Define jewelry resource subtypes with descriptions and visual icons for organization</span>
            </li>
            <li>
              <span className="feature-icon">📧</span>
              <span className="feature-title">Email Verification</span>
              <span className="feature-desc">Secure user authentication and email-based verification for account validation</span>
            </li>
          </ul>
        </div>

        <div className="quick-actions">
          <p>Select an option from the left menu to get started.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

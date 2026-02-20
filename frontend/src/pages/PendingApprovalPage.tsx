import React from 'react';
import './PendingApprovalPage.css';

const PendingApprovalPage: React.FC = () => {
  return (
    <div className="pending-container">
      <div className="pending-content">
        <h1>Registration Pending Approval</h1>
        <div className="pending-message">
          <p>✓ Your email has been registered successfully!</p>
          <p>Your account requires approval from existing administrators.</p>
          <p>An approval request has been sent to all eligible approvers.</p>
          
          <div className="next-steps">
            <h3>What happens next?</h3>
            <ol>
              <li>Verify your email when you receive the verification email</li>
              <li>Wait for approval from an administrator with equal or higher access level</li>
              <li>You'll be notified once your account is approved</li>
              <li>You can then log in with your credentials</li>
            </ol>
          </div>

          <div className="actions">
            <a href="/login" className="btn-primary">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;

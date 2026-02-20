import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPendingApprovalsAsync, approveUserAsync, clearMessage } from '../redux/approvalSlice';
import { AppDispatch, RootState } from '../redux/store';
import './ApprovalsPage.css';

const ApprovalsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { approvals, loading, error, message } = useSelector((state: RootState) => state.approval);
  const { email } = useSelector((state: RootState) => state.auth);
  const currentEmail = email || localStorage.getItem('email') || '';

  useEffect(() => {
    dispatch(fetchPendingApprovalsAsync());
  }, [dispatch]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        dispatch(clearMessage());
        dispatch(fetchPendingApprovalsAsync());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  const handleApprove = (approvalId: string) => {
    dispatch(approveUserAsync({ approvalId, approverEmail: currentEmail }));
  };

  return (
    <div className="approvals-container">
      <h1>Pending User Approvals</h1>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {loading && <div className="loading">Loading approvals...</div>}

      {approvals.length === 0 && !loading && (
        <div className="empty-state">
          <p>No pending approvals at this time.</p>
        </div>
      )}

      {approvals.length > 0 && (
        <div className="approvals-list">
          {approvals.map((approval) => (
            <div key={approval.id} className="approval-card">
              <div className="approval-info">
                <h3>
                  {approval.firstName} {approval.lastName}
                </h3>
                <p className="email">{approval.email}</p>
                <p className="access-level">
                  Requesting <strong>{approval.requestedAccessLevel}</strong> access
                </p>
                <p className="created-at">
                  Applied: {new Date(approval.id).toLocaleDateString()}
                </p>
              </div>
              <div className="approval-actions">
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(approval.id)}
                  disabled={loading}
                >
                  {loading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { verifyEmailAsync } from '../redux/registrationSlice';
import { AppDispatch, RootState } from '../redux/store';
import './VerifyEmailPage.css';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, message } = useSelector((state: RootState) => state.registration);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      dispatch(verifyEmailAsync(token));
    }
  }, [dispatch, searchParams]);

  return (
    <div className="verify-container">
      <div className="verify-content">
        <h1>Email Verification</h1>
        {loading && (
          <div className="loading">
            <p>Verifying your email...</p>
          </div>
        )}
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
            <p>Please try clicking the verification link again.</p>
          </div>
        )}
        {message && !loading && (
          <div className="success-message">
            <p>✓ {message}</p>
            <p>Your email has been verified successfully!</p>
            <a href="/login" className="btn-primary">
              Proceed to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;

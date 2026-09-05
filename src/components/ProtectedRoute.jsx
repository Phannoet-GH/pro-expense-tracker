import React, { useContext } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, currentUser, isLoading } = useContext(UserContext);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <div className="spinner-grow text-primary mb-3" role="status"></div>
        <div className="fw-semibold text-muted small">Verifying Secure Authentication Session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && currentUser?.role !== 'admin') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
        <div className="card border-0 shadow-lg rounded-4 p-5 text-center" style={{ maxWidth: '480px' }}>
          <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex mx-auto mb-3">
            <i className="bi bi-shield-x fs-1"></i>
          </div>
          <h4 className="fw-bold text-dark mb-2">Access Denied</h4>
          <p className="text-muted small mb-4">
            The Admin Console is restricted to administrators.
          </p>
          <Link to="/dashboard" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
            <i className="bi bi-arrow-left me-1"></i> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

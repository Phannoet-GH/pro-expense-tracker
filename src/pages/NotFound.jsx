import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5"
      style={{
        backgroundColor: 'var(--bg-body, #f4f7f6)',
        color: 'var(--text-primary, #1e293b)'
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 p-5 text-center"
        style={{
          maxWidth: '540px',
          width: '100%',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderColor: 'var(--border-color, #dee2e6)'
        }}
      >
        <div
          className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-4"
          style={{
            width: '88px',
            height: '88px',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.15))',
            color: '#3b82f6'
          }}
        >
          <i className="bi bi-compass fs-1"></i>
        </div>

        <span
          className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 fw-bold align-self-center mb-3"
          style={{ fontSize: '13px' }}
        >
          ERROR 404
        </span>

        <h2 className="fw-bold mb-2">Page Not Found</h2>
        <p className="text-muted small mb-4">
          The page or financial resource you are looking for does not exist, has been moved, or requires different permissions.
        </p>

        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
          <Link
            to="/"
            className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
          >
            <i className="bi bi-house"></i>
            <span>Return Home</span>
          </Link>

          <Link
            to="/dashboard"
            className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none' }}
          >
            <i className="bi bi-speedometer2"></i>
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

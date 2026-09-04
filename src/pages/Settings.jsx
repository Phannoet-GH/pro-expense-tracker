import React, { useContext } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';

export default function Settings() {
  const { expenses, dbStatus, dbInfo, refreshFromDb, clearAllExpenses } = useContext(ExpenseContext);

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4" style={{ maxWidth: '680px' }}>
      <h3 className="fw-bold mb-4">Settings & Configuration</h3>
      
      {/* MySQL Database Status Section */}
      <div className="mb-4 p-3 rounded-3 border bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="fw-semibold m-0 text-dark">
            <i className="bi bi-database me-2 text-primary"></i>MySQL Database Integration
          </h5>
          <span className={`badge rounded-pill ${dbStatus === 'connected' ? 'bg-success' : dbStatus === 'connecting' ? 'bg-warning text-dark' : 'bg-danger'}`}>
            {dbStatus === 'connected' ? 'Connected' : dbStatus === 'connecting' ? 'Connecting...' : 'Offline'}
          </span>
        </div>
        <p className="text-muted small mb-3">
          Directly linked to local MySQL instance via Express API. All operations persist into database tables automatically.
        </p>
        <div className="row g-2 mb-3 small">
          <div className="col-sm-6">
            <div className="p-2 bg-white rounded border">
              <span className="text-muted d-block">Database Name:</span>
              <strong className="text-dark font-monospace">{dbInfo?.dbName || 'pro_expense_tracker'}</strong>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="p-2 bg-white rounded border">
              <span className="text-muted d-block">Host & Port:</span>
              <strong className="text-dark font-monospace">{dbInfo?.host || '127.0.0.1:3306'}</strong>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="p-2 bg-white rounded border">
              <span className="text-muted d-block">Active Transactions:</span>
              <strong className="text-success">{expenses.length} records</strong>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="p-2 bg-white rounded border">
              <span className="text-muted d-block">API Proxy:</span>
              <strong className="text-primary font-monospace">http://localhost:5001</strong>
            </div>
          </div>
        </div>
        <button onClick={refreshFromDb} className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-arrow-clockwise me-1"></i> Re-sync from MySQL
        </button>
      </div>

      <div className="mb-4">
        <h5 className="fw-semibold">User Profile</h5>
        <div className="d-flex align-items-center mt-3">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="User" width="60" height="60" className="rounded-circle me-3" />
          <div>
            <p className="m-0 fw-bold">Admin User</p>
            <p className="m-0 text-muted small">admin@findash.com</p>
          </div>
        </div>
      </div>
      
      <hr className="my-4 text-muted" />

      <div className="mb-4">
        <h5 className="fw-semibold mb-3">Preferences</h5>
        <div className="mb-3">
          <label className="form-label text-muted small">Default Currency</label>
          <select className="form-select w-50 bg-light border-0">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>

      <hr className="my-4 text-muted" />

      <div>
        <h5 className="fw-semibold text-danger mb-3">Danger Zone</h5>
        <p className="text-muted small">Wipe all expense rows from the MySQL database. Transactions will be permanently removed.</p>
        <button onClick={clearAllExpenses} className="btn btn-outline-danger">
          <i className="bi bi-trash3-fill me-2"></i>Wipe All MySQL Expenses
        </button>
      </div>
    </div>
  );
}
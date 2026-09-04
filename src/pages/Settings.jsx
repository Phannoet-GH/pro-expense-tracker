import React, { useContext } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';

export default function Settings() {
  const { clearAllExpenses } = useContext(ExpenseContext);

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4" style={{ maxWidth: '600px' }}>
      <h3 className="fw-bold mb-4">Settings</h3>
      
      <div className="mb-4">
        <h5 className="fw-semibold">User Profile</h5>
        <div className="d-flex align-items-center mt-3">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="User" width="64" height="64" className="rounded-circle me-3" />
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
        <p className="text-muted small">Once you delete all data, there is no going back. Please be certain.</p>
        <button onClick={clearAllExpenses} className="btn btn-outline-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>Delete All Data
        </button>
      </div>
    </div>
  );
}
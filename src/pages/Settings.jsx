import React, { useContext, useState } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { UserContext } from '../context/UserContext';

export default function Settings() {
  const {
    expenses,
    incomes,
    savingsGoals,
    dbStatus,
    dbInfo,
    refreshFromDb,
    currency,
    changeCurrency,
    loadSampleData,
    clearAllExpenses,
    clearAllIncomes,
    clearAllSavingsGoals,
    resetAllData
  } = useContext(ExpenseContext);

  const { currentUser, changePassword } = useContext(UserContext) || {};

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', message: '' });

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setPasswordStatus({ type: 'danger', message: 'Please enter both current and new password.' });
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setPasswordStatus({ type: 'danger', message: 'New password must be at least 4 characters long.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'danger', message: 'New passwords do not match. Please re-type to confirm.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (typeof changePassword === 'function') {
        await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
        setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordStatus({ type: '', message: '' }), 5000);
      } else {
        throw new Error('Password change handler not available.');
      }
    } catch (err) {
      setPasswordStatus({ type: 'danger', message: err.message || 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const totalRecords = expenses.length + incomes.length + savingsGoals.length;

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ maxWidth: '750px' }}>
      <h3 className="fw-bold mb-1 text-dark">Settings & Financial Controls</h3>
      <p className="text-muted small mb-4">Manage MySQL persistence, currency display, sample portfolio data, and database maintenance</p>

      {/* 1-Click Sample Data Loader Banner */}
      <div className="card border-0 rounded-4 p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h5 className="fw-bold mb-1">
              <i className="bi bi-magic me-2"></i>Starter Kit: Load Realistic Sample Data
            </h5>
            <p className="text-white-50 small mb-0" style={{ maxWidth: '460px' }}>
              Instantly populate realistic monthly incomes, itemized expenses with scanned receipts, and active savings goals to test every feature.
            </p>
          </div>
          <button
            onClick={loadSampleData}
            className="btn btn-light text-primary fw-bold rounded-pill px-4 shadow-sm"
          >
            <i className="bi bi-cloud-arrow-down-fill me-1"></i> Load Sample Data
          </button>
        </div>
      </div>

      {/* MySQL Database Status Section */}
      <div className="mb-4 p-3 rounded-3 border bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="fw-semibold m-0 text-dark">
            <i className="bi bi-database me-2 text-primary"></i>MySQL Database Integration
          </h5>
          <span className={`badge rounded-pill ${dbStatus === 'connected' ? 'bg-success' : dbStatus === 'connecting' ? 'bg-warning text-dark' : 'bg-danger'}`}>
            {dbStatus === 'connected' ? 'Connected' : dbStatus === 'connecting' ? 'Connecting...' : 'Offline (LocalStorage Fallback)'}
          </span>
        </div>
        <p className="text-muted small mb-3">
          Directly synchronizes Incomes, Expenses, and Savings Goals with your local MySQL instance. When offline, all transactions persist seamlessly in browser local storage.
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
              <span className="text-muted d-block">Total Database Records:</span>
              <strong className="text-success">
                {totalRecords} records ({expenses.length} exp, {incomes.length} inc, {savingsGoals.length} goals)
              </strong>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="p-2 bg-white rounded border">
              <span className="text-muted d-block">Express API Server:</span>
              <strong className="text-primary font-monospace">http://localhost:5001</strong>
            </div>
          </div>
        </div>

        <button onClick={refreshFromDb} className="btn btn-sm btn-outline-secondary rounded-pill px-3">
          <i className="bi bi-arrow-clockwise me-1"></i> Re-sync from MySQL
        </button>
      </div>

      {/* Preferences Section */}
      <div className="mb-4">
        <h5 className="fw-semibold text-dark mb-3">
          <i className="bi bi-sliders me-2 text-primary"></i>Preferences
        </h5>
        <div className="mb-3">
          <label className="form-label text-muted small fw-semibold">Default Currency</label>
          <select
            className="form-select w-50 bg-light"
            value={currency}
            onChange={(e) => changeCurrency(e.target.value)}
          >
            <option value="$">USD ($) - US Dollar</option>
            <option value="€">EUR (€) - Euro</option>
            <option value="£">GBP (£) - British Pound</option>
            <option value="៛">KHR (៛) - Cambodian Riel</option>
            <option value="¥">JPY (¥) - Japanese Yen</option>
            <option value="CA$">CAD (CA$) - Canadian Dollar</option>
            <option value="AU$">AUD (AU$) - Australian Dollar</option>
          </select>
        </div>
      </div>

      <hr className="my-4 text-muted" />

      {/* User Profile & Security Section */}
      <div className="mb-4">
        <h5 className="fw-semibold text-dark mb-3">
          <i className="bi bi-person-circle me-2 text-primary"></i>User Account & Profile
        </h5>
        <div className="d-flex align-items-center mb-4 p-3 bg-light rounded-3 border">
          <img
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Client')}&background=0D8ABC&color=fff`}
            alt={currentUser?.name || 'User'}
            width="56"
            height="56"
            className="rounded-circle me-3 border"
          />
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2">
              <p className="m-0 fw-bold text-dark fs-6">{currentUser?.name || 'Authorized Member'}</p>
              <span className={`badge rounded-pill ${currentUser?.role === 'admin' ? 'bg-primary' : 'bg-success'}`}>
                {currentUser?.role === 'admin' ? 'Super Administrator' : 'Client Account'}
              </span>
            </div>
            <p className="m-0 text-muted small">{currentUser?.email || 'N/A'}</p>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="p-3 bg-white rounded-3 border">
          <h6 className="fw-bold text-dark mb-2">
            <i className="bi bi-shield-lock me-2 text-secondary"></i>Update Password
          </h6>
          <p className="text-muted small mb-3">
            Change your personal authentication password to keep your financial ledger secure.
          </p>

          {passwordStatus.message && (
            <div className={`alert alert-${passwordStatus.type} small py-2 px-3 rounded-3 d-flex align-items-center gap-2 mb-3`}>
              <i className={`bi ${passwordStatus.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
              <div>{passwordStatus.message}</div>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-4">
                <label className="form-label small fw-semibold text-muted">Current Password</label>
                <input
                  type="password"
                  required
                  className="form-control form-control-sm"
                  placeholder="Old password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                />
              </div>
              <div className="col-12 col-sm-4">
                <label className="form-label small fw-semibold text-muted">New Password</label>
                <input
                  type="password"
                  required
                  className="form-control form-control-sm"
                  placeholder="New password (4+ chars)"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="col-12 col-sm-4">
                <label className="form-label small fw-semibold text-muted">Confirm New Password</label>
                <input
                  type="password"
                  required
                  className="form-control form-control-sm"
                  placeholder="Re-type new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold shadow-sm"
            >
              {isUpdatingPassword ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-key-fill me-1"></i> Save New Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <hr className="my-4 text-muted" />

      {/* Danger Zone */}
      <div>
        <h5 className="fw-semibold text-danger mb-2">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>Danger Zone
        </h5>
        <p className="text-muted small mb-3">Permanently purge individual tables or wipe your entire financial history.</p>

        <div className="d-flex flex-wrap gap-2">
          <button onClick={clearAllExpenses} className="btn btn-sm btn-outline-danger rounded-pill px-3">
            <i className="bi bi-trash me-1"></i> Clear All Expenses
          </button>
          <button onClick={clearAllIncomes} className="btn btn-sm btn-outline-danger rounded-pill px-3">
            <i className="bi bi-trash me-1"></i> Clear All Incomes
          </button>
          <button onClick={clearAllSavingsGoals} className="btn btn-sm btn-outline-danger rounded-pill px-3">
            <i className="bi bi-trash me-1"></i> Clear All Savings Goals
          </button>
          <button onClick={resetAllData} className="btn btn-sm btn-danger rounded-pill px-3 fw-bold">
            <i className="bi bi-trash3-fill me-1"></i> Factory Reset (Wipe All)
          </button>
        </div>
      </div>
    </div>
  );
}

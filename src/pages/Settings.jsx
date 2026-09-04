import React, { useContext } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';

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

  const totalRecords = expenses.length + incomes.length + savingsGoals.length;

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ maxWidth: '750px' }}>
      <h3 className="fw-bold mb-1 text-dark">Settings & Financial Controls</h3>
      <p className="text-muted small mb-4">Manage MySQL persistence, currency display, demo portfolio data, and database maintenance</p>

      {/* 1-Click Sample Data Loader Banner */}
      <div className="card border-0 rounded-4 p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h5 className="fw-bold mb-1">
              <i className="bi bi-magic me-2"></i>Quick Demo: Load Realistic Sample Data
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

      {/* User Profile */}
      <div className="mb-4">
        <h5 className="fw-semibold text-dark mb-3">
          <i className="bi bi-person-circle me-2 text-primary"></i>User Account
        </h5>
        <div className="d-flex align-items-center">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="User" width="50" height="50" className="rounded-circle me-3" />
          <div>
            <p className="m-0 fw-bold text-dark">Admin User</p>
            <p className="m-0 text-muted small">admin@smartfinance.com &bull; Local Workspace</p>
          </div>
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

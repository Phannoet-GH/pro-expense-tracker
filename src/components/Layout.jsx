import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ExpenseContext } from '../context/ExpenseContext';
import { UserContext } from '../context/UserContext';

export default function Layout() {
  const { dbStatus, dbInfo, refreshFromDb, netSavings, formatAmount } = useContext(ExpenseContext);
  const { currentUser, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="d-flex bg-light" id="wrapper" style={{ minHeight: '100vh' }}>
      {/* Client Sidebar */}
      <div className="bg-dark text-white sidebar border-end border-secondary border-opacity-25" style={{ width: '260px', minWidth: '260px' }}>
        <div className="sidebar-heading fs-4 fw-bold text-center py-4 border-bottom border-secondary border-opacity-50">
          <i className="bi bi-wallet2 text-primary me-2"></i>SmartFinance
          <span className="badge bg-primary-subtle text-primary ms-1" style={{ fontSize: '10px' }}>PRO</span>
          <div className="text-secondary small mt-1 fw-normal" style={{ fontSize: '11px' }}>
            Personal Finance &amp; Wealth Vault
          </div>
        </div>

        <div className="list-group list-group-flush my-3 px-2 gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/transactions"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <i className="bi bi-arrow-left-right"></i>
            <span>Income &amp; Expense</span>
          </NavLink>

          <NavLink
            to="/savings"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex justify-content-between align-items-center ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-piggy-bank text-warning"></i>
              <span>How to Save</span>
            </div>
            <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '10px' }}>50/30/20</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <i className="bi bi-pie-chart"></i>
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <i className="bi bi-gear"></i>
            <span>Settings</span>
          </NavLink>
        </div>

        {/* Sidebar Footer: Active Client Profile & Logout */}
        <div className="mt-auto p-3 border-top border-secondary border-opacity-25">
          <div className="p-3 bg-secondary bg-opacity-25 rounded-3 mb-3 border border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <img
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=0D8ABC&color=fff`}
                alt="User Avatar"
                width="36"
                height="36"
                className="rounded-circle border border-2 border-primary"
              />
              <div className="overflow-hidden">
                <div className="fw-bold text-white small text-truncate">{currentUser?.name || 'Client'}</div>
                <div className="text-secondary text-truncate" style={{ fontSize: '10px' }}>{currentUser?.email}</div>
              </div>
            </div>
            <div className="d-flex justify-content-between text-secondary mt-2 pt-2 border-top border-secondary border-opacity-25" style={{ fontSize: '10px' }}>
              <span>Target Save:</span>
              <span className="text-white fw-bold">{currentUser?.target_savings_rate || 25}%</span>
            </div>
          </div>

          <div className="d-flex flex-column gap-2">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="btn btn-sm btn-outline-danger w-100 rounded-pill py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
              >
                <i className="bi bi-shield-lock-fill"></i>
                <span>Open Admin Console</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-light w-100 rounded-pill py-2 small fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div id="page-content-wrapper" className="w-100 overflow-auto" style={{ maxHeight: '100vh' }}>
        {/* Topbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white py-3 px-4 shadow-sm border-bottom">
          <div className="d-flex align-items-center flex-wrap gap-3">
            <h2 className="fs-5 m-0 fw-bold text-dark">Personal Wealth Manager</h2>
            <span className={`badge rounded-pill ${netSavings >= 0 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-3 py-1 fw-bold`} style={{ fontSize: '0.8rem' }}>
              Net Cash Flow: {formatAmount(netSavings)}
            </span>
          </div>

          <div className="ms-auto d-flex align-items-center gap-3">
            {/* MySQL Connection Status Indicator */}
            {dbStatus === 'connected' && (
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center px-3 py-2" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                <span className="spinner-grow spinner-grow-sm text-success me-2" style={{ width: '0.5rem', height: '0.5rem' }} role="status"></span>
                <i className="bi bi-database-check me-1"></i> MySQL Live: {dbInfo?.dbName || 'pro_expense_tracker'}
              </span>
            )}
            {dbStatus === 'offline' && (
              <span
                className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center px-3 py-2"
                onClick={refreshFromDb}
                title="Click to retry connecting to MySQL"
                style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <i className="bi bi-database-x me-1"></i> Reconnect DB
              </span>
            )}

            {/* User Session Info Pill */}
            <div className="d-flex align-items-center gap-2 border rounded-pill px-3 py-1 bg-light">
              <img
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=0D8ABC&color=fff`}
                alt="Avatar"
                width="28"
                height="28"
                className="rounded-circle"
              />
              <div className="text-start d-none d-md-block">
                <div className="fw-bold small lh-1">{currentUser?.name}</div>
                <small className="text-muted" style={{ fontSize: '10px' }}>{currentUser?.email}</small>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
              title="Secure Sign Out"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-sm-inline">Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Page Content */}
        <div className="container-fluid px-4 py-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

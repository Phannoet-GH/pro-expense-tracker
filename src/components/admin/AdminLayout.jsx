import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { ExpenseContext } from '../../context/ExpenseContext';

export default function AdminLayout() {
  const { currentUser, switchRole } = useContext(UserContext);
  const { dbStatus, dbInfo, refreshFromDb, adminMetrics, formatAmount } = useContext(ExpenseContext);
  const navigate = useNavigate();

  const handleSwitchToClient = () => {
    switchRole('client');
    navigate('/');
  };

  return (
    <div className="d-flex bg-light" style={{ minHeight: '100vh' }}>
      {/* Admin Sidebar */}
      <div className="bg-dark text-white sidebar border-end border-secondary border-opacity-25" style={{ width: '270px', minWidth: '270px' }}>
        <div className="sidebar-heading fs-5 fw-bold text-center py-4 border-bottom border-secondary border-opacity-50">
          <div className="d-flex align-items-center justify-content-center gap-2">
            <span className="p-2 bg-danger bg-opacity-25 rounded-3 border border-danger border-opacity-50 text-danger">
              <i className="bi bi-shield-lock-fill"></i>
            </span>
            <div>
              SmartFinance <span className="badge bg-danger text-white rounded-pill px-2" style={{ fontSize: '10px' }}>ADMIN</span>
            </div>
          </div>
          <div className="text-secondary small mt-1 fw-normal" style={{ fontSize: '11px' }}>
            Enterprise Management Console
          </div>
        </div>

        <div className="list-group list-group-flush my-3 px-3 gap-1">
          <div className="text-uppercase text-secondary px-3 py-1 fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
            Platform Control
          </div>

          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'hover-overlay'}`}
          >
            <i className="bi bi-speedometer2 text-info"></i>
            <span>Overview & KPIs</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center justify-content-between ${isActive ? 'bg-primary text-white shadow-sm' : 'hover-overlay'}`}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-people-fill text-warning"></i>
              <span>Client Accounts</span>
            </div>
            <span className="badge bg-secondary rounded-pill" style={{ fontSize: '10px' }}>
              {adminMetrics?.totalClients || 3}
            </span>
          </NavLink>

          <NavLink
            to="/admin/audit"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'hover-overlay'}`}
          >
            <i className="bi bi-file-earmark-spreadsheet-fill text-success"></i>
            <span>Master Audit Trail</span>
          </NavLink>

          <div className="text-uppercase text-secondary px-3 pt-3 pb-1 fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
            System & Policies
          </div>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'hover-overlay'}`}
          >
            <i className="bi bi-sliders text-primary"></i>
            <span>Category Benchmarks</span>
          </NavLink>

          <NavLink
            to="/admin/system"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'hover-overlay'}`}
          >
            <i className="bi bi-database-gear text-danger"></i>
            <span>Database & Health</span>
          </NavLink>
        </div>

        {/* Portal Switcher in Sidebar Footer */}
        <div className="mt-auto p-3 border-top border-secondary border-opacity-25">
          <div className="p-3 bg-secondary bg-opacity-25 rounded-3 mb-3 border border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2 mb-2">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="Admin"
                width="36"
                height="36"
                className="rounded-circle border border-2 border-danger"
              />
              <div className="overflow-hidden">
                <div className="fw-bold text-white small text-truncate">{currentUser?.name || 'Administrator'}</div>
                <div className="text-secondary" style={{ fontSize: '10px' }}>Super Admin</div>
              </div>
            </div>
            <div className="small text-secondary" style={{ fontSize: '11px' }}>
              Logged in with full administrative privileges.
            </div>
          </div>

          <button
            onClick={handleSwitchToClient}
            className="btn btn-outline-light w-100 rounded-pill py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
          >
            <i className="bi bi-arrow-left-circle"></i>
            <span>Switch to Client Portal</span>
          </button>
        </div>
      </div>

      {/* Admin Content Wrapper */}
      <div id="page-content-wrapper" className="w-100 overflow-auto" style={{ maxHeight: '100vh' }}>
        {/* Admin Topbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white py-3 px-4 shadow-sm border-bottom">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="badge bg-danger-subtle text-danger px-2 py-1 rounded fw-bold text-uppercase" style={{ fontSize: '11px' }}>
              Admin Console
            </span>
            <span className="text-muted small">|</span>
            <span className="text-muted small">
              Platform Managed Capital: <strong className="text-dark">{formatAmount(adminMetrics?.totalPlatformVolume || 0)}</strong>
            </span>
          </div>

          <div className="ms-auto d-flex align-items-center gap-3">
            {/* DB Status */}
            {dbStatus === 'connected' && (
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center px-3 py-2" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                <span className="spinner-grow spinner-grow-sm text-success me-2" style={{ width: '0.5rem', height: '0.5rem' }} role="status"></span>
                <i className="bi bi-database-check me-1"></i> MySQL: {dbInfo?.dbName || 'pro_expense_tracker'} (Online)
              </span>
            )}
            {dbStatus === 'offline' && (
              <span
                className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center px-3 py-2"
                onClick={refreshFromDb}
                title="Click to retry connecting"
                style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <i className="bi bi-database-x me-1"></i> MySQL Offline (Click to Retry)
              </span>
            )}

            {/* Quick Exit to Client */}
            <button
              onClick={handleSwitchToClient}
              className="btn btn-sm btn-primary rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm"
            >
              <i className="bi bi-person-fill"></i>
              <span>Client Portal</span>
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <div className="container-fluid px-4 py-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

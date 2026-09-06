import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { ExpenseContext } from '../../context/ExpenseContext';

export default function AdminLayout() {
  const { currentUser, logout } = useContext(UserContext);
  const { dbStatus, refreshFromDb } = useContext(ExpenseContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleSwitchToClient = () => {
    navigate('/dashboard');
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
            Infrastructure Operations Console
          </div>
        </div>

        <div className="list-group list-group-flush my-3 px-3 gap-1">
          <div className="text-uppercase text-secondary px-3 py-1 fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
            Platform Governance
          </div>

          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'hover-overlay'}`}
          >
            <i className="bi bi-speedometer2 text-info"></i>
            <span>Overview &amp; Telemetry</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'hover-overlay'}`}
          >
            <i className="bi bi-people-fill text-warning"></i>
            <span>User Accounts</span>
          </NavLink>

          <div className="text-uppercase text-secondary px-3 pt-3 pb-1 fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
            System Policies
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
            <span>Database &amp; Latency</span>
          </NavLink>
        </div>

        {/* Portal Switcher & Logout in Sidebar Footer */}
        <div className="mt-auto p-3 border-top border-secondary border-opacity-25">
          <div className="p-3 bg-secondary bg-opacity-25 rounded-3 mb-3 border border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2 mb-2">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="Admin"
                width="34"
                height="34"
                className="rounded-circle border border-2 border-danger"
              />
              <div className="overflow-hidden">
                <div className="fw-bold text-white small text-truncate">{currentUser?.name || 'Administrator'}</div>
                <div className="text-secondary text-truncate" style={{ fontSize: '10px' }}>{currentUser?.email}</div>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column gap-2">
            <button
              onClick={handleSwitchToClient}
              className="btn btn-sm btn-outline-light w-100 rounded-pill py-2 small fw-semibold d-flex align-items-center justify-content-center gap-2"
            >
              <i className="bi bi-arrow-left-circle"></i>
              <span>Open Personal View</span>
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-danger w-100 rounded-pill py-2 small fw-bold d-flex align-items-center justify-content-center gap-2"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Content Wrapper */}
      <div id="page-content-wrapper" className="w-100 overflow-auto" style={{ maxHeight: '100vh' }}>
        {/* Admin Topbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white py-3 px-4 shadow-sm border-bottom">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="badge bg-danger text-white px-2 py-1 rounded fw-bold text-uppercase" style={{ fontSize: '11px' }}>
              Super Admin Console
            </span>
          </div>

          <div className="ms-auto d-flex align-items-center gap-2">
            {/* DB Status */}
            {dbStatus === 'connected' && (
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center px-3 py-2" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                <span className="spinner-grow spinner-grow-sm text-success me-2" style={{ width: '0.5rem', height: '0.5rem' }} role="status"></span>
                <i className="bi bi-database-check me-1"></i> MySQL Connected
              </span>
            )}
            {dbStatus === 'offline' && (
              <span
                className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center px-3 py-2"
                onClick={refreshFromDb}
                title="Click to retry connecting"
                style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <i className="bi bi-database-x me-1"></i> MySQL Offline
              </span>
            )}

            <button
              onClick={handleSwitchToClient}
              className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 shadow-xs"
            >
              <i className="bi bi-speedometer2"></i>
              <span>Personal View</span>
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Sign Out</span>
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

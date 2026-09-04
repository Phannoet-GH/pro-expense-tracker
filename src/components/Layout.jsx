import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ExpenseContext } from '../context/ExpenseContext';
import { UserContext } from '../context/UserContext';

export default function Layout() {
  const { dbStatus, dbInfo, refreshFromDb, netSavings, formatAmount } = useContext(ExpenseContext);
  const { currentUser, users, switchUser, switchRole } = useContext(UserContext);
  const navigate = useNavigate();

  const clientUsers = users.filter(u => u.role === 'client');

  const handleSwitchToAdmin = () => {
    switchRole('admin');
    navigate('/admin');
  };

  return (
    <div className="d-flex bg-light" id="wrapper" style={{ minHeight: '100vh' }}>
      {/* Client Sidebar */}
      <div className="bg-dark text-white sidebar border-end border-secondary border-opacity-25" style={{ width: '260px', minWidth: '260px' }}>
        <div className="sidebar-heading fs-4 fw-bold text-center py-4 border-bottom border-secondary border-opacity-50">
          <i className="bi bi-wallet2 text-primary me-2"></i>SmartFinance
          <span className="badge bg-primary-subtle text-primary ms-1" style={{ fontSize: '10px' }}>PRO</span>
          <div className="text-secondary small mt-1 fw-normal" style={{ fontSize: '11px' }}>
            Personal Finance & Wealth Portal
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
            <span>Income & Expense</span>
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

        {/* Sidebar Footer: Active Client Profile */}
        <div className="mt-auto p-3 border-top border-secondary border-opacity-25">
          <div className="p-3 bg-secondary bg-opacity-25 rounded-3 mb-2 border border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'Client'}
                width="36"
                height="36"
                className="rounded-circle border border-2 border-primary"
              />
              <div className="overflow-hidden">
                <div className="fw-bold text-white small text-truncate">{currentUser?.name || 'Sophia Chen'}</div>
                <div className="text-secondary text-truncate" style={{ fontSize: '10px' }}>{currentUser?.title || 'Client'}</div>
              </div>
            </div>
            <div className="d-flex justify-content-between text-secondary mt-2 pt-2 border-top border-secondary border-opacity-25" style={{ fontSize: '10px' }}>
              <span>Target Save:</span>
              <span className="text-white fw-bold">{currentUser?.targetSavingsRate || 25}%</span>
            </div>
          </div>

          <button
            onClick={handleSwitchToAdmin}
            className="btn btn-outline-danger w-100 rounded-pill py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
          >
            <i className="bi bi-shield-lock-fill"></i>
            <span>Go to Admin Portal</span>
          </button>
        </div>
      </div>

      <div id="page-content-wrapper" className="w-100 overflow-auto" style={{ maxHeight: '100vh' }}>
        {/* Topbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white py-3 px-4 shadow-sm border-bottom">
          <div className="d-flex align-items-center flex-wrap gap-3">
            <h2 className="fs-5 m-0 fw-bold text-dark">Personal Finance Manager</h2>
            <span className={`badge rounded-pill ${netSavings >= 0 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-3 py-1 fw-bold`} style={{ fontSize: '0.8rem' }}>
              Cash Flow: {formatAmount(netSavings)}
            </span>

            {/* Portal Switcher Pill */}
            <div className="btn-group btn-group-sm rounded-pill p-1 bg-light border ms-2">
              <span className="btn btn-sm btn-primary rounded-pill fw-bold px-3 py-1 text-white shadow-sm">
                <i className="bi bi-person me-1"></i>Client Side
              </span>
              <button
                type="button"
                onClick={handleSwitchToAdmin}
                className="btn btn-sm btn-light rounded-pill fw-medium px-3 py-1 text-secondary"
              >
                <i className="bi bi-shield me-1"></i>Admin Side
              </button>
            </div>
          </div>

          <div className="ms-auto d-flex align-items-center gap-2">
            {/* MySQL Connection Status Indicator */}
            {dbStatus === 'connected' && (
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center px-3 py-2 me-2" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                <span className="spinner-grow spinner-grow-sm text-success me-2" style={{ width: '0.5rem', height: '0.5rem' }} role="status"></span>
                <i className="bi bi-database-check me-1"></i> MySQL: {dbInfo?.dbName || 'pro_expense_tracker'}
              </span>
            )}
            {dbStatus === 'connecting' && (
              <span className="badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle d-inline-flex align-items-center px-3 py-2 me-2" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                <span className="spinner-border spinner-border-sm text-warning me-2" style={{ width: '0.5rem', height: '0.5rem' }} role="status"></span>
                Connecting...
              </span>
            )}
            {dbStatus === 'offline' && (
              <span
                className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center px-3 py-2 me-2"
                onClick={refreshFromDb}
                title="Click to retry connecting to MySQL"
                style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <i className="bi bi-database-x me-1"></i> Offline (Local Mode)
              </span>
            )}

            {/* Client Persona Selector Dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-light border rounded-pill px-3 py-1 d-flex align-items-center gap-2 shadow-sm dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                  alt="User"
                  width="28"
                  height="28"
                  className="rounded-circle"
                />
                <div className="text-start d-none d-md-block">
                  <div className="fw-bold small lh-1">{currentUser?.name || 'Sophia Chen'}</div>
                  <small className="text-muted" style={{ fontSize: '10px' }}>Client User</small>
                </div>
              </button>

              <ul className="dropdown-menu dropdown-menu-end shadow-sm rounded-4 border-0 p-2" style={{ width: '240px' }}>
                <li className="dropdown-header small text-uppercase text-muted py-1">
                  Switch Active Client:
                </li>
                {clientUsers.map(user => (
                  <li key={user.id}>
                    <button
                      className={`dropdown-item rounded-3 py-2 d-flex align-items-center gap-2 ${user.id === currentUser?.id ? 'active' : ''}`}
                      onClick={() => switchUser(user.id)}
                    >
                      <img src={user.avatar} alt={user.name} width="28" height="28" className="rounded-circle border" />
                      <div className="overflow-hidden">
                        <div className="fw-semibold small text-truncate">{user.name}</div>
                        <div className="text-muted small" style={{ fontSize: '10px' }}>{user.title}</div>
                      </div>
                    </button>
                  </li>
                ))}
                <li><hr className="dropdown-divider my-2" /></li>
                <li>
                  <button
                    className="dropdown-item rounded-3 py-2 text-danger fw-semibold d-flex align-items-center gap-2"
                    onClick={handleSwitchToAdmin}
                  >
                    <i className="bi bi-shield-lock-fill"></i>
                    <span>Open Admin Console</span>
                  </button>
                </li>
              </ul>
            </div>
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

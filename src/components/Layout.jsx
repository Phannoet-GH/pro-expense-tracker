import React, { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ExpenseContext } from '../context/ExpenseContext';

export default function Layout() {
  const { dbStatus, dbInfo, refreshFromDb, netSavings, formatAmount } = useContext(ExpenseContext);

  return (
    <div className="d-flex bg-light" id="wrapper" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="bg-dark text-white sidebar">
        <div className="sidebar-heading fs-4 fw-bold text-center py-4 border-bottom border-secondary">
          <i className="bi bi-wallet2 text-primary me-2"></i>SmartFinance
          <span className="badge bg-primary-subtle text-primary ms-1" style={{ fontSize: '10px' }}>PRO</span>
        </div>
        <div className="list-group list-group-flush my-3 px-2 gap-1">
          <NavLink to="/" end className={({isActive}) => `list-group-item list-group-item-action bg-transparent rounded text-white fw-medium ${isActive ? 'active' : ''}`}>
            <i className="bi bi-speedometer2 me-2"></i>Dashboard
          </NavLink>
          <NavLink to="/transactions" className={({isActive}) => `list-group-item list-group-item-action bg-transparent rounded text-white fw-medium ${isActive ? 'active' : ''}`}>
            <i className="bi bi-arrow-left-right me-2"></i>Income & Expense
          </NavLink>
          <NavLink to="/savings" className={({isActive}) => `list-group-item list-group-item-action bg-transparent rounded text-white fw-medium d-flex justify-content-between align-items-center ${isActive ? 'active' : ''}`}>
            <span><i className="bi bi-piggy-bank me-2 text-warning"></i>How to Save</span>
            <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '10px' }}>50/30/20</span>
          </NavLink>
          <NavLink to="/analytics" className={({isActive}) => `list-group-item list-group-item-action bg-transparent rounded text-white fw-medium ${isActive ? 'active' : ''}`}>
            <i className="bi bi-pie-chart me-2"></i>Analytics
          </NavLink>
          <NavLink to="/settings" className={({isActive}) => `list-group-item list-group-item-action bg-transparent rounded text-white fw-medium ${isActive ? 'active' : ''}`}>
            <i className="bi bi-gear me-2"></i>Settings
          </NavLink>
        </div>
      </div>

      <div id="page-content-wrapper" className="w-100">
        {/* Topbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white py-3 px-4 shadow-sm mb-4">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <h2 className="fs-5 m-0 fw-bold text-dark">Income, Expense & Wealth Manager</h2>
            <span className={`badge rounded-pill ${netSavings >= 0 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-3 py-1 fw-bold`} style={{ fontSize: '0.8rem' }}>
              Cash Flow: {formatAmount(netSavings)}
            </span>
          </div>
          <div className="ms-auto d-flex align-items-center">
            {/* MySQL Connection Status Indicator */}
            {dbStatus === 'connected' && (
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center px-3 py-2 me-3" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                <span className="spinner-grow spinner-grow-sm text-success me-2" style={{ width: '0.5rem', height: '0.5rem' }} role="status"></span>
                <i className="bi bi-database-check me-1"></i> MySQL: {dbInfo?.dbName || 'pro_expense_tracker'} (Connected)
              </span>
            )}
            {dbStatus === 'connecting' && (
              <span className="badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle d-inline-flex align-items-center px-3 py-2 me-3" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                <span className="spinner-border spinner-border-sm text-warning me-2" style={{ width: '0.5rem', height: '0.5rem' }} role="status"></span>
                Connecting to MySQL...
              </span>
            )}
            {dbStatus === 'offline' && (
              <span 
                className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center px-3 py-2 me-3" 
                onClick={refreshFromDb}
                title="Click to retry connecting to MySQL"
                style={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <i className="bi bi-database-x me-1"></i> MySQL Offline (Click to Retry)
              </span>
            )}

            <div className="d-flex align-items-center text-dark">
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="User" width="32" height="32" className="rounded-circle me-2" />
              <strong>Admin</strong>
            </div>
          </div>
        </nav>

        {/* Page Content goes here */}
        <div className="container-fluid px-4 pb-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
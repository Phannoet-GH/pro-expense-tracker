import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="d-flex bg-light" id="wrapper" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="bg-dark text-white sidebar">
        <div className="sidebar-heading fs-4 fw-bold text-center py-4 border-bottom border-secondary">
          <i className="bi bi-wallet2 text-primary me-2"></i>FinDash
        </div>
        <div className="list-group list-group-flush my-3 px-2 gap-1">
          <NavLink to="/" className={({isActive}) => `list-group-item list-group-item-action bg-transparent rounded text-white fw-medium ${isActive ? 'active' : ''}`}>
            <i className="bi bi-speedometer2 me-2"></i>Dashboard
          </NavLink>
          <NavLink to="/transactions" className={({isActive}) => `list-group-item list-group-item-action bg-transparent rounded text-white fw-medium ${isActive ? 'active' : ''}`}>
            <i className="bi bi-receipt me-2"></i>Transactions
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
          <div className="d-flex align-items-center">
            <h2 className="fs-5 m-0 fw-bold text-dark">Expense Tracker</h2>
          </div>
          <div className="ms-auto d-flex align-items-center">
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
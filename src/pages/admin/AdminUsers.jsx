import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { ExpenseContext } from '../../context/ExpenseContext';

export default function AdminUsers() {
  const { users, addUser, deleteUser, toggleUserStatus, switchUser } = useContext(UserContext);
  const { adminMetrics, formatAmount } = useContext(ExpenseContext);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    title: '',
    monthlyTargetIncome: '',
    targetSavingsRate: '25'
  });

  const clientUsers = users.filter(u => u.role === 'client');

  const filteredUsers = clientUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenClient = (userId) => {
    switchUser(userId);
    navigate('/');
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    addUser({
      name: newUser.name,
      email: newUser.email,
      title: newUser.title || 'Client',
      monthlyTargetIncome: parseFloat(newUser.monthlyTargetIncome) || 4000,
      targetSavingsRate: parseFloat(newUser.targetSavingsRate) || 20
    });

    setNewUser({ name: '', email: '', title: '', monthlyTargetIncome: '', targetSavingsRate: '25' });
    setShowAddModal(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fs-4 fw-bold text-dark mb-1">
            <i className="bi bi-people-fill text-warning me-2"></i>Client Accounts Directory
          </h2>
          <p className="text-muted small mb-0">
            View, onboard, and manage client user accounts and audit their individual balance sheets.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
        >
          <i className="bi bi-person-plus-fill"></i>
          <span>Add New Client</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search clients by name, email, or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-6 d-flex gap-2 justify-content-md-end">
            <select
              className="form-select w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({clientUsers.length})</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-muted text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
              <tr>
                <th className="ps-4">Client User</th>
                <th>Target Income</th>
                <th>Actual Inflows</th>
                <th>Actual Spending</th>
                <th>Net Balance</th>
                <th>Savings Rate</th>
                <th>Status</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <i className="bi bi-person-slash fs-1 d-block mb-2 text-secondary"></i>
                    No client accounts match your search query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const stats = adminMetrics?.userStats?.[user.id] || {
                    totalIncome: 0,
                    totalExpense: 0,
                    netSavings: 0,
                    savingsRate: 0,
                    transactionCount: 0
                  };

                  return (
                    <tr key={user.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            width="42"
                            height="42"
                            className="rounded-circle border"
                          />
                          <div>
                            <div className="fw-bold text-dark">{user.name}</div>
                            <div className="text-muted small" style={{ fontSize: '11px' }}>{user.email}</div>
                            <span className="badge bg-light text-secondary border mt-1" style={{ fontSize: '10px' }}>
                              {user.title || 'Client'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="fw-bold text-dark">
                        {formatAmount(user.monthlyTargetIncome || 0)}
                        <span className="text-muted small d-block" style={{ fontSize: '10px' }}>target / mo</span>
                      </td>
                      <td className="text-success fw-bold">{formatAmount(stats.totalIncome)}</td>
                      <td className="text-danger fw-bold">{formatAmount(stats.totalExpense)}</td>
                      <td>
                        <strong className={stats.netSavings >= 0 ? 'text-success' : 'text-danger'}>
                          {formatAmount(stats.netSavings)}
                        </strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px', width: '60px' }}>
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{ width: `${Math.min(100, Math.round(stats.savingsRate))}%` }}
                            ></div>
                          </div>
                          <span className="small fw-bold">{Math.round(stats.savingsRate)}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${user.status === 'active' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'}`}>
                          {user.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-1 justify-content-end">
                          {/* Open Client Portal */}
                          <button
                            onClick={() => handleOpenClient(user.id)}
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            title="Open client's personalized finance dashboard"
                          >
                            <i className="bi bi-box-arrow-in-right me-1"></i>Open Client View
                          </button>

                          {/* Toggle Status */}
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className="btn btn-sm btn-outline-secondary rounded-circle"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            title={user.status === 'active' ? 'Suspend account' : 'Activate account'}
                          >
                            <i className={`bi ${user.status === 'active' ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete client "${user.name}"?`)) {
                                deleteUser(user.id);
                              }
                            }}
                            className="btn btn-sm btn-outline-danger rounded-circle"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            title="Delete user"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus text-primary me-2"></i>Onboard New Client Account
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateUser}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Legal Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. David Miller"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. david.miller@example.com"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Occupation / Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Senior Data Analyst"
                      value={newUser.title}
                      onChange={(e) => setNewUser(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold">Target Monthly Income ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 5000"
                        value={newUser.monthlyTargetIncome}
                        onChange={(e) => setNewUser(prev => ({ ...prev, monthlyTargetIncome: e.target.value }))}
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold">Target Saving Rate (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="5"
                        max="80"
                        value={newUser.targetSavingsRate}
                        onChange={(e) => setNewUser(prev => ({ ...prev, targetSavingsRate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 fw-bold"
                  >
                    Create Client Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

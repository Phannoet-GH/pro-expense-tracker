import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { parseResponse, apiFetch } from '../../utils/api';

export default function AdminUsers() {
  const { token } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok && Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        setActionMessage(`Account for ${user.name} was ${newStatus === 'active' ? 'activated' : 'suspended'}.`);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Permanently delete account for "${user.name}"? This action cannot be undone.`)) return;

    try {
      const res = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        setActionMessage(`Account for ${user.name} was deleted.`);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fs-4 fw-bold text-dark mb-1">
            <i className="bi bi-people-fill text-warning me-2"></i>User Accounts Directory
          </h2>
          <p className="text-muted small mb-0">
            Account lifecycle management &amp; status governance.
          </p>
        </div>

        {actionMessage && (
          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-3 py-2 rounded-pill">
            <i className="bi bi-info-circle me-1"></i>{actionMessage}
          </span>
        )}
      </div>

      {/* Zero-Knowledge Privacy Notice Banner */}
      <div className="alert alert-success border-0 shadow-sm rounded-4 mb-4 p-3 d-flex align-items-center gap-3">
        <span className="p-2 bg-success text-white rounded-circle flex-shrink-0">
          <i className="bi bi-shield-check fs-5"></i>
        </span>
        <div className="small">
          <strong className="d-block text-success-emphasis">Zero-Knowledge Financial Privacy Enforced</strong>
          <span className="text-success-emphasis text-opacity-75">
            By system design, administrators cannot view client transactions, incomes, expenses, or private balances, and cannot impersonate client sessions. Each user's financial ledger is strictly isolated to their own authenticated session.
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
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
                placeholder="Search accounts by name or email..."
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
              <option value="all">All Accounts ({users.length})</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-muted text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
              <tr>
                <th className="ps-4">User Account</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered Date</th>
                <th>Last Active Login</th>
                <th className="text-end pe-4">Account Controls</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <span className="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                    Loading user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No accounts found matching your query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`}
                          alt={user.name}
                          width="38"
                          height="38"
                          className="rounded-circle border"
                        />
                        <div>
                          <div className="fw-bold text-dark">{user.name}</div>
                          <div className="text-muted small" style={{ fontSize: '11px' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge rounded-pill ${user.role === 'admin' ? 'bg-danger text-white' : 'bg-primary-subtle text-primary border border-primary-subtle'}`}>
                        {user.role === 'admin' ? 'Super Admin' : 'Client User'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge rounded-pill ${user.status === 'active' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'}`}>
                        {user.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="text-muted small font-monospace">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="text-muted small font-monospace">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="text-end pe-4">
                      {user.role !== 'admin' && (
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`btn btn-sm ${user.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'} rounded-pill px-3 py-1`}
                            title={user.status === 'active' ? 'Suspend account' : 'Reactivate account'}
                          >
                            <i className={`bi ${user.status === 'active' ? 'bi-pause-circle me-1' : 'bi-play-circle me-1'}`}></i>
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="btn btn-sm btn-outline-danger rounded-circle"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            title="Delete user account"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

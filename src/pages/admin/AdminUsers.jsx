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
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const fetchUpgradeRequests = async () => {
    if (!token) return;
    setRequestsLoading(true);
    try {
      const res = await apiFetch('/api/admin/upgrade-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok && Array.isArray(data?.requests)) {
        setUpgradeRequests(data.requests);
      }
    } catch (err) {
      console.warn('Could not fetch upgrade requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleApproveRequest = async (reqId) => {
    try {
      const res = await apiFetch(`/api/admin/upgrade-requests/${reqId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok) {
        setActionMessage(data.message || 'PRO upgrade approved successfully!');
        setTimeout(() => setActionMessage(null), 4000);
        fetchUpgradeRequests();
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok && Array.isArray(data)) {
        setUsers(data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Admin users API offline:', err);
    }

    // Offline fallback: load registered users from localStorage
    try {
      const localUsers = JSON.parse(localStorage.getItem('smartfinance_local_users') || '[]');
      const adminEntry = {
        id: 'usr-admin-master',
        name: 'Administrator',
        email: 'admin@gmail.com',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString()
      };
      setUsers([adminEntry, ...localUsers]);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUpgradeRequests();
  }, [token]);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    setActionMessage(`Account for ${user.name} was ${newStatus === 'active' ? 'activated' : 'suspended'}.`);
    setTimeout(() => setActionMessage(null), 4000);

    // Update local storage if user is stored locally
    try {
      const localUsers = JSON.parse(localStorage.getItem('smartfinance_local_users') || '[]');
      const updated = localUsers.map(u => u.id === user.id ? { ...u, status: newStatus } : u);
      localStorage.setItem('smartfinance_local_users', JSON.stringify(updated));
    } catch {}

    try {
      await apiFetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.warn('Status update API offline:', err);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Permanently delete account for "${user.name}"? This action cannot be undone.`)) return;

    setUsers(prev => prev.filter(u => u.id !== user.id));
    setActionMessage(`Account for ${user.name} was deleted.`);
    setTimeout(() => setActionMessage(null), 4000);

    // Delete from localStorage
    try {
      const localUsers = JSON.parse(localStorage.getItem('smartfinance_local_users') || '[]');
      const updated = localUsers.filter(u => u.id !== user.id);
      localStorage.setItem('smartfinance_local_users', JSON.stringify(updated));
    } catch {}

    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn('Delete user API offline:', err);
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


      {/* PRO Upgrade Inquiries Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <i className="bi bi-envelope-paper-fill text-primary"></i>
              <span>PRO Upgrade Inquiries</span>
              <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 small">
                Target: admin@gmail.com
              </span>
            </h5>
            <p className="text-muted small mb-0">
              Users requesting SmartFinance PRO ($2/mo). Review and activate with one click.
            </p>
          </div>
          <button
            onClick={fetchUpgradeRequests}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh Inquiries
          </button>
        </div>

        {requestsLoading ? (
          <div className="text-center py-3 text-muted small">
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            Checking inquiries...
          </div>
        ) : upgradeRequests.length === 0 ? (
          <div className="p-3 bg-light rounded-3 text-muted small text-center">
            <i className="bi bi-inbox me-1"></i> No pending PRO upgrade inquiries at this time.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light text-uppercase" style={{ fontSize: '11px' }}>
                <tr>
                  <th>Client</th>
                  <th>Plan &amp; Price</th>
                  <th>Payment Method</th>
                  <th>Message / Notes</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {upgradeRequests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <div className="fw-bold text-dark">{req.user_name}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{req.user_email}</div>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary fw-bold">
                        {req.plan?.toUpperCase()} ({req.price})
                      </span>
                    </td>
                    <td>{req.payment_method || 'Standard'}</td>
                    <td className="text-muted" style={{ maxWidth: '200px' }}>
                      {req.message || '—'}
                    </td>
                    <td className="font-monospace text-muted" style={{ fontSize: '11px' }}>
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge rounded-pill ${req.status === 'approved' ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                        {req.status === 'approved' ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-end">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-sm"
                        >
                          <i className="bi bi-check2-circle me-1"></i> Approve PRO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                <th>Plan</th>
                <th>Status</th>
                <th>Registered Date</th>
                <th>Last Active Login</th>
                <th className="text-end pe-4">Account Controls</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <span className="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                    Loading user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
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
                      <span className={`badge rounded-pill ${user.plan_tier === 'pro' || user.role === 'admin' ? 'bg-success text-white' : 'bg-secondary-subtle text-secondary'}`}>
                        {user.role === 'admin' ? 'Admin Suite' : user.plan_tier === 'pro' ? 'PRO ($2/mo)' : 'Free'}
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

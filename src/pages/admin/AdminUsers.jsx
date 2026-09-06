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
  const [emailStatus, setEmailStatus] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  // Reply modal states
  const [replyModalRequest, setReplyModalRequest] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [approveProOnReply, setApproveProOnReply] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState(null);

  const fetchEmailStatus = async () => {
    if (!token) return;
    try {
      const res = await apiFetch('/api/admin/email-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok) setEmailStatus(data);
    } catch {}
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await apiFetch('/api/admin/test-email', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 35000
      });
      const { ok, data } = await parseResponse(res);
      if (ok && data?.configured) {
        setTestEmailResult({ success: true, message: data.message });
      } else {
        setTestEmailResult({
          success: false,
          message: data?.message || data?.error || 'Gmail connection failed. Check your App Password in .env.'
        });
      }
    } catch (err) {
      const isTimeout =
        err?.name === 'TimeoutError' ||
        err?.name === 'AbortError' ||
        err?.message?.toLowerCase().includes('abort') ||
        err?.message?.toLowerCase().includes('timed out');
      setTestEmailResult({
        success: false,
        message: isTimeout
          ? 'Gmail verification timed out. Connecting to smtp.gmail.com took longer than expected. Please verify your internet connection or try again.'
          : (err.message || 'Connection error')
      });
    } finally {
      setTestingEmail(false);
      fetchEmailStatus();
      setTimeout(() => setTestEmailResult(null), 9000);
    }
  };

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

  const openReplyModal = (req) => {
    setReplyModalRequest(req);
    setReplySubject(`💬 [Reply from Pet Phannoet] Regarding your SmartFinance PRO Inquiry`);
    setApproveProOnReply(req.status === 'pending');
    setReplyFeedback(null);
    setReplyMessage(
      req.admin_reply ||
      `Hi ${req.user_name},\n\nThank you for reaching out regarding your SmartFinance PRO subscription!\n\nYour account has been verified and upgraded to PRO Tier. You now have unlimited AI receipt scans, CPA tax deduction tracking, and financial forecasting unlocked.\n\nBest regards,\nPet Phannoet\nSmartFinance Administrator`
    );
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyMessage.trim() || !replyModalRequest) return;
    setSendingReply(true);
    setReplyFeedback(null);

    try {
      const res = await apiFetch(`/api/admin/upgrade-requests/${replyModalRequest.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          replyMessage: replyMessage.trim(),
          subject: replySubject.trim(),
          approvePro: approveProOnReply
        })
      });

      const { ok, data } = await parseResponse(res);
      if (ok) {
        setActionMessage(`✅ Reply sent successfully to ${replyModalRequest.user_email}!`);
        setTimeout(() => setActionMessage(null), 5000);
        setReplyModalRequest(null);
        fetchUpgradeRequests();
        fetchUsers();
      } else {
        setReplyFeedback({
          success: false,
          message: data?.error || 'Failed to send reply'
        });
      }
    } catch (err) {
      setReplyFeedback({
        success: false,
        message: err.message || 'Network error sending reply'
      });
    } finally {
      setSendingReply(false);
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
    fetchEmailStatus();
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
            <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2 flex-wrap">
              <i className="bi bi-envelope-paper-fill text-primary"></i>
              <span>PRO Upgrade Inquiries</span>
              <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 small">
                Target: {emailStatus?.adminEmail || 'admin@gmail.com'}
              </span>
              {emailStatus?.configured ? (
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 small">
                  <i className="bi bi-check-circle-fill me-1"></i>Gmail Connected
                </span>
              ) : (
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2 py-1 small" title="Set GMAIL_USER & GMAIL_APP_PASSWORD in .env">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>Gmail Setup Pending
                </span>
              )}
            </h5>
            <p className="text-muted small mb-0">
              Clients requesting SmartFinance PRO. Email notifications are dispatched to Gmail when submitted.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="btn btn-sm btn-outline-primary rounded-pill px-3"
              title="Verify Gmail SMTP connection"
            >
              {testingEmail ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  Testing...
                </>
              ) : (
                <>
                  <i className="bi bi-envelope-check me-1"></i> Test Gmail
                </>
              )}
            </button>
            <button
              onClick={fetchUpgradeRequests}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
        </div>

        {testEmailResult && (
          <div className={`alert ${testEmailResult.success ? 'alert-success' : 'alert-warning'} d-flex align-items-center gap-2 rounded-3 py-2 px-3 mb-3 small`}>
            <i className={`bi ${testEmailResult.success ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
            <span>{testEmailResult.message}</span>
          </div>
        )}

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
                    <td className="text-muted" style={{ maxWidth: '220px' }}>
                      <div className="text-truncate" title={req.message}>{req.message || '—'}</div>
                      {req.admin_reply && (
                        <div className="mt-1 small text-success d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                          <i className="bi bi-arrow-return-right"></i>
                          <span className="text-truncate fw-semibold" title={req.admin_reply}>
                            Replied: {req.admin_reply}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="font-monospace text-muted" style={{ fontSize: '11px' }}>
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge rounded-pill ${req.status === 'approved' ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                        {req.status === 'approved' ? 'Approved' : 'Pending'}
                      </span>
                      {req.admin_reply && (
                        <span className="badge bg-info-subtle text-primary border border-info-subtle rounded-pill ms-1" style={{ fontSize: '10px' }}>
                          <i className="bi bi-reply-fill"></i> Replied
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2 justify-content-end align-items-center">
                        <button
                          onClick={() => openReplyModal(req)}
                          className="btn btn-sm btn-primary rounded-pill px-3 fw-semibold shadow-xs"
                          title={`Send reply message to ${req.user_email}`}
                        >
                          <i className="bi bi-reply-fill me-1"></i> Reply
                        </button>
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-sm"
                          >
                            <i className="bi bi-check2-circle me-1"></i> Approve PRO
                          </button>
                        )}
                      </div>
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
                        {user.role === 'admin' ? 'Admin Suite' : user.plan_tier === 'pro' ? 'PRO ($1/mo)' : 'Free'}
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

      {/* Interactive Reply Modal */}
      {replyModalRequest && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-gradient bg-primary text-white border-0 px-4 py-3">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-reply-all-fill"></i> Reply to Client
                  </h5>
                  <p className="mb-0 text-white-50 small">
                    Direct message from <strong>{emailStatus?.adminEmail || 'petphannoet@gmail.com'}</strong> to <strong>{replyModalRequest.user_name}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setReplyModalRequest(null)}
                ></button>
              </div>

              <form onSubmit={handleSendReply}>
                <div className="modal-body px-4 py-3">
                  {/* Client Context Banner */}
                  <div className="bg-light p-3 rounded-3 mb-3 border">
                    <div className="row g-2 align-items-center">
                      <div className="col-md-6">
                        <span className="text-muted small">Client Name &amp; Email:</span>
                        <div className="fw-bold text-dark">{replyModalRequest.user_name} &lt;{replyModalRequest.user_email}&gt;</div>
                      </div>
                      <div className="col-md-6 text-md-end">
                        <span className="text-muted small">Requested Plan:</span>
                        <div className="fw-bold text-primary">{replyModalRequest.plan?.toUpperCase()} ({replyModalRequest.price}) &bull; {replyModalRequest.payment_method || 'Standard'}</div>
                      </div>
                      {replyModalRequest.message && (
                        <div className="col-12 mt-2 pt-2 border-top">
                          <span className="text-muted small">Client's Inquiry Note:</span>
                          <div className="fst-italic text-secondary small bg-white p-2 rounded border mt-1">
                            "{replyModalRequest.message}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Template Quick Selection */}
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold mb-2">
                      <i className="bi bi-lightning-charge-fill text-warning me-1"></i> Quick Response Templates:
                    </label>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-pill"
                        onClick={() => {
                          setReplyMessage(
                            `Hi ${replyModalRequest.user_name},\n\nThank you for reaching out regarding your SmartFinance PRO subscription!\n\nYour payment has been verified and your account is now upgraded to PRO Tier. You can now enjoy unlimited AI receipt scans, CPA tax write-offs, and multi-currency exports!\n\nBest regards,\nPet Phannoet\nSmartFinance Administrator`
                          );
                          setApproveProOnReply(true);
                        }}
                      >
                        🎉 Activate PRO &amp; Thank You
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-pill"
                        onClick={() => {
                          setReplyMessage(
                            `Hi ${replyModalRequest.user_name},\n\nThank you for your PRO upgrade inquiry!\n\nCould you please reply directly with a screenshot or receipt of your payment transfer so I can verify and activate your PRO subscription right away?\n\nBest regards,\nPet Phannoet\nSmartFinance Administrator`
                          );
                          setApproveProOnReply(false);
                        }}
                      >
                        💳 Request Payment Proof
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-pill"
                        onClick={() => {
                          setReplyMessage(
                            `Hi ${replyModalRequest.user_name},\n\nThank you for contacting SmartFinance. I am reviewing your request and will follow up with you shortly. If you have any questions, feel free to reply to this message.\n\nBest regards,\nPet Phannoet\nSmartFinance Administrator`
                          );
                        }}
                      >
                        💬 General Support Follow-up
                      </button>
                    </div>
                  </div>

                  {/* Subject Input */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Email Subject:</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      value={replySubject}
                      onChange={e => setReplySubject(e.target.value)}
                      required
                    />
                  </div>

                  {/* Message Textarea */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Reply Message to {replyModalRequest.user_name}:
                    </label>
                    <textarea
                      className="form-control rounded-3"
                      rows="6"
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder="Type your reply to the client..."
                      required
                    ></textarea>
                    <div className="form-text small text-muted">
                      💡 Delivered straight to the client's email inbox and posted in their SmartFinance dashboard notification banner.
                    </div>
                  </div>

                  {/* Also Approve Checkbox */}
                  <div className="form-check form-switch p-3 bg-success-subtle rounded-3 border border-success-subtle mb-2">
                    <input
                      className="form-check-input ms-0 me-2"
                      type="checkbox"
                      id="approveProCheckbox"
                      checked={approveProOnReply}
                      onChange={e => setApproveProOnReply(e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold text-success-emphasis small" htmlFor="approveProCheckbox">
                      Also unlock PRO tier for {replyModalRequest.user_name} immediately upon sending
                    </label>
                  </div>

                  {replyFeedback && !replyFeedback.success && (
                    <div className="alert alert-danger rounded-3 py-2 px-3 small mt-3">
                      <i className="bi bi-exclamation-octagon-fill me-1"></i> {replyFeedback.message}
                    </div>
                  )}
                </div>

                <div className="modal-footer bg-light px-4 py-3 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={() => setReplyModalRequest(null)}
                    disabled={sendingReply}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                    disabled={sendingReply || !replyMessage.trim()}
                  >
                    {sendingReply ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Sending Reply...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-1"></i> Send Reply to {replyModalRequest.user_email}
                      </>
                    )}
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


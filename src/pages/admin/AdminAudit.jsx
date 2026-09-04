import React, { useState, useContext, useMemo } from 'react';
import { ExpenseContext } from '../../context/ExpenseContext';
import { UserContext } from '../../context/UserContext';

export default function AdminAudit() {
  const { masterAuditLogs, formatAmount, currency } = useContext(ExpenseContext);
  const { users } = useContext(UserContext);

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  const clientUsers = users.filter(u => u.role === 'client');

  const filteredLogs = useMemo(() => {
    return masterAuditLogs.filter(log => {
      const client = users.find(u => u.id === log.userId) || { name: 'Unknown' };
      const matchesSearch = log.title.toLowerCase().includes(search.toLowerCase()) ||
                            client.name.toLowerCase().includes(search.toLowerCase()) ||
                            log.category.toLowerCase().includes(search.toLowerCase());
      const matchesUser = selectedUser === 'all' || log.userId === selectedUser;
      const matchesType = selectedType === 'all' || log.type === selectedType;
      const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
      const matchesAnomaly = !anomalyOnly || log.isAnomaly;

      return matchesSearch && matchesUser && matchesType && matchesCategory && matchesAnomaly;
    });
  }, [masterAuditLogs, search, selectedUser, selectedType, selectedCategory, anomalyOnly, users]);

  // CSV Export
  const exportMasterCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Client Name', 'Client Email', 'Type', 'Category/Source', 'Title', `Amount (${currency})`, 'Anomaly Flag'];
    const rows = filteredLogs.map(log => {
      const client = users.find(u => u.id === log.userId) || { name: 'Client', email: 'N/A' };
      return [
        `"${log.id}"`,
        `"${log.date}"`,
        `"${client.name}"`,
        `"${client.email}"`,
        `"${log.type.toUpperCase()}"`,
        `"${log.category}"`,
        `"${log.title.replace(/"/g, '""')}"`,
        log.amount.toFixed(2),
        `"${log.isAnomaly ? log.anomalyReason : 'Normal'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartfinance_platform_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = ['Room', 'Food & Drink', 'Transport', 'Internet', 'Other', 'Salary', 'Freelance', 'Investments'];

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fs-4 fw-bold text-dark mb-1">
            <i className="bi bi-file-earmark-spreadsheet-fill text-success me-2"></i>Master Platform Audit Trail
          </h2>
          <p className="text-muted small mb-0">
            Comprehensive audit log of all financial inflows and outflows transacted across all client accounts.
          </p>
        </div>

        <button
          onClick={exportMasterCSV}
          className="btn btn-outline-success rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
        >
          <i className="bi bi-download"></i>
          <span>Export Master CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-3">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control form-control-sm bg-light border-start-0"
                placeholder="Search audit records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="all">All Clients ({clientUsers.length})</option>
              {clientUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="income">Incomes Only</option>
              <option value="expense">Expenses Only</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3 d-flex align-items-center justify-content-md-end">
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="anomalyToggle"
                checked={anomalyOnly}
                onChange={(e) => setAnomalyOnly(e.target.checked)}
              />
              <label className="form-check-label small fw-semibold text-danger ms-1" htmlFor="anomalyToggle">
                High-Value Alerts Only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-muted text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
              <tr>
                <th className="ps-4">Date</th>
                <th>Client User</th>
                <th>Type</th>
                <th>Category</th>
                <th>Transaction Title</th>
                <th className="text-end">Amount</th>
                <th className="text-center pe-4">Audit Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-file-earmark-x fs-1 d-block mb-2 text-secondary"></i>
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const client = users.find(u => u.id === log.userId) || { name: 'Client' };
                  const isIncome = log.type === 'income';

                  return (
                    <tr key={log.id} className={log.isAnomaly ? 'table-warning table-opacity-25' : ''}>
                      <td className="ps-4 text-muted small font-monospace">{log.date}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={client.avatar}
                            alt={client.name}
                            width="28"
                            height="28"
                            className="rounded-circle border"
                          />
                          <span className="fw-semibold text-dark small">{client.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${isIncome ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                          {isIncome ? 'INFLOW' : 'OUTFLOW'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border">{log.category}</span>
                      </td>
                      <td className="fw-medium text-dark small">{log.title}</td>
                      <td className={`text-end fw-bold ${isIncome ? 'text-success' : 'text-danger'}`}>
                        {isIncome ? '+' : '-'}{formatAmount(log.amount)}
                      </td>
                      <td className="text-center pe-4">
                        {log.isAnomaly ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2 py-1" title={log.anomalyReason}>
                            <i className="bi bi-exclamation-triangle-fill me-1"></i>High Value
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border rounded-pill px-2 py-1">
                            <i className="bi bi-check-circle me-1 text-success"></i>Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

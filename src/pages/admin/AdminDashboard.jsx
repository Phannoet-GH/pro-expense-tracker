import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExpenseContext } from '../../context/ExpenseContext';
import { UserContext } from '../../context/UserContext';

export default function AdminDashboard() {
  const { adminMetrics, formatAmount, masterAuditLogs, loadSampleData } = useContext(ExpenseContext);
  const { users, switchUser } = useContext(UserContext);
  const navigate = useNavigate();

  const clientUsers = users.filter(u => u.role === 'client');

  const handleImpersonate = (userId) => {
    switchUser(userId);
    navigate('/');
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fs-4 fw-bold text-dark mb-1">
            <i className="bi bi-shield-check text-primary me-2"></i>Platform Administration Overview
          </h2>
          <p className="text-muted small mb-0">
            System-wide operational metrics, aggregate transaction throughput, and client account health.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            onClick={loadSampleData}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm d-flex align-items-center gap-1"
            title="Refresh sample multi-client dataset"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Seed Demo Data</span>
          </button>
          <Link
            to="/admin/users"
            className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm d-flex align-items-center gap-1"
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>Add Client Account</span>
          </Link>
        </div>
      </div>

      {/* 4 Master KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-primary border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">Active Client Accounts</span>
              <span className="p-2 bg-primary-subtle text-primary rounded-circle">
                <i className="bi bi-people-fill"></i>
              </span>
            </div>
            <h3 className="fs-3 fw-bold text-dark mb-1">{clientUsers.length}</h3>
            <div className="text-muted small" style={{ fontSize: '12px' }}>
              <span className="text-success fw-bold me-1">100% Active</span> across platform
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-success border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">Platform Volume Processed</span>
              <span className="p-2 bg-success-subtle text-success rounded-circle">
                <i className="bi bi-currency-exchange"></i>
              </span>
            </div>
            <h3 className="fs-3 fw-bold text-dark mb-1">{formatAmount(adminMetrics?.totalPlatformVolume || 0)}</h3>
            <div className="text-muted small" style={{ fontSize: '12px' }}>
              {adminMetrics?.totalTransactions || 0} total ledger entries recorded
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-info border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">Platform Net Cash Flow</span>
              <span className="p-2 bg-info-subtle text-info rounded-circle">
                <i className="bi bi-graph-up-arrow"></i>
              </span>
            </div>
            <h3 className={`fs-3 fw-bold mb-1 ${(adminMetrics?.netPlatformCashFlow || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatAmount(adminMetrics?.netPlatformCashFlow || 0)}
            </h3>
            <div className="text-muted small" style={{ fontSize: '12px' }}>
              Inflow: {formatAmount(adminMetrics?.totalPlatformIncome || 0)} vs Outflow: {formatAmount(adminMetrics?.totalPlatformExpenses || 0)}
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-warning border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">Managed Savings Assets</span>
              <span className="p-2 bg-warning-subtle text-warning rounded-circle">
                <i className="bi bi-piggy-bank-fill"></i>
              </span>
            </div>
            <h3 className="fs-3 fw-bold text-dark mb-1">{formatAmount(adminMetrics?.totalPlatformSaved || 0)}</h3>
            <div className="text-muted small" style={{ fontSize: '12px' }}>
              Target: {formatAmount(adminMetrics?.totalPlatformTarget || 0)} across all goals
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Client Accounts Directory Quick View */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-1">Managed Client Accounts</h5>
                <span className="text-muted small">Summary performance per registered client account</span>
              </div>
              <Link to="/admin/users" className="btn btn-sm btn-outline-primary rounded-pill px-3">
                View All Users <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-muted">
                  <tr>
                    <th>Client</th>
                    <th>Recorded Income</th>
                    <th>Total Expenses</th>
                    <th>Net Balance</th>
                    <th>Savings Rate</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clientUsers.map(client => {
                    const stats = adminMetrics?.userStats?.[client.id] || {
                      totalIncome: 0,
                      totalExpense: 0,
                      netSavings: 0,
                      savingsRate: 0
                    };

                    return (
                      <tr key={client.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={client.avatar}
                              alt={client.name}
                              width="36"
                              height="36"
                              className="rounded-circle border"
                            />
                            <div>
                              <div className="fw-bold text-dark">{client.name}</div>
                              <div className="text-muted small" style={{ fontSize: '11px' }}>{client.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-success fw-bold">{formatAmount(stats.totalIncome)}</td>
                        <td className="text-danger fw-bold">{formatAmount(stats.totalExpense)}</td>
                        <td>
                          <span className={`fw-bold ${stats.netSavings >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatAmount(stats.netSavings)}
                          </span>
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
                        <td className="text-end">
                          <button
                            onClick={() => handleImpersonate(client.id)}
                            className="btn btn-xs btn-outline-primary rounded-pill px-2 py-1 shadow-sm"
                            title="Switch into this client's portal"
                          >
                            <i className="bi bi-box-arrow-in-right me-1"></i>Open Client View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Platform Activity Feed */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Platform Activity</h5>
              <span className="badge bg-light text-dark border">Recent</span>
            </div>

            <div className="d-flex flex-column gap-3">
              {masterAuditLogs.slice(0, 6).map((log, idx) => {
                const client = users.find(u => u.id === log.userId) || { name: 'Client' };
                const isIncome = log.type === 'income';

                return (
                  <div key={log.id || idx} className="d-flex align-items-start gap-3 p-2 rounded-3 hover-overlay">
                    <span className={`p-2 rounded-circle ${isIncome ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                      <i className={`bi ${isIncome ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`}></i>
                    </span>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="fw-bold text-dark text-truncate small">{log.title}</span>
                        <span className={`fw-bold small ${isIncome ? 'text-success' : 'text-danger'}`}>
                          {isIncome ? '+' : '-'}{formatAmount(log.amount)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between text-muted" style={{ fontSize: '11px' }}>
                        <span>{client.name} &bull; {log.category}</span>
                        <span>{log.date}</span>
                      </div>
                      {log.isAnomaly && (
                        <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill mt-1" style={{ fontSize: '10px' }}>
                          <i className="bi bi-exclamation-triangle-fill me-1"></i>High Value Alert
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-3 border-top text-center">
              <Link to="/admin/audit" className="small text-primary text-decoration-none fw-semibold">
                Open Full Audit Trail ({masterAuditLogs.length} events) <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

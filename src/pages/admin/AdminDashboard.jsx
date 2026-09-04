import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { ExpenseContext } from '../../context/ExpenseContext';
import { parseResponse, apiFetch } from '../../utils/api';

export default function AdminDashboard() {
  const { token } = useContext(UserContext);
  const { dbStatus, dbInfo } = useContext(ExpenseContext);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok && data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fs-4 fw-bold text-dark mb-1">
            <i className="bi bi-shield-check text-primary me-2"></i>Platform Infrastructure Console
          </h2>
          <p className="text-muted small mb-0">
            System uptime, service telemetry, and account governance with zero-knowledge financial privacy.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm d-flex align-items-center gap-1"
        >
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Zero-Knowledge Privacy Callout */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4 border-start border-success border-4">
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
            <i className="bi bi-shield-lock-fill fs-3"></i>
          </div>
          <div>
            <h5 className="fw-bold text-dark mb-1">Zero-Knowledge Financial Security Active</h5>
            <p className="text-muted small mb-0">
              Each user's income streams, expenses, and savings goals are strictly encrypted and isolated. As a Super Administrator, you manage platform availability and account governance without inspecting or accessing client financial ledgers.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Infrastructure KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-primary border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">Total Registered Users</span>
              <span className="p-2 bg-primary-subtle text-primary rounded-circle">
                <i className="bi bi-people-fill"></i>
              </span>
            </div>
            <h3 className="fs-3 fw-bold text-dark mb-1">{stats?.totalUsers || 0}</h3>
            <div className="text-muted small" style={{ fontSize: '12px' }}>
              <span className="text-success fw-bold me-1">{stats?.activeUsers || 0} Active</span> accounts
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-success border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">MySQL Engine Status</span>
              <span className="p-2 bg-success-subtle text-success rounded-circle">
                <i className="bi bi-database-check"></i>
              </span>
            </div>
            <h3 className="fs-3 fw-bold text-success mb-1">
              {dbStatus === 'connected' ? 'CONNECTED' : 'OFFLINE'}
            </h3>
            <div className="text-muted small font-monospace" style={{ fontSize: '12px' }}>
              {dbInfo?.dbName || 'pro_expense_tracker'}
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-info border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">Server Process Uptime</span>
              <span className="p-2 bg-info-subtle text-info rounded-circle">
                <i className="bi bi-clock-history"></i>
              </span>
            </div>
            <h3 className="fs-3 fw-bold text-dark mb-1">
              {stats?.system?.uptimeSeconds ? `${Math.round(stats.system.uptimeSeconds / 60)} min` : '< 1 min'}
            </h3>
            <div className="text-muted small" style={{ fontSize: '12px' }}>
              Node {stats?.system?.nodeVersion || process.version} runtime
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white border-start border-warning border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-semibold">Memory Allocated</span>
              <span className="p-2 bg-warning-subtle text-warning rounded-circle">
                <i className="bi bi-cpu-fill"></i>
              </span>
            </div>
            <h3 className="fs-3 fw-bold text-dark mb-1">
              {stats?.system?.memoryUsageMb || 45} MB
            </h3>
            <div className="text-muted small" style={{ fontSize: '12px' }}>
              Optimized low footprint
            </div>
          </div>
        </div>
      </div>

      {/* Row: Quick Admin Actions & Database Stats */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <h5 className="fw-bold mb-3">Database Telemetry</h5>
            <p className="text-muted small mb-3">
              Total persistent entities tracked in MySQL across all partitions.
            </p>

            <div className="list-group list-group-flush border rounded-3 overflow-hidden mb-3">
              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <span className="small fw-semibold">User Profiles</span>
                <span className="badge bg-primary rounded-pill">{stats?.totalUsers || 0} rows</span>
              </div>
              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <span className="small fw-semibold">Encrypted Expense Entries</span>
                <span className="badge bg-danger rounded-pill">{stats?.databaseMetrics?.totalExpenseRows || 0} rows</span>
              </div>
              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <span className="small fw-semibold">Encrypted Income Streams</span>
                <span className="badge bg-success rounded-pill">{stats?.databaseMetrics?.totalIncomeRows || 0} rows</span>
              </div>
              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <span className="small fw-semibold">Tracked Savings Goals</span>
                <span className="badge bg-info text-dark rounded-pill">{stats?.databaseMetrics?.totalGoalRows || 0} rows</span>
              </div>
            </div>

            <Link to="/admin/system" className="btn btn-sm btn-outline-primary rounded-pill px-3">
              Open Advanced DB Diagnostics <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <h5 className="fw-bold mb-3">System Operational Controls</h5>
            <p className="text-muted small mb-3">
              Direct access to platform policies and user lifecycle governance.
            </p>

            <div className="d-flex flex-column gap-2 mb-3">
              <Link to="/admin/users" className="btn btn-light border text-start rounded-3 p-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <span className="p-2 bg-primary-subtle text-primary rounded-circle">
                    <i className="bi bi-people"></i>
                  </span>
                  <div>
                    <strong className="d-block small text-dark">User Account Governance</strong>
                    <span className="text-muted" style={{ fontSize: '11px' }}>Manage user status, activations, and account deletions</span>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>

              <Link to="/admin/categories" className="btn btn-light border text-start rounded-3 p-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <span className="p-2 bg-warning-subtle text-warning-emphasis rounded-circle">
                    <i className="bi bi-sliders"></i>
                  </span>
                  <div>
                    <strong className="d-block small text-dark">Category Benchmark Allocations</strong>
                    <span className="text-muted" style={{ fontSize: '11px' }}>Configure recommended baseline ratios (35/25/15/5/20)</span>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>

              <Link to="/admin/system" className="btn btn-light border text-start rounded-3 p-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <span className="p-2 bg-danger-subtle text-danger rounded-circle">
                    <i className="bi bi-database-gear"></i>
                  </span>
                  <div>
                    <strong className="d-block small text-dark">Database Health &amp; Ping</strong>
                    <span className="text-muted" style={{ fontSize: '11px' }}>Run live latency checks and inspect connection pool</span>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

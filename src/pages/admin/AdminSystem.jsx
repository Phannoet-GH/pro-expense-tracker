import React, { useState, useEffect, useContext } from 'react';
import { ExpenseContext } from '../../context/ExpenseContext';
import { UserContext } from '../../context/UserContext';
import { parseResponse, apiFetch } from '../../utils/api';

export default function AdminSystem() {
  const {
    dbStatus,
    dbInfo,
    refreshFromDb,
    expenses = [],
    incomes = [],
    savingsGoals = [],
    budgets = {},
    loadSampleData,
    resetAllData
  } = useContext(ExpenseContext);

  const { token, currentUser } = useContext(UserContext);

  const [stats, setStats] = useState(null);
  const [pingStatus, setPingStatus] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState(null);

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await apiFetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok && data) setStats(data);
    } catch (err) {
      console.warn('Could not fetch admin system stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const handlePing = async () => {
    setIsPinging(true);
    setPingStatus(null);
    try {
      const start = performance.now();
      const res = await apiFetch('/api/health');
      const end = performance.now();
      const { ok, data } = await parseResponse(res);
      setPingStatus({
        ok,
        time: Math.round(end - start),
        data
      });
    } catch (err) {
      setPingStatus({
        ok: false,
        error: err.message
      });
    } finally {
      setIsPinging(false);
    }
  };

  const exportSystemBackupJSON = () => {
    const backup = {
      exportTimestamp: new Date().toISOString(),
      platform: 'SmartFinance PRO',
      environment: 'Production',
      currentUser: currentUser?.email,
      systemStats: stats,
      personalWorkspace: {
        expenses,
        incomes,
        savingsGoals,
        budgets
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smartfinance_system_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fs-4 fw-bold text-dark mb-1">
            <i className="bi bi-database-gear text-danger me-2"></i>Database & System Diagnostics
          </h2>
          <p className="text-muted small mb-0">
            Monitor MySQL backend services, check database integrity, and run system maintenance procedures.
          </p>
        </div>

        <button
          onClick={exportSystemBackupJSON}
          className="btn btn-outline-dark rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
        >
          <i className="bi bi-cloud-arrow-down-fill"></i>
          <span>Download System Backup (JSON)</span>
        </button>
      </div>

      <div className="row g-4 mb-4">
        {/* Connection Status Card */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <h5 className="fw-bold mb-3">MySQL Service Health</h5>

            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Status:</span>
                <span className={`badge rounded-pill ${dbStatus === 'connected' ? 'bg-success text-white' : dbStatus === 'connecting' ? 'bg-warning text-dark' : 'bg-danger text-white'} px-3 py-1`}>
                  {dbStatus === 'connected' ? 'CONNECTED' : dbStatus === 'connecting' ? 'CONNECTING...' : 'OFFLINE (LOCAL STORAGE ACTIVE)'}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Target Database:</span>
                <span className="font-monospace fw-bold text-dark">{dbInfo?.dbName || 'pro_expense_tracker'}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">Host & Port:</span>
                <span className="font-monospace text-muted">{dbInfo?.host || '127.0.0.1:3306'}</span>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                onClick={handlePing}
                disabled={isPinging}
                className="btn btn-primary rounded-pill px-3 shadow-sm d-flex align-items-center gap-1"
              >
                {isPinging ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    <span>Pinging...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-broadcast"></i>
                    <span>Ping Backend API</span>
                  </>
                )}
              </button>

              <button
                onClick={refreshFromDb}
                className="btn btn-outline-secondary rounded-pill px-3"
              >
                <i className="bi bi-arrow-clockwise me-1"></i>Reconnect
              </button>
            </div>

            {pingStatus && (
              <div className={`mt-3 p-3 rounded-3 small ${pingStatus.ok ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}>
                {pingStatus.ok ? (
                  <div>
                    <i className="bi bi-check-circle-fill me-1"></i>
                    API responded in <strong>{pingStatus.time}ms</strong> with status <code>{pingStatus.data?.status}</code>.
                  </div>
                ) : (
                  <div>
                    <i className="bi bi-x-circle-fill me-1"></i>
                    Ping failed: {pingStatus.error}. Operating in LocalStorage fallback mode.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Database Table Row Counts */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <h5 className="fw-bold mb-3">Live Entity Row Counts</h5>

            <div className="list-group list-group-flush border rounded-3 overflow-hidden">
              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-people text-warning"></i>
                  <span className="fw-semibold small">users</span>
                </div>
                <span className="badge bg-primary rounded-pill">
                  {stats?.totalUsers ?? 1} rows
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-arrow-up-right text-danger"></i>
                  <span className="fw-semibold small">expenses</span>
                </div>
                <span className="badge bg-danger rounded-pill">
                  {stats?.databaseMetrics?.totalExpenseRows ?? expenses.length} rows
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-arrow-down-left text-success"></i>
                  <span className="fw-semibold small">incomes</span>
                </div>
                <span className="badge bg-success rounded-pill">
                  {stats?.databaseMetrics?.totalIncomeRows ?? incomes.length} rows
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-piggy-bank text-info"></i>
                  <span className="fw-semibold small">savings_goals</span>
                </div>
                <span className="badge bg-info text-dark rounded-pill">
                  {stats?.databaseMetrics?.totalGoalRows ?? savingsGoals.length} rows
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-sliders text-secondary"></i>
                  <span className="fw-semibold small">budgets</span>
                </div>
                <span className="badge bg-secondary rounded-pill">
                  {Object.keys(budgets || {}).length} rows
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Controls */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h5 className="fw-bold mb-0">Maintenance &amp; Data Operations</h5>
          {maintenanceMsg && (
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
              <i className="bi bi-check-circle me-1"></i>{maintenanceMsg}
            </span>
          )}
        </div>
        <p className="text-muted small mb-4">
          Quick administrative actions for workspace initialization and clearing entity records.
        </p>

        <div className="d-flex flex-wrap gap-3">
          <button
            onClick={async () => {
              await loadSampleData?.();
              await fetchStats();
              setMaintenanceMsg('Sample workspace data loaded.');
              setTimeout(() => setMaintenanceMsg(null), 4000);
            }}
            className="btn btn-success rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
          >
            <i className="bi bi-database-add"></i>
            <span>Load Sample Workspace Data</span>
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Purge all financial records in your workspace?')) {
                await resetAllData?.();
                await fetchStats();
                setMaintenanceMsg('Workspace financial records cleared.');
                setTimeout(() => setMaintenanceMsg(null), 4000);
              }
            }}
            className="btn btn-outline-danger rounded-pill px-4 d-flex align-items-center gap-2"
          >
            <i className="bi bi-trash3-fill"></i>
            <span>Purge All Financial Records</span>
          </button>
        </div>
      </div>
    </div>
  );
}

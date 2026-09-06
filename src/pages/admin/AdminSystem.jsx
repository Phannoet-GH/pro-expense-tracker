import React, { useState, useEffect, useContext } from 'react';
import { ExpenseContext } from '../../context/ExpenseContext';
import { UserContext } from '../../context/UserContext';
import { parseResponse, apiFetch } from '../../utils/api';

export default function AdminSystem() {
  const {
    dbStatus,
    refreshFromDb,
    expenses = [],
    incomes = [],
    savingsGoals = [],
    budgets = {},
    resetAllData
  } = useContext(ExpenseContext);

  const { token, currentUser } = useContext(UserContext);

  const [stats, setStats] = useState(null);
  const [pingStatus, setPingStatus] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState(null);

  // System Audit States
  const [auditData, setAuditData] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);

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

  const runAudit = async () => {
    if (!token) return;
    setIsAuditing(true);
    setAuditError(null);
    try {
      const res = await apiFetch('/api/admin/audit', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok && data) {
        setAuditData(data);
      } else {
        setAuditError(data?.error || 'System audit failed');
      }
    } catch (err) {
      setAuditError(err.message || 'Network error during system audit');
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    runAudit();
  }, [token]);

  const handleCleanOrphans = async () => {
    if (!token) return;
    setCleaningOrphans(true);
    try {
      const res = await apiFetch('/api/admin/audit/fix-orphans', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok && data) {
        setMaintenanceMsg(`✅ ${data.message}`);
        await runAudit();
        await fetchStats();
        setTimeout(() => setMaintenanceMsg(null), 5000);
      }
    } catch (err) {
      console.error('Failed to clean orphans:', err);
    } finally {
      setCleaningOrphans(false);
    }
  };

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

  const exportAuditReportJSON = () => {
    if (!auditData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smartfinance_audit_report_${auditData.auditId || 'latest'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportSystemBackupJSON = () => {
    const backup = {
      exportTimestamp: new Date().toISOString(),
      platform: 'SmartFinance PRO',
      environment: 'Production',
      currentUser: currentUser?.email,
      systemStats: stats,
      auditReport: auditData,
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
            <i className="bi bi-shield-check text-primary me-2"></i>System Audit &amp; Diagnostics
          </h2>
          <p className="text-muted small mb-0">
            Audit MySQL backend infrastructure, inspect security compliance, verify schema integrity, and maintain data hygiene.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            onClick={runAudit}
            disabled={isAuditing}
            className="btn btn-primary rounded-pill px-4 shadow-sm d-flex align-items-center gap-2 fw-semibold"
          >
            {isAuditing ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                <span>Auditing System...</span>
              </>
            ) : (
              <>
                <i className="bi bi-shield-shaded"></i>
                <span>Run System Audit</span>
              </>
            )}
          </button>

          <button
            onClick={exportSystemBackupJSON}
            className="btn btn-outline-dark rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
          >
            <i className="bi bi-cloud-arrow-down-fill"></i>
            <span>System Backup</span>
          </button>
        </div>
      </div>

      {/* Hero Audit Scorecard */}
      {auditData && (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3">
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-4 ${
                  auditData.grade === 'A+' || auditData.grade === 'A'
                    ? 'bg-success'
                    : auditData.grade === 'B'
                    ? 'bg-warning'
                    : 'bg-danger'
                }`}
                style={{ width: '56px', height: '56px' }}
              >
                {auditData.grade}
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="fw-bold mb-0 text-dark">System Audit Report</h5>
                  <span className="badge bg-primary-subtle text-primary font-monospace rounded-pill">
                    {auditData.auditId}
                  </span>
                  <span className="badge bg-success text-white rounded-pill">
                    {auditData.score}% Score
                  </span>
                </div>
                <div className="text-muted small mt-1">
                  Audited at {new Date(auditData.timestamp).toLocaleTimeString()} ({auditData.durationMs}ms) • Node {auditData.environment?.nodeVersion} on {auditData.environment?.platform}
                </div>
              </div>
            </div>

            <button
              onClick={exportAuditReportJSON}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1"
            >
              <i className="bi bi-download"></i>
              <span>Export Audit JSON</span>
            </button>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border">
                <div className="text-muted small text-uppercase fw-bold" style={{ fontSize: '11px' }}>Checklist Status</div>
                <div className="fs-5 fw-bold text-dark mt-1">
                  <span className="text-success">{auditData.summary?.passed} Pass</span>
                  {auditData.summary?.warnings > 0 && (
                    <span className="text-warning ms-2">{auditData.summary?.warnings} Warn</span>
                  )}
                  {auditData.summary?.failed > 0 && (
                    <span className="text-danger ms-2">{auditData.summary?.failed} Fail</span>
                  )}
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border">
                <div className="text-muted small text-uppercase fw-bold" style={{ fontSize: '11px' }}>Database Latency</div>
                <div className="fs-5 fw-bold text-dark mt-1">
                  {auditData.checks?.find(c => c.name.includes('Latency'))?.details.match(/\d+ms/)?.[0] || 'Active'}
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border">
                <div className="text-muted small text-uppercase fw-bold" style={{ fontSize: '11px' }}>Orphan Records</div>
                <div className={`fs-5 fw-bold mt-1 ${auditData.orphanRecords > 0 ? 'text-warning' : 'text-success'}`}>
                  {auditData.orphanRecords > 0 ? `${auditData.orphanRecords} Orphaned` : '0 Clean'}
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded-3 border">
                <div className="text-muted small text-uppercase fw-bold" style={{ fontSize: '11px' }}>Core Tables</div>
                <div className="fs-5 fw-bold text-dark mt-1">
                  {Object.keys(auditData.tables || {}).length} Verified
                </div>
              </div>
            </div>
          </div>

          {/* Orphan Records Warning Banner with 1-Click Fix */}
          {auditData.orphanRecords > 0 && (
            <div className="p-3 rounded-3 mb-4 bg-warning-subtle border border-warning-subtle d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
                <div>
                  <strong className="text-dark">Orphaned Financial Records Detected</strong>
                  <div className="small text-muted">
                    Found {auditData.orphanRecords} test/legacy record(s) not linked to any active user account.
                  </div>
                </div>
              </div>
              <button
                onClick={handleCleanOrphans}
                disabled={cleaningOrphans}
                className="btn btn-sm btn-warning rounded-pill px-3 fw-semibold shadow-xs"
              >
                {cleaningOrphans ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    <span>Cleaning...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-brush-fill me-1"></i>
                    <span>Clean Orphan Records Now</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Audit Checklist Table */}
          <div className="table-responsive border rounded-3 overflow-hidden">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light text-uppercase" style={{ fontSize: '11px' }}>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Audit Check Component</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Diagnostic Findings &amp; Evidence</th>
                </tr>
              </thead>
              <tbody>
                {auditData.checks?.map((check, idx) => (
                  <tr key={idx}>
                    <td className="text-center">
                      {check.status === 'PASS' ? (
                        <i className="bi bi-check-circle-fill text-success fs-6"></i>
                      ) : check.status === 'WARN' ? (
                        <i className="bi bi-exclamation-circle-fill text-warning fs-6"></i>
                      ) : (
                        <i className="bi bi-x-circle-fill text-danger fs-6"></i>
                      )}
                    </td>
                    <td className="fw-semibold text-dark">{check.name}</td>
                    <td>
                      <span className="badge bg-light text-secondary border rounded-pill">
                        {check.category}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill ${
                          check.status === 'PASS'
                            ? 'bg-success text-white'
                            : check.status === 'WARN'
                            ? 'bg-warning text-dark'
                            : 'bg-danger text-white'
                        }`}
                      >
                        {check.status}
                      </span>
                    </td>
                    <td className="text-muted">{check.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {auditError && (
        <div className="alert alert-danger rounded-4 p-3 mb-4 shadow-sm">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          <strong>Audit Encountered An Error:</strong> {auditError}
        </div>
      )}

      {/* Row: MySQL Service Health & Live Entity Row Counts */}
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
                <span className="text-muted small">Database Engine:</span>
                <span className="fw-semibold text-dark">MySQL 8.0 (SSL Connected)</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">Connection Mode:</span>
                <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1">Connection Pool Active</span>
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
                  {auditData?.tables?.users ?? stats?.totalUsers ?? 1} rows
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-arrow-up-right text-danger"></i>
                  <span className="fw-semibold small">expenses</span>
                </div>
                <span className="badge bg-danger rounded-pill">
                  {auditData?.tables?.expenses ?? stats?.databaseMetrics?.totalExpenseRows ?? expenses.length} rows
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-arrow-down-left text-success"></i>
                  <span className="fw-semibold small">incomes</span>
                </div>
                <span className="badge bg-success rounded-pill">
                  {auditData?.tables?.incomes ?? stats?.databaseMetrics?.totalIncomeRows ?? incomes.length} rows
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-piggy-bank text-info"></i>
                  <span className="fw-semibold small">savings_goals</span>
                </div>
                <span className="badge bg-info text-dark rounded-pill">
                  {auditData?.tables?.savings_goals ?? stats?.databaseMetrics?.totalGoalRows ?? savingsGoals.length} rows
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-envelope-paper text-primary"></i>
                  <span className="fw-semibold small">upgrade_requests</span>
                </div>
                <span className="badge bg-primary-subtle text-primary rounded-pill">
                  {auditData?.tables?.upgrade_requests ?? 0} rows
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-sliders text-secondary"></i>
                  <span className="fw-semibold small">budgets</span>
                </div>
                <span className="badge bg-secondary rounded-pill">
                  {auditData?.tables?.budgets ?? Object.keys(budgets || {}).length} rows
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
              await fetchStats();
              await runAudit();
              await refreshFromDb();
              setMaintenanceMsg('System diagnostics and stats refreshed.');
              setTimeout(() => setMaintenanceMsg(null), 4000);
            }}
            className="btn btn-outline-primary rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh Diagnostics</span>
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Purge all financial records in your workspace?')) {
                await resetAllData?.();
                await fetchStats();
                await runAudit();
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

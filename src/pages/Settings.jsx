import React, { useContext, useState, useRef } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { UserContext } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { CURRENCY_METADATA, SUPPORTED_CURRENCIES } from '../utils/currency';

export default function Settings() {
  const {
    currency,
    changeCurrency,
    ratesStatus,
    refreshExchangeRates,
    customKhrRate,
    updateCustomKhrRate,
    dualCurrencyEnabled,
    toggleDualCurrency,
    expenses,
    incomes,
    savingsGoals,
    budgets,
    clearAllExpenses,
    clearAllIncomes,
    clearAllSavingsGoals,
    resetAllData,
    addExpense,
    addIncome,
    addSavingsGoal
  } = useContext(ExpenseContext);

  const { currentUser, changePassword } = useContext(UserContext) || {};
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Currency & Rate states
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [rateSyncStatus, setRateSyncStatus] = useState('');
  const [tempKhrRate, setTempKhrRate] = useState(customKhrRate || '4100');
  const [khrSaveNotice, setKhrSaveNotice] = useState(false);

  // Backup & Restore
  const importFileRef = useRef(null);
  const [backupMsg, setBackupMsg] = useState({ type: '', message: '' });

  const handleSyncRates = async () => {
    setIsSyncingRates(true);
    setRateSyncStatus('Fetching latest market rates...');
    const res = await refreshExchangeRates();
    setIsSyncingRates(false);
    if (res?.success) {
      setRateSyncStatus('✅ Exchange rates successfully updated to latest market rates!');
      setTimeout(() => setRateSyncStatus(''), 4000);
    } else {
      setRateSyncStatus(`⚠️ Using cached rates (${res?.error || 'Network error'})`);
      setTimeout(() => setRateSyncStatus(''), 4000);
    }
  };

  const handleSaveKhrRate = (e) => {
    e.preventDefault();
    updateCustomKhrRate(tempKhrRate);
    setKhrSaveNotice(true);
    setTimeout(() => setKhrSaveNotice(false), 3000);
  };

  const handleExportBackup = () => {
    const backupData = {
      app: 'SmartFinance PRO',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      currency,
      customKhrRate,
      expenses,
      incomes,
      savingsGoals,
      budgets
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smartfinance_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setBackupMsg({ type: 'success', message: 'Backup JSON downloaded successfully!' });
    setTimeout(() => setBackupMsg({ type: '', message: '' }), 4000);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json || (!Array.isArray(json.expenses) && !Array.isArray(json.incomes))) {
          throw new Error('Invalid backup file format.');
        }

        // Restore currency settings if present
        if (json.currency) changeCurrency(json.currency);
        if (json.customKhrRate) updateCustomKhrRate(json.customKhrRate);

        // Restore items
        if (Array.isArray(json.expenses)) {
          for (const exp of json.expenses) {
            await addExpense(exp);
          }
        }
        if (Array.isArray(json.incomes)) {
          for (const inc of json.incomes) {
            await addIncome(inc);
          }
        }
        if (Array.isArray(json.savingsGoals)) {
          for (const goal of json.savingsGoals) {
            await addSavingsGoal(goal);
          }
        }

        setBackupMsg({ type: 'success', message: 'Backup restored successfully! Financial ledger updated.' });
        setTimeout(() => setBackupMsg({ type: '', message: '' }), 5000);
      } catch (err) {
        setBackupMsg({ type: 'danger', message: `Import failed: ${err.message}` });
      } finally {
        if (importFileRef.current) importFileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', message: '' });

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setPasswordStatus({ type: 'danger', message: 'Please enter both current and new password.' });
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setPasswordStatus({ type: 'danger', message: 'New password must be at least 4 characters long.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'danger', message: 'New passwords do not match. Please re-type to confirm.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (typeof changePassword === 'function') {
        await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
        setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordStatus({ type: '', message: '' }), 5000);
      } else {
        throw new Error('Password change handler not available.');
      }
    } catch (err) {
      setPasswordStatus({ type: 'danger', message: err.message || 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4" style={{ maxWidth: '750px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
      <h3 className="fw-bold mb-1">{t('settingsTitle')}</h3>
      <p className="text-muted small mb-4">{t('settingsDesc')}</p>

      {/* Preferences Section: Currency & Exchange Rate Hub */}
      <div className="mb-4">
        <h5 className="fw-semibold mb-3">
          <i className="bi bi-currency-exchange me-2 text-primary"></i>Currency &amp; Exchange Rates
        </h5>

        <div className="p-3 rounded-3 border mb-3" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
          {/* Currency Selection */}
          <div className="mb-3">
            <label className="form-label text-muted small fw-semibold">{t('defaultCurrency')}</label>
            <select
              className="form-select w-100 w-sm-75"
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              {SUPPORTED_CURRENCIES.map((code) => {
                const c = CURRENCY_METADATA[code];
                return (
                  <option key={code} value={code}>
                    {c.flag} {c.code} ({c.symbol}) — {c.name}
                  </option>
                );
              })}
            </select>
            <div className="text-muted mt-1" style={{ fontSize: '11px' }}>
              All expenses and incomes will dynamically convert and format using active exchange rates.
            </div>
          </div>

          {/* Live Rates Sync Panel */}
          <div className="p-3 rounded-3 mb-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <div>
                <div className="fw-semibold small d-flex align-items-center gap-2">
                  <i className="bi bi-arrow-repeat text-success"></i>
                  <span>Live Currency Parity</span>
                  <span className="badge rounded-pill bg-success-subtle text-success" style={{ fontSize: '10px' }}>
                    {ratesStatus?.source === 'online' ? 'Online API' : ratesStatus?.source === 'cache' ? 'Cached Rates' : 'Benchmark'}
                  </span>
                </div>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  {ratesStatus?.lastUpdated
                    ? `Last updated: ${new Date(ratesStatus.lastUpdated).toLocaleString()}`
                    : 'Rates cached locally'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncRates}
                disabled={isSyncingRates}
                className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 shadow-xs"
              >
                {isSyncingRates ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-down-fill me-1"></i>
                    <span>Sync Live Rates</span>
                  </>
                )}
              </button>
            </div>

            {rateSyncStatus && (
              <div className="alert alert-info py-2 px-3 small rounded-3 mb-0 mt-2">
                {rateSyncStatus}
              </div>
            )}
          </div>

          {/* Dual Currency Display Toggle */}
          <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <div className="fw-semibold small">
                <i className="bi bi-intersect text-primary me-2"></i>
                Dual Currency Display
              </div>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                Show both primary currency and secondary equivalent on dashboard KPI cards.
              </div>
            </div>
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input cursor-pointer"
                type="checkbox"
                role="switch"
                id="dualCurrencySwitch"
                checked={dualCurrencyEnabled}
                onChange={(e) => toggleDualCurrency(e.target.checked)}
              />
            </div>
          </div>

          {/* Custom Cambodian Riel Market Rate Override */}
          <form onSubmit={handleSaveKhrRate}>
            <div className="row align-items-center g-2">
              <div className="col-12 col-sm-8">
                <label className="form-label text-muted small fw-semibold mb-1">
                  <span className="me-1">🇰🇭</span>Custom USD ↔ KHR Exchange Rate (Cambodia)
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                    1 USD =
                  </span>
                  <input
                    type="number"
                    className="form-control"
                    value={tempKhrRate}
                    onChange={(e) => setTempKhrRate(e.target.value)}
                    placeholder="4100"
                    min="3000"
                    max="6000"
                    step="10"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                  <span className="input-group-text" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                    KHR (៛)
                  </span>
                </div>
              </div>
              <div className="col-12 col-sm-4 text-sm-end mt-2 mt-sm-4">
                <button
                  type="submit"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold w-100"
                >
                  <i className="bi bi-check2 me-1"></i>Set Rate
                </button>
              </div>
            </div>
            {khrSaveNotice && (
              <div className="text-success small mt-1 fw-semibold" style={{ fontSize: '11px' }}>
                <i className="bi bi-check-circle-fill me-1"></i> Custom KHR rate saved!
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Appearance & Language Section */}
      <div className="mb-4 p-3 rounded-3 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
        <h5 className="fw-semibold mb-3">
          <i className="bi bi-palette me-2 text-primary"></i>{t('appearance')}
        </h5>

        {/* Dark Mode Toggle */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <div className="fw-semibold small">
              <i className={`bi ${isDark ? 'bi-moon-stars-fill text-warning' : 'bi-sun-fill text-warning'} me-2`}></i>
              {t('darkMode')}
            </div>
            <div className="text-muted" style={{ fontSize: '12px' }}>{t('darkModeDesc')}</div>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle dark/light mode" />
        </div>

        {/* Language Toggle */}
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-semibold small">
              <i className="bi bi-translate text-info me-2"></i>
              {t('language')}
            </div>
            <div className="text-muted" style={{ fontSize: '12px' }}>{t('languageDesc')}</div>
          </div>
          <div className="lang-pill">
            <button className={lang === 'EN' ? 'active' : ''} onClick={() => lang !== 'EN' && toggleLang()}>EN</button>
            <button className={lang === 'KH' ? 'active' : ''} onClick={() => lang !== 'KH' && toggleLang()}>KH</button>
          </div>
        </div>
      </div>

      <hr className="my-4" style={{ borderColor: 'var(--border-color)' }} />

      {/* User Profile & Security Section */}
      <div className="mb-4">
        <h5 className="fw-semibold mb-3">
          <i className="bi bi-person-circle me-2 text-primary"></i>{t('userAccount')}
        </h5>
        <div className="d-flex align-items-center mb-4 p-3 rounded-3 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
          <img
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Client')}&background=0D8ABC&color=fff`}
            alt={currentUser?.name || 'User'}
            width="56"
            height="56"
            className="rounded-circle me-3 border"
          />
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2">
              <p className="m-0 fw-bold fs-6">{currentUser?.name || 'Authorized Member'}</p>
              <span className={`badge rounded-pill ${currentUser?.role === 'admin' ? 'bg-primary' : 'bg-success'}`}>
                {currentUser?.role === 'admin' ? t('superAdmin') : t('clientAccount')}
              </span>
            </div>
            <p className="m-0 text-muted small">{currentUser?.email || 'N/A'}</p>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="p-3 rounded-3 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h6 className="fw-bold mb-2">
            <i className="bi bi-shield-lock me-2 text-secondary"></i>{t('updatePassword')}
          </h6>
          <p className="text-muted small mb-3">{t('updatePasswordDesc')}</p>

          {passwordStatus.message && (
            <div className={`alert alert-${passwordStatus.type} small py-2 px-3 rounded-3 d-flex align-items-center gap-2 mb-3`}>
              <i className={`bi ${passwordStatus.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
              <div>{passwordStatus.message}</div>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-4">
                <label className="form-label small fw-semibold text-muted">{t('currentPassword')}</label>
                <input
                  type="password"
                  required
                  className="form-control form-control-sm"
                  placeholder={t('oldPasswordPlaceholder')}
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                />
              </div>
              <div className="col-12 col-sm-4">
                <label className="form-label small fw-semibold text-muted">{t('newPassword')}</label>
                <input
                  type="password"
                  required
                  className="form-control form-control-sm"
                  placeholder={t('newPasswordPlaceholder')}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="col-12 col-sm-4">
                <label className="form-label small fw-semibold text-muted">{t('confirmNewPassword')}</label>
                <input
                  type="password"
                  required
                  className="form-control form-control-sm"
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold shadow-sm"
            >
              {isUpdatingPassword ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  {t('updating')}
                </>
              ) : (
                <>
                  <i className="bi bi-key-fill me-1"></i> {t('saveNewPassword')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <hr className="my-4" style={{ borderColor: 'var(--border-color)' }} />

      {/* Backup & Restore Data Section */}
      <div className="mb-4">
        <h5 className="fw-semibold mb-3">
          <i className="bi bi-database-down me-2 text-primary"></i>Data Backup &amp; Restore
        </h5>
        <div className="p-3 rounded-3 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
          <p className="text-muted small mb-3">
            Export a full JSON backup of all your transactions, budgets, goals, and exchange settings to your device, or restore from a previous backup file.
          </p>

          {backupMsg.message && (
            <div className={`alert alert-${backupMsg.type} small py-2 px-3 rounded-3 d-flex align-items-center gap-2 mb-3`}>
              <i className={`bi ${backupMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
              <div>{backupMsg.message}</div>
            </div>
          )}

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold shadow-xs"
            >
              <i className="bi bi-download me-1"></i> Export JSON Backup
            </button>

            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold shadow-xs"
            >
              <i className="bi bi-upload me-1"></i> Restore from JSON
            </button>
            <input
              type="file"
              ref={importFileRef}
              onChange={handleImportBackup}
              accept=".json,application/json"
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      <hr className="my-4" style={{ borderColor: 'var(--border-color)' }} />

      {/* Danger Zone */}
      <div>
        <h5 className="fw-semibold text-danger mb-2">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{t('dangerZone')}
        </h5>
        <p className="text-muted small mb-3">{t('dangerZoneDesc')}</p>

        <div className="d-flex flex-wrap gap-2">
          <button onClick={clearAllExpenses} className="btn btn-sm btn-outline-danger rounded-pill px-3">
            <i className="bi bi-trash me-1"></i> {t('clearExpenses')}
          </button>
          <button onClick={clearAllIncomes} className="btn btn-sm btn-outline-danger rounded-pill px-3">
            <i className="bi bi-trash me-1"></i> {t('clearIncomes')}
          </button>
          <button onClick={clearAllSavingsGoals} className="btn btn-sm btn-outline-danger rounded-pill px-3">
            <i className="bi bi-trash me-1"></i> {t('clearGoals')}
          </button>
          <button onClick={resetAllData} className="btn btn-sm btn-danger rounded-pill px-3 fw-bold">
            <i className="bi bi-trash3-fill me-1"></i> {t('factoryReset')}
          </button>
        </div>
      </div>
    </div>
  );
}

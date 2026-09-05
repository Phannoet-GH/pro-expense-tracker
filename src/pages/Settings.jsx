import React, { useContext, useState } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { UserContext } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function Settings() {
  const {
    currency,
    changeCurrency,
    clearAllExpenses,
    clearAllIncomes,
    clearAllSavingsGoals,
    resetAllData
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

      {/* Preferences Section */}
      <div className="mb-4">
        <h5 className="fw-semibold mb-3">
          <i className="bi bi-sliders me-2 text-primary"></i>{t('preferences')}
        </h5>
        <div className="mb-3">
          <label className="form-label text-muted small fw-semibold">{t('defaultCurrency')}</label>
          <select
            className="form-select w-50"
            value={currency}
            onChange={(e) => changeCurrency(e.target.value)}
          >
            <option value="$">USD ($) - US Dollar</option>
            <option value="€">EUR (€) - Euro</option>
            <option value="£">GBP (£) - British Pound</option>
            <option value="៛">KHR (៛) - Cambodian Riel</option>
            <option value="¥">JPY (¥) - Japanese Yen</option>
            <option value="CA$">CAD (CA$) - Canadian Dollar</option>
            <option value="AU$">AUD (AU$) - Australian Dollar</option>
          </select>
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

import React, { useContext, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ExpenseContext } from '../context/ExpenseContext';
import { UserContext } from '../context/UserContext';
import { useBilling } from '../context/BillingContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import PricingModal from './PricingModal';
import CurrencyConverterModal from './CurrencyConverterModal';
import ShareModal from './ShareModal';
import { getCurrencyMeta } from '../utils/currency';

export default function Layout() {
  const { netSavings, formatAmount, currency } = useContext(ExpenseContext);
  const { currentUser, logout } = useContext(UserContext);
  const { tier, isPro, openPricingModal } = useBilling();
  const { toggleTheme, isDark } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const activeCurrencyMeta = getCurrencyMeta(currency);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="d-flex bg-light position-relative" id="wrapper" style={{ minHeight: '100vh' }}>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none"
          style={{ zIndex: 1040 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Client Sidebar */}
      <div
        className={`bg-dark text-white sidebar border-end border-secondary border-opacity-25 d-flex flex-column ${mobileMenuOpen ? 'position-fixed top-0 start-0 h-100 z-3' : 'd-none d-md-flex'}`}
        style={{ width: '260px', minWidth: '260px', zIndex: 1045 }}
      >
        <div className="sidebar-heading fs-4 fw-bold text-center py-4 border-bottom border-secondary border-opacity-50">
          <i className="bi bi-wallet2 text-primary me-2"></i>SmartFinance
          <span className="badge bg-primary-subtle text-primary ms-1" style={{ fontSize: '10px' }}>PRO</span>
          <div className="text-secondary small mt-1 fw-normal" style={{ fontSize: '11px' }}>
            Personal Finance &amp; Wealth Vault
          </div>
        </div>

        <div className="list-group list-group-flush my-3 px-2 gap-1">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <i className="bi bi-speedometer2"></i>
            <span>{t('dashboard')}</span>
          </NavLink>

          <NavLink
            to="/dashboard/transactions"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <i className="bi bi-arrow-left-right"></i>
            <span>{t('transactions')}</span>
          </NavLink>

          <NavLink
            to="/dashboard/savings"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex justify-content-between align-items-center ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-piggy-bank text-warning"></i>
              <span>{t('savings')}</span>
            </div>
            <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '10px' }}>50/30/20</span>
          </NavLink>

          <NavLink
            to="/dashboard/tax-reports"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex justify-content-between align-items-center ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-receipt-cutoff text-info"></i>
              <span>{t('taxReports')}</span>
            </div>
            <span className="badge bg-primary text-white rounded-pill" style={{ fontSize: '10px' }}>PRO</span>
          </NavLink>

          <NavLink
            to="/dashboard/analytics"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <i className="bi bi-pie-chart"></i>
            <span>{t('analytics')}</span>
          </NavLink>

          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => `list-group-item list-group-item-action bg-transparent rounded-3 text-white fw-medium py-2 px-3 d-flex align-items-center gap-2 ${isActive ? 'bg-primary text-white shadow-sm' : ''}`}
          >
            <i className="bi bi-gear"></i>
            <span>{t('settings')}</span>
          </NavLink>
        </div>

        {/* Subscription Upgrade Box in Sidebar */}
        <div className="px-3 mb-2">
          {!isPro ? (
            <div
              className="p-3 rounded-4 text-center shadow-sm position-relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <div className="d-flex align-items-center justify-content-center gap-1 text-warning small fw-bold mb-1">
                <i className="bi bi-stars"></i>
                <span>{t('upgradeToPro')}</span>
              </div>
              <div className="text-white small fw-semibold mb-1" style={{ fontSize: '12px' }}>
                {t('unlimitedScans')}
              </div>
              <button
                onClick={() => openPricingModal('Sidebar Banner')}
                className="btn btn-warning text-dark btn-sm rounded-pill fw-bold w-100 py-1 shadow-sm mt-1"
                style={{ fontSize: '11px' }}
              >
                {t('getPro')}
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-3 bg-primary bg-opacity-25 border border-primary border-opacity-50 text-center">
              <div className="d-flex align-items-center justify-content-center gap-1 text-primary fw-bold small">
                <i className="bi bi-patch-check-fill"></i>
                <span>{tier === 'enterprise' ? t('advisorPlan') : t('proSuiteActive')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Active Client Profile & Logout */}
        <div className="mt-auto p-3 border-top border-secondary border-opacity-25">
          <div className="p-3 bg-secondary bg-opacity-25 rounded-3 mb-2 border border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <img
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=0D8ABC&color=fff`}
                alt="User Avatar"
                width="36"
                height="36"
                className="rounded-circle border border-2 border-primary"
              />
              <div className="overflow-hidden">
                <div className="fw-bold text-white small text-truncate">{currentUser?.name || 'Client'}</div>
                <div className="text-secondary text-truncate" style={{ fontSize: '10px' }}>{currentUser?.email}</div>
              </div>
            </div>
            <div className="d-flex justify-content-between text-secondary mt-2 pt-2 border-top border-secondary border-opacity-25" style={{ fontSize: '10px' }}>
              <span>Account:</span>
              <span className="text-success fw-bold">{t('activeMember')}</span>
            </div>
          </div>

          {/* Theme & Language Toggles */}
          <div className="d-flex align-items-center justify-content-between mb-2 px-1">
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${isDark ? 'bi-moon-stars-fill text-warning' : 'bi-sun-fill text-warning'}`} style={{ fontSize: '13px' }}></i>
              <span className="text-secondary" style={{ fontSize: '11px' }}>{isDark ? 'Dark' : 'Light'}</span>
            </div>
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle dark/light mode" />
          </div>

          <div className="d-flex align-items-center justify-content-between mb-3 px-1">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-translate text-info" style={{ fontSize: '13px' }}></i>
              <span className="text-secondary" style={{ fontSize: '11px' }}>Language</span>
            </div>
            <div className="lang-pill">
              <button className={lang === 'EN' ? 'active' : ''} onClick={() => lang !== 'EN' && toggleLang()}>EN</button>
              <button className={lang === 'KH' ? 'active' : ''} onClick={() => lang !== 'KH' && toggleLang()}>KH</button>
            </div>
          </div>

          <div className="d-flex flex-column gap-2">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="btn btn-sm btn-outline-danger w-100 rounded-pill py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
              >
                <i className="bi bi-shield-lock-fill"></i>
                <span>{t('adminConsole')}</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-light w-100 rounded-pill py-2 small fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>{t('signOut')}</span>
            </button>
          </div>
        </div>
      </div>

      <div id="page-content-wrapper" className="w-100 overflow-auto" style={{ maxHeight: '100vh' }}>
        {/* Topbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white py-3 px-4 shadow-sm border-bottom">
          <div className="d-flex align-items-center flex-wrap gap-2">
            {/* Mobile Hamburger Drawer Button */}
            <button
              className="btn btn-sm btn-outline-secondary d-md-none rounded-circle me-1"
              style={{ width: '36px', height: '36px' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Toggle Menu"
            >
              <i className="bi bi-list fs-5"></i>
            </button>

            <h2 className="fs-5 m-0 fw-bold" style={{ color: 'var(--text-primary)' }}>{t('personalWealthManager')}</h2>
            <span className={`badge rounded-pill ${netSavings >= 0 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-3 py-1 fw-bold`} style={{ fontSize: '0.8rem' }}>
              Net Cash Flow: {formatAmount(netSavings)}
            </span>
          </div>

          <div className="ms-auto d-flex align-items-center gap-2 gap-sm-3">
            {/* Currency Converter Quick Trigger Button */}
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
              title="Open Currency Exchange Calculator"
            >
              <span className="me-1">{activeCurrencyMeta.flag}</span>
              <span className="fw-bold">{activeCurrencyMeta.code}</span>
              <span className="text-muted d-none d-sm-inline">({activeCurrencyMeta.symbol})</span>
              <i className="bi bi-arrow-repeat ms-1" style={{ fontSize: '11px' }}></i>
            </button>

            {/* Share / Invite Friends Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 shadow-2xs"
              title="Share SmartFinance PRO with friends"
            >
              <i className="bi bi-share-fill text-primary"></i>
              <span className="d-none d-sm-inline">Share</span>
            </button>

            {/* User Session Info Pill */}
            <div className="d-flex align-items-center gap-2 border rounded-pill px-3 py-1 bg-light">
              <img
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=0D8ABC&color=fff`}
                alt="Avatar"
                width="28"
                height="28"
                className="rounded-circle"
              />
              <div className="text-start d-none d-md-block">
                <div className="fw-bold small lh-1">{currentUser?.name}</div>
                <small className="text-muted" style={{ fontSize: '10px' }}>{currentUser?.email}</small>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
              title="Secure Sign Out"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-sm-inline">Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Page Content */}
        <div className="container-fluid px-4 py-4">
          <Outlet />
        </div>
      </div>

      {/* Global Modals */}
      <PricingModal />
      <CurrencyConverterModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}

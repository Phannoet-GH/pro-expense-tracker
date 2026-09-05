import React, { useState } from 'react';
import { useBilling } from '../context/BillingContext';

export default function PricingModal() {
  const {
    isPricingModalOpen,
    closePricingModal,
    upgradeTriggerReason,
    tier,
    upgradePlan,
    isLoading
  } = useBilling();

  const [interval, setInterval] = useState('annual'); // 'monthly' | 'annual'
  const [upgradingTier, setUpgradingTier] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!isPricingModalOpen) return null;

  const handleUpgrade = async (targetTier) => {
    setUpgradingTier(targetTier);
    setFeedbackMsg('');
    const res = await upgradePlan(targetTier);
    if (res.success) {
      setFeedbackMsg(res.message);
      setTimeout(() => {
        setUpgradingTier(null);
      }, 1500);
    } else {
      setFeedbackMsg(res.error || 'Upgrade failed');
      setUpgradingTier(null);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1060
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div
          className="modal-content border-0 shadow-24"
          style={{
            borderRadius: '24px',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            overflow: 'hidden'
          }}
        >
          {/* Top Banner if triggered by a specific feature */}
          {upgradeTriggerReason && (
            <div
              className="px-4 py-2 text-center text-white fw-semibold small"
              style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef)' }}
            >
              <i className="bi bi-stars me-2"></i>
              Feature Locked: {upgradeTriggerReason} — Upgrade to unlock instant access!
            </div>
          )}

          {/* Modal Header */}
          <div className="modal-header border-0 px-4 pt-4 pb-2 align-items-start">
            <div>
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-primary-subtle text-primary fw-semibold small mb-2">
                <i className="bi bi-lightning-charge-fill"></i>
                Accelerate Your Wealth
              </div>
              <h3 className="modal-title fw-bold text-slate-900 mb-1">
                Choose the Right Financial Plan
              </h3>
              <p className="text-muted small mb-0">
                Cancel anytime. All plans include automated database syncing and bank-grade security.
              </p>
            </div>
            <button
              type="button"
              className="btn-close shadow-none"
              onClick={closePricingModal}
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body px-4 py-3">
            {feedbackMsg && (
              <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 py-2 px-3 mb-4">
                <i className="bi bi-check-circle-fill"></i>
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* Monthly / Annual Billing Toggle */}
            <div className="d-flex justify-content-center mb-4">
              <div
                className="d-inline-flex p-1 rounded-pill bg-light border"
                style={{ cursor: 'pointer' }}
              >
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-4 fw-semibold ${
                    interval === 'monthly' ? 'btn-white shadow-sm text-primary' : 'text-muted'
                  }`}
                  onClick={() => setInterval('monthly')}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-4 fw-semibold d-flex align-items-center gap-1 ${
                    interval === 'annual' ? 'btn-primary shadow-sm text-white' : 'text-muted'
                  }`}
                  onClick={() => setInterval('annual')}
                >
                  <span>Annual Billing</span>
                  <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '0.65rem' }}>
                    Save 25%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="row g-4 align-items-stretch">
              {/* 1. Starter Free */}
              <div className="col-lg-4">
                <div
                  className="card h-100 border rounded-4 p-4 d-flex flex-column transition-all"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <div className="mb-3">
                    <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-1 mb-2">
                      Free Forever
                    </span>
                    <h5 className="fw-bold text-dark mb-1">Starter</h5>
                    <p className="text-muted small">Essential budgeting & manual tracking.</p>
                    <div className="d-flex align-items-baseline gap-1 my-3">
                      <span className="display-6 fw-bold text-dark">$0</span>
                      <span className="text-muted small">/ month</span>
                    </div>
                  </div>

                  <hr className="my-2 opacity-10" />

                  <ul className="list-unstyled d-flex flex-column gap-2 small my-3 flex-grow-1">
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2 text-success fw-bold"></i>
                      <span>Manual expense & income tracking</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2 text-success fw-bold"></i>
                      <span>3 AI receipt scans / month</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2 text-success fw-bold"></i>
                      <span>Up to 2 savings goals</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2 text-success fw-bold"></i>
                      <span>Basic spending analytics</span>
                    </li>
                    <li className="d-flex align-items-center gap-2 text-muted">
                      <i className="bi bi-x text-muted"></i>
                      <span>Schedule C Freelancer Tax Write-Offs</span>
                    </li>
                    <li className="d-flex align-items-center gap-2 text-muted">
                      <i className="bi bi-x text-muted"></i>
                      <span>Audit-ready PDF tax statements</span>
                    </li>
                  </ul>

                  <button
                    className="btn btn-outline-secondary rounded-pill py-2 fw-semibold w-100 mt-3"
                    disabled={tier === 'free'}
                    onClick={() => handleUpgrade('free')}
                  >
                    {tier === 'free' ? 'Current Plan' : 'Downgrade to Free'}
                  </button>
                </div>
              </div>

              {/* 2. SmartFinance PRO (Featured) */}
              <div className="col-lg-4">
                <div
                  className="card h-100 border-2 border-primary rounded-4 p-4 d-flex flex-column position-relative shadow-lg"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%)'
                  }}
                >
                  <div
                    className="position-absolute top-0 start-50 translate-middle badge rounded-pill px-3 py-1 shadow-sm"
                    style={{
                      background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    ⭐ MOST POPULAR
                  </div>

                  <div className="mb-3">
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 mb-2">
                      Pro Individual & Freelancer
                    </span>
                    <h5 className="fw-bold text-dark mb-1">SmartFinance PRO</h5>
                    <p className="text-muted small">Automate finances, scan receipts & maximize tax write-offs.</p>
                    <div className="d-flex align-items-baseline gap-1 my-3">
                      <span className="display-6 fw-bold text-primary">
                        ${interval === 'annual' ? '5.75' : '7.99'}
                      </span>
                      <span className="text-muted small">
                        / month {interval === 'annual' && '(billed $69/yr)'}
                      </span>
                    </div>
                  </div>

                  <hr className="my-2 opacity-10" />

                  <ul className="list-unstyled d-flex flex-column gap-2 small my-3 flex-grow-1">
                    <li className="d-flex align-items-center gap-2 fw-medium text-dark">
                      <i className="bi bi-check-circle-fill text-primary"></i>
                      <span><strong>Unlimited</strong> AI receipt OCR scanning</span>
                    </li>
                    <li className="d-flex align-items-center gap-2 fw-medium text-dark">
                      <i className="bi bi-check-circle-fill text-primary"></i>
                      <span><strong>Schedule C Tax Deductions</strong> & Write-Offs</span>
                    </li>
                    <li className="d-flex align-items-center gap-2 fw-medium text-dark">
                      <i className="bi bi-check-circle-fill text-primary"></i>
                      <span>Audit-ready PDF statement exports</span>
                    </li>
                    <li className="d-flex align-items-center gap-2 text-dark">
                      <i className="bi bi-check-circle-fill text-primary"></i>
                      <span>Unlimited savings goals & custom budgets</span>
                    </li>
                    <li className="d-flex align-items-center gap-2 text-dark">
                      <i className="bi bi-check-circle-fill text-primary"></i>
                      <span>High-Yield Savings affiliate comparisons</span>
                    </li>
                    <li className="d-flex align-items-center gap-2 text-dark">
                      <i className="bi bi-check-circle-fill text-primary"></i>
                      <span>Priority cloud sync & data backup</span>
                    </li>
                  </ul>

                  <button
                    className="btn btn-primary rounded-pill py-2 fw-semibold w-100 mt-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                    disabled={tier === 'pro' || isLoading}
                    onClick={() => handleUpgrade('pro')}
                  >
                    {upgradingTier === 'pro' ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Activating Pro...
                      </>
                    ) : tier === 'pro' ? (
                      <>
                        <i className="bi bi-check2-circle"></i> Active Plan
                      </>
                    ) : (
                      <>
                        <i className="bi bi-rocket-takeoff-fill"></i> Upgrade to PRO
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Advisor & Accountant Suite */}
              <div className="col-lg-4">
                <div
                  className="card h-100 border rounded-4 p-4 d-flex flex-column transition-all"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <div className="mb-3">
                    <span className="badge bg-purple-subtle text-purple rounded-pill px-3 py-1 mb-2" style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}>
                      CPA & Wealth Coaches
                    </span>
                    <h5 className="fw-bold text-dark mb-1">Advisor Suite</h5>
                    <p className="text-muted small">White-label portal to manage multiple client portfolios.</p>
                    <div className="d-flex align-items-baseline gap-1 my-3">
                      <span className="display-6 fw-bold text-dark">
                        ${interval === 'annual' ? '20.75' : '29.99'}
                      </span>
                      <span className="text-muted small">
                        / month {interval === 'annual' && '(billed $249/yr)'}
                      </span>
                    </div>
                  </div>

                  <hr className="my-2 opacity-10" />

                  <ul className="list-unstyled d-flex flex-column gap-2 small my-3 flex-grow-1">
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2 text-success fw-bold"></i>
                      <span><strong>Everything</strong> in SmartFinance PRO</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2 text-success fw-bold"></i>
                      <span>Multi-client management portal</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2 text-success fw-bold"></i>
                      <span>White-label brand & custom domain ready</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2 text-success fw-bold"></i>
                      <span>Direct accountant export (QBO/Xero)</span>
                    </li>
                    <li className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2 text-success fw-bold"></i>
                      <span>Client milestone & savings audit logs</span>
                    </li>
                  </ul>

                  <button
                    className="btn btn-outline-dark rounded-pill py-2 fw-semibold w-100 mt-3"
                    disabled={tier === 'enterprise' || isLoading}
                    onClick={() => handleUpgrade('enterprise')}
                  >
                    {upgradingTier === 'enterprise' ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Activating...
                      </>
                    ) : tier === 'enterprise' ? (
                      'Active Plan'
                    ) : (
                      'Upgrade to Advisor'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Trust Row */}
            <div className="d-flex flex-wrap justify-content-center align-items-center gap-4 text-muted small mt-4 pt-2 border-top">
              <span className="d-flex align-items-center gap-1">
                <i className="bi bi-shield-lock text-success"></i> 256-Bit Bank Grade SSL
              </span>
              <span className="d-flex align-items-center gap-1">
                <i className="bi bi-arrow-repeat text-primary"></i> 14-Day Money-Back Guarantee
              </span>
              <span className="d-flex align-items-center gap-1">
                <i className="bi bi-credit-card"></i> Powered by Stripe Verified Checkout
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

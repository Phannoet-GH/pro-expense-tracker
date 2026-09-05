import React, { useState, useContext } from 'react';
import { useBilling } from '../context/BillingContext';
import { UserContext } from '../context/UserContext';
import { apiFetch, parseResponse } from '../utils/api';

export default function PricingModal() {
  const {
    isPricingModalOpen,
    closePricingModal,
    upgradeTriggerReason,
    tier,
    upgradePlan,
    isLoading
  } = useBilling();

  const { currentUser, token } = useContext(UserContext) || {};

  const [interval, setInterval] = useState('monthly'); // 'monthly' | 'annual'
  const [feedbackMsg, setFeedbackMsg] = useState('');
  
  // Buy / Request Form State
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [buyFormData, setBuyFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    payment_method: 'ABA Pay / KHQR',
    message: ''
  });

  if (!isPricingModalOpen) return null;

  // Handle direct request to admin@gmail.com
  const handleBuyFormSubmit = async (e) => {
    e.preventDefault();
    if (!buyFormData.name || !buyFormData.email) return;

    setIsSubmitting(true);
    setFeedbackMsg('');

    try {
      const res = await apiFetch('/api/billing/upgrade-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: buyFormData.name,
          email: buyFormData.email,
          payment_method: buyFormData.payment_method,
          message: buyFormData.message,
          plan: 'pro',
          price: interval === 'annual' ? '$5/year ($5/y)' : '$1/month ($1/m)'
        })
      });

      const { ok, data } = await parseResponse(res);
      if (!ok) throw new Error(data?.error || 'Failed to submit request');

      setSubmittedSuccess(true);
    } catch (err) {
      setFeedbackMsg(err.message || 'Error submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    closePricingModal();
    setShowBuyForm(false);
    setSubmittedSuccess(false);
    setFeedbackMsg('');
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
      <div className="modal-dialog modal-dialog-centered modal-lg">
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
              style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
            >
              <i className="bi bi-stars me-2"></i>
              Feature Locked: {upgradeTriggerReason} — Upgrade to unlock instant access!
            </div>
          )}

          {/* Modal Header */}
          <div className="modal-header border-0 px-4 pt-4 pb-2 align-items-start">
            <div>
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-primary-subtle text-primary fw-semibold small mb-2">
                <i className="bi bi-rocket-takeoff-fill"></i>
                Simple &amp; Affordable Plans
              </div>
              <h3 className="modal-title fw-bold text-dark mb-1">
                {showBuyForm ? 'Complete PRO Upgrade Request' : 'Choose Your Financial Plan'}
              </h3>
              <p className="text-muted small mb-0">
                {showBuyForm
                  ? 'Request will be sent to Admin (admin@gmail.com) for quick verification.'
                  : 'Start free or get full tax deduction features for only $1/month or $5/year.'}
              </p>
            </div>
            <button
              type="button"
              className="btn-close shadow-none"
              onClick={handleModalClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body px-4 py-3">
            {feedbackMsg && (
              <div className="alert alert-info d-flex align-items-center gap-2 rounded-3 py-2 px-3 mb-3 small">
                <i className="bi bi-info-circle-fill"></i>
                <span>{feedbackMsg}</span>
              </div>
            )}

            {!showBuyForm ? (
              /* ================= 2-TIER PRICING VIEW ================= */
              <>
                {/* Monthly / Annual Billing Toggle */}
                <div className="d-flex justify-content-center mb-4">
                  <div className="d-inline-flex p-1 rounded-pill bg-light border">
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill px-4 fw-semibold ${
                        interval === 'monthly' ? 'btn-white shadow-sm text-primary' : 'text-muted'
                      }`}
                      onClick={() => setInterval('monthly')}
                    >
                      Monthly ($1/mo)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill px-4 fw-semibold d-flex align-items-center gap-1 ${
                        interval === 'annual' ? 'btn-primary shadow-sm text-white' : 'text-muted'
                      }`}
                      onClick={() => setInterval('annual')}
                    >
                      <span>Annual ($5/yr)</span>
                      <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '0.65rem' }}>
                        Best Value
                      </span>
                    </button>
                  </div>
                </div>

                {/* Cards Row: Starter Free vs SmartFinance PRO */}
                <div className="row g-4 align-items-stretch justify-content-center">
                  {/* 1. Starter Free */}
                  <div className="col-md-6">
                    <div
                      className="card h-100 border rounded-4 p-4 d-flex flex-column shadow-sm"
                      style={{ backgroundColor: '#ffffff' }}
                    >
                      <div className="mb-2">
                        <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-1 mb-2">
                          Free Forever
                        </span>
                        <h5 className="fw-bold text-dark mb-1">Starter</h5>
                        <p className="text-muted small">Essential budgeting &amp; manual tracking.</p>
                        <div className="d-flex align-items-baseline gap-1 my-3">
                          <span className="display-5 fw-bold text-dark">$0</span>
                          <span className="text-muted small">/ month</span>
                        </div>
                      </div>

                      <hr className="my-2 opacity-10" />

                      <ul className="list-unstyled d-flex flex-column gap-2 small my-3 flex-grow-1">
                        <li className="d-flex align-items-center gap-2">
                          <i className="bi bi-check2 text-success fw-bold"></i>
                          <span>Manual expense &amp; income tracking</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <i className="bi bi-check2 text-success fw-bold"></i>
                          <span>Monthly category budget limits</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <i className="bi bi-check2 text-success fw-bold"></i>
                          <span>Up to 2 savings goals</span>
                        </li>
                        <li className="d-flex align-items-center gap-2">
                          <i className="bi bi-check2 text-success fw-bold"></i>
                          <span>3 AI receipt scans / month</span>
                        </li>
                        <li className="d-flex align-items-center gap-2 text-muted">
                          <i className="bi bi-x text-muted"></i>
                          <span>Schedule C Tax Write-Offs</span>
                        </li>
                        <li className="d-flex align-items-center gap-2 text-muted">
                          <i className="bi bi-x text-muted"></i>
                          <span>Audit-ready PDF tax statements</span>
                        </li>
                      </ul>

                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill py-2 fw-semibold w-100 mt-2"
                        disabled={tier === 'free'}
                        onClick={() => upgradePlan('free')}
                      >
                        {tier === 'free' ? 'Current Plan' : 'Use Free Plan'}
                      </button>
                    </div>
                  </div>

                  {/* 2. SmartFinance PRO */}
                  <div className="col-md-6">
                    <div
                      className="card h-100 border-2 border-primary rounded-4 p-4 d-flex flex-column position-relative shadow-lg"
                      style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)'
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
                        ⭐ RECOMMENDED
                      </div>

                      <div className="mb-2">
                        <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 mb-2">
                          Pro Individual &amp; Freelance
                        </span>
                        <h5 className="fw-bold text-dark mb-1">SmartFinance PRO</h5>
                        <p className="text-muted small">Automate tax write-offs, receipt scans &amp; strategy.</p>
                        <div className="d-flex align-items-baseline gap-1 my-3">
                          <span className="display-5 fw-bold text-primary">
                            {interval === 'annual' ? '$5' : '$1'}
                          </span>
                          <span className="text-muted small">
                            {interval === 'annual' ? '/ year ($5/y)' : '/ month ($1/m)'}
                          </span>
                        </div>
                      </div>

                      <hr className="my-2 opacity-10" />

                      <ul className="list-unstyled d-flex flex-column gap-2 small my-3 flex-grow-1">
                        <li className="d-flex align-items-center gap-2 fw-semibold text-dark">
                          <i className="bi bi-check-circle-fill text-primary"></i>
                          <span><strong>Schedule C Tax Deductions</strong></span>
                        </li>
                        <li className="d-flex align-items-center gap-2 fw-semibold text-dark">
                          <i className="bi bi-check-circle-fill text-primary"></i>
                          <span><strong>Unlimited</strong> AI receipt scans</span>
                        </li>
                        <li className="d-flex align-items-center gap-2 text-dark">
                          <i className="bi bi-check-circle-fill text-primary"></i>
                          <span>Audit-ready PDF tax statement export</span>
                        </li>
                        <li className="d-flex align-items-center gap-2 text-dark">
                          <i className="bi bi-check-circle-fill text-primary"></i>
                          <span>Unlimited savings goals &amp; budgets</span>
                        </li>
                        <li className="d-flex align-items-center gap-2 text-dark">
                          <i className="bi bi-check-circle-fill text-primary"></i>
                          <span>High-Yield Savings comparisons</span>
                        </li>
                        <li className="d-flex align-items-center gap-2 text-dark">
                          <i className="bi bi-check-circle-fill text-primary"></i>
                          <span>Priority support via admin@gmail.com</span>
                        </li>
                      </ul>

                      <button
                        type="button"
                        className="btn btn-primary rounded-pill py-2 fw-bold w-100 mt-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
                        disabled={tier === 'pro'}
                        onClick={() => setShowBuyForm(true)}
                      >
                        {tier === 'pro' ? (
                          <>
                            <i className="bi bi-check-circle-fill"></i> PRO Active
                          </>
                        ) : (
                          <>
                            <i className="bi bi-rocket-takeoff-fill"></i> {interval === 'annual' ? 'Buy PRO ($5/y)' : 'Buy PRO ($1/m)'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Trust Indicators */}
                <div className="d-flex flex-wrap justify-content-center align-items-center gap-4 text-muted small mt-4 pt-2 border-top">
                  <span className="d-flex align-items-center gap-1">
                    <i className="bi bi-shield-check text-success"></i> Real-time MySQL Sync
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <i className="bi bi-envelope-check text-primary"></i> Verified Admin: admin@gmail.com
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <i className="bi bi-arrow-repeat text-info"></i> Cancel Anytime
                  </span>
                </div>
              </>
            ) : submittedSuccess ? (
              /* ================= SUBMITTED SUCCESS VIEW ================= */
              <div className="text-center py-4 px-3">
                <div
                  className="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '64px', height: '64px' }}
                >
                  <i className="bi bi-check2-circle fs-1"></i>
                </div>
                <h4 className="fw-bold text-dark mb-2">Upgrade Request Sent!</h4>
                <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '440px' }}>
                  Your request for <strong>SmartFinance PRO ({interval === 'annual' ? '$5/year' : '$1/month'})</strong> has been recorded and directed to{' '}
                  <strong className="text-dark">admin@gmail.com</strong>.
                </p>

                <div className="card bg-light border-0 rounded-4 p-3 mb-4 mx-auto text-start small" style={{ maxWidth: '420px' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Name:</span>
                    <strong className="text-dark">{buyFormData.name}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Email:</span>
                    <strong className="text-dark">{buyFormData.email}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Plan:</span>
                    <strong className="text-primary">SmartFinance PRO ({interval === 'annual' ? '$5/yr' : '$1/mo'})</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Payment:</span>
                    <strong className="text-dark">{buyFormData.payment_method}</strong>
                  </div>
                </div>

                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm"
                    onClick={handleModalClose}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* ================= BUY / REQUEST FORM VIEW ================= */
              <form onSubmit={handleBuyFormSubmit} className="py-2">
                <div
                  className="p-3 rounded-4 mb-4 text-white d-flex justify-content-between align-items-center"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
                >
                  <div>
                    <span className="badge bg-warning text-dark rounded-pill px-2 py-1 small fw-bold mb-1">
                      SELECTED PLAN
                    </span>
                    <h5 className="fw-bold mb-0">SmartFinance PRO</h5>
                    <div className="small text-white-50">Unlimited AI scans &amp; Schedule C write-offs</div>
                  </div>
                  <div className="text-end">
                    <div className="fs-3 fw-bold">{interval === 'annual' ? '$5' : '$1'}</div>
                    <div className="small text-white-50">{interval === 'annual' ? '/ year' : '/ month'}</div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Your Name</label>
                    <input
                      type="text"
                      required
                      className="form-control bg-light"
                      placeholder="Enter your name"
                      value={buyFormData.name}
                      onChange={(e) => setBuyFormData({ ...buyFormData, name: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Email Address</label>
                    <input
                      type="email"
                      required
                      className="form-control bg-light"
                      placeholder="name@example.com"
                      value={buyFormData.email}
                      onChange={(e) => setBuyFormData({ ...buyFormData, email: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark">Preferred Payment Method</label>
                    <select
                      className="form-select bg-light"
                      value={buyFormData.payment_method}
                      onChange={(e) => setBuyFormData({ ...buyFormData, payment_method: e.target.value })}
                    >
                      <option value="ABA Pay / KHQR">ABA Pay (KHQR Scan)</option>
                      <option value="Bakong App">Bakong Wallet / QR</option>
                      <option value="Bank Transfer">Direct Bank Transfer</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="Cash / Other">Cash / Direct Settlement</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark">
                      Message / Note to Admin (admin@gmail.com)
                    </label>
                    <textarea
                      rows="2"
                      className="form-control bg-light"
                      placeholder="Optional: Enter your transaction reference or any message to admin..."
                      value={buyFormData.message}
                      onChange={(e) => setBuyFormData({ ...buyFormData, message: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center gap-2 mt-4 pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-3 py-2 small"
                    onClick={() => setShowBuyForm(false)}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Back to Plans
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill"></i>
                        <span>Send Request to Admin</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useContext, useRef } from 'react';
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
  const [adminEmailDisplay, setAdminEmailDisplay] = useState('');
  const [buyFormData, setBuyFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    payment_method: 'ABA Pay / KHQR',
    message: ''
  });

  // Payment proof image / file state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptBase64, setReceiptBase64] = useState('');
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setFeedbackMsg('Selected file is too large. Maximum size is 8MB.');
      return;
    }
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptBase64(reader.result);
      if (file.type.startsWith('image/')) {
        setReceiptPreview(reader.result);
      } else {
        setReceiptPreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDropFile = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveFile = (e) => {
    e?.stopPropagation();
    setReceiptFile(null);
    setReceiptBase64('');
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUseDefaultImage = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      const response = await fetch('/images/aba-khqr.png');
      const blob = await response.blob();
      const file = new File([blob], 'aba-khqr-petphannoet.png', { type: 'image/png' });
      processFile(file);
    } catch (err) {
      console.warn('Could not load default payment proof:', err);
    }
  };

  if (!isPricingModalOpen) return null;

  // Handle direct request to admin
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
          payment_proof: receiptBase64 || null,
          receipt_file_name: receiptFile?.name || null,
          plan: 'pro',
          price: interval === 'annual' ? '$5/year ($5/y)' : '$1/month ($1/m)'
        })
      });

      const { ok, data } = await parseResponse(res);
      if (!ok) throw new Error(data?.error || 'Failed to submit request');

      if (data?.adminEmail) {
        setAdminEmailDisplay(data.adminEmail);
      }
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
    setReceiptFile(null);
    setReceiptBase64('');
    setReceiptPreview(null);
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
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
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
                        background: 'var(--bg-input)',
                        borderColor: 'var(--border-color)'
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
                <h4 className="fw-bold text-dark mb-2">Upgrade Request &amp; Auto-Reply Sent!</h4>
                <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '460px' }}>
                  Your request for <strong>SmartFinance PRO ({interval === 'annual' ? '$5/year' : '$1/month'})</strong> has been submitted. An automated reply has been dispatched from{' '}
                  <strong className="text-dark">{adminEmailDisplay || 'petphannoet@gmail.com'}</strong> and posted to your dashboard!
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
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Payment:</span>
                    <strong className="text-dark">{buyFormData.payment_method}</strong>
                  </div>
                  {receiptFile && (
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted">Receipt Slip:</span>
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        <i className="bi bi-file-earmark-check-fill me-1"></i>
                        {receiptFile.name}
                      </span>
                    </div>
                  )}
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

                  {/* Official ABA KHQR Card for Pet Phannoet */}
                  {buyFormData.payment_method === 'ABA Pay / KHQR' && (
                    <div className="col-12">
                      <div className="p-3 bg-white rounded-3 border text-center shadow-xs">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="badge bg-primary rounded-pill px-2 py-1 small">
                            <i className="bi bi-qr-code-scan me-1"></i> Scan &amp; Pay
                          </span>
                          <span className="fw-bold small text-dark">
                            Beneficiary: PET PHANNOET
                          </span>
                        </div>
                        <div className="my-2 d-flex justify-content-center">
                          <img
                            src="/images/aba-khqr.png"
                            alt="ABA PAY KHQR - PET PHANNOET"
                            className="img-fluid rounded-3 border shadow-xs"
                            style={{ maxHeight: '220px', objectFit: 'contain' }}
                          />
                        </div>
                        <div className="small text-muted mb-2">
                          Scan with <strong>ABA Mobile</strong> or any <strong>KHQR Bank App</strong> to pay{' '}
                          <strong className="text-primary">{interval === 'annual' ? '$5.00' : '$1.00'}</strong>
                        </div>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-primary rounded-pill px-3 py-1 shadow-2xs"
                          onClick={handleUseDefaultImage}
                          title="Attach this payment QR slip as your proof"
                        >
                          <i className="bi bi-paperclip me-1"></i> Use Default Image as Proof
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark">
                      Message / Payment Reference to Admin
                    </label>
                    <textarea
                      rows="2"
                      className="form-control bg-light"
                      placeholder="Optional: Enter your transaction reference or any message to admin..."
                      value={buyFormData.message}
                      onChange={(e) => setBuyFormData({ ...buyFormData, message: e.target.value })}
                    ></textarea>
                  </div>

                  {/* Browse Image or File Upload for Payment Proof */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark d-flex justify-content-between align-items-center">
                      <span>
                        <i className="bi bi-file-earmark-image-fill text-primary me-1"></i>
                        Attach Payment Slip / Transfer Screenshot
                      </span>
                      {receiptFile ? (
                        <span className="badge bg-success-subtle text-success small">
                          <i className="bi bi-check-circle-fill me-1"></i> Slip Ready
                        </span>
                      ) : (
                        <span className="text-muted small" style={{ fontSize: '11px' }}>Optional</span>
                      )}
                    </label>

                    {!receiptFile ? (
                      <div
                        className={`border border-2 border-dashed rounded-3 p-3 text-center transition-all ${
                          isDragging ? 'border-primary bg-primary-subtle' : 'border-secondary-subtle bg-light'
                        }`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDropFile}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                          className="d-none"
                          onChange={handleFileSelect}
                        />
                        <div className="text-primary fs-3 mb-1">
                          <i className="bi bi-cloud-arrow-up-fill"></i>
                        </div>
                        <div className="fw-semibold small text-dark">
                          Click to browse image or drag &amp; drop payment screenshot
                        </div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          Supports PNG, JPG, WEBP, or PDF receipt (Max 8MB)
                        </div>
                        <div className="mt-2">
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-primary rounded-pill px-3 py-1"
                            onClick={handleUseDefaultImage}
                          >
                            <i className="bi bi-image me-1"></i> Use Default Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3 overflow-hidden">
                          {receiptPreview ? (
                            <img
                              src={receiptPreview}
                              alt="Receipt Preview"
                              className="rounded border shadow-xs"
                              style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="bg-primary-subtle text-primary rounded p-2 text-center" style={{ width: '56px', height: '56px' }}>
                              <i className="bi bi-file-earmark-pdf fs-3"></i>
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div className="fw-bold small text-dark text-truncate">{receiptFile.name}</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>
                              {(receiptFile.size / 1024).toFixed(1)} KB &bull; Payment proof attached
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-circle"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            onClick={handleRemoveFile}
                            title="Remove attachment"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                          className="d-none"
                          onChange={handleFileSelect}
                        />
                      </div>
                    )}
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

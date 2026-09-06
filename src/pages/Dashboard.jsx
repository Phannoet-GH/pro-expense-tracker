import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { UserContext } from '../context/UserContext';
import { useBilling } from '../context/BillingContext';
import { apiFetch, parseResponse } from '../utils/api';
import { Link } from 'react-router-dom';
import AutoExpenseCalculator from '../components/AutoExpenseCalculator';
import CurrencyConverterModal from '../components/CurrencyConverterModal';

export default function Dashboard() {
  const {
    expenses,
    incomes,
    budgets,
    savingsGoals,
    addExpense,
    addIncome,
    updateBudget,
    resetBudgets,
    sampleReceipts,
    incomeSources,
    expenseCategories,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    totalBudgetLimit,
    formatAmount,
    currency,
    dualCurrencyEnabled
  } = useContext(ExpenseContext);

  const { token, currentUser } = useContext(UserContext) || {};
  const { isPro, billingData, openPricingModal, refreshBilling } = useBilling();

  // Admin reply notification states
  const [inquiryReply, setInquiryReply] = useState(null);
  const [adminEmail, setAdminEmail] = useState('petphannoet@gmail.com');
  const [replyDismissed, setReplyDismissed] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchReply = async () => {
      try {
        const res = await apiFetch('/api/client/inquiry-reply', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const { ok, data } = await parseResponse(res);
        if (ok && data?.reply) {
          const isDismissed = localStorage.getItem(`dismissed_reply_${data.reply.id}`);
          if (!isDismissed) {
            setInquiryReply(data.reply);
            if (data.adminEmail) setAdminEmail(data.adminEmail);
            if (data.reply.status === 'approved' && !isPro) {
              refreshBilling?.();
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch inquiry reply:', err);
      }
    };
    fetchReply();
  }, [token, isPro, refreshBilling]);

  const handleDismissReply = () => {
    if (inquiryReply?.id) {
      localStorage.setItem(`dismissed_reply_${inquiryReply.id}`, 'true');
    }
    setReplyDismissed(true);
  };

  const proofInputRef = useRef(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofSuccessMsg, setProofSuccessMsg] = useState('');

  const handleUploadProofFromDashboard = (e) => {
    const file = e.target.files?.[0];
    if (!file || !inquiryReply) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Selected file is too large (max 8MB)');
      return;
    }

    setUploadingProof(true);
    setProofSuccessMsg('');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await apiFetch('/api/client/inquiry-proof', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            requestId: inquiryReply.id,
            payment_proof: reader.result,
            receipt_file_name: file.name
          })
        });
        const { ok } = await parseResponse(res);
        if (ok) {
          setInquiryReply(prev => ({ ...prev, payment_proof: reader.result, receipt_file_name: file.name }));
          setProofSuccessMsg('Payment slip uploaded successfully to admin!');
          setTimeout(() => setProofSuccessMsg(''), 5000);
        }
      } catch (err) {
        console.error('Error uploading proof:', err);
      } finally {
        setUploadingProof(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Transaction form type toggle: 'expense' | 'income'
  const [txType, setTxType] = useState('expense');
  const [showAutoCalcModal, setShowAutoCalcModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const fileInputRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Food & Drink',
    source: 'Salary',
    amount: '',
    notes: '',
    receipt: null,
    is_recurring: false,
    is_tax_deductible: false,
    tax_category: 'General Business'
  });

  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState({ ...budgets });

  // Sync draft whenever user's loaded budgets change (e.g. login / account switch)
  useEffect(() => {
    setBudgetDraft({ ...budgets });
  }, [budgets]);

  // Remaining budget
  const remainingBudget = totalBudgetLimit - totalExpense;

  // Category spending
  const categorySpending = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount || 0);
      return acc;
    }, {});
  }, [expenses]);

  // Combined recent activities (both incomes and expenses, sorted by date)
  const recentActivities = useMemo(() => {
    const combined = [
      ...expenses.map(e => ({ ...e, txType: 'expense' })),
      ...incomes.map(i => ({ ...i, txType: 'income' }))
    ];
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);
  }, [expenses, incomes]);

  const handleScanReceipt = async (payload) => {
    if (!billingData.canScan && !isPro) {
      openPricingModal('Unlimited AI Receipt Scanning');
      return;
    }

    setIsScanning(true);
    setScanMessage('AI scanning receipt image & extracting line items...');
    try {
      const res = await apiFetch('/api/expenses/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const { ok, data } = await parseResponse(res);
      if (!ok) {
        if (data?.upgradeRequired) {
          openPricingModal('Unlimited AI Receipt Scanning');
        }
        throw new Error(data?.error || 'Receipt scan failed');
      }

      if (data?.receipt) {
        setFormData(prev => ({
          ...prev,
          title: data.receipt.merchant || prev.title,
          amount: data.receipt.amount ? data.receipt.amount.toString() : prev.amount,
          category: data.receipt.category || prev.category,
          date: data.receipt.date || prev.date,
          is_tax_deductible: !!data.receipt.is_tax_deductible,
          tax_category: data.receipt.tax_category || 'General Business',
          receipt: data.receipt
        }));
        setScanMessage(`✅ Scanned: ${data.receipt.merchant} ($${data.receipt.amount})`);
        setTimeout(() => setScanMessage(''), 3500);
      }

      await refreshBilling();
    } catch (err) {
      setScanMessage(`Scan error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleScanReceipt({
      fileName: file.name,
      receiptText: file.name
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectSampleReceipt = (rec) => {
    handleScanReceipt({
      sampleId: rec.id,
      fileName: `${rec.merchant}_Receipt.pdf`,
      receiptText: `${rec.merchant} total $${rec.amount} items: ${rec.items?.join(', ')}`
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;

    if (txType === 'expense') {
      addExpense({
        title: formData.title.trim() || `${formData.category} Expense`,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        notes: formData.notes,
        receipt: formData.receipt,
        is_tax_deductible: formData.is_tax_deductible,
        tax_category: formData.tax_category
      });
    } else {
      addIncome({
        title: formData.title.trim() || `${formData.source} Income`,
        amount: parseFloat(formData.amount),
        source: formData.source,
        date: formData.date,
        notes: formData.notes,
        is_recurring: formData.is_recurring
      });
    }

    // Reset form
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Food & Drink',
      source: 'Salary',
      amount: '',
      notes: '',
      receipt: null,
      is_recurring: false,
      is_tax_deductible: false,
      tax_category: 'General Business'
    });
  };

  const handleSaveBudgets = () => {
    Object.entries(budgetDraft).forEach(([cat, val]) => {
      updateBudget(cat, val);
    });
    setShowBudgetEditor(false);
  };

  const handleResetBudgets = async () => {
    if (window.confirm('Reset monthly category allowances for this account back to default benchmark values ($600 Room, $400 Food & Drink, $200 Transport, etc.)?')) {
      await resetBudgets?.();
    }
  };

  return (
    <div>
      {/* Top Banner Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold m-0 text-dark">Executive Financial Dashboard</h3>
          <p className="text-muted small m-0">Monitor income cash flow, expense categories, budget thresholds, and wealth building</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-xs d-flex align-items-center gap-1"
            onClick={() => setShowCurrencyModal(true)}
            title="Convert currencies & view exchange rates"
          >
            <i className="bi bi-currency-exchange text-primary"></i> Exchange Tool
          </button>
          <Link to="/dashboard/savings" className="btn btn-sm btn-warning rounded-pill px-3 fw-semibold text-dark shadow-sm">
            <i className="bi bi-piggy-bank-fill me-1"></i> How to Save Money
          </Link>
          <button
            className="btn btn-sm btn-outline-primary rounded-pill px-3"
            onClick={() => {
              setBudgetDraft({ ...budgets });
              setShowBudgetEditor(!showBudgetEditor);
            }}
          >
            <i className="bi bi-sliders me-1"></i> {showBudgetEditor ? 'Close Budgets' : 'Configure Category Budgets'}
          </button>
        </div>
      </div>

      {/* Admin Message Notification Banner */}
      {inquiryReply && !replyDismissed && (
        <div
          className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden border-start border-4 border-primary"
          style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)' }}
        >
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="badge bg-primary rounded-pill px-3 py-1">
                  <i className="bi bi-chat-left-text-fill me-1"></i> Message from Administrator
                </span>
                <span className="text-dark fw-bold small">
                  {adminEmail}
                </span>
                {inquiryReply.status === 'approved' && (
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 small">
                    <i className="bi bi-check-circle-fill me-1"></i> PRO Upgrade Approved
                  </span>
                )}
                <span className="text-muted small">
                  {inquiryReply.replied_at ? new Date(inquiryReply.replied_at).toLocaleString() : ''}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-circle"
                style={{ width: '28px', height: '28px', padding: 0 }}
                onClick={handleDismissReply}
                title="Dismiss message"
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="bg-white p-3 rounded-3 border shadow-xs text-dark my-3" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {inquiryReply.admin_reply}
            </div>

            {proofSuccessMsg && (
              <div className="alert alert-success py-1 px-3 mb-3 small rounded-pill d-inline-flex align-items-center gap-1">
                <i className="bi bi-check-circle-fill"></i> {proofSuccessMsg}
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-1">
              <div className="text-muted small d-flex align-items-center gap-2 flex-wrap">
                <span>
                  <i className="bi bi-info-circle me-1"></i>
                  Regarding your <strong>{inquiryReply.plan?.toUpperCase()}</strong> inquiry ({inquiryReply.price})
                </span>
                {inquiryReply.payment_proof && (
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
                    <i className="bi bi-file-earmark-check-fill me-1"></i>
                    Slip: {inquiryReply.receipt_file_name || 'Attached'}
                  </span>
                )}
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <button
                  type="button"
                  disabled={uploadingProof}
                  onClick={() => proofInputRef.current?.click()}
                  className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
                  title="Browse image or file to upload proof"
                >
                  {uploadingProof ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-paperclip me-1"></i>
                      {inquiryReply.payment_proof ? 'Change Slip' : 'Upload Slip / Screenshot'}
                    </>
                  )}
                </button>
                <input
                  type="file"
                  ref={proofInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                  className="d-none"
                  onChange={handleUploadProofFromDashboard}
                />

                <a
                  href={`mailto:${adminEmail}?subject=Re:%20SmartFinance%20PRO%20Inquiry%20Response`}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold"
                >
                  <i className="bi bi-reply-fill me-1"></i> Reply via Email
                </a>
                {inquiryReply.status === 'approved' && !isPro && (
                  <button
                    onClick={() => refreshBilling?.()}
                    className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-xs"
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> Activate PRO in Session
                  </button>
                )}
                <button
                  onClick={handleDismissReply}
                  className="btn btn-sm btn-light border rounded-pill px-3"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 KPI Top Cards */}
      <div className="row g-3 mb-4">
        {/* Card 1: Net Cash Flow */}
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Net Cash Flow</span>
              <span className={`badge rounded-pill ${netSavings >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                {netSavings >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <h3 className={`fw-bold mb-1 ${netSavings >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatAmount(netSavings)}
            </h3>
            {dualCurrencyEnabled && (
              <div className="small text-muted fw-semibold mb-1" style={{ fontSize: '12px' }}>
                ≈ {formatAmount(netSavings, currency === 'USD' ? 'KHR' : 'USD')}
              </div>
            )}
            <div className="text-muted small">
              {totalIncome > 0 ? `${savingsRate.toFixed(0)}% retained as savings` : 'Log income to measure flow'}
            </div>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Total Inflow</span>
              <span className="badge rounded-pill bg-primary-subtle text-primary">{incomes.length} Entries</span>
            </div>
            <h3 className="fw-bold text-primary mb-1">{formatAmount(totalIncome)}</h3>
            {dualCurrencyEnabled && (
              <div className="small text-muted fw-semibold mb-1" style={{ fontSize: '12px' }}>
                ≈ {formatAmount(totalIncome, currency === 'USD' ? 'KHR' : 'USD')}
              </div>
            )}
            <div className="text-muted small">Salary, freelance & investments</div>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Total Outflow</span>
              <span className="badge rounded-pill bg-secondary-subtle text-secondary">{expenses.length} Txns</span>
            </div>
            <h3 className="fw-bold text-danger mb-1">{formatAmount(totalExpense)}</h3>
            {dualCurrencyEnabled && (
              <div className="small text-muted fw-semibold mb-1" style={{ fontSize: '12px' }}>
                ≈ {formatAmount(totalExpense, currency === 'USD' ? 'KHR' : 'USD')}
              </div>
            )}
            <div className="text-muted small">
              {totalBudgetLimit > 0 ? `${Math.round((totalExpense / totalBudgetLimit) * 100)}% of budget limit` : 'No budget set'}
            </div>
          </div>
        </div>

        {/* Card 4: Savings Health */}
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Savings Rate</span>
              <span className={`badge rounded-pill ${savingsRate >= 20 ? 'bg-success' : savingsRate >= 10 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                {savingsRate >= 20 ? '⭐ Strong' : savingsRate >= 10 ? 'Moderate' : 'Needs Boost'}
              </span>
            </div>
            <h3 className="fw-bold text-dark mb-1">{savingsRate.toFixed(1)}%</h3>
            <div className="text-muted small">
              Recommended: 20%+ (50/30/20)
            </div>
          </div>
        </div>
      </div>

      {/* 50/30/20 Mini Progress Meter Callout */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning-subtle text-dark px-2 py-1 rounded-pill">
              <i className="bi bi-lightbulb-fill me-1 text-warning"></i> Smart Savings Rule
            </span>
            <span className="fw-bold small text-dark">50/30/20 Income Allocation Health</span>
          </div>
          <Link to="/dashboard/savings" className="small fw-bold text-primary text-decoration-none">
            Deep Dive in Savings Hub <i className="bi bi-arrow-right"></i>
          </Link>
        </div>

        {/* 3-Part Combined Progress Bar */}
        {totalIncome > 0 ? (
          <div>
            <div className="progress" style={{ height: '14px' }}>
              <div
                className="progress-bar bg-primary"
                style={{ width: `${Math.min(100, Math.round((totalExpense * 0.65 / totalIncome) * 100))}%` }}
                title="Needs (Target 50%)"
              >
                Needs
              </div>
              <div
                className="progress-bar bg-warning"
                style={{ width: `${Math.min(100, Math.round((totalExpense * 0.35 / totalIncome) * 100))}%` }}
                title="Wants (Target 30%)"
              >
                Wants
              </div>
              <div
                className="progress-bar bg-success"
                style={{ width: `${Math.max(0, savingsRate)}%` }}
                title="Savings (Target 20%)"
              >
                Savings
              </div>
            </div>
            <div className="d-flex justify-content-between small text-muted mt-2" style={{ fontSize: '11px' }}>
              <span><span className="badge bg-primary me-1">&bull;</span> Needs Target: 50% ({formatAmount(totalIncome * 0.5)})</span>
              <span><span className="badge bg-warning text-dark me-1">&bull;</span> Wants Target: 30% ({formatAmount(totalIncome * 0.3)})</span>
              <span><span className="badge bg-success me-1">&bull;</span> Savings Target: 20% ({formatAmount(totalIncome * 0.2)})</span>
            </div>
          </div>
        ) : (
          <p className="text-muted small mb-0">
            Log your monthly income to unlock real-time 50/30/20 recommendations and savings optimization!
          </p>
        )}
      </div>

      {/* Budget Configuration Drawer */}
      {showBudgetEditor && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-light border border-primary-subtle">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Set Monthly Category Budgets</h5>
              <div className="text-muted small">
                Customized for account: <strong className="text-primary">{currentUser?.name || currentUser?.email || 'Active Account'}</strong>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger rounded-pill px-3"
              onClick={handleResetBudgets}
              title="Reset this account back to default benchmark values"
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Reset to Benchmarks
            </button>
          </div>
          <div className="row g-3">
            {Object.keys(budgets).map((cat) => (
              <div key={cat} className="col-md-4 col-sm-6">
                <label className="form-label small fw-semibold text-muted">{cat} ({currency})</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={budgetDraft[cat] ?? ''}
                  onChange={(e) => setBudgetDraft({ ...budgetDraft, [cat]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setShowBudgetEditor(false)}>Cancel</button>
            <button className="btn btn-sm btn-primary rounded-pill px-4" onClick={handleSaveBudgets}>Save Budgets</button>
          </div>
        </div>
      )}

      {/* Savings Goals Preview Bar (if any goals exist) */}
      {savingsGoals.length > 0 && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold m-0"><i className="bi bi-bullseye text-primary me-2"></i>Active Savings Goals</h5>
            <Link to="/dashboard/savings" className="btn btn-sm btn-outline-primary rounded-pill px-3">Manage Goals</Link>
          </div>
          <div className="row g-3">
            {savingsGoals.slice(0, 3).map(g => {
              const target = parseFloat(g.target_amount) || 1;
              const current = parseFloat(g.current_amount) || 0;
              const pct = Math.min(100, Math.round((current / target) * 100));
              return (
                <div key={g.id} className="col-md-4">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small text-truncate">{g.title}</span>
                      <span className="badge bg-success-subtle text-success">{pct}%</span>
                    </div>
                    <div className="d-flex justify-content-between small text-muted mb-2">
                      <span>{formatAmount(current)}</span>
                      <span>Target: {formatAmount(target)}</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Two-Column Section: Unified Form & Recent Activity */}
      <div className="row g-4 mb-4">
        {/* Unified Transaction Form */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-dark">Quick Add Transaction</h5>

              {/* Type Switcher Pills */}
              <div className="btn-group p-1 bg-light rounded-pill border" role="group">
                <button
                  type="button"
                  className={`btn btn-xs rounded-pill px-3 fw-bold ${txType === 'expense' ? 'btn-danger text-white shadow-sm' : 'btn-light border-0 text-muted'}`}
                  style={{ fontSize: '11px', padding: '4px 12px' }}
                  onClick={() => setTxType('expense')}
                >
                  - Expense
                </button>
                <button
                  type="button"
                  className={`btn btn-xs rounded-pill px-3 fw-bold ${txType === 'income' ? 'btn-success text-white shadow-sm' : 'btn-light border-0 text-muted'}`}
                  style={{ fontSize: '11px', padding: '4px 12px' }}
                  onClick={() => setTxType('income')}
                >
                  + Income
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="form-label small fw-semibold text-muted">
                  {txType === 'expense' ? 'Merchant / Description' : 'Source / Payer'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={txType === 'expense' ? 'e.g. Starbucks, Uber, AWS' : 'e.g. Client Salary, Consulting, Bonus'}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">
                    {txType === 'expense' ? 'Category' : 'Income Stream'}
                  </label>
                  {txType === 'expense' ? (
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="form-select"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      required
                    >
                      {incomeSources.map(src => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Amount ({currency})</label>
                  <input
                    type="number"
                    className="form-control"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6 d-flex align-items-end">
                  {txType === 'income' ? (
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="recurringCheck"
                        checked={formData.is_recurring}
                        onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                      />
                      <label className="form-check-label small text-muted" htmlFor="recurringCheck">
                        Recurring Monthly
                      </label>
                    </div>
                  ) : (
                    <div className="small text-muted mb-2">
                      <i className="bi bi-tag me-1"></i> Budget: {formData.category}
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Attachment & AI OCR (Only for Expenses) */}
              {txType === 'expense' && (
                <div className="mb-3 p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-semibold text-dark d-flex align-items-center gap-1">
                      <i className="bi bi-cpu-fill text-primary"></i> AI Receipt Scanner
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge rounded-pill ${isPro ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-dark'} small`} style={{ fontSize: '10px' }}>
                        {isPro ? '⭐ Unlimited AI Scans' : `Scans Left: ${billingData?.scansRemaining ?? 3}/3`}
                      </span>
                      {formData.receipt && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0 text-decoration-none small"
                          onClick={() => setFormData({ ...formData, receipt: null })}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {scanMessage && (
                    <div className="alert alert-info py-1 px-2 small mb-2 rounded-2 d-flex align-items-center gap-1">
                      <span className="spinner-border spinner-border-sm me-1" role="status" style={{ display: isScanning ? 'inline-block' : 'none' }}></span>
                      <span>{scanMessage}</span>
                    </div>
                  )}

                  {formData.receipt ? (
                    <div className="d-flex align-items-center gap-2 bg-white text-dark p-2 rounded-2 small border shadow-sm">
                      <i className="bi bi-file-earmark-check-fill text-success fs-5"></i>
                      <div className="flex-grow-1 text-truncate">
                        <div className="fw-bold">{formData.receipt.merchant}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          Auto-parsed ${formData.receipt.amount} • {formData.receipt.category} • {formData.receipt.tax_category || 'Deductible'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,.pdf"
                        className="d-none"
                      />

                      <div className="d-flex gap-2 mb-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary rounded-pill w-100 py-1 d-flex align-items-center justify-content-center gap-1"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isScanning}
                        >
                          <i className="bi bi-camera-fill"></i>
                          <span>Upload Receipt Photo</span>
                        </button>

                        {!isPro && (
                          <button
                            type="button"
                            className="btn btn-sm btn-warning rounded-pill text-dark fw-semibold px-2 py-1"
                            onClick={() => openPricingModal('Unlimited AI Receipt Scanning')}
                            title="Upgrade to Pro for unlimited scans"
                          >
                            <i className="bi bi-stars"></i> Pro
                          </button>
                        )}
                      </div>

                      <div className="text-muted" style={{ fontSize: '11px', marginBottom: '4px' }}>
                        Or test with sample receipts:
                      </div>
                      <div className="d-flex gap-1 flex-wrap">
                        {sampleReceipts.map((rec) => (
                          <button
                            key={rec.id}
                            type="button"
                            className="btn btn-xs btn-outline-secondary"
                            style={{ fontSize: '11px', padding: '2px 7px' }}
                            onClick={() => handleSelectSampleReceipt(rec)}
                            disabled={isScanning}
                          >
                            + {rec.merchant} (${rec.amount})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tax Write-Off Tagging Toggle (Only for Expenses) */}
              {txType === 'expense' && (
                <div className="form-check form-switch mb-3 p-2 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                  <div className="ps-2">
                    <label className="form-check-label fw-semibold small text-dark d-flex align-items-center gap-1" htmlFor="taxDeductibleCheck">
                      <i className="bi bi-shield-check text-success"></i> Schedule C Tax Deductible
                    </label>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      Tag as a business expense for tax write-offs
                    </div>
                  </div>
                  <input
                    className="form-check-input ms-0 shadow-none me-2"
                    type="checkbox"
                    id="taxDeductibleCheck"
                    checked={formData.is_tax_deductible}
                    onChange={(e) => setFormData({ ...formData, is_tax_deductible: e.target.checked })}
                  />
                </div>
              )}

              <button
                type="submit"
                className={`btn w-100 fw-bold py-2 shadow-sm ${txType === 'expense' ? 'btn-danger' : 'btn-success'}`}
              >
                {txType === 'expense' ? 'Record Expense' : 'Record Income'}
              </button>
            </form>
          </div>
        </div>

        {/* Recent Unified Activity Table */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-dark">Recent Cash Flow Activity</h5>
              <Link to="/dashboard/transactions" className="btn btn-sm btn-outline-primary rounded-pill px-3">
                Full Ledger
              </Link>
            </div>

            <div className="table-responsive">
              <table className="table table-borderless align-middle">
                <tbody>
                  {recentActivities.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        No transactions recorded yet. Use the form to record income or expenses!
                      </td>
                    </tr>
                  ) : recentActivities.map((item) => {
                    const isInc = item.txType === 'income';
                    return (
                      <tr key={item.id} className="border-bottom">
                        <td className="py-2" style={{ width: '45px' }}>
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${isInc ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                            style={{ width: '36px', height: '36px' }}
                          >
                            <i className={`bi ${isInc ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`}></i>
                          </div>
                        </td>
                        <td className="py-2">
                          <div className="fw-bold text-dark">{item.title || (isInc ? item.source : item.category)}</div>
                          <div className="text-muted small">{new Date(item.date).toLocaleDateString()}</div>
                        </td>
                        <td>
                          <span className={`badge ${isInc ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                            {isInc ? `+${item.source}` : item.category}
                          </span>
                        </td>
                        <td className={`text-end fw-bold ${isInc ? 'text-success' : 'text-dark'}`}>
                          {isInc ? `+${formatAmount(item.amount)}` : `-${formatAmount(item.amount)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Category Budgets Progress Section */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h5 className="fw-bold m-0 text-dark">Monthly Category Budget Allowances</h5>
              <span className="badge bg-secondary-subtle text-secondary border px-2 py-1 small">
                <i className="bi bi-person-circle me-1"></i>
                {currentUser?.name || currentUser?.email || 'Account'}
              </span>
            </div>
            <span className="badge bg-primary-subtle text-primary mt-1">
              {formatAmount(totalExpense)} of {formatAmount(totalBudgetLimit)} spent &bull; Remaining: {formatAmount(remainingBudget)}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-medium shadow-sm"
              onClick={handleResetBudgets}
              title="Reset budgets for this account back to default benchmark allowances"
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Reset to Defaults
            </button>
            <button
              className="btn btn-sm btn-success rounded-pill px-3 fw-semibold shadow-sm"
              onClick={() => setShowAutoCalcModal(true)}
            >
              <i className="bi bi-calculator me-1"></i> Auto-Calculate from Saving Goal
            </button>
          </div>
        </div>

        <div className="row g-3">
          {Object.entries(budgets).map(([cat, limit]) => {
            const spent = categorySpending[cat] || 0;
            const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
            const isOver = spent > limit;
            const isWarning = pct >= 75 && !isOver;
            const barColorClass = isOver ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success';

            return (
              <div key={cat} className="col-md-6 col-lg-4">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold small">{cat}</span>
                    <span className={`badge ${isOver ? 'bg-danger' : isWarning ? 'bg-warning text-dark' : 'bg-success-subtle text-success'}`}>
                      {isOver ? 'Over Budget' : `${pct}%`}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-2">
                    <span>{formatAmount(spent)} spent</span>
                    <span>Limit: {formatAmount(limit)}</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className={`progress-bar ${barColorClass}`}
                      role="progressbar"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: AUTO EXPENSE CALCULATOR */}
      {showAutoCalcModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: '950px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-calculator text-success me-2"></i>Auto-Calculate Monthly Expenses from Saving Goal
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAutoCalcModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <AutoExpenseCalculator onApplied={() => setShowAutoCalcModal(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CURRENCY CONVERTER & EXCHANGE TOOL */}
      <CurrencyConverterModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />
    </div>
  );
}

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { UserContext } from '../context/UserContext';
import { useBilling } from '../context/BillingContext';
import { apiFetch, parseResponse } from '../utils/api';

const TAX_CATEGORIES = [
  { id: 'Software & Subscriptions', label: 'Software & SaaS', desc: 'Cloud hosting, GitHub, Figma, Adobe, Zoom', icon: 'bi-laptop' },
  { id: 'Office Supplies', label: 'Office & Tech Gear', desc: 'Monitors, keyboards, desk accessories, stationery', icon: 'bi-printer' },
  { id: 'Travel & Mileage', label: 'Travel & Rideshare', desc: 'Uber, flights, hotels, business transit', icon: 'bi-airplane' },
  { id: 'Meals & Entertainment', label: 'Business Dining (50%)', desc: 'Client meetings, project dinners, team lunches', icon: 'bi-cup-hot' },
  { id: 'Home Office & Utilities', label: 'Home Office / Internet', desc: 'Internet bills, dedicated workspace utilities', icon: 'bi-house-gear' },
  { id: 'Professional Services', label: 'Legal & Accounting', desc: 'Contractors, legal filings, tax preparation', icon: 'bi-briefcase' },
  { id: 'General Business', label: 'General Business', desc: 'Other legitimate deductible business expenses', icon: 'bi-tag' }
];

export default function TaxReports() {
  const { expenses, currency, formatAmount } = useContext(ExpenseContext);
  const { token, currentUser } = useContext(UserContext);
  const { isPro, openPricingModal } = useBilling();

  const [taxRate, setTaxRate] = useState(28); // Standard estimated marginal tax bracket
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [taxSummary, setTaxSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch server-calculated tax summary
  const fetchTaxSummary = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/tax/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { ok, data } = await parseResponse(res);
      if (ok && data?.success) {
        setTaxSummary(data);
      }
    } catch (err) {
      console.warn('Tax summary fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxSummary();
  }, [token, expenses]);

  // Toggle tax deductible state for an expense
  const handleToggleDeductible = async (expenseId, currentStatus, currentCat) => {
    if (!isPro) {
      openPricingModal('Schedule C Tax Deductions & Classification');
      return;
    }

    setUpdatingId(expenseId);
    try {
      const newStatus = !currentStatus;
      await apiFetch(`/api/expenses/${expenseId}/tax-tag`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          is_tax_deductible: newStatus,
          tax_category: currentCat || 'General Business'
        })
      });
      await fetchTaxSummary();
    } catch (err) {
      console.error('Failed to update tax tag:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Change tax category
  const handleChangeCategory = async (expenseId, newCat) => {
    if (!isPro) {
      openPricingModal('Schedule C Tax Categories');
      return;
    }

    try {
      await apiFetch(`/api/expenses/${expenseId}/tax-tag`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          is_tax_deductible: true,
          tax_category: newCat
        })
      });
      await fetchTaxSummary();
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  };

  // Filtered expenses
  const deductibleExpenses = useMemo(() => {
    return (expenses || []).filter(e => e.is_tax_deductible);
  }, [expenses]);

  const totalDeductibleAmount = useMemo(() => {
    return deductibleExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [deductibleExpenses]);

  const dynamicTaxSavings = useMemo(() => {
    return (totalDeductibleAmount * (taxRate / 100)).toFixed(2);
  }, [totalDeductibleAmount, taxRate]);

  // Export Tax CSV
  const handleExportCsv = () => {
    if (!isPro) {
      openPricingModal('CPA Tax Statement CSV Export');
      return;
    }

    const headers = ['Date', 'Merchant/Title', 'Amount', 'Standard Category', 'Schedule C Tax Category', 'Deductible Status'];
    const rows = (expenses || [])
      .filter(e => e.is_tax_deductible)
      .map(e => [
        e.date,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        e.amount,
        `"${e.category}"`,
        `"${e.tax_category || 'General Business'}"`,
        'YES (Deductible)'
      ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartFinance_Tax_Deductions_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    if (!isPro) {
      openPricingModal('Audit-Ready PDF & Print Statement');
      return;
    }
    window.print();
  };

  return (
    <div className="container-fluid py-4 px-lg-4">
      {/* Header Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-success-subtle text-success fw-semibold small mb-2">
            <i className="bi bi-shield-check"></i>
            Schedule C & Freelancer Tax Optimizer
          </div>
          <h2 className="fw-bold text-dark mb-1">Tax Write-Offs & Statements</h2>
          <p className="text-muted small mb-0">
            Categorize eligible business deductions to lower your taxable income legally and prepare for tax season.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm shadow-none rounded-pill"
            style={{ width: '120px' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2026">Tax Year 2026</option>
            <option value="2025">Tax Year 2025</option>
            <option value="2024">Tax Year 2024</option>
          </select>

          <button
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-2"
            onClick={handleExportCsv}
          >
            <i className="bi bi-file-earmark-spreadsheet"></i>
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-2 shadow-sm"
            onClick={handlePrintReport}
          >
            <i className="bi bi-printer"></i>
            <span>Print Tax Statement</span>
          </button>
        </div>
      </div>

      {/* Pro Lock Overlay for Free Tier */}
      {!isPro && (
        <div
          className="card border-0 rounded-4 p-4 text-white mb-4 shadow-lg position-relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)'
          }}
        >
          <div className="position-absolute end-0 top-0 opacity-10 p-4" style={{ fontSize: '12rem', transform: 'translate(20%, -20%)' }}>
            <i className="bi bi-file-earmark-medical-fill"></i>
          </div>

          <div className="row align-items-center position-relative z-1">
            <div className="col-lg-8">
              <span className="badge bg-warning text-dark rounded-pill px-3 py-1 fw-bold mb-2">
                🔒 PRO FEATURE
              </span>
              <h4 className="fw-bold mb-2">
                Unlock Schedule C Deduction Categorization & CPA Exports
              </h4>
              <p className="text-white-50 small mb-3">
                Freelancers and self-employed creators save an average of <strong>$2,400/year</strong> by systematically tracking software, home office, travel, and business equipment write-offs.
              </p>
              <ul className="list-inline text-white small mb-0">
                <li className="list-inline-item me-3">
                  <i className="bi bi-check-circle-fill text-warning me-1"></i> Auto-Deduction Tagging
                </li>
                <li className="list-inline-item me-3">
                  <i className="bi bi-check-circle-fill text-warning me-1"></i> Real-time Tax Savings Estimate
                </li>
                <li className="list-inline-item">
                  <i className="bi bi-check-circle-fill text-warning me-1"></i> One-Click CPA Statements
                </li>
              </ul>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <button
                className="btn btn-warning text-dark rounded-pill px-4 py-2 fw-bold shadow d-inline-flex align-items-center gap-2"
                onClick={() => openPricingModal('Schedule C Tax Deductions')}
              >
                <i className="bi bi-lightning-charge-fill"></i>
                Upgrade to PRO ($2/mo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Deductible */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-medium">Total Write-Offs</span>
              <div className="p-2 rounded-3 bg-success-subtle text-success">
                <i className="bi bi-cash-stack"></i>
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-1">
              {formatAmount(totalDeductibleAmount)}
            </h3>
            <p className="text-muted small mb-0">
              From {deductibleExpenses.length} qualifying expenses
            </p>
          </div>
        </div>

        {/* Card 2: Estimated Tax Reduction */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-medium">Est. Tax Savings</span>
              <div className="p-2 rounded-3 bg-primary-subtle text-primary">
                <i className="bi bi-piggy-bank-fill"></i>
              </div>
            </div>
            <h3 className="fw-bold text-success mb-1">
              {currency}{dynamicTaxSavings}
            </h3>
            <p className="text-muted small mb-0">
              Based on {taxRate}% estimated tax rate
            </p>
          </div>
        </div>

        {/* Card 3: Deduction Ratio */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-medium">Deduction Ratio</span>
              <div className="p-2 rounded-3 bg-purple-subtle text-purple">
                <i className="bi bi-percent"></i>
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-1">
              {taxSummary?.deductiblePercentage || 0}%
            </h3>
            <p className="text-muted small mb-0">
              Of your total spending is deductible
            </p>
          </div>
        </div>

        {/* Card 4: Tax Bracket Simulator */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 rounded-4 shadow-sm p-3 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted small fw-medium">Marginal Tax Bracket</span>
              <span className="badge bg-primary rounded-pill">{taxRate}%</span>
            </div>
            <input
              type="range"
              className="form-range my-2"
              min="15"
              max="37"
              step="1"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
            />
            <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
              <span>15% (Low)</span>
              <span>28% (Avg Freelance)</span>
              <span>37% (Top)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Breakdown & Transactions Grid */}
      <div className="row g-4">
        {/* Left Column: Category Breakdown */}
        <div className="col-lg-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <h5 className="fw-bold text-dark mb-3">Schedule C Categories</h5>
            <p className="text-muted small mb-3">
              Standard IRS & freelance deductible expense categories:
            </p>

            <div className="d-flex flex-column gap-3">
              {TAX_CATEGORIES.map(cat => {
                const catData = taxSummary?.categoryBreakdown?.[cat.id] || { count: 0, total: 0 };
                return (
                  <div key={cat.id} className="p-3 rounded-3 bg-light border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold text-dark d-flex align-items-center gap-2 small">
                        <i className={`bi ${cat.icon} text-primary`}></i>
                        {cat.label}
                      </span>
                      <span className="badge bg-white text-dark border rounded-pill">
                        {catData.count} items
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-baseline">
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{cat.desc}</span>
                      <span className="fw-bold text-success small">{formatAmount(catData.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Transactions Tax Tagger */}
        <div className="col-lg-8">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">Expense Tax Classification</h5>
                <p className="text-muted small mb-0">
                  Tag transactions as business write-offs. Changes save automatically to your private ledger.
                </p>
              </div>
              <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                {expenses?.length || 0} Total Transactions
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr className="small text-muted">
                    <th>Deductible?</th>
                    <th>Date</th>
                    <th>Merchant / Expense</th>
                    <th>Amount</th>
                    <th>Schedule C Category</th>
                  </tr>
                </thead>
                <tbody>
                  {(expenses || []).slice(0, 15).map(e => {
                    const isDeductible = !!e.is_tax_deductible;
                    return (
                      <tr key={e.id} className={isDeductible ? 'table-success-subtle' : ''}>
                        {/* Deductible Toggle */}
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input shadow-none"
                              type="checkbox"
                              checked={isDeductible}
                              disabled={updatingId === e.id}
                              onChange={() => handleToggleDeductible(e.id, isDeductible, e.tax_category)}
                            />
                          </div>
                        </td>

                        {/* Date */}
                        <td className="small text-muted">{e.date}</td>

                        {/* Title */}
                        <td>
                          <div className="fw-semibold text-dark small">{e.title}</div>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{e.category}</span>
                        </td>

                        {/* Amount */}
                        <td className="fw-bold text-dark small">
                          {formatAmount(e.amount)}
                        </td>

                        {/* Category Dropdown */}
                        <td>
                          {isDeductible ? (
                            <select
                              className="form-select form-select-sm rounded-pill shadow-none py-1"
                              style={{ fontSize: '0.8rem', maxWidth: '200px' }}
                              value={e.tax_category || 'General Business'}
                              onChange={(evt) => handleChangeCategory(e.id, evt.target.value)}
                            >
                              {TAX_CATEGORIES.map(tc => (
                                <option key={tc.id} value={tc.id}>{tc.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="badge bg-secondary-subtle text-secondary rounded-pill small">
                              Personal Expense
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!expenses || expenses.length === 0) && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No transactions recorded yet. Add an expense to begin tax categorization!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useContext, useState } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { expenses, budgets, addExpense, updateBudget, sampleReceipts } = useContext(ExpenseContext);
  
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Food & Dining',
    amount: '',
    notes: '',
    receipt: null
  });

  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState({ ...budgets });

  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalBudgetLimit = Object.values(budgets).reduce((sum, b) => sum + parseFloat(b || 0), 0);
  const remainingBudget = totalBudgetLimit - totalSpent;
  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  // Calculate spending per category
  const categorySpending = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount || 0);
    return acc;
  }, {});

  const handleSelectSampleReceipt = (rec) => {
    setFormData({
      ...formData,
      title: rec.merchant,
      category: rec.category,
      amount: rec.amount.toString(),
      receipt: rec
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;

    addExpense({
      ...formData,
      title: formData.title.trim() || `${formData.category} Expense`,
      amount: parseFloat(formData.amount)
    });

    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Food & Dining',
      amount: '',
      notes: '',
      receipt: null
    });
  };

  const handleSaveBudgets = () => {
    Object.entries(budgetDraft).forEach(([cat, val]) => {
      updateBudget(cat, val);
    });
    setShowBudgetEditor(false);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold m-0">Dashboard Overview</h3>
          <p className="text-muted small m-0">Track recurring category budgets, expenses, and attached receipts</p>
        </div>
        <button
          className="btn btn-sm btn-outline-primary rounded-pill px-3"
          onClick={() => {
            setBudgetDraft({ ...budgets });
            setShowBudgetEditor(!showBudgetEditor);
          }}
        >
          <i className="bi bi-gear-fill me-1"></i> {showBudgetEditor ? 'Close Budget Settings' : 'Configure Monthly Budgets'}
        </button>
      </div>

      {/* KPI Top Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
            <h6 className="text-muted text-uppercase fw-bold small">Total Spent</h6>
            <h2 className="text-primary fw-bold mb-0">${totalSpent.toFixed(2)}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
            <h6 className="text-muted text-uppercase fw-bold small">Total Transactions</h6>
            <h2 className="text-success fw-bold mb-0">{expenses.length}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
            <h6 className="text-muted text-uppercase fw-bold small">Remaining Budget</h6>
            <h2 className={`fw-bold mb-0 ${remainingBudget >= 0 ? 'text-success' : 'text-danger'}`}>
              ${remainingBudget.toFixed(2)}
            </h2>
          </div>
        </div>
      </div>

      {/* Budget Configuration Modal / Drawer */}
      {showBudgetEditor && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-light">
          <h5 className="fw-bold mb-3">Set Monthly Recurring Budgets</h5>
          <div className="row g-3">
            {Object.keys(budgets).map((cat) => (
              <div key={cat} className="col-md-4 col-sm-6">
                <label className="form-label small fw-semibold text-muted">{cat} ($)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={budgetDraft[cat] || ''}
                  onChange={(e) => setBudgetDraft({ ...budgetDraft, [cat]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setShowBudgetEditor(false)}>Cancel</button>
            <button className="btn btn-sm btn-primary rounded-pill px-4" onClick={handleSaveBudgets}>Save Budget Limits</button>
          </div>
        </div>
      )}

      {/* Recurring Category Budgets Progress Section */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold m-0">Monthly Recurring Category Budgets</h5>
          <span className="badge bg-primary-subtle text-primary">
            ${totalSpent.toFixed(0)} of ${totalBudgetLimit.toFixed(0)} spent ({totalBudgetLimit > 0 ? Math.round((totalSpent / totalBudgetLimit) * 100) : 0}%)
          </span>
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
                    <span>${spent.toFixed(2)} spent</span>
                    <span>Budget: ${limit.toFixed(0)}</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className={`progress-bar ${barColorClass}`}
                      role="progressbar"
                      style={{ width: `${pct}%` }}
                      aria-valuenow={pct}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="row g-4">
        {/* Quick Add Form with Receipt Attachment Simulator */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white h-100">
            <h5 className="fw-bold mb-3">Add Transaction & Receipt</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="form-label small fw-semibold">Title / Merchant</label>
                <input
                  type="text"
                  className="form-control border-0"
                  placeholder="e.g. Starbucks, Uber, AWS..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label small fw-semibold">Category</label>
                  <select
                    className="form-select border-0"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Transport">Transport</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Amount ($)</label>
                  <input
                    type="number"
                    className="form-control border-0"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Date</label>
                <input
                  type="date"
                  className="form-control border-0"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              {/* Receipt Attachment Simulator */}
              <div className="mb-3 p-2 bg-white bg-opacity-10 rounded-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-semibold">
                    <i className="bi bi-receipt me-1"></i> Receipt Attachment Simulator
                  </span>
                  {formData.receipt && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-white p-0 text-decoration-none"
                      onClick={() => setFormData({ ...formData, receipt: null })}
                    >
                      &times; Remove
                    </button>
                  )}
                </div>

                {formData.receipt ? (
                  <div className="d-flex align-items-center gap-2 bg-white text-dark p-2 rounded-2 small">
                    <i className="bi bi-file-earmark-check-fill text-success fs-5"></i>
                    <div className="flex-grow-1 text-truncate">
                      <strong>{formData.receipt.merchant}</strong>
                      <div className="text-muted" style={{ fontSize: '11px' }}>
                        Auto-scanned ${formData.receipt.amount} receipt
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-white-50" style={{ fontSize: '11px', marginBottom: '6px' }}>
                      Click a sample receipt to simulate OCR auto-fill:
                    </div>
                    <div className="d-flex gap-1 flex-wrap">
                      {sampleReceipts.map((rec) => (
                        <button
                          key={rec.id}
                          type="button"
                          className="btn btn-xs btn-light text-primary"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                          onClick={() => handleSelectSampleReceipt(rec)}
                        >
                          + {rec.merchant} (${rec.amount})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-light w-100 fw-bold py-2 text-primary shadow-sm">
                Save Transaction
              </button>
            </form>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0">Recent Activity</h5>
              <Link to="/transactions" className="btn btn-sm btn-outline-primary rounded-pill px-3">View All</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-borderless align-middle">
                <tbody>
                  {recentExpenses.length === 0 ? (
                    <tr><td className="text-muted py-4">No recent activity.</td></tr>
                  ) : recentExpenses.map((exp) => (
                    <tr key={exp.id} className="border-bottom">
                      <td className="py-3">
                        <div className="fw-bold text-dark">{exp.title || exp.category}</div>
                        <div className="text-muted small">{new Date(exp.date).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary">{exp.category}</span>
                      </td>
                      <td>
                        {exp.receipt ? (
                          <span className="badge bg-success-subtle text-success" title="Receipt attached">
                            <i className="bi bi-paperclip me-1"></i> Receipt
                          </span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td className="text-end fw-bold text-dark">
                        ${parseFloat(exp.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
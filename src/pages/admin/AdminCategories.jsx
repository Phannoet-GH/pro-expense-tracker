import React, { useState, useContext } from 'react';
import { ExpenseContext, CORE_EXPENSE_CATEGORIES } from '../../context/ExpenseContext';

export default function AdminCategories() {
  const { coreExpenseCategories, formatAmount, expenses } = useContext(ExpenseContext);

  const categories = coreExpenseCategories && coreExpenseCategories.length > 0
    ? coreExpenseCategories
    : (CORE_EXPENSE_CATEGORIES || ['Room', 'Food & Drink', 'Transport', 'Internet', 'Other']);

  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeFormat = typeof formatAmount === 'function' ? formatAmount : (amt) => `$${parseFloat(amt || 0).toFixed(2)}`;

  const [benchmarks, setBenchmarks] = useState({
    'Room': 35,
    'Food & Drink': 25,
    'Transport': 15,
    'Internet': 5,
    'Other': 20
  });

  const [bufferCategory, setBufferCategory] = useState('Other');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Calculate platform aggregate spend per category
  const categoryStats = categories.map(cat => {
    const totalSpent = safeExpenses
      .filter(e => e && e.category === cat)
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    return {
      name: cat,
      benchmarkPct: benchmarks[cat] || 0,
      totalSpent
    };
  });

  const totalAllocatedPct = Object.values(benchmarks).reduce((s, v) => s + (parseInt(v) || 0), 0);

  const handleSlider = (cat, val) => {
    setBenchmarks(prev => ({
      ...prev,
      [cat]: parseInt(val) || 0
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fs-4 fw-bold text-dark mb-1">
            <i className="bi bi-sliders text-primary me-2"></i>Platform Category Benchmarks & Policy
          </h2>
          <p className="text-muted small mb-0">
            Configure system-wide default allocation ratios and dynamic auto-compensation parameters.
          </p>
        </div>

        {saveSuccess && (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
            <i className="bi bi-check-circle me-1"></i>Benchmarks updated successfully!
          </span>
        )}
      </div>

      <div className="row g-4">
        {/* Left Column: Benchmark Sliders */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
            <h5 className="fw-bold mb-3">System Benchmark Percentages</h5>
            <p className="text-muted small mb-4">
              These percentages represent the baseline recommendations provided to clients when using the Auto Expense Calculator.
            </p>

            <form onSubmit={handleSave}>
              <div className="d-flex flex-column gap-3 mb-4">
                {categories.map(cat => (
                  <div key={cat} className="p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <strong className="text-dark">{cat}</strong>
                        {cat === bufferCategory && (
                          <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '10px' }}>
                            Default Buffer
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-white text-dark border font-monospace fs-6 px-3 py-1">
                          {benchmarks[cat] || 0}%
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      className="form-range"
                      min="0"
                      max="60"
                      step="1"
                      value={benchmarks[cat] || 0}
                      onChange={(e) => handleSlider(cat, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Total Ratio Status */}
              <div className={`alert ${totalAllocatedPct === 100 ? 'alert-success' : 'alert-warning'} border-0 rounded-3 small d-flex justify-content-between align-items-center mb-4`}>
                <div>
                  <i className={`bi ${totalAllocatedPct === 100 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                  Total Benchmark Sum: <strong>{totalAllocatedPct}%</strong> (Ideal: 100%)
                </div>
                {totalAllocatedPct !== 100 && (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-dark rounded-pill px-3"
                    onClick={() => setBenchmarks({ 'Room': 35, 'Food & Drink': 25, 'Transport': 15, 'Internet': 5, 'Other': 20 })}
                  >
                    Reset 35/25/15/5/20
                  </button>
                )}
              </div>

              <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
                <i className="bi bi-save me-2"></i>Save System Benchmarks
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Auto-Compensation Rule Config */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
            <h5 className="fw-bold mb-3">Auto-Compensation Policy</h5>
            <p className="text-muted small mb-3">
              Defines how the client-side calculator automatically compensates when discretionary categories expand.
            </p>

            <div className="p-3 bg-light rounded-3 border mb-3">
              <label className="form-label small fw-semibold">Designated Buffer Category</label>
              <select
                className="form-select"
                value={bufferCategory}
                onChange={(e) => setBufferCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="text-muted small mt-2" style={{ fontSize: '11px' }}>
                When users increase <strong>Food & Drink</strong> or other categories, <strong>{bufferCategory}</strong> will dynamically decrease to protect the target savings goal.
              </div>
            </div>

            <div className="p-3 border rounded-3 bg-primary-subtle border-primary-subtle text-primary-emphasis small">
              <div className="fw-bold mb-1"><i className="bi bi-info-circle-fill me-1"></i>Algorithm Summary:</div>
              <p className="font-monospace mb-1 fw-bold">Delta Buffer = - Sum(Delta Adjusted)</p>
              The auto-compensator guarantees that the sum of all allocated category expenses equals the allowed monthly budget cap, ensuring zero accidental deficits.
            </div>
          </div>

          {/* Actual Platform Category Spending */}
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
            <h5 className="fw-bold mb-3">Platform Spend Distribution</h5>
            <div className="d-flex flex-column gap-3">
              {categoryStats.map(stat => (
                <div key={stat.name}>
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="fw-semibold text-dark">{stat.name}</span>
                    <span className="text-muted">{safeFormat(stat.totalSpent)}</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-primary"
                      role="progressbar"
                      style={{ width: `${stat.benchmarkPct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

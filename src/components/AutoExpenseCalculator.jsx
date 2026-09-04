import React, { useContext, useState, useMemo, useEffect } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';

export default function AutoExpenseCalculator({ onApplied, preselectedGoal = null }) {
  const {
    totalIncome,
    expenses,
    savingsGoals,
    formatAmount,
    currency,
    applyAutoBudgets
  } = useContext(ExpenseContext);

  // Default income: total recorded income or fallback to $2,000
  const [incomeInput, setIncomeInput] = useState(() => {
    return totalIncome > 0 ? totalIncome.toString() : '2000';
  });

  // Default saving goal: 20% of income or $400
  const [savingGoalInput, setSavingGoalInput] = useState(() => {
    if (preselectedGoal && preselectedGoal.target_amount) {
      return Math.round(parseFloat(preselectedGoal.target_amount) / 6).toString();
    }
    const inc = totalIncome > 0 ? totalIncome : 2000;
    return Math.round(inc * 0.20).toString();
  });

  // Selected goal dropdown link
  const [selectedGoalId, setSelectedGoalId] = useState(() => preselectedGoal?.id || '');

  // Customizable percentages for Room, Food & Drink, Transport, Internet, Other
  const [ratios, setRatios] = useState({
    'Room': 35,
    'Food & Drink': 25,
    'Transport': 15,
    'Internet': 5,
    'Other': 20
  });

  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Sync if preselectedGoal changes
  useEffect(() => {
    if (preselectedGoal) {
      setSelectedGoalId(preselectedGoal.id);
      const monthlyTarget = Math.round(parseFloat(preselectedGoal.target_amount || 0) / 6);
      if (monthlyTarget > 0) {
        setSavingGoalInput(monthlyTarget.toString());
      }
    }
  }, [preselectedGoal]);

  // Handle choosing an active savings goal
  const handleSelectGoal = (goalId) => {
    setSelectedGoalId(goalId);
    if (!goalId) return;
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal) {
      const target = parseFloat(goal.target_amount) || 1000;
      const current = parseFloat(goal.current_amount) || 0;
      const remaining = Math.max(0, target - current);

      // Estimate monthly contribution needed (if target_date exists, use months left, else 6 months default)
      let months = 6;
      if (goal.target_date) {
        const diffMonths = Math.max(1, Math.round((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
        months = diffMonths;
      }
      const monthlyNeeded = Math.round(remaining / months);
      setSavingGoalInput((monthlyNeeded || 200).toString());
    }
  };

  // Quick percent of income for saving goal
  const handleQuickPercent = (pct) => {
    const inc = parseFloat(incomeInput) || 0;
    setSavingGoalInput(Math.round(inc * (pct / 100)).toString());
    setSelectedGoalId('');
  };

  // Calculations
  const income = Math.max(0, parseFloat(incomeInput) || 0);
  const savingGoal = Math.max(0, parseFloat(savingGoalInput) || 0);
  const allowedTotalExpenses = Math.max(0, income - savingGoal);

  // Actual spending per category from recorded expenses
  const actualSpending = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      const cat = exp.category;
      acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount || 0);
      return acc;
    }, {});
  }, [expenses]);

  // Map category icons & descriptions
  const CATEGORY_META = {
    'Room': { icon: 'bi-house-door', color: '#6366f1', label: 'Room & Rent', desc: 'Apartment rent, room lease, accommodation' },
    'Food & Drink': { icon: 'bi-cup-straw', color: '#10b981', label: 'Food & Drink', desc: 'Groceries, dining, coffee, snacks' },
    'Transport': { icon: 'bi-car-front', color: '#06b6d4', label: 'Transport', desc: 'Gas, fuel, subway, bus, transit pass' },
    'Internet': { icon: 'bi-wifi', color: '#3b82f6', label: 'Internet', desc: 'Home fiber, mobile data, cloud services' },
    'Other': { icon: 'bi-three-dots', color: '#f59e0b', label: 'Other Expenses', desc: 'Personal care, utilities, buffer, miscellaneous' }
  };

  // Compute allocated dollar amount for each category
  const calculatedBudgets = useMemo(() => {
    const res = {};
    Object.entries(ratios).forEach(([cat, pct]) => {
      res[cat] = Math.round(allowedTotalExpenses * (pct / 100) * 100) / 100;
    });
    return res;
  }, [allowedTotalExpenses, ratios]);

  const totalAllocated = useMemo(() => {
    return Object.values(calculatedBudgets).reduce((sum, v) => sum + v, 0);
  }, [calculatedBudgets]);

  const totalRatioPct = useMemo(() => {
    return Object.values(ratios).reduce((sum, v) => sum + v, 0);
  }, [ratios]);

  // Adjust a specific category ratio
  const handleRatioChange = (cat, newPct) => {
    const val = Math.max(0, Math.min(100, parseInt(newPct, 10) || 0));
    setRatios(prev => ({ ...prev, [cat]: val }));
    setAppliedSuccess(false);
  };

  // Reset to default balanced ratios
  const handleResetRatios = () => {
    setRatios({
      'Room': 35,
      'Food & Drink': 25,
      'Transport': 15,
      'Internet': 5,
      'Other': 20
    });
  };

  // Apply to active budgets in state + backend
  const handleApplyBudgets = async () => {
    await applyAutoBudgets(calculatedBudgets);
    setAppliedSuccess(true);
    if (onApplied) onApplied(calculatedBudgets);
    setTimeout(() => setAppliedSuccess(false), 5000);
  };

  return (
    <div className="auto-expense-calculator">
      {/* Header Banner */}
      <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span className="badge bg-white bg-opacity-25 px-3 py-1 rounded-pill small fw-semibold text-uppercase mb-2">
              <i className="bi bi-calculator-fill me-1"></i> Auto Expense Planner
            </span>
            <h3 className="fw-bold mb-1">Auto-Calculate Monthly Expenses from Saving Goal</h3>
            <p className="mb-0 text-white-50 small" style={{ maxWidth: '620px' }}>
              Set how much money you want to save each month. The algorithm automatically determines your safe spending caps across <strong>Room</strong>, <strong>Food & Drink</strong>, <strong>Transport</strong>, <strong>Internet</strong>, and <strong>Other</strong>.
            </p>
          </div>
          <button
            onClick={handleResetRatios}
            className="btn btn-sm btn-outline-light rounded-pill px-3"
            title="Reset to 35/25/15/5/20 distribution"
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Default Ratios
          </button>
        </div>
      </div>

      {/* Input Controls Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="row g-4">
          {/* Monthly Income Input */}
          <div className="col-md-4">
            <label className="form-label small fw-bold text-dark">
              1. Monthly Income ({currency})
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">{currency}</span>
              <input
                type="number"
                min="0"
                step="50"
                className="form-control form-control-lg fw-bold"
                value={incomeInput}
                onChange={(e) => {
                  setIncomeInput(e.target.value);
                  setAppliedSuccess(false);
                }}
                placeholder="2000"
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mt-1">
              <span className="small text-muted" style={{ fontSize: '11px' }}>
                Actual recorded: {formatAmount(totalIncome)}
              </span>
              {totalIncome > 0 && (
                <button
                  type="button"
                  className="btn btn-link p-0 text-primary small text-decoration-none"
                  style={{ fontSize: '11px' }}
                  onClick={() => setIncomeInput(totalIncome.toString())}
                >
                  Use Actual
                </button>
              )}
            </div>
          </div>

          {/* Monthly Saving Goal Input */}
          <div className="col-md-5">
            <label className="form-label small fw-bold text-dark">
              2. Target Monthly Saving Goal ({currency})
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light text-success fw-bold">
                <i className="bi bi-piggy-bank me-1"></i> {currency}
              </span>
              <input
                type="number"
                min="0"
                step="25"
                className="form-control form-control-lg fw-bold text-success"
                value={savingGoalInput}
                onChange={(e) => {
                  setSavingGoalInput(e.target.value);
                  setSelectedGoalId('');
                  setAppliedSuccess(false);
                }}
                placeholder="400"
              />
            </div>

            {/* Quick Percentage Buttons */}
            <div className="d-flex gap-1 mt-2 flex-wrap align-items-center">
              <span className="small text-muted me-1" style={{ fontSize: '11px' }}>Quick Goal:</span>
              {[10, 15, 20, 25, 30].map(pct => (
                <button
                  key={pct}
                  type="button"
                  className="btn btn-xs btn-outline-success rounded-pill px-2 py-0"
                  style={{ fontSize: '11px' }}
                  onClick={() => handleQuickPercent(pct)}
                >
                  {pct}% ({formatAmount(income * (pct / 100))})
                </button>
              ))}
            </div>
          </div>

          {/* Optional: Link to Active Goal */}
          <div className="col-md-3">
            <label className="form-label small fw-bold text-dark">
              Pick From Active Goals
            </label>
            <select
              className="form-select"
              value={selectedGoalId}
              onChange={(e) => handleSelectGoal(e.target.value)}
            >
              <option value="">-- Custom Saving Goal --</option>
              {savingsGoals.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title} (Target: {formatAmount(g.target_amount)})
                </option>
              ))}
            </select>
            <span className="small text-muted d-block mt-1" style={{ fontSize: '11px' }}>
              Auto-calculates monthly pace to hit goal
            </span>
          </div>
        </div>

        {/* Calculated Result Banner */}
        <div className="mt-4 p-3 rounded-4 bg-light border d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <span className="small text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>
              Calculated Monthly Expense Budget (Income - Saving Goal)
            </span>
            <div className="d-flex align-items-baseline gap-2">
              <h2 className="fw-bold text-primary m-0">{formatAmount(allowedTotalExpenses)}</h2>
              <span className="text-muted small">
                ({income > 0 ? Math.round((allowedTotalExpenses / income) * 100) : 0}% of income)
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <span className="small text-muted d-block">Saving Velocity:</span>
              <span className="badge bg-success-subtle text-success fs-6 fw-bold">
                +{formatAmount(savingGoal)} / month ({income > 0 ? Math.round((savingGoal / income) * 100) : 0}%)
              </span>
            </div>
            <button
              className="btn btn-success rounded-pill px-4 fw-bold shadow-sm py-2"
              onClick={handleApplyBudgets}
              disabled={allowedTotalExpenses <= 0}
            >
              <i className="bi bi-check2-circle me-1"></i> Apply as Monthly Budgets
            </button>
          </div>
        </div>

        {appliedSuccess && (
          <div className="alert alert-success border-0 shadow-sm rounded-4 mt-3 mb-0 d-flex align-items-center">
            <i className="bi bi-check-circle-fill fs-5 me-2"></i>
            <div>
              <strong>Budgets successfully synchronized!</strong> Your monthly category allowances for Room, Food & Drink, Transport, Internet, and Other have been saved to your account.
            </div>
          </div>
        )}
      </div>

      {/* Auto-Calculated 5 Categories Breakdown Grid */}
      <h5 className="fw-bold mb-3 text-dark">
        <i className="bi bi-pie-chart-fill text-primary me-2"></i>
        Auto-Calculated Category Spending Allowances
      </h5>

      <div className="row g-3 mb-4">
        {Object.entries(ratios).map(([cat, pct]) => {
          const meta = CATEGORY_META[cat] || { icon: 'bi-tag', color: '#0d6efd', label: cat, desc: '' };
          const calculatedLimit = calculatedBudgets[cat] || 0;
          const currentSpent = actualSpending[cat] || 0;
          const isOver = currentSpent > calculatedLimit && calculatedLimit > 0;
          const diff = calculatedLimit - currentSpent;

          return (
            <div key={cat} className="col-lg-4 col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '38px', height: '38px', backgroundColor: `${meta.color}15`, color: meta.color }}
                    >
                      <i className={`bi ${meta.icon} fs-5`}></i>
                    </div>
                    <div>
                      <h6 className="fw-bold m-0 text-dark">{meta.label}</h6>
                      <small className="text-muted" style={{ fontSize: '11px' }}>{pct}% of expense budget</small>
                    </div>
                  </div>
                  <span className={`badge rounded-pill ${isOver ? 'bg-danger text-white' : 'bg-success-subtle text-success'}`}>
                    {isOver ? 'Over Limit' : 'On Track'}
                  </span>
                </div>

                <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>{meta.desc}</p>

                {/* Amount & Comparison */}
                <div className="d-flex justify-content-between align-items-baseline mb-2">
                  <div>
                    <span className="text-muted small d-block" style={{ fontSize: '11px' }}>Max Monthly Cap:</span>
                    <strong className="fs-4 text-dark">{formatAmount(calculatedLimit)}</strong>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small d-block" style={{ fontSize: '11px' }}>Current Spent:</span>
                    <span className={`fw-bold ${isOver ? 'text-danger' : 'text-muted'}`}>
                      {formatAmount(currentSpent)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress mb-2" style={{ height: '6px' }}>
                  <div
                    className={`progress-bar ${isOver ? 'bg-danger' : 'bg-success'}`}
                    style={{ width: `${calculatedLimit > 0 ? Math.min(100, Math.round((currentSpent / calculatedLimit) * 100)) : 0}%` }}
                  ></div>
                </div>

                <div className="d-flex justify-content-between small text-muted mb-3" style={{ fontSize: '11px' }}>
                  <span>{calculatedLimit > 0 ? Math.round((currentSpent / calculatedLimit) * 100) : 0}% consumed</span>
                  <span>{diff >= 0 ? `${formatAmount(diff)} buffer left` : `Exceeded by ${formatAmount(Math.abs(diff))}`}</span>
                </div>

                {/* Ratio Slider */}
                <div className="mt-auto pt-2 border-top">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small text-muted mb-0" style={{ fontSize: '11px' }}>Adjust Ratio:</label>
                    <span className="badge bg-light text-dark border">{pct}%</span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="1"
                    max="60"
                    step="1"
                    value={pct}
                    onChange={(e) => handleRatioChange(cat, e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ratios Validation Alert */}
      {totalRatioPct !== 100 && (
        <div className="alert alert-warning border-0 shadow-sm rounded-4 mb-3 small d-flex justify-content-between align-items-center">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Current category weights total <strong>{totalRatioPct}%</strong> (Ideal: 100%). Total allocated: {formatAmount(totalAllocated)} of {formatAmount(allowedTotalExpenses)}.
          </div>
          <button onClick={handleResetRatios} className="btn btn-xs btn-outline-dark rounded-pill px-3">
            Reset to 100%
          </button>
        </div>
      )}
    </div>
  );
}

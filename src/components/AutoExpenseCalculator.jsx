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

  // Start with clean empty inputs — no forced default values to delete
  const [incomeInput, setIncomeInput] = useState('');

  const [savingGoalInput, setSavingGoalInput] = useState(() => {
    if (preselectedGoal && preselectedGoal.target_amount) {
      return Math.round(parseFloat(preselectedGoal.target_amount) / 6).toString();
    }
    return '';
  });

  // Selected goal dropdown link
  const [selectedGoalId, setSelectedGoalId] = useState(() => preselectedGoal?.id || '');

  // Category percentages for Room, Food & Drink, Transport, Internet, Other
  const [ratios, setRatios] = useState({
    'Room': 35,
    'Food & Drink': 25,
    'Transport': 15,
    'Internet': 5,
    'Other': 20
  });

  // Dynamic Auto-Compensate Mode (When enabled, increasing one category automatically decreases 'Other')
  const [autoCompensate, setAutoCompensate] = useState(true);
  const [bufferCategory, setBufferCategory] = useState('Other');
  const [lockedCategories, setLockedCategories] = useState({
    'Room': false,
    'Food & Drink': false,
    'Transport': false,
    'Internet': false,
    'Other': false
  });

  // Active preset template identifier
  const [activePreset, setActivePreset] = useState('default');
  const [adjustmentNote, setAdjustmentNote] = useState('');
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

  // Category Metadata
  const CATEGORY_META = {
    'Room': { icon: 'bi-house-door', color: '#6366f1', label: 'Room & Rent', desc: 'Rent, lease, housing accommodation' },
    'Food & Drink': { icon: 'bi-cup-straw', color: '#10b981', label: 'Food & Drink', desc: 'Groceries, restaurants, drinks & dining' },
    'Transport': { icon: 'bi-car-front', color: '#06b6d4', label: 'Transport', desc: 'Fuel, transit pass, Uber, ride sharing' },
    'Internet': { icon: 'bi-wifi', color: '#3b82f6', label: 'Internet', desc: 'Home fiber, mobile data & online bills' },
    'Other': { icon: 'bi-three-dots', color: '#f59e0b', label: 'Other Expenses', desc: 'Buffer, shopping, personal care & flex' }
  };

  // Preset Allocation Profiles
  const PRESETS = [
    {
      id: 'default',
      name: 'Default Balanced',
      badge: '35 / 25 / 15 / 5 / 20',
      icon: 'bi-sliders',
      ratios: { 'Room': 35, 'Food & Drink': 25, 'Transport': 15, 'Internet': 5, 'Other': 20 },
      description: 'Standard balanced allocation for everyday life'
    },
    {
      id: 'food-boost',
      name: 'Food & Drink Boost (+10%)',
      badge: 'Food ↑ 35% | Other ↓ 10%',
      icon: 'bi-cup-straw',
      ratios: { 'Room': 35, 'Food & Drink': 35, 'Transport': 15, 'Internet': 5, 'Other': 10 },
      description: 'Increases Food & Drink to 35% while decreasing Other to 10% to protect savings'
    },
    {
      id: 'transit-boost',
      name: 'Travel / Commute Month (+10%)',
      badge: 'Transport ↑ 25% | Other ↓ 10%',
      icon: 'bi-car-front',
      ratios: { 'Room': 35, 'Food & Drink': 25, 'Transport': 25, 'Internet': 5, 'Other': 10 },
      description: 'Increases Transport to 25% while decreasing Other to 10%'
    },
    {
      id: 'frugal',
      name: 'Super Saver / Frugal',
      badge: 'Food 20% | Trans 10% | Other 10%',
      icon: 'bi-shield-check',
      ratios: { 'Room': 35, 'Food & Drink': 20, 'Transport': 10, 'Internet': 5, 'Other': 30 },
      description: 'Trims dining and transport, maximizing Other buffer and savings surplus'
    }
  ];

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

  // SMART AUTO-REBALANCE: Adjust a category ratio and auto-compensate with bufferCategory ('Other')
  const handleRatioChange = (cat, newPct) => {
    const targetVal = Math.max(0, Math.min(100, parseInt(newPct, 10) || 0));
    const oldVal = ratios[cat] || 0;
    const delta = targetVal - oldVal;

    if (delta === 0) return;

    if (autoCompensate) {
      // If user adjusts the buffer category itself ('Other'), change it directly
      if (cat === bufferCategory) {
        setRatios(prev => ({ ...prev, [cat]: targetVal }));
        setActivePreset('custom');
        return;
      }

      // Check if buffer category ('Other') can absorb the full delta
      const currentBuffer = ratios[bufferCategory] || 0;
      const targetBuffer = currentBuffer - delta;

      if (targetBuffer >= 0) {
        // Perfect auto-compensation with 'Other'
        setRatios(prev => ({
          ...prev,
          [cat]: targetVal,
          [bufferCategory]: targetBuffer
        }));

        setAdjustmentNote(
          delta > 0
            ? `${cat} increased by +${delta}% ➔ ${bufferCategory} automatically decreased by -${delta}% (${targetBuffer}%) to protect your ${formatAmount(savingGoal)} saving goal!`
            : `${cat} decreased by ${delta}% ➔ ${bufferCategory} increased by +${Math.abs(delta)}% (${targetBuffer}%)!`
        );
      } else {
        // 'Other' hits 0%, distribute remainder across remaining unlocked categories
        let remainingDelta = delta - currentBuffer;
        const updated = { ...ratios, [cat]: targetVal, [bufferCategory]: 0 };

        const availableUnlocked = Object.keys(ratios).filter(
          c => c !== cat && c !== bufferCategory && !lockedCategories[c]
        );

        for (const oc of availableUnlocked) {
          if (remainingDelta <= 0) break;
          const avail = updated[oc];
          const deduction = Math.min(avail, remainingDelta);
          updated[oc] -= deduction;
          remainingDelta -= deduction;
        }

        setRatios(updated);
        setAdjustmentNote(
          `${cat} increased by +${delta}% ➔ ${bufferCategory} decreased to 0%, remaining adjusted across unlocked categories to keep budget at 100%.`
        );
      }
    } else {
      // Manual mode without auto-compensation
      setRatios(prev => ({ ...prev, [cat]: targetVal }));
      setAdjustmentNote(`${cat} set to ${targetVal}%. Total is now ${totalRatioPct + delta}%.`);
    }

    setActivePreset('custom');
    setAppliedSuccess(false);
  };

  // Direct dollar input handler (allows user to type "$450" directly)
  const handleDollarChange = (cat, newDollarStr) => {
    const val = parseFloat(newDollarStr);
    if (isNaN(val) || allowedTotalExpenses <= 0) return;
    const derivedPct = Math.round((val / allowedTotalExpenses) * 100);
    handleRatioChange(cat, derivedPct);
  };

  // Toggle lock state for a category (e.g. rent is fixed)
  const toggleLock = (cat) => {
    setLockedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Apply a preset allocation profile
  const handleApplyPreset = (preset) => {
    setRatios({ ...preset.ratios });
    setActivePreset(preset.id);
    setAdjustmentNote(`Switched to "${preset.name}". ${preset.description}.`);
    setAppliedSuccess(false);
  };

  // Reset to default balanced ratios (35 / 25 / 15 / 5 / 20)
  const handleResetToDefault = () => {
    setRatios({
      'Room': 35,
      'Food & Drink': 25,
      'Transport': 15,
      'Internet': 5,
      'Other': 20
    });
    setActivePreset('default');
    setAdjustmentNote('Reset to Default Ratios (Room: 35%, Food & Drink: 25%, Transport: 15%, Internet: 5%, Other: 20%).');
    setAppliedSuccess(false);
  };

  // Auto-Normalize all categories to sum exactly to 100%
  const handleAutoNormalize = () => {
    if (totalRatioPct === 0) return handleResetToDefault();
    const normalized = {};
    let runningSum = 0;
    const keys = Object.keys(ratios);

    keys.forEach((cat, idx) => {
      if (idx === keys.length - 1) {
        normalized[cat] = Math.max(0, 100 - runningSum);
      } else {
        const share = Math.round((ratios[cat] / totalRatioPct) * 100);
        normalized[cat] = share;
        runningSum += share;
      }
    });

    setRatios(normalized);
    setAdjustmentNote('Normalized all category percentages to total exactly 100%.');
  };

  // Apply calculated limits into active budgets in state + MySQL
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
              <i className="bi bi-calculator-fill me-1"></i> Auto Expense & Rebalance Planner
            </span>
            <h3 className="fw-bold mb-1">Auto-Calculate Monthly Expenses from Saving Goal</h3>
            <p className="mb-0 text-white-50 small" style={{ maxWidth: '640px' }}>
              Set your target monthly savings. When expenses change (e.g. <strong>Food & Drink increases</strong>), other categories like <strong>Other automatically decrease</strong> so your saving goal is always achieved!
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button
              onClick={handleResetToDefault}
              className="btn btn-sm btn-outline-light rounded-pill px-3 fw-semibold"
              title="Restore 35/25/15/5/20 default distribution"
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Default % Ratios
            </button>
          </div>
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
                step="any"
                className="form-control form-control-lg fw-bold"
                value={incomeInput}
                onChange={(e) => {
                  setIncomeInput(e.target.value);
                  setAppliedSuccess(false);
                }}
                placeholder="Enter monthly income"
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mt-1">
              <span className="small text-muted" style={{ fontSize: '11px' }}>
                {totalIncome > 0 ? `Recorded: ${formatAmount(totalIncome)}` : 'No income recorded'}
              </span>
              {totalIncome > 0 && (
                <button
                  type="button"
                  className="btn btn-link p-0 text-primary small text-decoration-none fw-semibold"
                  style={{ fontSize: '11px' }}
                  onClick={() => setIncomeInput(totalIncome.toString())}
                >
                  Use Actual ({formatAmount(totalIncome)})
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
                step="any"
                className="form-control form-control-lg fw-bold text-success"
                value={savingGoalInput}
                onChange={(e) => {
                  setSavingGoalInput(e.target.value);
                  setSelectedGoalId('');
                  setAppliedSuccess(false);
                }}
                placeholder="Enter saving goal"
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
                  disabled={income <= 0}
                  title={income <= 0 ? 'Enter monthly income first' : `Set saving goal to ${pct}% of income`}
                >
                  {pct}% {income > 0 ? `(${formatAmount(income * (pct / 100))})` : ''}
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
              <h2 className="fw-bold text-primary m-0">
                {allowedTotalExpenses > 0 ? formatAmount(allowedTotalExpenses) : `${currency}0.00`}
              </h2>
              {income > 0 && (
                <span className="text-muted small">
                  ({Math.round((allowedTotalExpenses / income) * 100)}% of income)
                </span>
              )}
            </div>
            {!incomeInput && (
              <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                <i className="bi bi-info-circle me-1 text-primary"></i>
                Enter your monthly income above to calculate category allowances.
              </small>
            )}
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <span className="small text-muted d-block">Monthly Savings Protected:</span>
              <span className="badge bg-success-subtle text-success fs-6 fw-bold">
                +{formatAmount(savingGoal)} / month {income > 0 ? `(${Math.round((savingGoal / income) * 100)}%)` : ''}
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

      {/* Preset Profiles & Dynamic Auto-Compensate Controls */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h5 className="fw-bold m-0 text-dark">
              <i className="bi bi-shuffle text-primary me-2"></i>
              Preset Allocation Profiles
            </h5>
            <p className="text-muted small m-0">One-click templates to shift budget weight between categories</p>
          </div>

          {/* Auto-Compensate Toggle */}
          <div className="form-check form-switch bg-light p-2 px-3 rounded-pill border d-inline-flex align-items-center gap-2 m-0">
            <input
              className="form-check-input ms-0 me-2"
              type="checkbox"
              role="switch"
              id="autoCompensateSwitch"
              checked={autoCompensate}
              onChange={(e) => setAutoCompensate(e.target.checked)}
            />
            <label className="form-check-label small fw-semibold text-dark cursor-pointer mb-0" htmlFor="autoCompensateSwitch">
              <i className="bi bi-arrow-left-right text-success me-1"></i>
              Auto-Compensate with '{bufferCategory}' (Keeps 100%)
            </label>
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="row g-2 mb-3">
          {PRESETS.map((preset) => {
            const isCurrent = activePreset === preset.id;
            return (
              <div key={preset.id} className="col-md-3 col-sm-6">
                <div
                  className={`p-3 rounded-3 border h-100 cursor-pointer transition-all ${isCurrent ? 'bg-primary-subtle border-primary text-primary' : 'bg-light text-dark'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleApplyPreset(preset)}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold small">
                      <i className={`bi ${preset.icon} me-1`}></i>
                      {preset.name}
                    </span>
                    {isCurrent && <i className="bi bi-check-circle-fill text-primary"></i>}
                  </div>
                  <div className="small font-monospace text-muted mb-1" style={{ fontSize: '11px' }}>
                    {preset.badge}
                  </div>
                  <div className="small text-muted" style={{ fontSize: '11px' }}>
                    {preset.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Adjustment Live Feedback Pill */}
        {adjustmentNote && (
          <div className="p-2 px-3 bg-info-subtle text-dark rounded-3 border border-info-subtle small d-flex align-items-center justify-content-between">
            <div>
              <i className="bi bi-info-circle-fill text-info me-2"></i>
              <strong>Dynamic Shift:</strong> {adjustmentNote}
            </div>
            <button
              className="btn btn-link p-0 text-muted small text-decoration-none"
              onClick={() => setAdjustmentNote('')}
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Auto-Calculated 5 Categories Breakdown Grid */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 className="fw-bold m-0 text-dark">
          <i className="bi bi-pie-chart-fill text-primary me-2"></i>
          Category Spending Allowances & Sliders
        </h5>
        <div className="d-flex gap-2 align-items-center">
          <span className={`badge rounded-pill px-3 py-2 ${totalRatioPct === 100 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'}`}>
            Total Weight: {totalRatioPct}% / 100%
          </span>
          {totalRatioPct !== 100 && (
            <button onClick={handleAutoNormalize} className="btn btn-xs btn-outline-primary rounded-pill px-3" style={{ fontSize: '11px' }}>
              Auto-Normalize to 100%
            </button>
          )}
          <button onClick={handleResetToDefault} className="btn btn-xs btn-outline-secondary rounded-pill px-3" style={{ fontSize: '11px' }}>
            Reset Default %
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {Object.entries(ratios).map(([cat, pct]) => {
          const meta = CATEGORY_META[cat] || { icon: 'bi-tag', color: '#0d6efd', label: cat, desc: '' };
          const calculatedLimit = calculatedBudgets[cat] || 0;
          const currentSpent = actualSpending[cat] || 0;
          const isOver = currentSpent > calculatedLimit && calculatedLimit > 0;
          const diff = calculatedLimit - currentSpent;
          const isLocked = lockedCategories[cat];
          const isBuffer = cat === bufferCategory;

          return (
            <div key={cat} className="col-lg-4 col-md-6">
              <div className={`card border shadow-sm rounded-4 p-3 bg-white h-100 ${isBuffer ? 'border-warning' : ''}`}>
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
                      <div className="d-flex align-items-center gap-1">
                        <h6 className="fw-bold m-0 text-dark">{meta.label}</h6>
                        {isBuffer && (
                          <span className="badge bg-warning text-dark" style={{ fontSize: '9px' }}>
                            Flex Buffer
                          </span>
                        )}
                      </div>
                      <small className="text-muted" style={{ fontSize: '11px' }}>{pct}% of expense budget</small>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-1">
                    {/* Lock Button */}
                    <button
                      type="button"
                      className={`btn btn-xs rounded-circle p-1 ${isLocked ? 'btn-danger' : 'btn-light text-muted'}`}
                      style={{ width: '26px', height: '26px' }}
                      onClick={() => toggleLock(cat)}
                      title={isLocked ? 'Locked (will not change when other categories rebalance)' : 'Click to lock this category'}
                    >
                      <i className={`bi ${isLocked ? 'bi-lock-fill' : 'bi-unlock'}`} style={{ fontSize: '11px' }}></i>
                    </button>

                    <span className={`badge rounded-pill ${isOver ? 'bg-danger text-white' : 'bg-success-subtle text-success'}`}>
                      {isOver ? 'Over Limit' : 'On Track'}
                    </span>
                  </div>
                </div>

                <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>{meta.desc}</p>

                {/* Amount & Comparison with Direct Dollar Input */}
                <div className="p-2 bg-light rounded-3 border mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted small" style={{ fontSize: '11px' }}>Max Allowed Budget:</span>
                    <div className="input-group input-group-sm" style={{ width: '130px' }}>
                      <span className="input-group-text bg-white px-2">{currency}</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="form-control form-control-sm text-end fw-bold"
                        value={calculatedLimit || ''}
                        onChange={(e) => handleDollarChange(cat, e.target.value)}
                        disabled={isLocked}
                        title="Type a dollar amount to auto-recalculate percentage"
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center small text-muted" style={{ fontSize: '11px' }}>
                    <span>Actual Spent:</span>
                    <strong className={isOver ? 'text-danger' : 'text-dark'}>
                      {formatAmount(currentSpent)}
                    </strong>
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
                  <span>{diff >= 0 ? `${formatAmount(diff)} left` : `+${formatAmount(Math.abs(diff))} over`}</span>
                </div>

                {/* Ratio Slider */}
                <div className="mt-auto pt-2 border-top">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small text-muted mb-0" style={{ fontSize: '11px' }}>
                      {cat} Share:
                    </label>
                    <div className="d-flex align-items-center gap-1">
                      {/* Step down */}
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary rounded-circle"
                        style={{ width: '20px', height: '20px', padding: 0, fontSize: '10px' }}
                        onClick={() => handleRatioChange(cat, pct - 5)}
                        disabled={pct <= 0 || isLocked}
                      >
                        -
                      </button>
                      <span className="badge bg-light text-dark border font-monospace px-2">{pct}%</span>
                      {/* Step up */}
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary rounded-circle"
                        style={{ width: '20px', height: '20px', padding: 0, fontSize: '10px' }}
                        onClick={() => handleRatioChange(cat, pct + 5)}
                        disabled={pct >= 100 || isLocked}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="70"
                    step="1"
                    value={pct}
                    disabled={isLocked}
                    onChange={(e) => handleRatioChange(cat, e.target.value)}
                  />

                  {autoCompensate && cat !== bufferCategory && (
                    <div className="text-muted text-center" style={{ fontSize: '10px' }}>
                      <i className="bi bi-arrow-left-right me-1 text-success"></i>
                      Shifting this automatically adjusts <strong>{bufferCategory}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ratios Validation Alert */}
      {totalRatioPct !== 100 && (
        <div className="alert alert-warning border-0 shadow-sm rounded-4 mb-3 small d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Current category weights total <strong>{totalRatioPct}%</strong> (Target: 100%). Total allocated: {formatAmount(totalAllocated)} of {formatAmount(allowedTotalExpenses)}.
          </div>
          <div className="d-flex gap-2">
            <button onClick={handleAutoNormalize} className="btn btn-xs btn-primary rounded-pill px-3">
              Auto-Normalize to 100%
            </button>
            <button onClick={handleResetToDefault} className="btn btn-xs btn-outline-dark rounded-pill px-3">
              Reset Default %
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

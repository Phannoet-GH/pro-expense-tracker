import React, { useContext, useState, useMemo, useEffect } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import AutoExpenseCalculator from '../components/AutoExpenseCalculator';

export default function SavingsHub() {
  const [preselectedGoalForCalc, setPreselectedGoalForCalc] = useState(null);
  const {
    expenses,
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    depositToGoal,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    formatAmount,
    currency,
    savingsCategories
  } = useContext(ExpenseContext);

  // Tab navigation
  const [activeTab, setActiveTab] = useState('503020'); // '503020' | 'goals' | 'emergency' | 'compound' | 'challenge' | 'tips'

  // Goal modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalForm, setGoalForm] = useState({
    title: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    category: 'General Savings',
    color: '#0d6efd',
    notes: ''
  });

  // Quick Deposit modal state
  const [depositGoal, setDepositGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');

  // 52-Week Challenge saved weeks
  const [checkedWeeks, setCheckedWeeks] = useState(() => {
    try {
      const saved = localStorage.getItem('savings_52_weeks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('savings_52_weeks', JSON.stringify(checkedWeeks));
  }, [checkedWeeks]);

  const toggleWeek = (weekNum) => {
    setCheckedWeeks(prev =>
      prev.includes(weekNum) ? prev.filter(w => w !== weekNum) : [...prev, weekNum]
    );
  };

  const challengeTotalSaved = useMemo(() => {
    return checkedWeeks.reduce((sum, w) => sum + w, 0);
  }, [checkedWeeks]);

  // Compound Interest Simulator inputs
  const [compoundInputs, setCompoundInputs] = useState({
    initial: 1000,
    monthly: 300,
    rate: 8,
    years: 10
  });

  const compoundResults = useMemo(() => {
    const p = parseFloat(compoundInputs.initial) || 0;
    const pmt = parseFloat(compoundInputs.monthly) || 0;
    const r = (parseFloat(compoundInputs.rate) || 0) / 100 / 12;
    const t = (parseFloat(compoundInputs.years) || 1) * 12;

    let fv = 0;
    if (r === 0) {
      fv = p + pmt * t;
    } else {
      fv = p * Math.pow(1 + r, t) + pmt * ((Math.pow(1 + r, t) - 1) / r);
    }

    const totalDeposited = p + pmt * t;
    const interestEarned = Math.max(0, fv - totalDeposited);

    return {
      futureValue: fv,
      totalDeposited,
      interestEarned,
      multiplier: totalDeposited > 0 ? (fv / totalDeposited).toFixed(1) : '1.0'
    };
  }, [compoundInputs]);

  // 50/30/20 Rule Analysis
  const rule503020 = useMemo(() => {
    // Categorize expenses into Needs vs Wants
    const needsCategories = ['Housing & Rent', 'Utilities', 'Food & Dining', 'Transport', 'Healthcare', 'Education'];

    let actualNeeds = 0;
    let actualWants = 0;

    expenses.forEach(exp => {
      const amt = parseFloat(exp.amount || 0);
      if (needsCategories.includes(exp.category)) {
        actualNeeds += amt;
      } else {
        actualWants += amt;
      }
    });

    const actualSavings = Math.max(0, netSavings);

    const baseIncome = totalIncome > 0 ? totalIncome : (totalExpense > 0 ? totalExpense * 1.25 : 3000);
    const targetNeeds = baseIncome * 0.50;
    const targetWants = baseIncome * 0.30;
    const targetSavings = baseIncome * 0.20;

    const pctNeeds = totalIncome > 0 ? Math.round((actualNeeds / totalIncome) * 100) : 0;
    const pctWants = totalIncome > 0 ? Math.round((actualWants / totalIncome) * 100) : 0;
    const pctSavings = totalIncome > 0 ? Math.round((actualSavings / totalIncome) * 100) : 0;

    return {
      baseIncome,
      actualNeeds,
      actualWants,
      actualSavings,
      targetNeeds,
      targetWants,
      targetSavings,
      pctNeeds,
      pctWants,
      pctSavings
    };
  }, [expenses, totalIncome, netSavings, totalExpense]);

  // Emergency Fund Stress Test
  const emergencyFund = useMemo(() => {
    const monthlyBurn = totalExpense > 0 ? totalExpense : 1500;
    const target3Months = monthlyBurn * 3;
    const target6Months = monthlyBurn * 6;
    const target12Months = monthlyBurn * 12;

    // Find saved emergency money in goals
    const emergencyGoals = savingsGoals.filter(g =>
      (g.category || '').toLowerCase().includes('emergency') ||
      (g.title || '').toLowerCase().includes('emergency')
    );
    const emergencySavedInGoals = emergencyGoals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
    const currentEmergencyAvailable = emergencySavedInGoals > 0 ? emergencySavedInGoals : Math.max(0, netSavings);

    const runwayMonths = monthlyBurn > 0 ? (currentEmergencyAvailable / monthlyBurn) : 0;

    let status = 'Critical';
    let statusClass = 'bg-danger';
    if (runwayMonths >= 6) {
      status = 'Bulletproof (6+ Months)';
      statusClass = 'bg-success';
    } else if (runwayMonths >= 3) {
      status = 'Healthy (3-5 Months)';
      statusClass = 'bg-primary';
    } else if (runwayMonths >= 1) {
      status = 'Fragile (1-2 Months)';
      statusClass = 'bg-warning text-dark';
    }

    return {
      monthlyBurn,
      target3Months,
      target6Months,
      target12Months,
      currentEmergencyAvailable,
      runwayMonths: runwayMonths.toFixed(1),
      status,
      statusClass
    };
  }, [totalExpense, savingsGoals, netSavings]);

  // Save / Update Goal Handler
  const handleSaveGoal = (e) => {
    e.preventDefault();
    if (!goalForm.title || !goalForm.target_amount) return;

    if (editingGoalId) {
      updateSavingsGoal({
        ...goalForm,
        id: editingGoalId,
        target_amount: parseFloat(goalForm.target_amount),
        current_amount: parseFloat(goalForm.current_amount || 0)
      });
    } else {
      addSavingsGoal({
        ...goalForm,
        target_amount: parseFloat(goalForm.target_amount),
        current_amount: parseFloat(goalForm.current_amount || 0)
      });
    }

    setShowGoalModal(false);
    setEditingGoalId(null);
    setGoalForm({
      title: '',
      target_amount: '',
      current_amount: '',
      target_date: '',
      category: 'General Savings',
      color: '#0d6efd',
      notes: ''
    });
  };

  const handleOpenEditGoal = (g) => {
    setEditingGoalId(g.id);
    setGoalForm({
      title: g.title,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      target_date: g.target_date || '',
      category: g.category || 'General Savings',
      color: g.color || '#0d6efd',
      notes: g.notes || ''
    });
    setShowGoalModal(true);
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!depositGoal || !depositAmount || parseFloat(depositAmount) <= 0) return;
    depositToGoal(depositGoal.id, parseFloat(depositAmount));
    setDepositGoal(null);
    setDepositAmount('');
  };

  return (
    <div className="savings-hub pb-5">
      {/* Hero Banner */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="badge bg-white bg-opacity-25 px-3 py-2 rounded-pill mb-2 text-uppercase fw-semibold" style={{ letterSpacing: '1px', fontSize: '11px' }}>
              <i className="bi bi-piggy-bank-fill me-1"></i> Wealth & Savings Accelerator
            </div>
            <h2 className="fw-bold mb-1">How to Save Money & Build Financial Freedom</h2>
            <p className="mb-0 text-white-50" style={{ maxWidth: '650px' }}>
              Transform spare cash into lasting wealth using the 50/30/20 rule, automated goal milestones, emergency runway planning, and compound interest growth.
            </p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-light rounded-pill px-4 fw-bold text-primary shadow-sm"
              onClick={() => {
                setEditingGoalId(null);
                setGoalForm({
                  title: '',
                  target_amount: '',
                  current_amount: '',
                  target_date: '',
                  category: 'General Savings',
                  color: '#0d6efd',
                  notes: ''
                });
                setShowGoalModal(true);
              }}
            >
              <i className="bi bi-plus-circle-fill me-2"></i>Create Savings Goal
            </button>
          </div>
        </div>

        {/* Quick Snapshot KPIs inside banner */}
        <div className="row g-3 mt-3 pt-3 border-top border-white border-opacity-10">
          <div className="col-6 col-md-3">
            <div className="small text-white-50">Current Net Savings</div>
            <div className="fs-4 fw-bold">{formatAmount(netSavings)}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-white-50">Savings Rate</div>
            <div className="fs-4 fw-bold">{savingsRate.toFixed(1)}%</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-white-50">Active Goals</div>
            <div className="fs-4 fw-bold">{savingsGoals.length}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-white-50">Emergency Runway</div>
            <div className="fs-4 fw-bold">{emergencyFund.runwayMonths} mos</div>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="d-flex gap-2 overflow-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
        <button
          className={`btn rounded-pill px-4 fw-semibold text-nowrap ${activeTab === '503020' ? 'btn-primary shadow-sm' : 'btn-white bg-white border text-secondary'}`}
          onClick={() => setActiveTab('503020')}
        >
          <i className="bi bi-pie-chart-fill me-2"></i>The 50/30/20 Rule
        </button>
        <button
          className={`btn rounded-pill px-4 fw-semibold text-nowrap ${activeTab === 'goals' ? 'btn-primary shadow-sm' : 'btn-white bg-white border text-secondary'}`}
          onClick={() => setActiveTab('goals')}
        >
          <i className="bi bi-bullseye me-2"></i>Savings Goals ({savingsGoals.length})
        </button>
        <button
          className={`btn rounded-pill px-4 fw-semibold text-nowrap ${activeTab === 'auto-planner' ? 'btn-primary shadow-sm' : 'btn-white bg-white border text-secondary'}`}
          onClick={() => {
            setPreselectedGoalForCalc(null);
            setActiveTab('auto-planner');
          }}
        >
          <i className="bi bi-calculator-fill me-2 text-warning"></i>Auto Expense Planner
        </button>
        <button
          className={`btn rounded-pill px-4 fw-semibold text-nowrap ${activeTab === 'emergency' ? 'btn-primary shadow-sm' : 'btn-white bg-white border text-secondary'}`}
          onClick={() => setActiveTab('emergency')}
        >
          <i className="bi bi-shield-check me-2"></i>Emergency Fund Calculator
        </button>
        <button
          className={`btn rounded-pill px-4 fw-semibold text-nowrap ${activeTab === 'compound' ? 'btn-primary shadow-sm' : 'btn-white bg-white border text-secondary'}`}
          onClick={() => setActiveTab('compound')}
        >
          <i className="bi bi-graph-up-arrow me-2"></i>Compound Interest Simulator
        </button>
        <button
          className={`btn rounded-pill px-4 fw-semibold text-nowrap ${activeTab === 'challenge' ? 'btn-primary shadow-sm' : 'btn-white bg-white border text-secondary'}`}
          onClick={() => setActiveTab('challenge')}
        >
          <i className="bi bi-trophy-fill me-2"></i>52-Week Challenge
        </button>
        <button
          className={`btn rounded-pill px-4 fw-semibold text-nowrap ${activeTab === 'tips' ? 'btn-primary shadow-sm' : 'btn-white bg-white border text-secondary'}`}
          onClick={() => setActiveTab('tips')}
        >
          <i className="bi bi-lightbulb-fill me-2"></i>Top 10 Saving Rules
        </button>
      </div>

      {/* TAB 1: 50/30/20 RULE */}
      {activeTab === '503020' && (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="fw-bold m-0">50/30/20 Budgeting Strategy</h4>
                  <p className="text-muted small m-0">
                    The world-recognized gold standard for money allocation based on your income of {formatAmount(rule503020.baseIncome)}
                  </p>
                </div>
                <span className="badge bg-info-subtle text-info px-3 py-2 rounded-pill">
                  <i className="bi bi-info-circle me-1"></i> Harvard Formula
                </span>
              </div>

              {/* Allocation comparison cards */}
              <div className="row g-3 mb-4">
                {/* 50% Needs */}
                <div className="col-md-4">
                  <div className="p-3 rounded-4 border bg-light h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-primary text-white rounded-pill px-2 py-1">50% Target</span>
                      <small className="fw-semibold text-muted">Essentials</small>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Needs</h5>
                    <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>Rent, utilities, groceries, transport, healthcare</p>
                    <div className="fs-5 fw-bold text-primary mb-1">{formatAmount(rule503020.actualNeeds)}</div>
                    <div className="small text-muted mb-2">Budget Target: {formatAmount(rule503020.targetNeeds)}</div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className={`progress-bar ${rule503020.pctNeeds > 55 ? 'bg-danger' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, (rule503020.actualNeeds / (rule503020.targetNeeds || 1)) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between small mt-1 text-muted" style={{ fontSize: '11px' }}>
                      <span>{rule503020.pctNeeds}% of Income</span>
                      <span>{rule503020.pctNeeds <= 50 ? '✅ Within 50%' : '⚠️ Exceeded'}</span>
                    </div>
                  </div>
                </div>

                {/* 30% Wants */}
                <div className="col-md-4">
                  <div className="p-3 rounded-4 border bg-light h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-warning text-dark rounded-pill px-2 py-1">30% Target</span>
                      <small className="fw-semibold text-muted">Lifestyle</small>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Wants</h5>
                    <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>Dining out, shopping, hobbies, entertainment</p>
                    <div className="fs-5 fw-bold text-warning mb-1">{formatAmount(rule503020.actualWants)}</div>
                    <div className="small text-muted mb-2">Budget Target: {formatAmount(rule503020.targetWants)}</div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className={`progress-bar ${rule503020.pctWants > 35 ? 'bg-danger' : 'bg-warning'}`}
                        style={{ width: `${Math.min(100, (rule503020.actualWants / (rule503020.targetWants || 1)) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between small mt-1 text-muted" style={{ fontSize: '11px' }}>
                      <span>{rule503020.pctWants}% of Income</span>
                      <span>{rule503020.pctWants <= 30 ? '✅ Within 30%' : '⚠️ High Wants'}</span>
                    </div>
                  </div>
                </div>

                {/* 20% Savings */}
                <div className="col-md-4">
                  <div className="p-3 rounded-4 border bg-light h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-success text-white rounded-pill px-2 py-1">20% Target</span>
                      <small className="fw-semibold text-muted">Wealth</small>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Savings</h5>
                    <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>Emergency fund, investments, debts, savings</p>
                    <div className="fs-5 fw-bold text-success mb-1">{formatAmount(rule503020.actualSavings)}</div>
                    <div className="small text-muted mb-2">Target: {formatAmount(rule503020.targetSavings)}</div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${Math.min(100, (rule503020.actualSavings / (rule503020.targetSavings || 1)) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between small mt-1 text-muted" style={{ fontSize: '11px' }}>
                      <span>{rule503020.pctSavings}% Saved</span>
                      <span>{rule503020.pctSavings >= 20 ? '🎉 Goal Met!' : '📈 Boost Needed'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Action Plan */}
              <div className="p-3 rounded-3 bg-primary bg-opacity-10 border border-primary-subtle">
                <h6 className="fw-bold text-primary mb-2">
                  <i className="bi bi-lightbulb-fill me-1"></i> Personalized Financial Advice:
                </h6>
                <ul className="mb-0 small text-dark ps-3">
                  {rule503020.pctWants > 30 && (
                    <li className="mb-1">
                      <strong>Trim Discretionary Spending:</strong> You are spending {rule503020.pctWants}% on non-essentials (above the 30% limit). Cutting back just {formatAmount(rule503020.actualWants - rule503020.targetWants)} in shopping or dining will bring you into perfect balance.
                    </li>
                  )}
                  {rule503020.pctSavings < 20 && (
                    <li className="mb-1">
                      <strong>Automate Payday Transfers:</strong> Your savings rate is currently {rule503020.pctSavings}%. Set up an automatic bank transfer of {formatAmount(rule503020.targetSavings - rule503020.actualSavings)} each payday to reach your 20% savings milestone.
                    </li>
                  )}
                  {rule503020.pctNeeds > 50 && (
                    <li className="mb-1">
                      <strong>Review Fixed Overhead:</strong> Fixed needs take up {rule503020.pctNeeds}% of your income. Look into renegotiating internet/phone plans or utility conservation to lower fixed commitments.
                    </li>
                  )}
                  {rule503020.pctSavings >= 20 && rule503020.pctWants <= 30 && (
                    <li className="mb-1 text-success fw-semibold">
                      🌟 Outstanding financial discipline! Your spending aligns cleanly with the 50/30/20 formula. Consider channeling excess savings into index funds or high-yield accounts.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* Quick Savings Rules checklist */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold mb-3">How the 50/30/20 Works</h5>
              <div className="d-flex align-items-start gap-3 mb-3">
                <div className="badge bg-primary rounded-circle p-2 fs-6">1</div>
                <div>
                  <h6 className="fw-bold mb-1">50% for Needs</h6>
                  <p className="text-muted small mb-0">Expenses you cannot avoid to survive and work: rent/mortgage, groceries, power, basic transportation.</p>
                </div>
              </div>
              <div className="d-flex align-items-start gap-3 mb-3">
                <div className="badge bg-warning text-dark rounded-circle p-2 fs-6">2</div>
                <div>
                  <h6 className="fw-bold mb-1">30% for Wants</h6>
                  <p className="text-muted small mb-0">Comfort and entertainment: streaming subscriptions, restaurants, vacations, latest electronics.</p>
                </div>
              </div>
              <div className="d-flex align-items-start gap-3 mb-3">
                <div className="badge bg-success rounded-circle p-2 fs-6">3</div>
                <div>
                  <h6 className="fw-bold mb-1">20% for Savings</h6>
                  <p className="text-muted small mb-0">Paying your future self: emergency reserves, mutual funds/ETFs, extra debt payoff, and savings goals.</p>
                </div>
              </div>

              <hr className="my-3" />

              <button
                className="btn btn-outline-primary rounded-pill w-100 py-2 fw-semibold"
                onClick={() => setActiveTab('goals')}
              >
                View Your Active Savings Goals <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAVINGS GOALS */}
      {activeTab === 'goals' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold m-0">Interactive Savings Goals</h4>
              <p className="text-muted small m-0">Set target dates, track deposit progress, and celebrate milestones</p>
            </div>
            <button
              className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
              onClick={() => {
                setEditingGoalId(null);
                setGoalForm({
                  title: '',
                  target_amount: '',
                  current_amount: '',
                  target_date: '',
                  category: 'General Savings',
                  color: '#0d6efd',
                  notes: ''
                });
                setShowGoalModal(true);
              }}
            >
              <i className="bi bi-plus-lg me-1"></i> New Goal
            </button>
          </div>

          {savingsGoals.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
              <i className="bi bi-trophy text-muted display-4 mb-3"></i>
              <h4 className="fw-bold">No Savings Goals Created Yet</h4>
              <p className="text-muted mx-auto mb-4" style={{ maxWidth: '460px' }}>
                Having a concrete goal makes you 42% more likely to save consistently! Create goals for emergency funds, travel, or big purchases.
              </p>
              <div>
                <button
                  className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                  onClick={() => {
                    setGoalForm({
                      title: 'Emergency Safety Net',
                      target_amount: 3000,
                      current_amount: 500,
                      target_date: '',
                      category: 'Emergency Fund',
                      color: '#10b981',
                      notes: '3 months of essential buffer'
                    });
                    setShowGoalModal(true);
                  }}
                >
                  <i className="bi bi-plus-circle me-1"></i> Add Sample Emergency Goal
                </button>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {savingsGoals.map(goal => {
                const target = parseFloat(goal.target_amount) || 1;
                const current = parseFloat(goal.current_amount) || 0;
                const remaining = Math.max(0, target - current);
                const pct = Math.min(100, Math.round((current / target) * 100));
                const isComplete = current >= target;

                // Days calculation
                let daysLeftText = null;
                if (goal.target_date) {
                  const targetTime = new Date(goal.target_date).getTime();
                  const nowTime = new Date().getTime();
                  const diffDays = Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24));
                  if (diffDays > 0) {
                    daysLeftText = `${diffDays} days left`;
                  } else if (diffDays === 0) {
                    daysLeftText = 'Due today';
                  } else {
                    daysLeftText = 'Target date passed';
                  }
                }

                return (
                  <div key={goal.id} className="col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 position-relative">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <span
                            className="badge rounded-pill px-3 py-1 mb-2 small fw-semibold"
                            style={{ backgroundColor: `${goal.color || '#0d6efd'}18`, color: goal.color || '#0d6efd' }}
                          >
                            {goal.category || 'General Savings'}
                          </span>
                          <h5 className="fw-bold text-dark m-0">{goal.title}</h5>
                        </div>
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-light rounded-circle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end border-0 shadow">
                            <li>
                              <button className="dropdown-item small" onClick={() => handleOpenEditGoal(goal)}>
                                <i className="bi bi-pencil me-2"></i>Edit Goal
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item small text-danger" onClick={() => deleteSavingsGoal(goal.id)}>
                                <i className="bi bi-trash me-2"></i>Delete Goal
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {goal.notes && (
                        <p className="text-muted small mb-3 text-truncate">{goal.notes}</p>
                      )}

                      {/* Amounts & Progress */}
                      <div className="d-flex justify-content-between align-items-baseline mb-1">
                        <span className="fs-4 fw-bold text-dark">{formatAmount(current)}</span>
                        <span className="small text-muted">Target: {formatAmount(target)}</span>
                      </div>

                      <div className="progress mb-2" style={{ height: '10px' }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isComplete ? '#10b981' : (goal.color || '#0d6efd')
                          }}
                        ></div>
                      </div>

                      <div className="d-flex justify-content-between small text-muted mb-3">
                        <span><strong>{pct}%</strong> funded</span>
                        <span>{isComplete ? '🎉 Target Achieved!' : `${formatAmount(remaining)} remaining`}</span>
                      </div>

                      {daysLeftText && (
                        <div className="small text-muted mb-3">
                          <i className="bi bi-calendar3 me-1"></i> {daysLeftText} ({new Date(goal.target_date).toLocaleDateString()})
                        </div>
                      )}

                      <div className="mt-auto pt-2 border-top">
                        <div className="d-flex gap-2 mb-2">
                          <button
                            className="btn btn-sm btn-outline-success rounded-pill flex-grow-1 fw-semibold"
                            onClick={() => {
                              setDepositGoal(goal);
                              setDepositAmount('');
                            }}
                          >
                            <i className="bi bi-cash-stack me-1"></i> Deposit Money
                          </button>
                          <button
                            className="btn btn-sm btn-light rounded-pill px-3 text-secondary"
                            onClick={() => depositToGoal(goal.id, 50)}
                            title="Quick deposit +$50"
                          >
                            +$50
                          </button>
                          <button
                            className="btn btn-sm btn-light rounded-pill px-3 text-secondary"
                            onClick={() => depositToGoal(goal.id, 100)}
                            title="Quick deposit +$100"
                          >
                            +$100
                          </button>
                        </div>
                        <button
                          className="btn btn-xs btn-outline-primary rounded-pill w-100 py-1"
                          style={{ fontSize: '11px' }}
                          onClick={() => {
                            setPreselectedGoalForCalc(goal);
                            setActiveTab('auto-planner');
                          }}
                          title="Auto-calculate allowable expenses to reach this goal"
                        >
                          <i className="bi bi-calculator me-1"></i> Auto-Plan Monthly Expenses for this Goal
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: AUTO EXPENSE PLANNER */}
      {activeTab === 'auto-planner' && (
        <AutoExpenseCalculator
          preselectedGoal={preselectedGoalForCalc}
          onApplied={() => setActiveTab('goals')}
        />
      )}

      {/* TAB 3: EMERGENCY FUND CALCULATOR */}
      {activeTab === 'emergency' && (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="fw-bold m-0">Emergency Safety Runway Calculator</h4>
                  <p className="text-muted small m-0">Stress test your finances against sudden income disruption or unexpected bills</p>
                </div>
                <span className={`badge rounded-pill px-3 py-2 fw-bold ${emergencyFund.statusClass}`}>
                  {emergencyFund.status}
                </span>
              </div>

              <div className="alert alert-light border rounded-3 mb-4">
                <div className="row text-center g-3">
                  <div className="col-md-4">
                    <div className="small text-muted">Monthly Essential Burn</div>
                    <div className="fs-4 fw-bold text-dark">{formatAmount(emergencyFund.monthlyBurn)}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-muted">Liquid Emergency Reserves</div>
                    <div className="fs-4 fw-bold text-primary">{formatAmount(emergencyFund.currentEmergencyAvailable)}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-muted">Runway Coverage</div>
                    <div className="fs-4 fw-bold text-success">{emergencyFund.runwayMonths} Months</div>
                  </div>
                </div>
              </div>

              {/* Safety Milestone Bars */}
              <h6 className="fw-bold mb-3">Emergency Reserve Milestones</h6>

              {/* 3 Months Starter Safety */}
              <div className="mb-3 p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold small">Level 1: 3-Month Starter Shield</span>
                  <span className="fw-bold text-dark">{formatAmount(emergencyFund.target3Months)}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-info"
                    style={{ width: `${Math.min(100, (emergencyFund.currentEmergencyAvailable / emergencyFund.target3Months) * 100)}%` }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between small text-muted mt-1">
                  <span>Covers car repair, minor medical, sudden job switch</span>
                  <span>{Math.round(Math.min(100, (emergencyFund.currentEmergencyAvailable / emergencyFund.target3Months) * 100))}% reached</span>
                </div>
              </div>

              {/* 6 Months Solid Fortress */}
              <div className="mb-3 p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold small">Level 2: 6-Month Full Security Fortress (Recommended)</span>
                  <span className="fw-bold text-dark">{formatAmount(emergencyFund.target6Months)}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${Math.min(100, (emergencyFund.currentEmergencyAvailable / emergencyFund.target6Months) * 100)}%` }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between small text-muted mt-1">
                  <span>Total peace of mind through recession or prolonged recovery</span>
                  <span>{Math.round(Math.min(100, (emergencyFund.currentEmergencyAvailable / emergencyFund.target6Months) * 100))}% reached</span>
                </div>
              </div>

              {/* 12 Months High Shield */}
              <div className="p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold small">Level 3: 12-Month Bulletproof Independence</span>
                  <span className="fw-bold text-dark">{formatAmount(emergencyFund.target12Months)}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${Math.min(100, (emergencyFund.currentEmergencyAvailable / emergencyFund.target12Months) * 100)}%` }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between small text-muted mt-1">
                  <span>Ideal for freelancers, single-income households, or business owners</span>
                  <span>{Math.round(Math.min(100, (emergencyFund.currentEmergencyAvailable / emergencyFund.target12Months) * 100))}% reached</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Where to Keep Emergency Cash</h5>
                <span className="badge bg-success-subtle text-success rounded-pill small">4.5%+ APY</span>
              </div>

              {/* High-Yield Affiliate Recommendation Cards */}
              <div className="p-3 mb-3 rounded-3" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="badge bg-primary text-white rounded-pill px-2 py-1 mb-1" style={{ fontSize: '10px' }}>
                      TOP HYSA PICK
                    </span>
                    <h6 className="fw-bold text-dark mb-0">Wealthfront Cash</h6>
                  </div>
                  <span className="badge bg-success text-white fw-bold fs-6">5.00% APY</span>
                </div>
                <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                  Earn $500/year for every $10,000 saved. FDIC insured up to $8M, zero account fees, free same-day transfers.
                </p>
                <a
                  href="https://www.wealthfront.com/cash"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-sm btn-primary rounded-pill w-100 fw-semibold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                  style={{ fontSize: '12px' }}
                >
                  <span>Open Wealthfront Account</span>
                  <i className="bi bi-box-arrow-up-right" style={{ fontSize: '10px' }}></i>
                </a>
              </div>

              <div className="p-3 mb-3 rounded-3 border bg-light">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Marcus by Goldman Sachs</h6>
                    <span className="text-muted" style={{ fontSize: '10px' }}>No minimum deposit • Zero fees</span>
                  </div>
                  <span className="badge bg-dark text-white fw-bold">4.40% APY</span>
                </div>
                <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                  Institutional-grade safety with Goldman Sachs. No balance minimums or transaction fees.
                </p>
                <a
                  href="https://www.marcus.com/us/en/savings/high-yield-savings"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-sm btn-outline-dark rounded-pill w-100 fw-semibold d-flex align-items-center justify-content-center gap-1"
                  style={{ fontSize: '12px' }}
                >
                  <span>View Marcus Rates</span>
                  <i className="bi bi-box-arrow-up-right" style={{ fontSize: '10px' }}></i>
                </a>
              </div>

              <div className="p-3 mb-3 rounded-3 border bg-light">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">SoFi Savings &amp; Checking</h6>
                    <span className="text-muted" style={{ fontSize: '10px' }}>$300 Bonus with Direct Deposit</span>
                  </div>
                  <span className="badge bg-primary text-white fw-bold">4.60% APY</span>
                </div>
                <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                  Full all-in-one digital banking with automated vaults and round-up savings.
                </p>
                <a
                  href="https://www.sofi.com/banking/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-sm btn-outline-primary rounded-pill w-100 fw-semibold d-flex align-items-center justify-content-center gap-1"
                  style={{ fontSize: '12px' }}
                >
                  <span>Explore SoFi ($300 Bonus)</span>
                  <i className="bi bi-box-arrow-up-right" style={{ fontSize: '10px' }}></i>
                </a>
              </div>

              <div className="text-muted text-center" style={{ fontSize: '10px' }}>
                <i className="bi bi-info-circle me-1"></i>
                Sponsored Financial Partners. Rates subject to change based on Fed interest rates.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPOUND INTEREST SIMULATOR */}
      {activeTab === 'compound' && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h4 className="fw-bold mb-1">Compound Growth Simulator</h4>
              <p className="text-muted small mb-4">See how consistent small savings multiply into life-changing wealth over time</p>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Initial Deposit ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-control"
                  value={compoundInputs.initial}
                  onChange={(e) => setCompoundInputs({ ...compoundInputs, initial: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Monthly Contribution ({currency}/month)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-control"
                  value={compoundInputs.monthly}
                  onChange={(e) => setCompoundInputs({ ...compoundInputs, monthly: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <label className="form-label small fw-semibold text-muted">Expected Annual Return (%)</label>
                  <span className="badge bg-primary-subtle text-primary">{compoundInputs.rate}%</span>
                </div>
                <input
                  type="range"
                  className="form-range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={compoundInputs.rate}
                  onChange={(e) => setCompoundInputs({ ...compoundInputs, rate: e.target.value })}
                />
                <div className="d-flex justify-content-between small text-muted" style={{ fontSize: '11px' }}>
                  <span>4% (HYSA)</span>
                  <span>8% (Balanced Index)</span>
                  <span>10% (S&P 500 Historical)</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <label className="form-label small fw-semibold text-muted">Time Horizon (Years)</label>
                  <span className="badge bg-success-subtle text-success">{compoundInputs.years} Years</span>
                </div>
                <input
                  type="range"
                  className="form-range"
                  min="1"
                  max="30"
                  step="1"
                  value={compoundInputs.years}
                  onChange={(e) => setCompoundInputs({ ...compoundInputs, years: e.target.value })}
                />
                <div className="d-flex justify-content-between small text-muted" style={{ fontSize: '11px' }}>
                  <span>1 yr</span>
                  <span>10 yrs</span>
                  <span>20 yrs</span>
                  <span>30 yrs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold m-0">Projected Future Wealth</h5>
                <span className="badge bg-success px-3 py-2 rounded-pill">
                  {compoundResults.multiplier}x Your Money!
                </span>
              </div>

              <div className="p-4 rounded-4 text-center text-white mb-4" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                <span className="text-white-50 text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>Total Projected Portfolio</span>
                <h1 className="display-4 fw-bold mt-1 mb-0">{formatAmount(compoundResults.futureValue)}</h1>
                <p className="small mb-0 text-white-50 mt-1">
                  After {compoundInputs.years} years of saving {formatAmount(compoundInputs.monthly)}/month at {compoundInputs.rate}% return
                </p>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="small text-muted">Your Out-of-Pocket Deposits</div>
                    <div className="fs-4 fw-bold text-dark">{formatAmount(compoundResults.totalDeposited)}</div>
                    <div className="small text-muted">{Math.round((compoundResults.totalDeposited / compoundResults.futureValue) * 100)}% of total value</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="small text-muted">Free Compound Interest Earned</div>
                    <div className="fs-4 fw-bold text-success">+{formatAmount(compoundResults.interestEarned)}</div>
                    <div className="small text-muted">{Math.round((compoundResults.interestEarned / compoundResults.futureValue) * 100)}% generated by compound magic</div>
                  </div>
                </div>
              </div>

              {/* Progress Breakdown bar */}
              <div className="progress" style={{ height: '18px' }}>
                <div
                  className="progress-bar bg-secondary"
                  style={{ width: `${(compoundResults.totalDeposited / compoundResults.futureValue) * 100}%` }}
                  title="Your Principal"
                >
                  Principal
                </div>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${(compoundResults.interestEarned / compoundResults.futureValue) * 100}%` }}
                  title="Interest Earned"
                >
                  Interest
                </div>
              </div>
              <div className="d-flex justify-content-between small text-muted mt-2">
                <span><span className="badge bg-secondary me-1">&bull;</span> Principal ({formatAmount(compoundResults.totalDeposited)})</span>
                <span><span className="badge bg-success me-1">&bull;</span> Compound Returns ({formatAmount(compoundResults.interestEarned)})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 52-WEEK SAVINGS CHALLENGE */}
      {activeTab === 'challenge' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold m-0">The 52-Week Money Savings Challenge</h4>
              <p className="text-muted small m-0">Save $1 in Week 1, $2 in Week 2... and finish with $1,378 saved by Week 52!</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <span className="small text-muted d-block">Total Saved So Far:</span>
                <strong className="fs-5 text-success">{formatAmount(challengeTotalSaved)}</strong> / {formatAmount(1378)}
              </div>
              <button
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={() => setCheckedWeeks([])}
              >
                Reset Checklist
              </button>
            </div>
          </div>

          <div className="progress mb-4" style={{ height: '12px' }}>
            <div
              className="progress-bar bg-success"
              style={{ width: `${(checkedWeeks.length / 52) * 100}%` }}
            ></div>
          </div>

          {/* Grid of 52 weeks */}
          <div className="row g-2">
            {Array.from({ length: 52 }, (_, i) => i + 1).map(week => {
              const isChecked = checkedWeeks.includes(week);
              return (
                <div key={week} className="col-6 col-sm-4 col-md-3 col-lg-2">
                  <div
                    className={`p-2 rounded-3 border text-center cursor-pointer transition-all ${isChecked ? 'bg-success text-white border-success' : 'bg-light text-dark'}`}
                    onClick={() => toggleWeek(week)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="small fw-bold">Week {week}</div>
                    <div className={`fs-6 fw-bold ${isChecked ? 'text-white' : 'text-primary'}`}>
                      {currency}{week}
                    </div>
                    <div className="small" style={{ fontSize: '10px' }}>
                      {isChecked ? '✓ Saved' : 'Tap to Save'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: TOP 10 MONEY-SAVING RULES */}
      {activeTab === 'tips' && (
        <div className="row g-4">
          {[
            {
              title: '1. The 24-Hour Rule',
              icon: 'bi-clock-history',
              badge: 'Behavioral',
              desc: 'For any non-essential purchase over $50, enforce a mandatory 24-hour waiting period. Over 70% of impulse purchase urges fade within 24 hours.'
            },
            {
              title: '2. Pay Yourself First (Automate)',
              icon: 'bi-arrow-repeat',
              badge: 'Golden Rule',
              desc: 'Do not save what is left after spending; spend what is left after saving. Set automatic recurring transfers on the exact day your salary deposits.'
            },
            {
              title: '3. Audit Recurring Subscriptions',
              icon: 'bi-credit-card-2-front',
              badge: 'Quick Win',
              desc: 'The average consumer underestimates subscriptions by over $130/month. Review bank statements every 3 months and cancel services you have not used in 30 days.'
            },
            {
              title: '4. The Sunday Meal Prep Rule',
              icon: 'bi-basket2',
              badge: 'Food & Dining',
              desc: 'Dining out costs 4x to 5x more than home-cooked food. Planning 4 to 5 dinners on Sunday cuts restaurant and delivery spending by up to $300/month.'
            },
            {
              title: '5. Move Cash to High-Yield Savings (HYSA)',
              icon: 'bi-bank',
              badge: 'Free Returns',
              desc: 'A standard checking account pays ~0.01% APY. A 4.5% HYSA turns a $10,000 emergency fund into $450/year in passive risk-free interest.'
            },
            {
              title: '6. Zero-Spend Days',
              icon: 'bi-calendar-check',
              badge: 'Habit',
              desc: 'Commit to 1 or 2 designated days per week where you spend exactly $0 outside of fixed bills. Great for resetting spending dopamine.'
            },
            {
              title: '7. Calculate Purchases in Work Hours',
              icon: 'bi-hourglass-split',
              badge: 'Mindset',
              desc: 'If you earn $20/hour, a $100 jacket costs you 5 full hours of labor. Ask yourself: Is this item worth 5 hours at your desk?'
            },
            {
              title: '8. Unsubscribe from Marketing Emails',
              icon: 'bi-envelope-x',
              badge: 'Temptation',
              desc: 'Flash sales and limited-time discount emails create artificial urgency. Remove temptations from your inbox to prevent mindless browsing.'
            },
            {
              title: '9. Check Used & Refurbished First',
              icon: 'bi-recycle',
              badge: 'Shopping',
              desc: 'Certified refurbished laptops, phones, furniture, and vehicles carry 30% to 50% discounts with identical warranties and performance.'
            },
            {
              title: '10. Build a 3-Month Minimum Safety Net',
              icon: 'bi-shield-shaded',
              badge: 'Security',
              desc: 'Financial emergencies are inevitable. Having 3 months of essential living expenses shields you from high-interest credit card debt and predatory loans.'
            }
          ].map((tip, idx) => (
            <div key={idx} className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                      <i className={`bi ${tip.icon} fs-5`}></i>
                    </div>
                    <h5 className="fw-bold m-0 text-dark">{tip.title}</h5>
                  </div>
                  <span className="badge bg-light text-secondary border">{tip.badge}</span>
                </div>
                <p className="text-muted small mb-0 mt-2">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE / EDIT SAVINGS GOAL */}
      {showGoalModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 py-3">
                <h5 className="modal-title fw-bold text-dark">
                  {editingGoalId ? 'Edit Savings Goal' : 'Create New Savings Goal'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowGoalModal(false)}></button>
              </div>
              <form onSubmit={handleSaveGoal}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Goal Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Emergency Fund, Summer Vacation, New Laptop"
                      value={goalForm.title}
                      onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Target Amount ({currency})</label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        className="form-control"
                        placeholder="e.g. 5000"
                        value={goalForm.target_amount}
                        onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Current Amount ({currency})</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-control"
                        placeholder="e.g. 500"
                        value={goalForm.current_amount}
                        onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Category</label>
                      <select
                        className="form-select"
                        value={goalForm.category}
                        onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                      >
                        {savingsCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Target Completion Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={goalForm.target_date}
                        onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Goal Accent Color</label>
                    <div className="d-flex gap-2">
                      {['#0d6efd', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(color => (
                        <div
                          key={color}
                          onClick={() => setGoalForm({ ...goalForm, color })}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            cursor: 'pointer',
                            outline: goalForm.color === color ? '3px solid #000' : 'none',
                            outlineOffset: '2px'
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-muted">Notes & Milestones</label>
                    <textarea
                      rows="2"
                      className="form-control"
                      placeholder="Why are you saving for this? Key milestones..."
                      value={goalForm.notes}
                      onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-0 py-3">
                  <button type="button" className="btn btn-secondary rounded-pill px-3" onClick={() => setShowGoalModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold">
                    {editingGoalId ? 'Update Goal' : 'Save Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DEPOSIT INTO GOAL */}
      {depositGoal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 py-3">
                <h6 className="modal-title fw-bold text-dark">
                  Deposit to {depositGoal.title}
                </h6>
                <button type="button" className="btn-close" onClick={() => setDepositGoal(null)}></button>
              </div>
              <form onSubmit={handleDepositSubmit}>
                <div className="modal-body p-4 text-center">
                  <p className="text-muted small mb-3">
                    Current Saved: <strong>{formatAmount(depositGoal.current_amount)}</strong> of {formatAmount(depositGoal.target_amount)}
                  </p>

                  <div className="input-group mb-3">
                    <span className="input-group-text">{currency}</span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      className="form-control form-control-lg text-center fw-bold"
                      placeholder="Amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  {/* Preset Buttons */}
                  <div className="d-flex justify-content-center gap-1 mb-2">
                    {[20, 50, 100, 250].map(val => (
                      <button
                        key={val}
                        type="button"
                        className="btn btn-xs btn-outline-secondary rounded-pill px-2"
                        style={{ fontSize: '11px' }}
                        onClick={() => setDepositAmount(val.toString())}
                      >
                        +{currency}{val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-footer bg-light border-0 py-2">
                  <button type="button" className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setDepositGoal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-success rounded-pill px-4 fw-bold">
                    Deposit Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

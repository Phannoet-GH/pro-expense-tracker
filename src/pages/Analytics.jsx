import React, { useContext, useState, useMemo } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TIMEFRAMES = [
  { id: 'all', label: 'All Time' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' }
];

export default function Analytics() {
  const { expenses, incomes, formatAmount, currencySymbol, convertAmount } = useContext(ExpenseContext);
  const { isDark } = useTheme();
  const [timeframe, setTimeframe] = useState('all');

  // Filter items by timeframe
  const { filteredExpenses, filteredIncomes } = useMemo(() => {
    if (timeframe === 'all') return { filteredExpenses: expenses, filteredIncomes: incomes };
    const now = new Date();
    const days = timeframe === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return {
      filteredExpenses: expenses.filter(e => new Date(e.date) >= cutoff),
      filteredIncomes: incomes.filter(i => new Date(i.date) >= cutoff)
    };
  }, [expenses, incomes, timeframe]);

  // Aggregate expenses by category
  const expenseCategoryTotals = useMemo(() => {
    return filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount || 0);
      return acc;
    }, {});
  }, [filteredExpenses]);

  // Aggregate incomes by source
  const incomeSourceTotals = useMemo(() => {
    return filteredIncomes.reduce((acc, inc) => {
      acc[inc.source] = (acc[inc.source] || 0) + parseFloat(inc.amount || 0);
      return acc;
    }, {});
  }, [filteredIncomes]);

  const periodTotalIncome = useMemo(() => {
    return Object.values(incomeSourceTotals).reduce((sum, v) => sum + v, 0);
  }, [incomeSourceTotals]);

  const periodTotalExpense = useMemo(() => {
    return Object.values(expenseCategoryTotals).reduce((sum, v) => sum + v, 0);
  }, [expenseCategoryTotals]);

  const periodNetSavings = periodTotalIncome - periodTotalExpense;
  const periodSavingsRate = periodTotalIncome > 0 ? Math.max(0, (periodNetSavings / periodTotalIncome) * 100) : 0;

  // Top Category
  const topExpenseCategory = useMemo(() => {
    const entries = Object.entries(expenseCategoryTotals);
    if (entries.length === 0) return { category: 'None', amount: 0 };
    return entries.reduce((max, curr) => curr[1] > max.amount ? { category: curr[0], amount: curr[1] } : max, { category: '', amount: 0 });
  }, [expenseCategoryTotals]);

  // Top Income Source
  const topIncomeSource = useMemo(() => {
    const entries = Object.entries(incomeSourceTotals);
    if (entries.length === 0) return { source: 'None', amount: 0 };
    return entries.reduce((max, curr) => curr[1] > max.amount ? { source: curr[0], amount: curr[1] } : max, { source: '', amount: 0 });
  }, [incomeSourceTotals]);

  // Income vs Expense Comparison Bar Chart
  const comparisonBarData = {
    labels: ['Total Income', 'Total Expenses', 'Net Savings'],
    datasets: [{
      label: `Amount (${currencySymbol})`,
      data: [
        convertAmount(periodTotalIncome),
        convertAmount(periodTotalExpense),
        Math.max(0, convertAmount(periodNetSavings))
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.85)',  // Income Green
        'rgba(239, 68, 68, 0.85)',   // Expense Red
        'rgba(59, 130, 246, 0.85)'   // Savings Blue
      ],
      borderRadius: 8
    }]
  };

  // Expense Categories Doughnut Chart
  const expenseDoughnutData = {
    labels: Object.keys(expenseCategoryTotals),
    datasets: [{
      data: Object.values(expenseCategoryTotals).map(val => convertAmount(val)),
      backgroundColor: [
        '#0d6efd',
        '#198754',
        '#ffc107',
        '#dc3545',
        '#6f42c1',
        '#fd7e14',
        '#20c997',
        '#0dcaf0',
        '#6c757d'
      ],
      borderWidth: 2,
      borderColor: isDark ? '#1e293b' : '#ffffff'
    }]
  };

  // Income Sources Doughnut Chart
  const incomeDoughnutData = {
    labels: Object.keys(incomeSourceTotals),
    datasets: [{
      data: Object.values(incomeSourceTotals).map(val => convertAmount(val)),
      backgroundColor: [
        '#10b981',
        '#06b6d4',
        '#6366f1',
        '#8b5cf6',
        '#ec4899',
        '#f59e0b',
        '#3b82f6'
      ],
      borderWidth: 2,
      borderColor: isDark ? '#1e293b' : '#ffffff'
    }]
  };

  return (
    <div>
      {/* Header & Filter */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold m-0 text-dark">Financial Analytics & Reports</h3>
          <p className="text-muted small m-0">In-depth breakdown of cash inflows, expenditure patterns, and savings ratios</p>
        </div>

        <div className="btn-group bg-white p-1 rounded-pill shadow-sm border" role="group">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.id}
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${timeframe === tf.id ? 'btn-primary' : 'btn-light border-0 text-muted'}`}
              onClick={() => setTimeframe(tf.id)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Period Income</span>
            <h4 className="fw-bold text-success mt-1 mb-0">{formatAmount(periodTotalIncome)}</h4>
            <span className="small text-muted">{filteredIncomes.length} inflow transactions</span>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Period Expenses</span>
            <h4 className="fw-bold text-danger mt-1 mb-0">{formatAmount(periodTotalExpense)}</h4>
            <span className="small text-muted">{filteredExpenses.length} purchases</span>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Net Cash Flow</span>
            <h4 className={`fw-bold mt-1 mb-0 ${periodNetSavings >= 0 ? 'text-primary' : 'text-danger'}`}>
              {formatAmount(periodNetSavings)}
            </h4>
            <span className="small text-muted">{periodNetSavings >= 0 ? 'Surplus retained' : 'Deficit incurred'}</span>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Savings Efficiency</span>
            <h4 className="fw-bold text-dark mt-1 mb-0">{periodSavingsRate.toFixed(1)}%</h4>
            <span className="small text-muted">{periodSavingsRate >= 20 ? 'Strong savings velocity' : 'Target: 20%+'}</span>
          </div>
        </div>
      </div>

      {/* Comparison Chart Section */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <h5 className="fw-bold mb-3">Cash Inflow vs Outflow Comparison</h5>
            {filteredExpenses.length > 0 || filteredIncomes.length > 0 ? (
              <Bar
                data={comparisonBarData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      ticks: { color: isDark ? '#94a3b8' : '#64748b' },
                      grid: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: isDark ? '#94a3b8' : '#64748b',
                        callback: (val) => `${currencySymbol}${Number(val).toLocaleString()}`
                      },
                      grid: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }
                    }
                  }
                }}
              />
            ) : (
              <p className="text-muted text-center py-5">No transaction data recorded for this timeframe.</p>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <h5 className="fw-bold mb-3">Key Financial Insights</h5>
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-muted small">Top Income Stream</span>
                <span className="badge bg-success-subtle text-success">Highest Earner</span>
              </div>
              <h5 className="fw-bold text-dark mb-0">{topIncomeSource.source}</h5>
              <div className="small text-muted">{formatAmount(topIncomeSource.amount)} generated</div>
            </div>

            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-muted small">Top Expense Category</span>
                <span className="badge bg-danger-subtle text-danger">Largest Drain</span>
              </div>
              <h5 className="fw-bold text-dark mb-0">{topExpenseCategory.category}</h5>
              <div className="small text-muted">{formatAmount(topExpenseCategory.amount)} spent</div>
            </div>

            <div className="p-3 bg-light rounded-3 border">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-muted small">Income-to-Expense Multiplier</span>
                <span className="badge bg-primary-subtle text-primary">Health Metric</span>
              </div>
              <h5 className="fw-bold text-dark mb-0">
                {periodTotalExpense > 0 ? (periodTotalIncome / periodTotalExpense).toFixed(2) : 'N/A'}x
              </h5>
              <div className="small text-muted">
                {periodTotalExpense > 0 && (periodTotalIncome / periodTotalExpense) >= 1.25
                  ? 'Healthy coverage (Income exceeds expenses by > 25%)'
                  : 'Tight margins (Work on lowering expenses or increasing inflow)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doughnut Charts: Expense Breakdown & Income Breakdown */}
      <div className="row g-4">
        {/* Expenses by Category */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <h5 className="fw-bold mb-3 text-center">Expense Breakdown by Category</h5>
            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
              {filteredExpenses.length > 0 ? (
                <Doughnut
                  data={expenseDoughnutData}
                  options={{
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 12,
                          color: isDark ? '#cbd5e1' : '#475569'
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const val = ctx.parsed;
                            const pct = periodTotalExpense > 0 ? Math.round((val / periodTotalExpense) * 100) : 0;
                            return ` ${formatAmount(val)} (${pct}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-muted text-center py-5">No expenses recorded for this timeframe.</p>
              )}
            </div>
          </div>
        </div>

        {/* Incomes by Source */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <h5 className="fw-bold mb-3 text-center">Income Breakdown by Source</h5>
            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
              {filteredIncomes.length > 0 ? (
                <Doughnut
                  data={incomeDoughnutData}
                  options={{
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 12,
                          color: isDark ? '#cbd5e1' : '#475569'
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const val = ctx.parsed;
                            const pct = periodTotalIncome > 0 ? Math.round((val / periodTotalIncome) * 100) : 0;
                            return ` ${formatAmount(val)} (${pct}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-muted text-center py-5">No incomes recorded for this timeframe.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

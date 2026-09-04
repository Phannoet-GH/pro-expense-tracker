import React, { useContext, useState, useMemo } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
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
  const { expenses } = useContext(ExpenseContext);
  const [timeframe, setTimeframe] = useState('all');

  // Filter expenses by timeframe
  const filteredExpenses = useMemo(() => {
    if (timeframe === 'all') return expenses;
    const now = new Date();
    const days = timeframe === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return expenses.filter(e => new Date(e.date) >= cutoff);
  }, [expenses, timeframe]);

  // Aggregate by category
  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});
  }, [filteredExpenses]);

  const totalSpent = useMemo(() => {
    return Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
  }, [categoryTotals]);

  // Top Category
  const topCategoryEntry = useMemo(() => {
    const entries = Object.entries(categoryTotals);
    if (entries.length === 0) return { category: 'None', amount: 0 };
    return entries.reduce((max, curr) => curr[1] > max.amount ? { category: curr[0], amount: curr[1] } : max, { category: '', amount: 0 });
  }, [categoryTotals]);

  // Largest Single Purchase
  const largestPurchase = useMemo(() => {
    if (filteredExpenses.length === 0) return { title: 'None', amount: 0 };
    return filteredExpenses.reduce((max, curr) => parseFloat(curr.amount) > max.amount ? { title: curr.title || curr.category, amount: parseFloat(curr.amount) } : max, { title: '', amount: 0 });
  }, [filteredExpenses]);

  const doughnutData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: [
        '#0d6efd', // Primary
        '#198754', // Success
        '#ffc107', // Warning
        '#dc3545', // Danger
        '#6f42c1', // Purple
        '#fd7e14'  // Orange
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 6
    }]
  };

  const barData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      label: 'Spending ($)',
      data: Object.values(categoryTotals),
      backgroundColor: 'rgba(13, 110, 253, 0.75)',
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(13, 110, 253, 0.95)'
    }]
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold m-0">Category Analytics & Reports</h3>
          <p className="text-muted small m-0">Visual breakdown of your expenditure patterns</p>
        </div>

        {/* Timeframe Filter Pills */}
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

      {/* Analytics Summary Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Period Total</span>
            <h4 className="fw-bold text-primary mt-1 mb-0">${totalSpent.toFixed(2)}</h4>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Top Category</span>
            <h4 className="fw-bold text-dark mt-1 mb-0 text-truncate">{topCategoryEntry.category}</h4>
            <span className="small text-muted">${topCategoryEntry.amount.toFixed(2)} spent</span>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Largest Expense</span>
            <h4 className="fw-bold text-danger mt-1 mb-0">${largestPurchase.amount.toFixed(2)}</h4>
            <span className="small text-muted text-truncate d-block">{largestPurchase.title}</span>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '11px' }}>Transactions</span>
            <h4 className="fw-bold text-success mt-1 mb-0">{filteredExpenses.length}</h4>
            <span className="small text-muted">Receipts logged</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3 text-center">Spending Share by Category</h5>
            <div style={{ maxWidth: '280px', margin: '0 auto', position: 'relative' }}>
              {filteredExpenses.length > 0 ? (
                <Doughnut
                  data={doughnutData}
                  options={{
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const val = ctx.parsed;
                            const pct = totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0;
                            return ` $${val.toFixed(2)} (${pct}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-muted text-center mt-5">No transactions recorded for this period.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3 text-center">Expenditure Comparison</h5>
            {filteredExpenses.length > 0 ? (
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { callback: (val) => `$${val}` }
                    }
                  }
                }}
              />
            ) : (
              <p className="text-muted text-center mt-5">No transactions recorded for this period.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
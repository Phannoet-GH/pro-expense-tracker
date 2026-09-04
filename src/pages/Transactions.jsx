import React, { useContext, useState, useMemo } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';

export default function Transactions() {
  const { expenses, deleteExpense } = useContext(ExpenseContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inspectReceipt, setInspectReceipt] = useState(null);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(exp => {
        const matchesSearch =
          (exp.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.amount.toString().includes(searchTerm);

        const matchesCat = selectedCategory === 'All' || exp.category === selectedCategory;

        return matchesSearch && matchesCat;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, searchTerm, selectedCategory]);

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Date,Title,Category,Amount,Notes\n" +
      filteredExpenses.map(e => `"${e.date}","${e.title || e.category}","${e.category}","${e.amount}","${e.notes || ''}"`).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold m-0">All Transactions</h3>
          <p className="text-muted small m-0">{filteredExpenses.length} records matching current filters</p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            className="form-select form-select-sm border-0 bg-light rounded-pill px-3"
            style={{ width: 'auto' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Food & Dining">Food & Dining</option>
            <option value="Utilities">Utilities</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Other">Other</option>
          </select>

          {/* Search Box */}
          <input
            type="text"
            className="form-control form-control-sm bg-light border-0 rounded-pill px-3"
            placeholder="Search merchant, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '200px' }}
          />

          <button onClick={exportToCSV} className="btn btn-success btn-sm rounded-pill px-3">
            <i className="bi bi-download me-1"></i> Export CSV
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Transaction / Title</th>
              <th>Category</th>
              <th className="text-center">Receipt</th>
              <th className="text-end">Amount</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(expense => (
              <tr key={expense.id}>
                <td className="text-muted small">
                  {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td>
                  <div className="fw-bold text-dark">{expense.title || expense.category}</div>
                  {expense.notes && <div className="text-muted small">{expense.notes}</div>}
                </td>
                <td>
                  <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                    {expense.category}
                  </span>
                </td>
                <td className="text-center">
                  {expense.receipt ? (
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-success rounded-pill px-2 py-1 small"
                      style={{ fontSize: '11px' }}
                      onClick={() => setInspectReceipt(expense.receipt)}
                      title="Click to inspect receipt details"
                    >
                      <i className="bi bi-receipt me-1"></i> View Receipt
                    </button>
                  ) : (
                    <span className="text-muted small" style={{ fontSize: '11px' }}>None</span>
                  )}
                </td>
                <td className="text-end fw-bold text-dark">
                  ${parseFloat(expense.amount).toFixed(2)}
                </td>
                <td className="text-center">
                  <button
                    className="btn btn-sm btn-light text-danger rounded-circle"
                    onClick={() => deleteExpense(expense.id)}
                    title="Delete record"
                  >
                    <i className="bi bi-trash-fill"></i>
                  </button>
                </td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  No matching transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Inspection Modal */}
      {inspectReceipt && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setInspectReceipt(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 py-3">
                <h6 className="modal-title fw-bold m-0 text-dark">
                  <i className="bi bi-receipt-cutoff me-2 text-primary"></i> Digital Receipt Voucher
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setInspectReceipt(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                {/* Paper Receipt Simulation Card */}
                <div
                  className="p-4 bg-light border rounded-3 text-center"
                  style={{
                    fontFamily: 'monospace',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <div className="fw-bold fs-5 text-uppercase tracking-wider mb-1">
                    {inspectReceipt.merchant}
                  </div>
                  <div className="text-muted small mb-3">
                    Date: {inspectReceipt.date} &bull; Category: {inspectReceipt.category}
                  </div>

                  <hr className="border-secondary border-dashed my-2" />

                  {/* Line Items */}
                  <div className="text-start py-2">
                    {inspectReceipt.items && inspectReceipt.items.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between small py-1">
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <hr className="border-secondary border-dashed my-2" />

                  <div className="d-flex justify-content-between fw-bold fs-5 py-2 text-dark">
                    <span>TOTAL:</span>
                    <span>${parseFloat(inspectReceipt.amount).toFixed(2)}</span>
                  </div>

                  {/* Simulated Barcode */}
                  <div className="mt-3 pt-2 text-muted" style={{ letterSpacing: '4px', fontSize: '11px' }}>
                    ||| | |||| | ||||| || ||| | |||
                  </div>
                  <div className="text-muted" style={{ fontSize: '9px', letterSpacing: '2px' }}>
                    AUTH: {inspectReceipt.id.toUpperCase()} • APPROVED
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light border-0 py-2">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary rounded-pill px-4"
                  onClick={() => setInspectReceipt(null)}
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useContext, useState, useMemo } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';

export default function Transactions() {
  const {
    expenses,
    incomes,
    deleteExpense,
    deleteIncome,
    addExpense,
    addIncome,
    updateExpense,
    updateIncome,
    formatAmount,
    currency,
    expenseCategories,
    incomeSources
  } = useContext(ExpenseContext);

  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Expense' | 'Income'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inspectReceipt, setInspectReceipt] = useState(null);

  // Quick Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTxType, setNewTxType] = useState('expense');
  const [modalForm, setModalForm] = useState({
    title: '',
    amount: '',
    category: 'Food & Drink',
    source: 'Salary',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    is_recurring: false
  });

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState({
    id: '',
    txType: 'expense',
    title: '',
    amount: '',
    category: 'Food & Drink',
    source: 'Salary',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    is_recurring: false,
    receipt: null,
    is_tax_deductible: false,
    tax_category: 'General Business'
  });

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setEditForm({
      id: tx.id,
      txType: tx.txType,
      title: tx.title || '',
      amount: tx.amount ? tx.amount.toString() : '',
      category: tx.category || 'Food & Drink',
      source: tx.source || 'Salary',
      date: tx.date || new Date().toISOString().split('T')[0],
      notes: tx.notes || '',
      is_recurring: Boolean(tx.is_recurring),
      receipt: tx.receipt || null,
      is_tax_deductible: Boolean(tx.is_tax_deductible),
      tax_category: tx.tax_category || 'General Business'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.amount || parseFloat(editForm.amount) <= 0) return;

    if (editForm.txType === 'expense') {
      updateExpense({
        id: editForm.id,
        title: editForm.title.trim() || `${editForm.category} Expense`,
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        date: editForm.date,
        notes: editForm.notes,
        receipt: editForm.receipt,
        is_tax_deductible: editForm.is_tax_deductible,
        tax_category: editForm.tax_category
      });
    } else {
      updateIncome({
        id: editForm.id,
        title: editForm.title.trim() || `${editForm.source} Income`,
        amount: parseFloat(editForm.amount),
        source: editForm.source,
        date: editForm.date,
        notes: editForm.notes,
        is_recurring: editForm.is_recurring
      });
    }

    setShowEditModal(false);
    setEditingTx(null);
  };

  // Combine and filter transactions
  const combinedTransactions = useMemo(() => {
    const list = [
      ...expenses.map(e => ({ ...e, txType: 'expense' })),
      ...incomes.map(i => ({ ...i, txType: 'income' }))
    ];

    return list
      .filter(tx => {
        // Type filter
        if (typeFilter === 'Expense' && tx.txType !== 'expense') return false;
        if (typeFilter === 'Income' && tx.txType !== 'income') return false;

        // Category/source filter
        if (selectedCategory !== 'All') {
          const cat = tx.txType === 'expense' ? tx.category : tx.source;
          if (cat !== selectedCategory) return false;
        }

        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitle = (tx.title || '').toLowerCase().includes(term);
          const matchCat = (tx.txType === 'expense' ? tx.category : tx.source).toLowerCase().includes(term);
          const matchAmount = tx.amount.toString().includes(term);
          const matchNotes = (tx.notes || '').toLowerCase().includes(term);
          if (!matchTitle && !matchCat && !matchAmount && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, incomes, typeFilter, selectedCategory, searchTerm]);

  // Handle deletion based on type
  const handleDelete = (tx) => {
    if (tx.txType === 'income') {
      deleteIncome(tx.id);
    } else {
      deleteExpense(tx.id);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Type,Date,Title,Category_Source,Amount,Notes\n" +
      combinedTransactions.map(tx => {
        const type = tx.txType === 'income' ? 'Income' : 'Expense';
        const cat = tx.txType === 'income' ? tx.source : tx.category;
        const sign = tx.txType === 'income' ? '+' : '-';
        return `"${type}","${tx.date}","${tx.title || cat}","${cat}","${sign}${tx.amount}","${tx.notes || ''}"`;
      }).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `cashflow_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Quick Add submit
  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalForm.amount || parseFloat(modalForm.amount) <= 0) return;

    if (newTxType === 'expense') {
      addExpense({
        title: modalForm.title.trim() || `${modalForm.category} Expense`,
        amount: parseFloat(modalForm.amount),
        category: modalForm.category,
        date: modalForm.date,
        notes: modalForm.notes
      });
    } else {
      addIncome({
        title: modalForm.title.trim() || `${modalForm.source} Income`,
        amount: parseFloat(modalForm.amount),
        source: modalForm.source,
        date: modalForm.date,
        notes: modalForm.notes,
        is_recurring: modalForm.is_recurring
      });
    }

    setShowAddModal(false);
    setModalForm({
      title: '',
      amount: '',
      category: 'Food & Drink',
      source: 'Salary',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      is_recurring: false
    });
  };

  // Dynamic filter options
  const filterCategoryOptions = useMemo(() => {
    if (typeFilter === 'Expense') return expenseCategories;
    if (typeFilter === 'Income') return incomeSources;
    return Array.from(new Set([...expenseCategories, ...incomeSources]));
  }, [typeFilter, expenseCategories, incomeSources]);

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 min-vh-100 bg-white">
      {/* Header & Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">Cash Flow & Transactions</h3>
          <p className="text-muted small m-0">
            {combinedTransactions.length} records matching current filters
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap align-items-center">
          {/* Type Filter Buttons */}
          <div className="btn-group bg-light p-1 rounded-pill border" role="group">
            {['All', 'Income', 'Expense'].map(type => (
              <button
                key={type}
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-semibold ${typeFilter === type ? 'btn-primary shadow-sm' : 'btn-light border-0 text-muted'}`}
                onClick={() => {
                  setTypeFilter(type);
                  setSelectedCategory('All');
                }}
              >
                {type === 'All' ? 'All Types' : type === 'Income' ? '+ Incomes' : '- Expenses'}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            className="form-select form-select-sm border bg-light rounded-pill px-3"
            style={{ width: 'auto' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories / Sources</option>
            {filterCategoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Search Box */}
          <input
            type="text"
            className="form-control form-control-sm bg-light border rounded-pill px-3"
            placeholder="Search title, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '180px' }}
          />

          <button onClick={exportToCSV} className="btn btn-outline-success btn-sm rounded-pill px-3">
            <i className="bi bi-download me-1"></i> Export CSV
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm"
          >
            <i className="bi bi-plus-lg me-1"></i> Add Entry
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: '120px' }}>Date</th>
              <th style={{ width: '100px' }}>Type</th>
              <th>Description / Title</th>
              <th>Category / Source</th>
              <th className="text-center" style={{ width: '110px' }}>Details / Receipt</th>
              <th className="text-end" style={{ width: '140px' }}>Amount</th>
              <th className="text-center" style={{ width: '70px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {combinedTransactions.map(tx => {
              const isInc = tx.txType === 'income';
              return (
                <tr key={`${tx.txType}-${tx.id}`}>
                  <td className="text-muted small">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <span className={`badge rounded-pill ${isInc ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}>
                      {isInc ? '+ Income' : '- Expense'}
                    </span>
                  </td>
                  <td>
                    <div className="fw-bold text-dark">{tx.title || (isInc ? tx.source : tx.category)}</div>
                    {tx.notes && <div className="text-muted small">{tx.notes}</div>}
                  </td>
                  <td>
                    <span className="badge bg-light text-secondary border px-2 py-1">
                      {isInc ? tx.source : tx.category}
                    </span>
                    {tx.is_recurring && (
                      <span className="badge bg-info-subtle text-info ms-1" title="Recurring Monthly">
                        <i className="bi bi-repeat"></i> Recurring
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    {tx.receipt ? (
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-success rounded-pill px-2 py-1 small"
                        style={{ fontSize: '11px' }}
                        onClick={() => setInspectReceipt(tx.receipt)}
                        title="Click to inspect receipt details"
                      >
                        <i className="bi bi-receipt me-1"></i> Receipt
                      </button>
                    ) : (
                      <span className="text-muted small">-</span>
                    )}
                  </td>
                  <td className={`text-end fw-bold fs-6 ${isInc ? 'text-success' : 'text-dark'}`}>
                    {isInc ? `+${formatAmount(tx.amount)}` : `-${formatAmount(tx.amount)}`}
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-light text-primary rounded-circle"
                        onClick={() => handleOpenEdit(tx)}
                        title="Edit transaction"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light text-danger rounded-circle"
                        onClick={() => handleDelete(tx)}
                        title="Delete transaction"
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {combinedTransactions.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
                  No matching transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD TRANSACTION */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 py-3">
                <h5 className="modal-title fw-bold text-dark">Add New Transaction</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleModalSubmit}>
                <div className="modal-body p-4">
                  {/* Type Selector */}
                  <div className="d-flex gap-2 mb-3">
                    <button
                      type="button"
                      className={`btn flex-grow-1 rounded-pill fw-bold ${newTxType === 'expense' ? 'btn-danger' : 'btn-light border text-muted'}`}
                      onClick={() => setNewTxType('expense')}
                    >
                      - Record Expense
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 rounded-pill fw-bold ${newTxType === 'income' ? 'btn-success' : 'btn-light border text-muted'}`}
                      onClick={() => setNewTxType('income')}
                    >
                      + Record Income
                    </button>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Title / Description</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={newTxType === 'expense' ? 'e.g. Grocery store, Gas, Dinner' : 'e.g. Monthly Salary, Freelance project'}
                      value={modalForm.title}
                      onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">
                        {newTxType === 'expense' ? 'Category' : 'Source'}
                      </label>
                      {newTxType === 'expense' ? (
                        <select
                          className="form-select"
                          value={modalForm.category}
                          onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                        >
                          {expenseCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          className="form-select"
                          value={modalForm.source}
                          onChange={(e) => setModalForm({ ...modalForm, source: e.target.value })}
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
                        step="0.01"
                        min="0.01"
                        className="form-control"
                        placeholder="0.00"
                        value={modalForm.amount}
                        onChange={(e) => setModalForm({ ...modalForm, amount: e.target.value })}
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
                        value={modalForm.date}
                        onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6 d-flex align-items-end">
                      {newTxType === 'income' && (
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="modalRecurringCheck"
                            checked={modalForm.is_recurring}
                            onChange={(e) => setModalForm({ ...modalForm, is_recurring: e.target.checked })}
                          />
                          <label className="form-check-label small text-muted" htmlFor="modalRecurringCheck">
                            Recurring Monthly
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-muted">Notes (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Additional details or context..."
                      value={modalForm.notes}
                      onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-0 py-3">
                  <button type="button" className="btn btn-secondary rounded-pill px-3" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={`btn rounded-pill px-4 fw-bold ${newTxType === 'expense' ? 'btn-danger' : 'btn-success'}`}>
                    Save {newTxType === 'expense' ? 'Expense' : 'Income'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECEIPT INSPECTION */}
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
                    <span>{formatAmount(inspectReceipt.amount)}</span>
                  </div>

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

      {/* MODAL: EDIT TRANSACTION */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-pencil-square text-primary me-2"></i>
                  Edit {editForm.txType === 'income' ? 'Income' : 'Expense'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  {/* Title / Description */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Title / Description</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={editForm.txType === 'expense' ? 'e.g. Starbucks Nitro Cold Brew' : 'e.g. Monthly Base Salary'}
                    />
                  </div>

                  {/* Category or Source & Amount */}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">
                        {editForm.txType === 'expense' ? 'Expense Category' : 'Income Source'}
                      </label>
                      {editForm.txType === 'expense' ? (
                        <select
                          className="form-select"
                          value={editForm.category}
                          onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                        >
                          {expenseCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          className="form-select"
                          value={editForm.source}
                          onChange={(e) => setEditForm(prev => ({ ...prev, source: e.target.value }))}
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
                        step="0.01"
                        min="0.01"
                        required
                        className="form-control fw-bold"
                        value={editForm.amount}
                        onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Date & Recurring/Tax */}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Transaction Date</label>
                      <input
                        type="date"
                        required
                        className="form-control"
                        value={editForm.date}
                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>

                    {editForm.txType === 'income' ? (
                      <div className="col-6 d-flex align-items-end">
                        <div className="form-check form-switch mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="editRecurringSwitch"
                            checked={editForm.is_recurring}
                            onChange={(e) => setEditForm(prev => ({ ...prev, is_recurring: e.target.checked }))}
                          />
                          <label className="form-check-label small fw-semibold text-dark" htmlFor="editRecurringSwitch">
                            Recurring Income
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="col-6 d-flex align-items-end">
                        <div className="form-check form-switch mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="editTaxSwitch"
                            checked={editForm.is_tax_deductible}
                            onChange={(e) => setEditForm(prev => ({ ...prev, is_tax_deductible: e.target.checked }))}
                          />
                          <label className="form-check-label small fw-semibold text-dark" htmlFor="editTaxSwitch">
                            Tax Deductible
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-muted">Notes / Memo</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={editForm.notes}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes or context..."
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-0 py-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border rounded-pill px-3"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-sm"
                  >
                    <i className="bi bi-check-lg me-1"></i> Save Changes
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

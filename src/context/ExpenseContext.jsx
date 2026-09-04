import React, { createContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const ExpenseContext = createContext();

export const DEFAULT_BUDGETS = {
  'Food & Dining': 500,
  'Utilities': 250,
  'Transport': 150,
  'Shopping': 300,
  'Entertainment': 120,
  'Other': 100
};

export const SAMPLE_RECEIPTS = [
  {
    id: 'rec-1',
    merchant: 'Starbucks Reserve',
    amount: 14.50,
    category: 'Food & Dining',
    items: ['1x Nitro Cold Brew ($6.50)', '1x Almond Croissant ($5.50)', 'Tax & Tip ($2.50)'],
    date: new Date().toISOString().split('T')[0],
    color: '#10b981'
  },
  {
    id: 'rec-2',
    merchant: 'Amazon Web Services',
    amount: 184.20,
    category: 'Utilities',
    items: ['EC2 t4g.xlarge ($82.00)', 'RDS MySQL ($64.20)', 'S3 & Data Transfer ($38.00)'],
    date: new Date().toISOString().split('T')[0],
    color: '#6366f1'
  },
  {
    id: 'rec-3',
    merchant: 'Uber Technologies',
    amount: 32.40,
    category: 'Transport',
    items: ['UberX Airport Transit ($28.00)', 'Tolls & Surcharge ($4.40)'],
    date: new Date().toISOString().split('T')[0],
    color: '#06b6d4'
  },
  {
    id: 'rec-4',
    merchant: 'Whole Foods Market',
    amount: 92.75,
    category: 'Food & Dining',
    items: ['Organic Groceries ($68.50)', 'Bakery & Deli ($24.25)'],
    date: new Date().toISOString().split('T')[0],
    color: '#10b981'
  },
  {
    id: 'rec-5',
    merchant: 'Keychron Keyboards',
    amount: 119.00,
    category: 'Shopping',
    items: ['Keychron Q1 Pro Wireless Mechanical Keyboard ($119.00)'],
    date: new Date().toISOString().split('T')[0],
    color: '#f59e0b'
  }
];

export const ExpenseProvider = ({ children }) => {
  // Clean start: 0 demo transactions
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'connected' | 'offline' | 'error'
  const [dbInfo, setDbInfo] = useState({ dbName: 'pro_expense_tracker', host: '127.0.0.1:3306' });
  const [isLoading, setIsLoading] = useState(true);

  // Clear legacy mock data from browser localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If it contains legacy seed IDs, purge it immediately
        if (Array.isArray(parsed) && parsed.some(e => e.id && e.id.toString().startsWith('exp-10'))) {
          localStorage.removeItem('expenses');
        }
      }
    } catch (e) {
      localStorage.removeItem('expenses');
    }
  }, []);

  // Fetch initial data from MySQL Express backend
  const refreshFromDb = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Check health
      const healthRes = await fetch('/api/health');
      if (!healthRes.ok) throw new Error('Health check failed');
      const healthData = await healthRes.json();
      
      setDbStatus(healthData.database === 'connected' ? 'connected' : 'connecting');
      if (healthData.dbName) {
        setDbInfo(prev => ({ ...prev, dbName: healthData.dbName }));
      }

      // 2. Fetch expenses from MySQL
      const expRes = await fetch('/api/expenses');
      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData || []);
        localStorage.setItem('expenses', JSON.stringify(expData || []));
      }

      // 3. Fetch budgets from MySQL
      const budRes = await fetch('/api/budgets');
      if (budRes.ok) {
        const budData = await budRes.json();
        if (budData && Object.keys(budData).length > 0) {
          setBudgets(prev => ({ ...prev, ...budData }));
        }
      }
    } catch (error) {
      console.warn('[ExpenseContext] MySQL Backend offline or unreachable:', error.message);
      setDbStatus('offline');
      // Fallback to local storage
      const saved = localStorage.getItem('expenses');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setExpenses(parsed);
        } catch (e) {}
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  // Sync expenses to localStorage as backup
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    }
  }, [expenses, isLoading]);

  // Sync budgets to localStorage
  useEffect(() => {
    localStorage.setItem('category_budgets', JSON.stringify(budgets));
  }, [budgets]);

  // 1. ADD EXPENSE (MySQL + State)
  const addExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: expense.id || uuidv4(),
      amount: parseFloat(expense.amount || 0)
    };

    // Optimistic UI update
    setExpenses(prev => [newExpense, ...prev]);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
      if (!res.ok) {
        console.error('Failed to save to MySQL');
      }
    } catch (err) {
      console.warn('Backend offline, saved locally only:', err);
      setDbStatus('offline');
    }
  };

  // 2. UPDATE EXPENSE (MySQL + State)
  const updateExpense = async (updatedExpense) => {
    setExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));

    try {
      await fetch(`/api/expenses/${updatedExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExpense)
      });
    } catch (err) {
      console.warn('Failed to update on MySQL server:', err);
    }
  };

  // 3. DELETE EXPENSE (MySQL + State)
  const deleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setExpenses(prev => prev.filter(exp => exp.id !== id));

    try {
      await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Failed to delete on MySQL server:', err);
    }
  };

  // 4. UPDATE BUDGET (MySQL + State)
  const updateBudget = async (category, amount) => {
    const numAmount = parseFloat(amount) || 0;
    setBudgets(prev => ({ ...prev, [category]: numAmount }));

    try {
      await fetch('/api/budgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount: numAmount })
      });
    } catch (err) {
      console.warn('Failed to persist budget to MySQL:', err);
    }
  };

  // 5. CLEAR ALL EXPENSES (MySQL + State)
  const clearAllExpenses = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all expense transactions from MySQL database?')) {
      return;
    }

    setExpenses([]);
    localStorage.removeItem('expenses');

    try {
      await fetch('/api/expenses', {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Failed to clear MySQL expenses table:', err);
    }
  };

  // 6. Reset all data (clear clean state)
  const resetAllData = () => {
    clearAllExpenses();
  };

  return (
    <ExpenseContext.Provider value={{
      expenses,
      budgets,
      dbStatus,
      dbInfo,
      isLoading,
      refreshFromDb,
      addExpense,
      updateExpense,
      deleteExpense,
      updateBudget,
      resetAllData,
      clearAllExpenses,
      sampleReceipts: SAMPLE_RECEIPTS
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};
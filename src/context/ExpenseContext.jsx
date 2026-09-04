import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const ExpenseContext = createContext();

export const CORE_EXPENSE_CATEGORIES = [
  'Room',
  'Food & Drink',
  'Transport',
  'Internet',
  'Other'
];

export const DEFAULT_BUDGET_RATIOS = {
  'Room': 0.35,
  'Food & Drink': 0.25,
  'Transport': 0.15,
  'Internet': 0.05,
  'Other': 0.20
};

export const DEFAULT_BUDGETS = {
  'Room': 600,
  'Food & Drink': 400,
  'Transport': 200,
  'Internet': 60,
  'Other': 240,
  'Food & Dining': 400,
  'Housing & Rent': 600,
  'Utilities': 150,
  'Shopping': 150,
  'Entertainment': 100
};

export const INCOME_SOURCES = [
  'Salary',
  'Freelance',
  'Investments',
  'Business',
  'Rental',
  'Side Hustle',
  'Bonus & Gifts',
  'Other'
];

export const EXPENSE_CATEGORIES = [
  'Room',
  'Food & Drink',
  'Transport',
  'Internet',
  'Other',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Education'
];

export const SAVINGS_CATEGORIES = [
  'Emergency Fund',
  'Travel & Vacation',
  'Retirement',
  'House Down Payment',
  'Vehicle / Car',
  'Gadget & Gear',
  'Education',
  'General Savings'
];

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
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
  const [currency, setCurrency] = useState('$');
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'connected' | 'offline'
  const [dbInfo, setDbInfo] = useState({ dbName: 'pro_expense_tracker', host: '127.0.0.1:3306' });
  const [isLoading, setIsLoading] = useState(true);

  // Load currency preference from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('app_currency');
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  const changeCurrency = (newCurr) => {
    setCurrency(newCurr);
    localStorage.setItem('app_currency', newCurr);
  };

  // Helper currency formatter
  const formatAmount = useCallback((amount) => {
    const num = parseFloat(amount || 0);
    return `${currency}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency]);

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

      // 3. Fetch incomes from MySQL
      const incRes = await fetch('/api/incomes');
      if (incRes.ok) {
        const incData = await incRes.json();
        setIncomes(incData || []);
        localStorage.setItem('incomes', JSON.stringify(incData || []));
      }

      // 4. Fetch savings goals from MySQL
      const goalRes = await fetch('/api/savings-goals');
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setSavingsGoals(goalData || []);
        localStorage.setItem('savings_goals', JSON.stringify(goalData || []));
      }

      // 5. Fetch budgets from MySQL
      const budRes = await fetch('/api/budgets');
      if (budRes.ok) {
        const budData = await budRes.json();
        if (budData && Object.keys(budData).length > 0) {
          setBudgets(prev => ({ ...prev, ...budData }));
        }
      }
    } catch (error) {
      console.warn('[ExpenseContext] MySQL Backend offline, falling back to LocalStorage:', error.message);
      setDbStatus('offline');
      
      // LocalStorage Fallbacks
      try {
        const savedExp = localStorage.getItem('expenses');
        if (savedExp) setExpenses(JSON.parse(savedExp));

        const savedInc = localStorage.getItem('incomes');
        if (savedInc) setIncomes(JSON.parse(savedInc));

        const savedGoals = localStorage.getItem('savings_goals');
        if (savedGoals) setSavingsGoals(JSON.parse(savedGoals));

        const savedBudgets = localStorage.getItem('category_budgets');
        if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
      } catch (e) {
        console.error('Error loading fallback storage', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  // Sync to localStorage as backup
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('expenses', JSON.stringify(expenses));
      localStorage.setItem('incomes', JSON.stringify(incomes));
      localStorage.setItem('savings_goals', JSON.stringify(savingsGoals));
      localStorage.setItem('category_budgets', JSON.stringify(budgets));
    }
  }, [expenses, incomes, savingsGoals, budgets, isLoading]);

  // ================= EXPENSES CRUD =================
  const addExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: expense.id || uuidv4(),
      amount: parseFloat(expense.amount || 0)
    };

    setExpenses(prev => [newExpense, ...prev]);

    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
    } catch (err) {
      console.warn('Backend offline, saved locally only:', err);
      setDbStatus('offline');
    }
  };

  const updateExpense = async (updatedExpense) => {
    setExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));

    try {
      await fetch(`/api/expenses/${updatedExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExpense)
      });
    } catch (err) {
      console.warn('Backend offline, updated locally only:', err);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setExpenses(prev => prev.filter(exp => exp.id !== id));

    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend offline, deleted locally only:', err);
    }
  };

  const clearAllExpenses = async () => {
    if (!window.confirm('Permanently delete all expenses?')) return;
    setExpenses([]);
    localStorage.removeItem('expenses');

    try {
      await fetch('/api/expenses', { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend offline, cleared locally only:', err);
    }
  };

  // ================= INCOMES CRUD =================
  const addIncome = async (income) => {
    const newIncome = {
      ...income,
      id: income.id || uuidv4(),
      amount: parseFloat(income.amount || 0),
      is_recurring: Boolean(income.is_recurring)
    };

    setIncomes(prev => [newIncome, ...prev]);

    try {
      await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncome)
      });
    } catch (err) {
      console.warn('Backend offline, saved locally only:', err);
      setDbStatus('offline');
    }
  };

  const updateIncome = async (updatedIncome) => {
    setIncomes(prev => prev.map(inc => inc.id === updatedIncome.id ? updatedIncome : inc));

    try {
      await fetch(`/api/incomes/${updatedIncome.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedIncome)
      });
    } catch (err) {
      console.warn('Backend offline, updated locally only:', err);
    }
  };

  const deleteIncome = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income entry?')) return;
    setIncomes(prev => prev.filter(inc => inc.id !== id));

    try {
      await fetch(`/api/incomes/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend offline, deleted locally only:', err);
    }
  };

  const clearAllIncomes = async () => {
    if (!window.confirm('Permanently delete all income records?')) return;
    setIncomes([]);
    localStorage.removeItem('incomes');

    try {
      await fetch('/api/incomes', { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend offline, cleared locally only:', err);
    }
  };

  // ================= SAVINGS GOALS CRUD =================
  const addSavingsGoal = async (goal) => {
    const newGoal = {
      ...goal,
      id: goal.id || uuidv4(),
      target_amount: parseFloat(goal.target_amount || 0),
      current_amount: parseFloat(goal.current_amount || 0)
    };

    setSavingsGoals(prev => [newGoal, ...prev]);

    try {
      await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });
    } catch (err) {
      console.warn('Backend offline, saved locally only:', err);
    }
  };

  const updateSavingsGoal = async (updatedGoal) => {
    setSavingsGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));

    try {
      await fetch(`/api/savings-goals/${updatedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGoal)
      });
    } catch (err) {
      console.warn('Backend offline, updated locally only:', err);
    }
  };

  const depositToGoal = async (id, amount) => {
    const depositVal = parseFloat(amount || 0);
    if (isNaN(depositVal) || depositVal === 0) return;

    setSavingsGoals(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, current_amount: Math.max(0, g.current_amount + depositVal) };
      }
      return g;
    }));

    try {
      await fetch(`/api/savings-goals/${id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: depositVal })
      });
    } catch (err) {
      console.warn('Backend offline, deposited locally only:', err);
    }
  };

  const deleteSavingsGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    setSavingsGoals(prev => prev.filter(g => g.id !== id));

    try {
      await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend offline, deleted locally only:', err);
    }
  };

  const clearAllSavingsGoals = async () => {
    if (!window.confirm('Permanently delete all savings goals?')) return;
    setSavingsGoals([]);
    localStorage.removeItem('savings_goals');

    try {
      await fetch('/api/savings-goals', { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend offline, cleared locally only:', err);
    }
  };

  // ================= BUDGETS =================
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
      console.warn('Backend offline, updated locally only:', err);
    }
  };

  // ================= AUTO EXPENSE / BUDGET CALCULATOR =================
  const calculateAutoBudgets = (incomeAmount, savingGoalAmount, customRatios = DEFAULT_BUDGET_RATIOS) => {
    const income = parseFloat(incomeAmount) || 0;
    const savingGoal = parseFloat(savingGoalAmount) || 0;
    const availableExpense = Math.max(0, income - savingGoal);

    const calculated = {};
    Object.entries(customRatios).forEach(([cat, ratio]) => {
      calculated[cat] = Math.round(availableExpense * ratio * 100) / 100;
    });

    return {
      income,
      savingGoal,
      availableExpense,
      categoryBudgets: calculated
    };
  };

  const applyAutoBudgets = async (categoryBudgets) => {
    setBudgets(prev => ({ ...prev, ...categoryBudgets }));
    try {
      for (const [cat, amt] of Object.entries(categoryBudgets)) {
        await fetch('/api/budgets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: cat, amount: parseFloat(amt) })
        });
      }
    } catch (err) {
      console.warn('Backend offline, applied auto budgets locally:', err);
    }
  };

  // ================= SAMPLE DATA GENERATOR =================
  const loadSampleData = async () => {
    const today = new Date();
    const formatDate = (offsetDays) => {
      const d = new Date(today.getTime() - offsetDays * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    };

    const demoIncomes = [
      { id: uuidv4(), title: 'Monthly Base Salary', amount: 3800.00, source: 'Salary', date: formatDate(2), notes: 'Tech Corp direct deposit', is_recurring: true },
      { id: uuidv4(), title: 'Client Web Design Project', amount: 850.00, source: 'Freelance', date: formatDate(8), notes: 'Completed redesign deliverables', is_recurring: false },
      { id: uuidv4(), title: 'Dividend Distribution', amount: 140.00, source: 'Investments', date: formatDate(15), notes: 'Vanguard Index ETF payout', is_recurring: true },
      { id: uuidv4(), title: 'E-commerce Affiliate Store', amount: 260.00, source: 'Side Hustle', date: formatDate(20), notes: 'Online store earnings', is_recurring: false }
    ];

    const demoExpenses = [
      { id: uuidv4(), title: 'Apartment Room Rent', amount: 950.00, category: 'Room', date: formatDate(1), notes: 'Fixed monthly room payment', receipt: null },
      { id: uuidv4(), title: 'Whole Foods Groceries', amount: 135.40, category: 'Food & Drink', date: formatDate(3), notes: 'Fresh produce and ingredients', receipt: SAMPLE_RECEIPTS[3] },
      { id: uuidv4(), title: 'High-speed Fiber Internet', amount: 55.00, category: 'Internet', date: formatDate(5), notes: 'Fiber home connection', receipt: null },
      { id: uuidv4(), title: 'Starbucks Reserve Coffee', amount: 14.50, category: 'Food & Drink', date: formatDate(6), notes: 'Cold brew and pastry', receipt: SAMPLE_RECEIPTS[0] },
      { id: uuidv4(), title: 'Uber Commute Transit', amount: 32.40, category: 'Transport', date: formatDate(8), notes: 'City transit ride', receipt: SAMPLE_RECEIPTS[2] },
      { id: uuidv4(), title: 'Keychron Mechanical Keyboard', amount: 119.00, category: 'Other', date: formatDate(10), notes: 'Ergonomics keyboard upgrade', receipt: SAMPLE_RECEIPTS[4] },
      { id: uuidv4(), title: 'Fuel & Subway Card Reload', amount: 65.00, category: 'Transport', date: formatDate(12), notes: 'Weekly travel pass', receipt: null },
      { id: uuidv4(), title: 'Netflix & Cloud Storage', amount: 32.99, category: 'Internet', date: formatDate(15), notes: 'Online media subscriptions', receipt: null },
      { id: uuidv4(), title: 'Gym Pass & Wellness', amount: 45.00, category: 'Other', date: formatDate(18), notes: 'Monthly fitness dues', receipt: null }
    ];

    const demoGoals = [
      { id: uuidv4(), title: 'Emergency Fund (6 Months)', target_amount: 6000.00, current_amount: 3400.00, target_date: formatDate(-180), category: 'Emergency Fund', color: '#10b981', notes: 'Safety net to cover 6 months essential living expenses.' },
      { id: uuidv4(), title: 'Tokyo Autumn Vacation', target_amount: 2500.00, current_amount: 1250.00, target_date: formatDate(-120), category: 'Travel & Vacation', color: '#6366f1', notes: 'Flights, accommodations, and JR pass in Japan.' },
      { id: uuidv4(), title: 'MacBook Pro M3 Max', target_amount: 1999.00, current_amount: 820.00, target_date: formatDate(-90), category: 'Gadget & Gear', color: '#f59e0b', notes: 'Workstation laptop upgrade for development.' }
    ];

    // Update state
    setIncomes(demoIncomes);
    setExpenses(demoExpenses);
    setSavingsGoals(demoGoals);

    // Persist to MySQL
    try {
      for (const inc of demoIncomes) {
        await fetch('/api/incomes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inc)
        });
      }
      for (const exp of demoExpenses) {
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exp)
        });
      }
      for (const g of demoGoals) {
        await fetch('/api/savings-goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(g)
        });
      }
    } catch (e) {
      console.warn('Saved sample data locally:', e);
    }
  };

  // Reset all
  const resetAllData = async () => {
    if (!window.confirm('Wipe all financial data (Incomes, Expenses, and Goals)?')) return;
    setExpenses([]);
    setIncomes([]);
    setSavingsGoals([]);
    localStorage.removeItem('expenses');
    localStorage.removeItem('incomes');
    localStorage.removeItem('savings_goals');

    try {
      await Promise.all([
        fetch('/api/expenses', { method: 'DELETE' }),
        fetch('/api/incomes', { method: 'DELETE' }),
        fetch('/api/savings-goals', { method: 'DELETE' })
      ]);
    } catch (err) {
      console.warn('Offline wipe completed locally:', err);
    }
  };

  // ================= COMPUTED TOTALS =================
  const totalIncome = useMemo(() => {
    return incomes.reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);
  }, [incomes]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  }, [expenses]);

  const netSavings = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    return Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100);
  }, [totalIncome, totalExpense]);

  const totalBudgetLimit = useMemo(() => {
    return Object.values(budgets).reduce((sum, b) => sum + parseFloat(b || 0), 0);
  }, [budgets]);

  const totalGoalSaved = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
  }, [savingsGoals]);

  const totalGoalTarget = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + parseFloat(g.target_amount || 0), 0);
  }, [savingsGoals]);

  return (
    <ExpenseContext.Provider value={{
      expenses,
      incomes,
      savingsGoals,
      budgets,
      currency,
      changeCurrency,
      formatAmount,
      dbStatus,
      dbInfo,
      isLoading,
      refreshFromDb,
      addExpense,
      updateExpense,
      deleteExpense,
      clearAllExpenses,
      addIncome,
      updateIncome,
      deleteIncome,
      clearAllIncomes,
      addSavingsGoal,
      updateSavingsGoal,
      depositToGoal,
      deleteSavingsGoal,
      clearAllSavingsGoals,
      updateBudget,
      calculateAutoBudgets,
      applyAutoBudgets,
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      totalBudgetLimit,
      totalGoalSaved,
      totalGoalTarget,
      loadSampleData,
      resetAllData,
      coreExpenseCategories: CORE_EXPENSE_CATEGORIES,
      defaultBudgetRatios: DEFAULT_BUDGET_RATIOS,
      sampleReceipts: SAMPLE_RECEIPTS,
      incomeSources: INCOME_SOURCES,
      expenseCategories: EXPENSE_CATEGORIES,
      savingsCategories: SAVINGS_CATEGORIES
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};
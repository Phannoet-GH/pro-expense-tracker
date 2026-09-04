import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UserContext } from './UserContext';

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
    category: 'Food & Drink',
    items: ['1x Nitro Cold Brew ($6.50)', '1x Almond Croissant ($5.50)', 'Tax & Tip ($2.50)'],
    date: new Date().toISOString().split('T')[0],
    color: '#10b981'
  },
  {
    id: 'rec-2',
    merchant: 'Amazon Web Services',
    amount: 184.20,
    category: 'Internet',
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
    category: 'Food & Drink',
    items: ['Organic Groceries ($68.50)', 'Bakery & Deli ($24.25)'],
    date: new Date().toISOString().split('T')[0],
    color: '#10b981'
  },
  {
    id: 'rec-5',
    merchant: 'Keychron Keyboards',
    amount: 119.00,
    category: 'Other',
    items: ['Keychron Q1 Pro Wireless Mechanical Keyboard ($119.00)'],
    date: new Date().toISOString().split('T')[0],
    color: '#f59e0b'
  }
];

export const ExpenseProvider = ({ children }) => {
  const { currentUserId, users, activeRole } = useContext(UserContext) || {
    currentUser: { id: 'user-1', name: 'Sophia Chen', role: 'client' },
    currentUserId: 'user-1',
    users: [],
    activeRole: 'client'
  };

  const [allExpenses, setAllExpenses] = useState([]);
  const [allIncomes, setAllIncomes] = useState([]);
  const [allSavingsGoals, setAllSavingsGoals] = useState([]);
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
        setAllExpenses(expData || []);
        localStorage.setItem('expenses', JSON.stringify(expData || []));
      }

      // 3. Fetch incomes from MySQL
      const incRes = await fetch('/api/incomes');
      if (incRes.ok) {
        const incData = await incRes.json();
        setAllIncomes(incData || []);
        localStorage.setItem('incomes', JSON.stringify(incData || []));
      }

      // 4. Fetch savings goals from MySQL
      const goalRes = await fetch('/api/savings-goals');
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setAllSavingsGoals(goalData || []);
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
        if (savedExp) setAllExpenses(JSON.parse(savedExp));

        const savedInc = localStorage.getItem('incomes');
        if (savedInc) setAllIncomes(JSON.parse(savedInc));

        const savedGoals = localStorage.getItem('savings_goals');
        if (savedGoals) setAllSavingsGoals(JSON.parse(savedGoals));

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
      localStorage.setItem('expenses', JSON.stringify(allExpenses));
      localStorage.setItem('incomes', JSON.stringify(allIncomes));
      localStorage.setItem('savings_goals', JSON.stringify(allSavingsGoals));
      localStorage.setItem('category_budgets', JSON.stringify(budgets));
    }
  }, [allExpenses, allIncomes, allSavingsGoals, budgets, isLoading]);

  // Active client-scoped datasets
  const activeClientExpenses = useMemo(() => {
    if (activeRole === 'admin') return allExpenses;
    return allExpenses.filter(e => e.userId === currentUserId || (!e.userId && currentUserId === 'user-1'));
  }, [allExpenses, activeRole, currentUserId]);

  const activeClientIncomes = useMemo(() => {
    if (activeRole === 'admin') return allIncomes;
    return allIncomes.filter(i => i.userId === currentUserId || (!i.userId && currentUserId === 'user-1'));
  }, [allIncomes, activeRole, currentUserId]);

  const activeClientGoals = useMemo(() => {
    if (activeRole === 'admin') return allSavingsGoals;
    return allSavingsGoals.filter(g => g.userId === currentUserId || (!g.userId && currentUserId === 'user-1'));
  }, [allSavingsGoals, activeRole, currentUserId]);

  // ================= EXPENSES CRUD =================
  const addExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: expense.id || uuidv4(),
      userId: expense.userId || currentUserId || 'user-1',
      amount: parseFloat(expense.amount || 0)
    };

    setAllExpenses(prev => [newExpense, ...prev]);

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
    setAllExpenses(prev => prev.map(e => e.id === updatedExpense.id ? { ...e, ...updatedExpense, amount: parseFloat(updatedExpense.amount) } : e));

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
    setAllExpenses(prev => prev.filter(e => e.id !== id));

    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend offline, deleted locally only:', err);
    }
  };

  const clearAllExpenses = async () => {
    if (activeRole === 'admin') {
      setAllExpenses([]);
      localStorage.removeItem('expenses');
      try {
        await fetch('/api/expenses', { method: 'DELETE' });
      } catch (err) {
        console.warn('Offline clear:', err);
      }
    } else {
      setAllExpenses(prev => prev.filter(e => e.userId !== currentUserId));
    }
  };

  // ================= INCOMES CRUD =================
  const addIncome = async (income) => {
    const newIncome = {
      ...income,
      id: income.id || uuidv4(),
      userId: income.userId || currentUserId || 'user-1',
      amount: parseFloat(income.amount || 0),
      is_recurring: Boolean(income.is_recurring)
    };

    setAllIncomes(prev => [newIncome, ...prev]);

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
    setAllIncomes(prev => prev.map(i => i.id === updatedIncome.id ? { ...i, ...updatedIncome, amount: parseFloat(updatedIncome.amount) } : i));

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
    setAllIncomes(prev => prev.filter(i => i.id !== id));

    try {
      await fetch(`/api/incomes/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend offline, deleted locally only:', err);
    }
  };

  const clearAllIncomes = async () => {
    if (activeRole === 'admin') {
      setAllIncomes([]);
      localStorage.removeItem('incomes');
      try {
        await fetch('/api/incomes', { method: 'DELETE' });
      } catch (err) {
        console.warn('Offline clear:', err);
      }
    } else {
      setAllIncomes(prev => prev.filter(i => i.userId !== currentUserId));
    }
  };

  // ================= SAVINGS GOALS CRUD =================
  const addSavingsGoal = async (goal) => {
    const newGoal = {
      ...goal,
      id: goal.id || uuidv4(),
      userId: goal.userId || currentUserId || 'user-1',
      target_amount: parseFloat(goal.target_amount || 0),
      current_amount: parseFloat(goal.current_amount || 0)
    };

    setAllSavingsGoals(prev => [newGoal, ...prev]);

    try {
      await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });
    } catch (err) {
      console.warn('Backend offline, saved locally only:', err);
      setDbStatus('offline');
    }
  };

  const updateSavingsGoal = async (updatedGoal) => {
    setAllSavingsGoals(prev => prev.map(g => g.id === updatedGoal.id ? {
      ...g,
      ...updatedGoal,
      target_amount: parseFloat(updatedGoal.target_amount),
      current_amount: parseFloat(updatedGoal.current_amount)
    } : g));

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

  const depositToGoal = async (id, depositAmount) => {
    const amt = parseFloat(depositAmount || 0);
    if (amt <= 0) return;

    setAllSavingsGoals(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, current_amount: parseFloat(g.current_amount || 0) + amt };
      }
      return g;
    }));

    try {
      await fetch(`/api/savings-goals/${id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt })
      });
    } catch (err) {
      console.warn('Backend offline, deposited locally only:', err);
    }
  };

  const deleteSavingsGoal = async (id) => {
    setAllSavingsGoals(prev => prev.filter(g => g.id !== id));

    try {
      await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend offline, deleted locally only:', err);
    }
  };

  const clearAllSavingsGoals = async () => {
    if (activeRole === 'admin') {
      setAllSavingsGoals([]);
      localStorage.removeItem('savings_goals');
      try {
        await fetch('/api/savings-goals', { method: 'DELETE' });
      } catch (err) {
        console.warn('Offline clear:', err);
      }
    } else {
      setAllSavingsGoals(prev => prev.filter(g => g.userId !== currentUserId));
    }
  };

  // ================= BUDGETS & AUTO-CALCULATOR =================
  const updateBudget = async (category, amount) => {
    const numAmount = parseFloat(amount || 0);
    setBudgets(prev => ({ ...prev, [category]: numAmount }));

    try {
      await fetch('/api/budgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount: numAmount })
      });
    } catch (err) {
      console.warn('Backend offline, saved budget locally:', err);
    }
  };

  const calculateAutoBudgets = (targetMonthlyIncome, targetMonthlySaving, customRatios = DEFAULT_BUDGET_RATIOS) => {
    const income = Math.max(0, parseFloat(targetMonthlyIncome || 0));
    const savingGoal = Math.max(0, parseFloat(targetMonthlySaving || 0));
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

    // Client 1 (Sophia Chen - UX Designer)
    const sophiaIncomes = [
      { id: uuidv4(), userId: 'user-1', title: 'Monthly Base Salary', amount: 4500.00, source: 'Salary', date: formatDate(2), notes: 'Tech Corp direct deposit', is_recurring: true },
      { id: uuidv4(), userId: 'user-1', title: 'UX Consulting Project', amount: 950.00, source: 'Freelance', date: formatDate(9), notes: 'Design audit deliverables', is_recurring: false },
      { id: uuidv4(), userId: 'user-1', title: 'ETF Dividends', amount: 120.00, source: 'Investments', date: formatDate(15), notes: 'Vanguard Index ETF payout', is_recurring: true }
    ];

    const sophiaExpenses = [
      { id: uuidv4(), userId: 'user-1', title: 'Apartment Room Rent', amount: 950.00, category: 'Room', date: formatDate(1), notes: 'Fixed monthly room payment', receipt: null },
      { id: uuidv4(), userId: 'user-1', title: 'Whole Foods Market Groceries', amount: 135.40, category: 'Food & Drink', date: formatDate(3), notes: 'Fresh produce & ingredients', receipt: SAMPLE_RECEIPTS[3] },
      { id: uuidv4(), userId: 'user-1', title: 'Fiber Home Internet', amount: 55.00, category: 'Internet', date: formatDate(5), notes: 'High-speed fiber connection', receipt: null },
      { id: uuidv4(), userId: 'user-1', title: 'Starbucks Reserve Coffee', amount: 14.50, category: 'Food & Drink', date: formatDate(6), notes: 'Cold brew and pastry', receipt: SAMPLE_RECEIPTS[0] },
      { id: uuidv4(), userId: 'user-1', title: 'Uber Commute', amount: 32.40, category: 'Transport', date: formatDate(8), notes: 'City transit ride', receipt: SAMPLE_RECEIPTS[2] },
      { id: uuidv4(), userId: 'user-1', title: 'Keychron Keyboard', amount: 119.00, category: 'Other', date: formatDate(10), notes: 'Ergonomic keyboard upgrade', receipt: SAMPLE_RECEIPTS[4] },
      { id: uuidv4(), userId: 'user-1', title: 'Fuel & Subway Card', amount: 65.00, category: 'Transport', date: formatDate(12), notes: 'Weekly travel pass', receipt: null },
      { id: uuidv4(), userId: 'user-1', title: 'Gym Membership & Wellness', amount: 45.00, category: 'Other', date: formatDate(18), notes: 'Monthly fitness dues', receipt: null }
    ];

    const sophiaGoals = [
      { id: uuidv4(), userId: 'user-1', title: 'Emergency Fund (6 Months)', target_amount: 6000.00, current_amount: 3500.00, target_date: formatDate(-180), category: 'Emergency Fund', color: '#10b981', notes: 'Safety net to cover living expenses.' },
      { id: uuidv4(), userId: 'user-1', title: 'Tokyo Autumn Vacation', target_amount: 2500.00, current_amount: 1450.00, target_date: formatDate(-120), category: 'Travel & Vacation', color: '#6366f1', notes: 'Flights and accommodations in Japan.' },
      { id: uuidv4(), userId: 'user-1', title: 'MacBook Pro M3 Max', target_amount: 1999.00, current_amount: 920.00, target_date: formatDate(-90), category: 'Gadget & Gear', color: '#f59e0b', notes: 'Workstation laptop upgrade.' }
    ];

    // Client 2 (Marcus Brody - Freelance Architect)
    const marcusIncomes = [
      { id: uuidv4(), userId: 'user-2', title: 'Cloud Architecture Retainer', amount: 3200.00, source: 'Freelance', date: formatDate(4), notes: 'Monthly DevOps architecture retainer', is_recurring: true },
      { id: uuidv4(), userId: 'user-2', title: 'App Migration Bonus', amount: 1000.00, source: 'Bonus & Gifts', date: formatDate(14), notes: 'Completed database cutover', is_recurring: false }
    ];

    const marcusExpenses = [
      { id: uuidv4(), userId: 'user-2', title: 'Studio Room Rent', amount: 800.00, category: 'Room', date: formatDate(2), notes: 'Studio rental', receipt: null },
      { id: uuidv4(), userId: 'user-2', title: 'AWS Cloud Server Hosting', amount: 184.20, category: 'Internet', date: formatDate(4), notes: 'Server cluster for projects', receipt: SAMPLE_RECEIPTS[1] },
      { id: uuidv4(), userId: 'user-2', title: 'Organic Market & Meal Prep', amount: 190.00, category: 'Food & Drink', date: formatDate(7), notes: 'Weekly health meals', receipt: null },
      { id: uuidv4(), userId: 'user-2', title: 'Metro Transit Card', amount: 80.00, category: 'Transport', date: formatDate(11), notes: 'Monthly train pass', receipt: null },
      { id: uuidv4(), userId: 'user-2', title: 'Office Supplies & Monitor Mount', amount: 75.00, category: 'Other', date: formatDate(16), notes: 'Desk accessories', receipt: null }
    ];

    const marcusGoals = [
      { id: uuidv4(), userId: 'user-2', title: 'High-Performance Server Rig', target_amount: 3200.00, current_amount: 1800.00, target_date: formatDate(-150), category: 'Gadget & Gear', color: '#06b6d4', notes: 'Local AI model inference workstation.' }
    ];

    // Client 3 (Elena Rostova - Marketing Director)
    const elenaIncomes = [
      { id: uuidv4(), userId: 'user-3', title: 'Executive Director Salary', amount: 5800.00, source: 'Salary', date: formatDate(1), notes: 'Corporate payroll', is_recurring: true },
      { id: uuidv4(), userId: 'user-3', title: 'Real Estate Rental Inflow', amount: 650.00, source: 'Rental', date: formatDate(10), notes: 'Condo tenant payment', is_recurring: true }
    ];

    const elenaExpenses = [
      { id: uuidv4(), userId: 'user-3', title: 'High-Rise Room Apartment', amount: 1250.00, category: 'Room', date: formatDate(1), notes: 'Downtown luxury flat', receipt: null },
      { id: uuidv4(), userId: 'user-3', title: 'Gourmet Dining & Business Lunch', amount: 285.00, category: 'Food & Drink', date: formatDate(5), notes: 'Client meetings & dinner', receipt: null },
      { id: uuidv4(), userId: 'user-3', title: 'Tesla Supercharging & Tolls', amount: 95.00, category: 'Transport', date: formatDate(8), notes: 'Vehicle commute charging', receipt: null },
      { id: uuidv4(), userId: 'user-3', title: 'Gigabit Business Internet', amount: 85.00, category: 'Internet', date: formatDate(12), notes: 'High-tier internet plan', receipt: null },
      { id: uuidv4(), userId: 'user-3', title: 'MasterClass Annual & Books', amount: 180.00, category: 'Other', date: formatDate(17), notes: 'Executive leadership learning', receipt: null }
    ];

    const elenaGoals = [
      { id: uuidv4(), userId: 'user-3', title: 'Real Estate Down Payment', target_amount: 15000.00, current_amount: 8500.00, target_date: formatDate(-300), category: 'House Down Payment', color: '#8b5cf6', notes: 'Investment property fund.' }
    ];

    const combinedIncomes = [...sophiaIncomes, ...marcusIncomes, ...elenaIncomes];
    const combinedExpenses = [...sophiaExpenses, ...marcusExpenses, ...elenaExpenses];
    const combinedGoals = [...sophiaGoals, ...marcusGoals, ...elenaGoals];

    // Update state
    setAllIncomes(combinedIncomes);
    setAllExpenses(combinedExpenses);
    setAllSavingsGoals(combinedGoals);

    // Persist to MySQL if available
    try {
      for (const inc of combinedIncomes) {
        await fetch('/api/incomes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inc)
        });
      }
      for (const exp of combinedExpenses) {
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exp)
        });
      }
      for (const g of combinedGoals) {
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
    setAllExpenses([]);
    setAllIncomes([]);
    setAllSavingsGoals([]);
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

  // ================= COMPUTED TOTALS (CLIENT-SCOPED) =================
  const totalIncome = useMemo(() => {
    return activeClientIncomes.reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);
  }, [activeClientIncomes]);

  const totalExpense = useMemo(() => {
    return activeClientExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  }, [activeClientExpenses]);

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
    return activeClientGoals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
  }, [activeClientGoals]);

  const totalGoalTarget = useMemo(() => {
    return activeClientGoals.reduce((sum, g) => sum + parseFloat(g.target_amount || 0), 0);
  }, [activeClientGoals]);

  // ================= ADMIN-WIDE METRICS =================
  const adminMetrics = useMemo(() => {
    const clientUsers = (users || []).filter(u => u.role === 'client');
    const totalPlatformIncome = allIncomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const totalPlatformExpenses = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalPlatformVolume = totalPlatformIncome + totalPlatformExpenses;
    const totalPlatformSaved = allSavingsGoals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
    const totalPlatformTarget = allSavingsGoals.reduce((sum, g) => sum + parseFloat(g.target_amount || 0), 0);
    const netPlatformCashFlow = totalPlatformIncome - totalPlatformExpenses;

    // Per user breakdown
    const userStats = {};
    clientUsers.forEach(u => {
      const uInc = allIncomes.filter(i => i.userId === u.id).reduce((s, i) => s + parseFloat(i.amount || 0), 0);
      const uExp = allExpenses.filter(e => e.userId === u.id).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
      const uGoals = allSavingsGoals.filter(g => g.userId === u.id);
      const uSaved = uGoals.reduce((s, g) => s + parseFloat(g.current_amount || 0), 0);
      const txCount = allIncomes.filter(i => i.userId === u.id).length + allExpenses.filter(e => e.userId === u.id).length;

      userStats[u.id] = {
        totalIncome: uInc,
        totalExpense: uExp,
        netSavings: uInc - uExp,
        savingsRate: uInc > 0 ? Math.max(0, ((uInc - uExp) / uInc) * 100) : 0,
        totalSaved: uSaved,
        goalCount: uGoals.length,
        transactionCount: txCount
      };
    });

    return {
      totalClients: clientUsers.length,
      totalPlatformVolume,
      totalPlatformIncome,
      totalPlatformExpenses,
      netPlatformCashFlow,
      totalPlatformSaved,
      totalPlatformTarget,
      totalTransactions: allIncomes.length + allExpenses.length,
      userStats
    };
  }, [allExpenses, allIncomes, allSavingsGoals, users]);

  // Master Audit Trail with Anomaly Flags
  const masterAuditLogs = useMemo(() => {
    const combined = [
      ...allIncomes.map(i => ({
        id: i.id,
        type: 'income',
        title: i.title,
        amount: parseFloat(i.amount || 0),
        category: i.source,
        date: i.date,
        userId: i.userId || 'user-1',
        isAnomaly: parseFloat(i.amount || 0) >= 3000,
        anomalyReason: parseFloat(i.amount || 0) >= 3000 ? 'High-value income deposit' : null
      })),
      ...allExpenses.map(e => ({
        id: e.id,
        type: 'expense',
        title: e.title,
        amount: parseFloat(e.amount || 0),
        category: e.category,
        date: e.date,
        userId: e.userId || 'user-1',
        isAnomaly: parseFloat(e.amount || 0) >= 1000,
        anomalyReason: parseFloat(e.amount || 0) >= 1000 ? 'High-value expense over $1,000' : null
      }))
    ];

    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allExpenses, allIncomes]);

  return (
    <ExpenseContext.Provider value={{
      // Client-scoped datasets
      expenses: activeClientExpenses,
      incomes: activeClientIncomes,
      savingsGoals: activeClientGoals,
      // Platform-wide datasets
      allExpenses,
      allIncomes,
      allSavingsGoals,
      adminMetrics,
      masterAuditLogs,
      // Configuration & DB
      budgets,
      currency,
      changeCurrency,
      formatAmount,
      dbStatus,
      dbInfo,
      isLoading,
      refreshFromDb,
      // CRUD
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
      // Totals (Client-scoped)
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      totalBudgetLimit,
      totalGoalSaved,
      totalGoalTarget,
      // Generators
      loadSampleData,
      resetAllData,
      // Category constants
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

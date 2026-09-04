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
  'Other': 240
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
  'Other'
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
  const { token } = useContext(UserContext) || {};

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
  const [currency, setCurrency] = useState('$');
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'connected' | 'offline'
  const [dbInfo, setDbInfo] = useState({ dbName: 'pro_expense_tracker', host: '127.0.0.1:3306' });
  const [isLoading, setIsLoading] = useState(false);

  // Load currency preference
  useEffect(() => {
    const savedCurrency = localStorage.getItem('app_currency');
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  const changeCurrency = (newCurr) => {
    setCurrency(newCurr);
    localStorage.setItem('app_currency', newCurr);
  };

  const formatAmount = useCallback((amount) => {
    const num = parseFloat(amount || 0);
    return `${currency}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency]);

  // Auth Headers helper
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }, [token]);

  // Fetch data from MySQL for current authenticated user
  const refreshFromDb = useCallback(async () => {
    if (!token) {
      setExpenses([]);
      setIncomes([]);
      setSavingsGoals([]);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Health check
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setDbStatus(healthData.database === 'connected' ? 'connected' : 'connecting');
        if (healthData.dbName) setDbInfo(prev => ({ ...prev, dbName: healthData.dbName }));
      }

      // 2. Fetch authenticated user's private expenses
      const expRes = await fetch('/api/expenses', { headers: getAuthHeaders() });
      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData || []);
      }

      // 3. Fetch authenticated user's private incomes
      const incRes = await fetch('/api/incomes', { headers: getAuthHeaders() });
      if (incRes.ok) {
        const incData = await incRes.json();
        setIncomes(incData || []);
      }

      // 4. Fetch authenticated user's private savings goals
      const goalRes = await fetch('/api/savings-goals', { headers: getAuthHeaders() });
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setSavingsGoals(goalData || []);
      }

      // 5. Fetch default budgets
      const budRes = await fetch('/api/budgets');
      if (budRes.ok) {
        const budData = await budRes.json();
        if (budData && Object.keys(budData).length > 0) {
          setBudgets(prev => ({ ...prev, ...budData }));
        }
      }
    } catch (error) {
      console.warn('[ExpenseContext] API error, checking connection:', error.message);
      setDbStatus('offline');
    } finally {
      setIsLoading(false);
    }
  }, [token, getAuthHeaders]);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

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
        headers: getAuthHeaders(),
        body: JSON.stringify(newExpense)
      });
    } catch (err) {
      console.warn('Expense API offline:', err);
    }
  };

  const updateExpense = async (updatedExpense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? { ...e, ...updatedExpense, amount: parseFloat(updatedExpense.amount) } : e));

    try {
      await fetch(`/api/expenses/${updatedExpense.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedExpense)
      });
    } catch (err) {
      console.warn('Expense API offline:', err);
    }
  };

  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));

    try {
      await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('Expense API offline:', err);
    }
  };

  const clearAllExpenses = async () => {
    setExpenses([]);
    try {
      await fetch('/api/expenses', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('Expense API offline:', err);
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
        headers: getAuthHeaders(),
        body: JSON.stringify(newIncome)
      });
    } catch (err) {
      console.warn('Income API offline:', err);
    }
  };

  const updateIncome = async (updatedIncome) => {
    setIncomes(prev => prev.map(i => i.id === updatedIncome.id ? { ...i, ...updatedIncome, amount: parseFloat(updatedIncome.amount) } : i));

    try {
      await fetch(`/api/incomes/${updatedIncome.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedIncome)
      });
    } catch (err) {
      console.warn('Income API offline:', err);
    }
  };

  const deleteIncome = async (id) => {
    setIncomes(prev => prev.filter(i => i.id !== id));

    try {
      await fetch(`/api/incomes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('Income API offline:', err);
    }
  };

  const clearAllIncomes = async () => {
    setIncomes([]);
    try {
      await fetch('/api/incomes', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('Income API offline:', err);
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
        headers: getAuthHeaders(),
        body: JSON.stringify(newGoal)
      });
    } catch (err) {
      console.warn('Savings goal API offline:', err);
    }
  };

  const updateSavingsGoal = async (updatedGoal) => {
    setSavingsGoals(prev => prev.map(g => g.id === updatedGoal.id ? {
      ...g,
      ...updatedGoal,
      target_amount: parseFloat(updatedGoal.target_amount),
      current_amount: parseFloat(updatedGoal.current_amount)
    } : g));

    try {
      await fetch(`/api/savings-goals/${updatedGoal.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedGoal)
      });
    } catch (err) {
      console.warn('Savings goal API offline:', err);
    }
  };

  const depositToGoal = async (id, depositAmount) => {
    const amt = parseFloat(depositAmount || 0);
    if (amt <= 0) return;

    setSavingsGoals(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, current_amount: parseFloat(g.current_amount || 0) + amt };
      }
      return g;
    }));

    try {
      await fetch(`/api/savings-goals/${id}/deposit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount: amt })
      });
    } catch (err) {
      console.warn('Goal deposit API offline:', err);
    }
  };

  const deleteSavingsGoal = async (id) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));

    try {
      await fetch(`/api/savings-goals/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('Savings goal API offline:', err);
    }
  };

  const clearAllSavingsGoals = async () => {
    setSavingsGoals([]);
    try {
      await fetch('/api/savings-goals', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('Savings goals API offline:', err);
    }
  };

  // ================= BUDGETS & AUTO-CALCULATOR =================
  const updateBudget = async (category, amount) => {
    const numAmount = parseFloat(amount || 0);
    setBudgets(prev => ({ ...prev, [category]: numAmount }));

    try {
      await fetch('/api/budgets', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ category, amount: numAmount })
      });
    } catch (err) {
      console.warn('Budget API offline:', err);
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
          headers: getAuthHeaders(),
          body: JSON.stringify({ category: cat, amount: parseFloat(amt) })
        });
      }
    } catch (err) {
      console.warn('Budget sync offline:', err);
    }
  };

  // Computed Totals for Current User
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

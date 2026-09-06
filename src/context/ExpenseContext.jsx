import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UserContext } from './UserContext';
import { parseResponse, apiFetch } from '../utils/api';
import {
  DEFAULT_EXCHANGE_RATES,
  fetchLiveExchangeRates,
  convertCurrency,
  formatCurrencyAmount,
  getCurrencyMeta
} from '../utils/currency';

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
  const { token, currentUser } = useContext(UserContext) || {};

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('app_currency');
    const symbolMap = { '$': 'USD', '៛': 'KHR', '€': 'EUR', '£': 'GBP', '¥': 'JPY', 'CA$': 'CAD', 'AU$': 'AUD', '฿': 'THB', 'S$': 'SGD', 'CN¥': 'CNY' };
    return symbolMap[saved] || saved || 'USD';
  });

  const [exchangeRates, setExchangeRates] = useState(() => {
    try {
      const cached = localStorage.getItem('sf_exchange_rates');
      return cached ? { ...DEFAULT_EXCHANGE_RATES, ...JSON.parse(cached) } : DEFAULT_EXCHANGE_RATES;
    } catch {
      return DEFAULT_EXCHANGE_RATES;
    }
  });

  const [ratesStatus, setRatesStatus] = useState(() => ({
    lastUpdated: localStorage.getItem('sf_exchange_rates_timestamp') || null,
    source: localStorage.getItem('sf_exchange_rates') ? 'cache' : 'fallback',
    isUpdating: false
  }));

  const [customKhrRate, setCustomKhrRate] = useState(() => {
    return localStorage.getItem('app_custom_khr_rate') || '4100';
  });

  const [dualCurrencyEnabled, setDualCurrencyEnabled] = useState(() => {
    return localStorage.getItem('app_dual_currency') === 'true';
  });

  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'connected' | 'offline'
  const [dbInfo, setDbInfo] = useState({ dbName: 'pro_expense_tracker', host: '127.0.0.1:3306' });
  const [isLoading, setIsLoading] = useState(false);

  const userStorageKey = currentUser?.id || 'guest';

  // Fetch live exchange rates on initial load silently
  useEffect(() => {
    let isMounted = true;
    fetchLiveExchangeRates().then(result => {
      if (!isMounted) return;
      if (result && result.rates) {
        setExchangeRates(result.rates);
        setRatesStatus({
          lastUpdated: result.lastUpdated,
          source: result.source,
          isUpdating: false
        });
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Persist state to localStorage when offline
  useEffect(() => {
    if (userStorageKey && dbStatus === 'offline' && !isLoading) {
      localStorage.setItem(`smartfinance_expenses_${userStorageKey}`, JSON.stringify(expenses));
    }
  }, [expenses, userStorageKey, dbStatus, isLoading]);

  useEffect(() => {
    if (userStorageKey && dbStatus === 'offline' && !isLoading) {
      localStorage.setItem(`smartfinance_incomes_${userStorageKey}`, JSON.stringify(incomes));
    }
  }, [incomes, userStorageKey, dbStatus, isLoading]);

  useEffect(() => {
    if (userStorageKey && dbStatus === 'offline' && !isLoading) {
      localStorage.setItem(`smartfinance_goals_${userStorageKey}`, JSON.stringify(savingsGoals));
    }
  }, [savingsGoals, userStorageKey, dbStatus, isLoading]);

  useEffect(() => {
    if (userStorageKey && dbStatus === 'offline' && !isLoading && budgets) {
      localStorage.setItem(`smartfinance_budgets_${userStorageKey}`, JSON.stringify(budgets));
    }
  }, [budgets, userStorageKey, dbStatus, isLoading]);

  const refreshExchangeRates = useCallback(async () => {
    setRatesStatus(prev => ({ ...prev, isUpdating: true }));
    try {
      const result = await fetchLiveExchangeRates();
      if (result && result.rates) {
        setExchangeRates(result.rates);
        setRatesStatus({
          lastUpdated: result.lastUpdated,
          source: result.source,
          isUpdating: false
        });
        return { success: true, ...result };
      }
      return { success: false, error: 'No rates received' };
    } catch (err) {
      setRatesStatus(prev => ({ ...prev, isUpdating: false }));
      return { success: false, error: err.message };
    }
  }, []);

  const changeCurrency = useCallback((newCurr) => {
    const symbolMap = { '$': 'USD', '៛': 'KHR', '€': 'EUR', '£': 'GBP', '¥': 'JPY', 'CA$': 'CAD', 'AU$': 'AUD', '฿': 'THB', 'S$': 'SGD', 'CN¥': 'CNY' };
    const code = symbolMap[newCurr] || newCurr || 'USD';
    setCurrency(code);
    localStorage.setItem('app_currency', code);
  }, []);

  const updateCustomKhrRate = useCallback((rate) => {
    const cleanRate = String(rate).replace(/[^0-9.]/g, '');
    setCustomKhrRate(cleanRate);
    localStorage.setItem('app_custom_khr_rate', cleanRate);
  }, []);

  const toggleDualCurrency = useCallback((val) => {
    const nextVal = typeof val === 'boolean' ? val : !dualCurrencyEnabled;
    setDualCurrencyEnabled(nextVal);
    localStorage.setItem('app_dual_currency', nextVal ? 'true' : 'false');
  }, [dualCurrencyEnabled]);

  const convertAmount = useCallback((amount, targetCurr = currency, fromCurr = 'USD') => {
    return convertCurrency(amount, fromCurr, targetCurr, exchangeRates, customKhrRate);
  }, [currency, exchangeRates, customKhrRate]);

  const formatAmount = useCallback((amount, overrideCurrency = null) => {
    const targetCurr = overrideCurrency || currency;
    return formatCurrencyAmount(amount, targetCurr, exchangeRates, {
      fromCurrency: 'USD',
      customKhrRate
    });
  }, [currency, exchangeRates, customKhrRate]);

  const currencySymbol = useMemo(() => {
    return getCurrencyMeta(currency).symbol;
  }, [currency]);

  // Auth Headers helper
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }, [token]);

  // Fetch data from MySQL for current authenticated user or load from localStorage
  const refreshFromDb = useCallback(async () => {
    if (!token) {
      setExpenses([]);
      setIncomes([]);
      setSavingsGoals([]);
      setBudgets(DEFAULT_BUDGETS);
      return;
    }

    setIsLoading(true);
    let isBackendAlive = false;

    try {
      // 1. Health check
      const healthRes = await apiFetch('/api/health');
      const { ok: healthOk, data: healthData, isOffline, isHtml } = await parseResponse(healthRes);
      if (healthOk && healthData && !isOffline && !isHtml && healthData.database === 'connected') {
        isBackendAlive = true;
        setDbStatus('connected');
        if (healthData.dbName) setDbInfo(prev => ({ ...prev, dbName: healthData.dbName, host: healthData.host || prev.host }));
      } else {
        setDbStatus('offline');
      }
    } catch {
      setDbStatus('offline');
    }

    if (isBackendAlive) {
      try {
        // 2. Fetch authenticated user's private expenses
        const expRes = await apiFetch('/api/expenses', { headers: getAuthHeaders() });
        const { ok: expOk, data: expData } = await parseResponse(expRes);
        if (expOk && Array.isArray(expData)) setExpenses(expData);

        // 3. Fetch authenticated user's private incomes
        const incRes = await apiFetch('/api/incomes', { headers: getAuthHeaders() });
        const { ok: incOk, data: incData } = await parseResponse(incRes);
        if (incOk && Array.isArray(incData)) setIncomes(incData);

        // 4. Fetch authenticated user's private savings goals
        const goalRes = await apiFetch('/api/savings-goals', { headers: getAuthHeaders() });
        const { ok: goalOk, data: goalData } = await parseResponse(goalRes);
        if (goalOk && Array.isArray(goalData)) setSavingsGoals(goalData);

        // 5. Fetch authenticated user's isolated category budgets (or default benchmarks)
        const budRes = await apiFetch('/api/budgets', { headers: getAuthHeaders() });
        const { ok: budOk, data: budData } = await parseResponse(budRes);
        if (budOk && budData && typeof budData === 'object' && Object.keys(budData).length > 0) {
          setBudgets({ ...DEFAULT_BUDGETS, ...budData });
        } else {
          setBudgets(DEFAULT_BUDGETS);
        }
      } catch (error) {
        console.warn('[ExpenseContext] Online sync error:', error.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Backend is offline: load from LocalStorage
    const userId = currentUser?.id || 'guest';
    const localExpenses = localStorage.getItem(`smartfinance_expenses_${userId}`);
    const localIncomes = localStorage.getItem(`smartfinance_incomes_${userId}`);
    const localGoals = localStorage.getItem(`smartfinance_goals_${userId}`);
    const localBudgets = localStorage.getItem(`smartfinance_budgets_${userId}`);

    if (localExpenses) {
      try { setExpenses(JSON.parse(localExpenses)); } catch {}
    } else {
      const initialDemoExpenses = [
        {
          id: 'exp-1',
          title: 'Starbucks Nitro Cold Brew & Snacks',
          amount: 14.50,
          category: 'Food & Drink',
          date: new Date().toISOString().split('T')[0],
          description: 'Nitro Cold Brew & Almond Croissant',
          is_tax_deductible: false,
          tax_category: 'Personal'
        },
        {
          id: 'exp-2',
          title: 'High-speed Fiber Internet',
          amount: 60.00,
          category: 'Internet',
          date: new Date().toISOString().split('T')[0],
          description: 'Monthly fiber broadband',
          is_tax_deductible: true,
          tax_category: 'Work Utility'
        },
        {
          id: 'exp-3',
          title: 'Studio Apartment Rental',
          amount: 550.00,
          category: 'Room',
          date: new Date().toISOString().split('T')[0],
          description: 'Monthly housing allowance',
          is_tax_deductible: false,
          tax_category: 'Housing'
        }
      ];
      setExpenses(initialDemoExpenses);
      localStorage.setItem(`smartfinance_expenses_${userId}`, JSON.stringify(initialDemoExpenses));
    }

    if (localIncomes) {
      try { setIncomes(JSON.parse(localIncomes)); } catch {}
    } else {
      const initialDemoIncomes = [
        {
          id: 'inc-1',
          source: 'Primary Employment Salary',
          amount: 3200.00,
          date: new Date().toISOString().split('T')[0],
          is_recurring: true,
          notes: 'Bi-weekly direct payroll deposit'
        }
      ];
      setIncomes(initialDemoIncomes);
      localStorage.setItem(`smartfinance_incomes_${userId}`, JSON.stringify(initialDemoIncomes));
    }

    if (localGoals) {
      try { setSavingsGoals(JSON.parse(localGoals)); } catch {}
    } else {
      const initialDemoGoals = [
        {
          id: 'goal-1',
          title: 'Emergency Rainy Day Fund',
          target_amount: 5000.00,
          current_amount: 2200.00,
          target_date: '2026-12-31',
          category: 'Emergency Fund',
          priority: 'high',
          color: '#10b981'
        },
        {
          id: 'goal-2',
          title: 'Vacation & Travel',
          target_amount: 1500.00,
          current_amount: 650.00,
          target_date: '2026-11-20',
          category: 'Travel & Vacation',
          priority: 'medium',
          color: '#3b82f6'
        }
      ];
      setSavingsGoals(initialDemoGoals);
      localStorage.setItem(`smartfinance_goals_${userId}`, JSON.stringify(initialDemoGoals));
    }

    if (localBudgets) {
      try {
        setBudgets({ ...DEFAULT_BUDGETS, ...JSON.parse(localBudgets) });
      } catch {
        setBudgets(DEFAULT_BUDGETS);
      }
    } else {
      setBudgets(DEFAULT_BUDGETS);
    }

    setIsLoading(false);
  }, [token, currentUser?.id, getAuthHeaders]);

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
      await apiFetch('/api/expenses', {
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
      await apiFetch(`/api/expenses/${updatedExpense.id}`, {
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
      await apiFetch(`/api/expenses/${id}`, {
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
      await apiFetch('/api/expenses', {
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
      await apiFetch('/api/incomes', {
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
      await apiFetch(`/api/incomes/${updatedIncome.id}`, {
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
      await apiFetch(`/api/incomes/${id}`, {
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
      await apiFetch('/api/incomes', {
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
      await apiFetch('/api/savings-goals', {
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
      await apiFetch(`/api/savings-goals/${updatedGoal.id}`, {
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
      await apiFetch(`/api/savings-goals/${id}/deposit`, {
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
      await apiFetch(`/api/savings-goals/${id}`, {
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
      await apiFetch('/api/savings-goals', {
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
    setBudgets(prev => {
      const next = { ...prev, [category]: numAmount };
      if (userStorageKey) {
        try { localStorage.setItem(`smartfinance_budgets_${userStorageKey}`, JSON.stringify(next)); } catch {}
      }
      return next;
    });

    try {
      await apiFetch('/api/budgets', {
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
    setBudgets(prev => {
      const next = { ...prev, ...categoryBudgets };
      if (userStorageKey) {
        try { localStorage.setItem(`smartfinance_budgets_${userStorageKey}`, JSON.stringify(next)); } catch {}
      }
      return next;
    });
    try {
      await apiFetch('/api/budgets', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ budgets: categoryBudgets })
      });
    } catch (err) {
      console.warn('Budget sync offline:', err);
    }
  };

  const resetBudgets = async () => {
    setBudgets(DEFAULT_BUDGETS);
    if (userStorageKey) {
      try { localStorage.removeItem(`smartfinance_budgets_${userStorageKey}`); } catch {}
    }
    try {
      await apiFetch('/api/budgets', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('Budget reset offline:', err);
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

  const resetAllData = async () => {
    if (userStorageKey) {
      localStorage.removeItem(`smartfinance_expenses_${userStorageKey}`);
      localStorage.removeItem(`smartfinance_incomes_${userStorageKey}`);
      localStorage.removeItem(`smartfinance_goals_${userStorageKey}`);
      localStorage.removeItem(`smartfinance_budgets_${userStorageKey}`);
    }
    await resetBudgets();
    await clearAllExpenses();
    await clearAllIncomes();
    await clearAllSavingsGoals();
  };

  return (
    <ExpenseContext.Provider value={{
      expenses,
      incomes,
      savingsGoals,
      allExpenses: expenses,
      allIncomes: incomes,
      allSavingsGoals: savingsGoals,
      budgets,
      currency,
      currencySymbol,
      changeCurrency,
      formatAmount,
      exchangeRates,
      ratesStatus,
      refreshExchangeRates,
      customKhrRate,
      updateCustomKhrRate,
      dualCurrencyEnabled,
      toggleDualCurrency,
      convertAmount,
      dbStatus,
      dbInfo,
      isLoading,
      refreshFromDb,
      resetAllData,
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
      resetBudgets,
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

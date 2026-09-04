import React, { createContext, useState, useEffect } from 'react';
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
    date: '2026-08-28',
    color: '#10b981'
  },
  {
    id: 'rec-2',
    merchant: 'Amazon Web Services',
    amount: 184.20,
    category: 'Utilities',
    items: ['EC2 t4g.xlarge ($82.00)', 'RDS PostgreSQL ($64.20)', 'S3 & Data Transfer ($38.00)'],
    date: '2026-08-25',
    color: '#6366f1'
  },
  {
    id: 'rec-3',
    merchant: 'Uber Technologies',
    amount: 32.40,
    category: 'Transport',
    items: ['UberX Airport Transit ($28.00)', 'Tolls & Surcharge ($4.40)'],
    date: '2026-08-27',
    color: '#06b6d4'
  },
  {
    id: 'rec-4',
    merchant: 'Whole Foods Market',
    amount: 92.75,
    category: 'Food & Dining',
    items: ['Organic Groceries ($68.50)', 'Bakery & Deli ($24.25)'],
    date: '2026-08-29',
    color: '#10b981'
  },
  {
    id: 'rec-5',
    merchant: 'Keychron Keyboards',
    amount: 119.00,
    category: 'Shopping',
    items: ['Keychron Q1 Pro Wireless Mechanical Keyboard ($119.00)'],
    date: '2026-08-20',
    color: '#f59e0b'
  }
];

const SEED_EXPENSES = [
  {
    id: 'exp-101',
    title: 'AWS Cloud Infrastructure',
    date: '2026-08-25',
    category: 'Utilities',
    amount: 184.20,
    notes: 'Monthly production servers and RDS database hosting',
    receipt: SAMPLE_RECEIPTS[1]
  },
  {
    id: 'exp-102',
    title: 'Whole Foods Weekly Groceries',
    date: '2026-08-29',
    category: 'Food & Dining',
    amount: 92.75,
    notes: 'Produce and pantry essentials',
    receipt: SAMPLE_RECEIPTS[3]
  },
  {
    id: 'exp-103',
    title: 'Airport Ride to Tech Summit',
    date: '2026-08-27',
    category: 'Transport',
    amount: 32.40,
    notes: 'Uber ride from downtown to terminal 2',
    receipt: SAMPLE_RECEIPTS[2]
  },
  {
    id: 'exp-104',
    title: 'Team Coffee & Pastries',
    date: '2026-08-28',
    category: 'Food & Dining',
    amount: 14.50,
    notes: 'Sprint planning catch-up at Starbucks',
    receipt: SAMPLE_RECEIPTS[0]
  },
  {
    id: 'exp-105',
    title: 'Ergonomic Mechanical Keyboard',
    date: '2026-08-20',
    category: 'Shopping',
    amount: 119.00,
    notes: 'Remote home office equipment upgrade',
    receipt: SAMPLE_RECEIPTS[4]
  },
  {
    id: 'exp-106',
    title: 'Cinema & IMAX Tickets',
    date: '2026-08-18',
    category: 'Entertainment',
    amount: 38.00,
    notes: 'Weekend movie with friends',
    receipt: null
  }
];

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback to seed
      }
    }
    return SEED_EXPENSES;
  });

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('category_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_BUDGETS;
  });

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('category_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const addExpense = (expense) => {
    setExpenses(prev => [{ ...expense, id: uuidv4() }, ...prev]);
  };

  const updateExpense = (updatedExpense) => {
    setExpenses(expenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));
  };

  const deleteExpense = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  const updateBudget = (category, amount) => {
    setBudgets(prev => ({ ...prev, [category]: parseFloat(amount) || 0 }));
  };

  const resetAllData = () => {
    if (window.confirm('Reset all expense data and recurring budgets back to seed demo?')) {
      setExpenses(SEED_EXPENSES);
      setBudgets(DEFAULT_BUDGETS);
    }
  };

  const clearAllExpenses = () => {
    if (window.confirm('Are you sure you want to permanently delete all data?')) {
      setExpenses([]);
    }
  };

  return (
    <ExpenseContext.Provider value={{
      expenses,
      budgets,
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
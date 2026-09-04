import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase, getPool } from './db.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/api/health', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(503).json({ status: 'connecting', database: 'initializing' });
    }
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      dbName: 'pro_expense_tracker',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. GET all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM expenses ORDER BY date DESC, created_at DESC');
    const expenses = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      date: typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0],
      receipt: typeof r.receipt === 'string' ? JSON.parse(r.receipt) : r.receipt
    }));
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// 3. POST new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const pool = getPool();
    const { id, title, amount, category, date, notes, receipt } = req.body;

    if (!title || amount === undefined || !category || !date) {
      return res.status(400).json({ error: 'Missing required expense fields' });
    }

    const receiptJson = receipt ? JSON.stringify(receipt) : null;

    await pool.query(
      `INSERT INTO expenses (id, title, amount, category, date, notes, receipt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, title, parseFloat(amount), category, date, notes || null, receiptJson]
    );

    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to save expense' });
  }
});

// 4. PUT update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { title, amount, category, date, notes, receipt } = req.body;

    const receiptJson = receipt ? JSON.stringify(receipt) : null;

    await pool.query(
      `UPDATE expenses
       SET title = ?, amount = ?, category = ?, date = ?, notes = ?, receipt = ?
       WHERE id = ?`,
      [title, parseFloat(amount), category, date, notes || null, receiptJson, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// 5. DELETE single expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// 6. DELETE all expenses (Clear data)
app.delete('/api/expenses', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM expenses');
    res.json({ success: true, message: 'All expenses cleared' });
  } catch (error) {
    console.error('Error clearing expenses:', error);
    res.status(500).json({ error: 'Failed to clear expenses' });
  }
});

// 7. GET budgets
app.get('/api/budgets', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM budgets');
    const budgets = {};
    rows.forEach(r => {
      budgets[r.category] = parseFloat(r.amount);
    });
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// 8. PUT budget
app.put('/api/budgets', async (req, res) => {
  try {
    const pool = getPool();
    const { category, amount } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    await pool.query(
      `INSERT INTO budgets (category, amount)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [category, parseFloat(amount) || 0]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// ==========================================
// 9. INCOMES API
// ==========================================

// GET all incomes
app.get('/api/incomes', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM incomes ORDER BY date DESC, created_at DESC');
    const incomes = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      date: typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0],
      is_recurring: Boolean(r.is_recurring)
    }));
    res.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
});

// POST new income
app.post('/api/incomes', async (req, res) => {
  try {
    const pool = getPool();
    const { id, title, amount, source, date, notes, is_recurring } = req.body;

    if (!title || amount === undefined || !source || !date) {
      return res.status(400).json({ error: 'Missing required income fields' });
    }

    await pool.query(
      `INSERT INTO incomes (id, title, amount, source, date, notes, is_recurring)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, title, parseFloat(amount), source, date, notes || null, is_recurring ? 1 : 0]
    );

    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Failed to save income' });
  }
});

// PUT update income
app.put('/api/incomes/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { title, amount, source, date, notes, is_recurring } = req.body;

    await pool.query(
      `UPDATE incomes
       SET title = ?, amount = ?, source = ?, date = ?, notes = ?, is_recurring = ?
       WHERE id = ?`,
      [title, parseFloat(amount), source, date, notes || null, is_recurring ? 1 : 0, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ error: 'Failed to update income' });
  }
});

// DELETE single income
app.delete('/api/incomes/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query('DELETE FROM incomes WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

// DELETE all incomes (Clear data)
app.delete('/api/incomes', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM incomes');
    res.json({ success: true, message: 'All incomes cleared' });
  } catch (error) {
    console.error('Error clearing incomes:', error);
    res.status(500).json({ error: 'Failed to clear incomes' });
  }
});

// ==========================================
// 10. SAVINGS GOALS API
// ==========================================

// GET all savings goals
app.get('/api/savings-goals', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM savings_goals ORDER BY created_at DESC');
    const goals = rows.map(r => ({
      ...r,
      target_amount: parseFloat(r.target_amount),
      current_amount: parseFloat(r.current_amount || 0),
      target_date: r.target_date ? (typeof r.target_date === 'string' ? r.target_date : new Date(r.target_date).toISOString().split('T')[0]) : null
    }));
    res.json(goals);
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    res.status(500).json({ error: 'Failed to fetch savings goals' });
  }
});

// POST new savings goal
app.post('/api/savings-goals', async (req, res) => {
  try {
    const pool = getPool();
    const { id, title, target_amount, current_amount, target_date, category, color, notes } = req.body;

    if (!title || target_amount === undefined) {
      return res.status(400).json({ error: 'Title and target amount are required' });
    }

    await pool.query(
      `INSERT INTO savings_goals (id, title, target_amount, current_amount, target_date, category, color, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        parseFloat(target_amount),
        parseFloat(current_amount || 0),
        target_date || null,
        category || 'General Savings',
        color || '#0d6efd',
        notes || null
      ]
    );

    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error creating savings goal:', error);
    res.status(500).json({ error: 'Failed to save savings goal' });
  }
});

// PUT update savings goal
app.put('/api/savings-goals/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { title, target_amount, current_amount, target_date, category, color, notes } = req.body;

    await pool.query(
      `UPDATE savings_goals
       SET title = ?, target_amount = ?, current_amount = ?, target_date = ?, category = ?, color = ?, notes = ?
       WHERE id = ?`,
      [
        title,
        parseFloat(target_amount),
        parseFloat(current_amount || 0),
        target_date || null,
        category || 'General Savings',
        color || '#0d6efd',
        notes || null,
        id
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating savings goal:', error);
    res.status(500).json({ error: 'Failed to update savings goal' });
  }
});

// POST deposit/withdraw into savings goal
app.post('/api/savings-goals/:id/deposit', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { amount } = req.body;
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount)) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    await pool.query(
      `UPDATE savings_goals
       SET current_amount = GREATEST(0, current_amount + ?)
       WHERE id = ?`,
      [depositAmount, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error depositing to savings goal:', error);
    res.status(500).json({ error: 'Failed to deposit to savings goal' });
  }
});

// DELETE single savings goal
app.delete('/api/savings-goals/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query('DELETE FROM savings_goals WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting savings goal:', error);
    res.status(500).json({ error: 'Failed to delete savings goal' });
  }
});

// DELETE all savings goals
app.delete('/api/savings-goals', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM savings_goals');
    res.json({ success: true, message: 'All savings goals cleared' });
  } catch (error) {
    console.error('Error clearing savings goals:', error);
    res.status(500).json({ error: 'Failed to clear savings goals' });
  }
});

// ==========================================
// 11. FINANCIAL SUMMARY API
// ==========================================
app.get('/api/financial-summary', async (req, res) => {
  try {
    const pool = getPool();
    const [expRows] = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total_expense FROM expenses');
    const [incRows] = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total_income FROM incomes');
    const [goalRows] = await pool.query('SELECT COALESCE(SUM(current_amount), 0) AS total_saved, COALESCE(SUM(target_amount), 0) AS total_target FROM savings_goals');

    const totalExpense = parseFloat(expRows[0].total_expense || 0);
    const totalIncome = parseFloat(incRows[0].total_income || 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    res.json({
      totalExpense,
      totalIncome,
      netSavings,
      savingsRate: Math.max(0, savingsRate),
      totalSaved: parseFloat(goalRows[0].total_saved || 0),
      totalTarget: parseFloat(goalRows[0].total_target || 0)
    });
  } catch (error) {
    console.error('Error getting financial summary:', error);
    res.status(500).json({ error: 'Failed to get financial summary' });
  }
});

// ==========================================
// 12. USERS & ADMIN API
// ==========================================
app.get('/api/users', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const pool = getPool();
    const { id, name, email, role, title, avatar, status, monthly_target_income, target_savings_rate } = req.body;
    await pool.query(
      `INSERT INTO users (id, name, email, role, title, avatar, status, monthly_target_income, target_savings_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), role=VALUES(role), title=VALUES(title),
       avatar=VALUES(avatar), status=VALUES(status), monthly_target_income=VALUES(monthly_target_income), target_savings_rate=VALUES(target_savings_rate)`,
      [id, name, email, role || 'client', title || 'Client', avatar || null, status || 'active', parseFloat(monthly_target_income || 0), parseFloat(target_savings_rate || 20)]
    );
    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Initialize DB and launch server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Pro Expense Tracker API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Fatal: Could not connect to MySQL:', err.message);
  process.exit(1);
});


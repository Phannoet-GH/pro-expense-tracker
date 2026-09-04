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

// Initialize DB and launch server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Pro Expense Tracker API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Fatal: Could not connect to MySQL:', err.message);
  process.exit(1);
});

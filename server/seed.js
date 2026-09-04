import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'pro_expense_tracker'
};

async function seed() {
  const pool = mysql.createPool(DB_CONFIG);
  console.log('🌱 Starting MySQL database seed...');

  // Ensure user_id column exists on older tables
  try {
    await pool.query("ALTER TABLE incomes ADD COLUMN user_id VARCHAR(64) DEFAULT 'user-1'");
  } catch (e) { /* ignore */ }
  try {
    await pool.query("ALTER TABLE expenses ADD COLUMN user_id VARCHAR(64) DEFAULT 'user-1'");
  } catch (e) { /* ignore */ }
  try {
    await pool.query("ALTER TABLE savings_goals ADD COLUMN user_id VARCHAR(64) DEFAULT 'user-1'");
  } catch (e) { /* ignore */ }

  const today = new Date();
  const formatDate = (daysAgo) => {
    const d = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  // 1. Seed Users
  const users = [
    {
      id: 'user-admin',
      name: 'Alex Vance',
      email: 'alex.vance@smartfinance.pro',
      role: 'admin',
      title: 'Lead System Administrator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      monthly_target_income: 8000,
      target_savings_rate: 35
    },
    {
      id: 'user-1',
      name: 'Sophia Chen',
      email: 'sophia.chen@example.com',
      role: 'client',
      title: 'Senior UX Designer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      monthly_target_income: 5500,
      target_savings_rate: 25
    },
    {
      id: 'user-2',
      name: 'Marcus Brody',
      email: 'marcus.brody@example.com',
      role: 'client',
      title: 'Freelance Software Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      monthly_target_income: 4200,
      target_savings_rate: 20
    },
    {
      id: 'user-3',
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      role: 'client',
      title: 'Marketing Director',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      monthly_target_income: 6200,
      target_savings_rate: 30
    }
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, name, email, role, title, avatar, status, monthly_target_income, target_savings_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), role=VALUES(role), title=VALUES(title),
       avatar=VALUES(avatar), status=VALUES(status), monthly_target_income=VALUES(monthly_target_income), target_savings_rate=VALUES(target_savings_rate)`,
      [u.id, u.name, u.email, u.role, u.title, u.avatar, u.status, u.monthly_target_income, u.target_savings_rate]
    );
  }
  console.log(`✅ Seeded ${users.length} users`);

  // 2. Seed Budgets
  const budgets = [
    ['Room', 600],
    ['Food & Drink', 400],
    ['Transport', 200],
    ['Internet', 60],
    ['Other', 240]
  ];

  for (const [cat, amt] of budgets) {
    await pool.query(
      `INSERT INTO budgets (category, amount) VALUES (?, ?) ON DUPLICATE KEY UPDATE amount=VALUES(amount)`,
      [cat, amt]
    );
  }
  console.log('✅ Seeded default budgets');

  // 3. Seed Incomes
  const incomes = [
    // Sophia Chen
    { id: 'inc-1', user_id: 'user-1', title: 'Monthly Base Salary', amount: 4500.00, source: 'Salary', date: formatDate(2), notes: 'Tech Corp direct deposit', is_recurring: 1 },
    { id: 'inc-2', user_id: 'user-1', title: 'UX Consulting Project', amount: 950.00, source: 'Freelance', date: formatDate(8), notes: 'Design audit deliverables', is_recurring: 0 },
    { id: 'inc-3', user_id: 'user-1', title: 'Index ETF Dividends', amount: 120.00, source: 'Investments', date: formatDate(15), notes: 'Quarterly payout', is_recurring: 1 },
    // Marcus Brody
    { id: 'inc-4', user_id: 'user-2', title: 'Cloud Architecture Retainer', amount: 3200.00, source: 'Freelance', date: formatDate(3), notes: 'Monthly DevOps architecture retainer', is_recurring: 1 },
    { id: 'inc-5', user_id: 'user-2', title: 'Database Cutover Milestone', amount: 1000.00, source: 'Bonus & Gifts', date: formatDate(12), notes: 'Production cutover success bonus', is_recurring: 0 },
    // Elena Rostova
    { id: 'inc-6', user_id: 'user-3', title: 'Executive Director Payroll', amount: 5800.00, source: 'Salary', date: formatDate(1), notes: 'Executive corporate payroll', is_recurring: 1 },
    { id: 'inc-7', user_id: 'user-3', title: 'Real Estate Rental Inflow', amount: 650.00, source: 'Rental', date: formatDate(10), notes: 'Condo tenant payment', is_recurring: 1 }
  ];

  for (const inc of incomes) {
    await pool.query(
      `INSERT INTO incomes (id, user_id, title, amount, source, date, notes, is_recurring)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), amount=VALUES(amount), source=VALUES(source), date=VALUES(date), notes=VALUES(notes)` ,
      [inc.id, inc.user_id, inc.title, inc.amount, inc.source, inc.date, inc.notes, inc.is_recurring]
    );
  }
  console.log(`✅ Seeded ${incomes.length} incomes`);

  // 4. Seed Expenses
  const expenses = [
    // Sophia Chen (user-1)
    { id: 'exp-1', user_id: 'user-1', title: 'Apartment Room Rent', amount: 950.00, category: 'Room', date: formatDate(1), notes: 'Monthly housing rent' },
    { id: 'exp-2', user_id: 'user-1', title: 'Whole Foods Market Groceries', amount: 135.40, category: 'Food & Drink', date: formatDate(3), notes: 'Fresh groceries & ingredients' },
    { id: 'exp-3', user_id: 'user-1', title: 'Fiber Home Internet', amount: 55.00, category: 'Internet', date: formatDate(5), notes: 'High-speed fiber connection' },
    { id: 'exp-4', user_id: 'user-1', title: 'Starbucks Reserve Coffee', amount: 14.50, category: 'Food & Drink', date: formatDate(6), notes: 'Cold brew and pastry' },
    { id: 'exp-5', user_id: 'user-1', title: 'Uber Commute', amount: 32.40, category: 'Transport', date: formatDate(8), notes: 'City transit ride' },
    { id: 'exp-6', user_id: 'user-1', title: 'Keychron Keyboard', amount: 119.00, category: 'Other', date: formatDate(10), notes: 'Ergonomic keyboard upgrade' },
    { id: 'exp-7', user_id: 'user-1', title: 'Subway Travel Card', amount: 65.00, category: 'Transport', date: formatDate(12), notes: 'Monthly travel pass' },
    { id: 'exp-8', user_id: 'user-1', title: 'Gym & Fitness Pass', amount: 45.00, category: 'Other', date: formatDate(18), notes: 'Monthly gym dues' },

    // Marcus Brody (user-2)
    { id: 'exp-9', user_id: 'user-2', title: 'Studio Room Rent', amount: 800.00, category: 'Room', date: formatDate(2), notes: 'Studio rental' },
    { id: 'exp-10', user_id: 'user-2', title: 'AWS Cloud Server Hosting', amount: 184.20, category: 'Internet', date: formatDate(4), notes: 'Production server cluster' },
    { id: 'exp-11', user_id: 'user-2', title: 'Organic Market Groceries', amount: 190.00, category: 'Food & Drink', date: formatDate(7), notes: 'Weekly meal prep' },
    { id: 'exp-12', user_id: 'user-2', title: 'Train & Transit Pass', amount: 80.00, category: 'Transport', date: formatDate(11), notes: 'Commuter card' },
    { id: 'exp-13', user_id: 'user-2', title: 'Standing Desk Converter', amount: 140.00, category: 'Other', date: formatDate(16), notes: 'Ergonomic equipment' },

    // Elena Rostova (user-3)
    { id: 'exp-14', user_id: 'user-3', title: 'High-Rise Apartment Rent', amount: 1250.00, category: 'Room', date: formatDate(1), notes: 'Luxury flat' },
    { id: 'exp-15', user_id: 'user-3', title: 'Fine Dining & Lunch Meetings', amount: 285.00, category: 'Food & Drink', date: formatDate(5), notes: 'Client hospitality' },
    { id: 'exp-16', user_id: 'user-3', title: 'Tesla Charging & Fastrak', amount: 95.00, category: 'Transport', date: formatDate(8), notes: 'EV travel' },
    { id: 'exp-17', user_id: 'user-3', title: 'Business Gigabit Fiber', amount: 85.00, category: 'Internet', date: formatDate(12), notes: 'Home studio internet' },
    { id: 'exp-18', user_id: 'user-3', title: 'Executive Coaching Course', amount: 350.00, category: 'Other', date: formatDate(17), notes: 'Leadership training' }
  ];

  for (const exp of expenses) {
    await pool.query(
      `INSERT INTO expenses (id, user_id, title, amount, category, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), amount=VALUES(amount), category=VALUES(category), date=VALUES(date), notes=VALUES(notes)`,
      [exp.id, exp.user_id, exp.title, exp.amount, exp.category, exp.date, exp.notes]
    );
  }
  console.log(`✅ Seeded ${expenses.length} expenses`);

  // 5. Seed Savings Goals
  const goals = [
    { id: 'goal-1', user_id: 'user-1', title: 'Emergency Fund (6 Months)', target_amount: 6000.00, current_amount: 3500.00, target_date: formatDate(-180), category: 'Emergency Fund', color: '#10b981', notes: 'Safety net to cover 6 months expenses.' },
    { id: 'goal-2', user_id: 'user-1', title: 'Tokyo Vacation Trip', target_amount: 2500.00, current_amount: 1450.00, target_date: formatDate(-120), category: 'Travel & Vacation', color: '#6366f1', notes: 'Flights and hotels in Japan.' },
    { id: 'goal-3', user_id: 'user-1', title: 'MacBook Pro M3 Max', target_amount: 1999.00, current_amount: 920.00, target_date: formatDate(-90), category: 'Gadget & Gear', color: '#f59e0b', notes: 'Workstation upgrade.' },
    { id: 'goal-4', user_id: 'user-2', title: 'AI Inference Server Rig', target_amount: 3200.00, current_amount: 1800.00, target_date: formatDate(-150), category: 'Gadget & Gear', color: '#06b6d4', notes: 'Local deep learning inference server.' },
    { id: 'goal-5', user_id: 'user-3', title: 'Real Estate Down Payment', target_amount: 15000.00, current_amount: 8500.00, target_date: formatDate(-300), category: 'House Down Payment', color: '#8b5cf6', notes: 'Condo down payment fund.' }
  ];

  for (const g of goals) {
    await pool.query(
      `INSERT INTO savings_goals (id, user_id, title, target_amount, current_amount, target_date, category, color, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), target_amount=VALUES(target_amount), current_amount=VALUES(current_amount), target_date=VALUES(target_date), notes=VALUES(notes)`,
      [g.id, g.user_id, g.title, g.target_amount, g.current_amount, g.target_date, g.category, g.color, g.notes]
    );
  }
  console.log(`✅ Seeded ${goals.length} savings goals`);

  await pool.end();
  console.log('🎉 Database successfully seeded with real production data!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

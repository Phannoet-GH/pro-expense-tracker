import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'pro_expense_tracker'
};

async function seed() {
  const pool = mysql.createPool(DB_CONFIG);
  console.log('🌱 Starting secure MySQL database seed...');

  // Ensure tables and columns
  try { await pool.query("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''"); } catch {}
  try { await pool.query("ALTER TABLE users ADD COLUMN auth_token VARCHAR(255) NULL"); } catch {}
  try { await pool.query("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL"); } catch {}
  try { await pool.query("ALTER TABLE expenses ADD COLUMN user_id VARCHAR(64) NOT NULL DEFAULT 'user-1'"); } catch {}
  try { await pool.query("ALTER TABLE incomes ADD COLUMN user_id VARCHAR(64) NOT NULL DEFAULT 'user-1'"); } catch {}
  try { await pool.query("ALTER TABLE savings_goals ADD COLUMN user_id VARCHAR(64) NOT NULL DEFAULT 'user-1'"); } catch {}

  const today = new Date();
  const formatDate = (daysAgo) => {
    const d = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  // 1. Seed Super Admin User with Bcrypt Hashed Password
  const users = [
    {
      id: 'user-admin',
      name: 'Alex Vance',
      email: 'admin@smartfinance.pro',
      password: 'AdminPass@2026',
      role: 'admin',
      title: 'Lead System Administrator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      plan_tier: 'enterprise',
      monthly_target_income: 8000,
      target_savings_rate: 35
    }
  ];

  for (const u of users) {
    const password_hash = bcrypt.hashSync(u.password, 10);
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, title, avatar, status, plan_tier, monthly_target_income, target_savings_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), password_hash=VALUES(password_hash), role=VALUES(role),
       title=VALUES(title), avatar=VALUES(avatar), status=VALUES(status), plan_tier=VALUES(plan_tier),
       monthly_target_income=VALUES(monthly_target_income), target_savings_rate=VALUES(target_savings_rate)`,
      [u.id, u.name, u.email, password_hash, u.role, u.title, u.avatar, u.status, u.plan_tier, u.monthly_target_income, u.target_savings_rate]
    );
  }
  console.log(`✅ Seeded Super Administrator user: ${users[0].email}`);

  // 2. Seed Default Category Budgets
  const budgets = [
    ['Room', 600],
    ['Food & Drink', 400],
    ['Transport', 200],
    ['Internet', 60],
    ['Other', 240]
  ];

  for (const [cat, amt] of budgets) {
    await pool.query(
      `INSERT INTO budgets (category, amount) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE amount=VALUES(amount)`,
      [cat, amt]
    );
  }
  console.log('✅ Seeded default budgets');

  await pool.end();
  console.log('🎉 Database initialization complete. Clean slate ready for real clients!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

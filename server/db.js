import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const DB_CONFIG = {
  host:     process.env.DB_HOST     || process.env.MYSQLHOST     || process.env.MYSQL_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || '3306', 10),
  user:     process.env.DB_USER     || process.env.MYSQLUSER     || process.env.MYSQL_USER     || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || 'root',
  database: process.env.DB_NAME     || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'pro_expense_tracker'
};

let pool = null;

export async function initDatabase() {
  try {
    // 1. Connect without specific DB to create database if not present
    const rootConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    // 2. Initialize connection pool to the database
    pool = mysql.createPool({
      ...DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 3. Create schema tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'client') DEFAULT 'client',
        avatar VARCHAR(500) NULL,
        status VARCHAR(50) DEFAULT 'active',
        auth_token VARCHAR(255) NULL,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        notes TEXT NULL,
        receipt JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_expenses (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        user_id VARCHAR(64) NOT NULL DEFAULT 'global',
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incomes (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        source VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        notes TEXT NULL,
        is_recurring BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_incomes (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        target_amount DECIMAL(10, 2) NOT NULL,
        current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        target_date DATE NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'General Savings',
        color VARCHAR(20) DEFAULT '#0d6efd',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_goals (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS upgrade_requests (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        plan VARCHAR(50) NOT NULL DEFAULT 'pro',
        price VARCHAR(50) NOT NULL DEFAULT '$2/mo',
        payment_method VARCHAR(100) NULL,
        message TEXT NULL,
        payment_proof LONGTEXT NULL,
        receipt_file_name VARCHAR(255) NULL,
        admin_reply TEXT NULL,
        replied_at TIMESTAMP NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_req_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Schema migrations for existing databases
    try { await pool.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN auth_token VARCHAR(255) NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN plan_tier ENUM('free', 'pro', 'enterprise') DEFAULT 'free';`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'active';`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255) NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN current_period_end TIMESTAMP NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN monthly_ai_scans_used INT DEFAULT 0;`); } catch {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN last_scan_reset DATE NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE expenses ADD COLUMN user_id VARCHAR(64) NOT NULL DEFAULT 'user-1';`); } catch {}
    try { await pool.query(`ALTER TABLE expenses ADD COLUMN is_tax_deductible BOOLEAN DEFAULT 0;`); } catch {}
    try { await pool.query(`ALTER TABLE expenses ADD COLUMN tax_category VARCHAR(100) DEFAULT 'General Business';`); } catch {}
    try { await pool.query(`ALTER TABLE incomes ADD COLUMN user_id VARCHAR(64) NOT NULL DEFAULT 'user-1';`); } catch {}
    try { await pool.query(`ALTER TABLE savings_goals ADD COLUMN user_id VARCHAR(64) NOT NULL DEFAULT 'user-1';`); } catch {}
    try { await pool.query(`ALTER TABLE upgrade_requests ADD COLUMN admin_reply TEXT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE upgrade_requests ADD COLUMN replied_at TIMESTAMP NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE upgrade_requests ADD COLUMN payment_proof LONGTEXT NULL;`); } catch {}
    try { await pool.query(`ALTER TABLE upgrade_requests ADD COLUMN receipt_file_name VARCHAR(255) NULL;`); } catch {}

    // Drop legacy private client fields from users table if they exist
    try { await pool.query(`ALTER TABLE users DROP COLUMN monthly_target_income;`); } catch {}
    try { await pool.query(`ALTER TABLE users DROP COLUMN target_savings_rate;`); } catch {}
    try { await pool.query(`ALTER TABLE users DROP COLUMN title;`); } catch {}

    // Ensure super admin account (admin@gmail.com / admin) exists
    const adminHash = bcrypt.hashSync('admin', 10);
    const [existingAdmin] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@gmail.com']);
    if (existingAdmin.length === 0) {
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, role, avatar, status, plan_tier)
        VALUES ('admin-gmail-id', 'Administrator', 'admin@gmail.com', ?, 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'active', 'enterprise')
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', status = 'active'
      `, [adminHash]);
      console.log('✅ [MySQL] Seeded super admin: admin@gmail.com');
    } else {
      await pool.query(`
        UPDATE users SET password_hash = ?, role = 'admin', status = 'active' WHERE email = 'admin@gmail.com'
      `, [adminHash]);
      console.log('✅ [MySQL] Verified super admin: admin@gmail.com');
    }

    // Ensure default budgets if empty
    try {
      const [budgetRows] = await pool.query('SELECT COUNT(*) as cnt FROM budgets');
      if (budgetRows[0]?.cnt === 0) {
        const defaultBudgets = [
          ['Room', 600],
          ['Food & Drink', 400],
          ['Transport', 200],
          ['Internet', 60],
          ['Other', 240]
        ];
        for (const [cat, amt] of defaultBudgets) {
          await pool.query('INSERT IGNORE INTO budgets (category, amount) VALUES (?, ?)', [cat, amt]);
        }
      }
    } catch {}

    console.log(`✅ [MySQL] Initialized & connected to database: ${DB_CONFIG.database}`);
    return pool;
  } catch (error) {
    console.error('❌ [MySQL] Database initialization failed:', error.message);
    throw error;
  }
}

export function getPool() {
  return pool;
}

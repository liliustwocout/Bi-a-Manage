import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;
const DB_NAME = process.env.DB_NAME || 'cuemaster';

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Kiểm tra kết nối database ngay khi khởi động
pool.getConnection()
  .then(conn => {
    console.log('Successfully connected to MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('CRITICAL: Could not connect to MySQL. Is it running?');
    console.error('Error details:', err.message);
  });

// Simple key-value store table to persist JSON blobs (similar to localStorage)
const DB_KEYS = {
  TABLES: 'cuemaster_tables',
  RATES: 'cuemaster_rates',
  MENU: 'cuemaster_menu',
  STAFF: 'cuemaster_staff',
  TRANSACTIONS: 'cuemaster_transactions',
};

async function ensureKvTable() {
  // Tạo database nếu chưa có
  await pool.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  );

  // Tạo bảng key-value trong database đó
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`${DB_NAME}\`.kv_store (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_name VARCHAR(255) NOT NULL UNIQUE,
      value LONGTEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function getValue(key) {
  const [rows] = await pool.query(
    `SELECT value FROM \`${DB_NAME}\`.kv_store WHERE key_name = ?`,
    [key],
  );
  if (!rows.length) return null;
  const raw = rows[0].value;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

async function setValue(key, value) {
  const json = JSON.stringify(value ?? null);
  await pool.query(
    `INSERT INTO \`${DB_NAME}\`.kv_store (key_name, value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [key, json],
  );
}

// --- Seed data (tương tự localStorage hiện tại) ---
function createInitialTables() {
  const tables = [];
  for (let i = 0; i < 12; i++) {
    const id = String(i + 1).padStart(2, '0');
    tables.push({
      id,
      name: `Bàn ${id}`,
      status: 'EMPTY',
      type: i < 8 ? 'Pool' : i < 10 ? 'Carom' : 'VIP',
      orders: [],
    });
  }
  return tables;
}

const INITIAL_RATES = {
  Pool: 60000,
  Carom: 50000,
  Snooker: 80000,
  VIP: 120000,
  billingBlock: 15,
};

const INITIAL_MENU = [
  { id: '1', name: 'Sting Dâu', price: 15000, category: 'Drink', status: 'In Stock', image: 'https://picsum.photos/seed/sting/200' },
  { id: '2', name: 'Bò Húc', price: 20000, category: 'Drink', status: 'In Stock', image: 'https://picsum.photos/seed/redbull/200' },
  { id: '3', name: 'Mì Trứng', price: 35000, category: 'Food', status: 'In Stock', image: 'https://picsum.photos/seed/noodle/200' },
  { id: '4', name: 'Thuốc lá 555', price: 35000, category: 'Other', status: 'In Stock', image: 'https://picsum.photos/seed/cig/200' },
];

const router = express.Router();

// --- Routes ---

// Khởi tạo dữ liệu lần đầu (seed giống localStorage cũ)
router.post('/init', async (req, res) => {
  try {
    await ensureKvTable();
    const existingTables = await getValue(DB_KEYS.TABLES);
    if (!existingTables || !Array.isArray(existingTables) || existingTables.length === 0) {
      await setValue(DB_KEYS.TABLES, createInitialTables());
      await setValue(DB_KEYS.RATES, INITIAL_RATES);
      await setValue(DB_KEYS.MENU, INITIAL_MENU);
      await setValue(DB_KEYS.TRANSACTIONS, []);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Error in /init:', err);
    res.status(500).json({ error: err.message || 'Internal server error', code: err.code });
  }
});

// Tables
router.get('/tables', async (req, res) => {
  try {
    const tables = (await getValue(DB_KEYS.TABLES)) || [];
    res.json(tables);
  } catch (err) {
    console.error('Error in GET /tables:', err);
    res.status(500).json({ error: err.message || 'Internal server error', code: err.code });
  }
});

router.put('/tables', async (req, res) => {
  try {
    const tables = req.body;
    if (!Array.isArray(tables)) {
      return res.status(400).json({ error: 'Tables must be an array' });
    }
    await setValue(DB_KEYS.TABLES, tables);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error in PUT /tables:', err);
    res.status(500).json({ error: err.message || 'Internal server error', code: err.code });
  }
});

// Rates
router.get('/rates', async (req, res) => {
  try {
    const rates = (await getValue(DB_KEYS.RATES)) || INITIAL_RATES;
    res.json(rates);
  } catch (err) {
    console.error('Error in GET /rates:', err);
    res.status(500).json({ error: err.message || 'Internal server error', code: err.code });
  }
});

router.put('/rates', async (req, res) => {
  try {
    const rates = req.body || {};
    await setValue(DB_KEYS.RATES, rates);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error in PUT /rates:', err);
    res.status(500).json({ error: err.message || 'Internal server error', code: err.code });
  }
});

// Menu
router.get('/menu', async (req, res) => {
  try {
    const menu = (await getValue(DB_KEYS.MENU)) || INITIAL_MENU;
    res.json(menu);
  } catch (err) {
    console.error('Error in GET /menu:', err);
    res.status(500).json({ error: err.message || 'Internal server error', code: err.code });
  }
});

router.put('/menu', async (req, res) => {
  try {
    const menu = req.body;
    if (!Array.isArray(menu)) {
      return res.status(400).json({ error: 'Menu must be an array' });
    }
    await setValue(DB_KEYS.MENU, menu);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error in PUT /menu:', err);
    res.status(500).json({ error: err.message || 'Internal server error', code: err.code });
  }
});

// Transactions
router.get('/transactions', async (req, res) => {
  try {
    const txs = (await getValue(DB_KEYS.TRANSACTIONS)) || [];
    res.json(txs);
  } catch (err) {
    console.error('Error in GET /transactions:', err);
    res.status(500).json({ error: err.message || 'Internal server error', code: err.code });
  }
});

router.post('/transactions', async (req, res) => {
  try {
    const tx = req.body;
    const txs = (await getValue(DB_KEYS.TRANSACTIONS)) || [];
    const next = [tx, ...txs];
    await setValue(DB_KEYS.TRANSACTIONS, next);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error in POST /transactions:', err);
    res.status(500).json({ error: err.message || 'Internal server error', code: err.code });
  }
});

// Reset toàn bộ dữ liệu
router.post('/reset', async (req, res) => {
  try {
    await ensureKvTable();
    await setValue(DB_KEYS.TABLES, createInitialTables());
    await setValue(DB_KEYS.RATES, INITIAL_RATES);
    await setValue(DB_KEYS.MENU, INITIAL_MENU);
    await setValue(DB_KEYS.TRANSACTIONS, []);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error in POST /reset:', err);
    res.status(500).json({ error: err.message || 'Internal server error', code: err.code });
  }
});

router.get('/', (req, res) => {
  res.json({ status: 'CueMaster Pro API running', version: '1.0.0' });
});

app.use('/api', router);
// Fallback cho local (vì local có thể không dùng prefix /api nếu access trực tiếp cổng 4000)
app.use('/', router);

// Export app for Vercel
export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`CueMaster Pro API listening on http://127.0.0.1:${PORT}`);
  });
}

// Giữ process Node luôn sống (chỉ dành cho local dev)
if (!process.env.VERCEL) {
  setInterval(() => {
    // no-op
  }, 1e9);
}


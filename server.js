import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import crypto from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 3001);

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'scholarpath',
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

async function ensureDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await connection.end();

    const db = await getPool();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NULL,
        profile JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS newsletters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.warn('MySQL not available yet. The app will keep running in a demo mode until a database is configured.', error.message);
  }
}

function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

function hashPassword(value) {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex');
}

function jsonSafe(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function buildUserRecord(row) {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    profile: jsonSafe(row.profile, {}),
    isAdmin: false,
  };
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'ScholarPath API is running.' });
});

app.get('/api/newsletters', async (_req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.execute(
      'SELECT id, title, summary, category, created_by, created_at FROM newsletters ORDER BY created_at DESC',
    );
    res.json({ ok: true, newsletters: rows });
  } catch (error) {
    res.status(500).json({ message: 'Newsletter list unavailable until the database is connected.' });
  }
});

app.post('/api/register', async (req, res) => {
  const fullName = String(req.body?.fullName ?? '').trim();
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const email = String(req.body?.email ?? '').trim();

  if (!fullName || !username || !password) {
    return res.status(400).json({ message: 'Full name, username, and password are required.' });
  }

  try {
    const db = await getPool();
    const [existingRows] = await db.execute('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    if (existingRows.length) {
      return res.status(409).json({ message: 'That username is already taken. Please choose another one.' });
    }

    const profile = {
      ethnicity: '',
      gender: '',
      age: '',
      gpa: '',
      apCount: '',
      school: '',
      major: '',
      graduationYear: '',
      interests: `New student profile for ${fullName}`,
      ...(req.body?.profile ?? {}),
    };

    const [result] = await db.execute(
      'INSERT INTO users (username, password_hash, full_name, email, profile) VALUES (?, ?, ?, ?, ?)',
      [username, hashPassword(password), fullName, email || null, JSON.stringify(profile)],
    );

    return res.status(201).json({
      ok: true,
      user: {
        id: result.insertId,
        username,
        fullName,
        email,
        profile,
        isAdmin: false,
      },
    });
  } catch (error) {
    console.error('Register failed:', error);
    return res.status(500).json({ message: 'Unable to save your account in the SQL database right now.' });
  }
});

app.post('/api/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');

  if (normalizeUsername(username) === 'admin' && password === 'admin123') {
    return res.json({
      ok: true,
      user: {
        username: 'admin',
        fullName: 'Admin',
        email: 'admin@scholarpath.app',
        isAdmin: true,
        profile: {},
      },
    });
  }

  try {
    const db = await getPool();
    const [rows] = await db.execute('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    const row = rows[0];

    if (!row) {
      return res.status(401).json({ message: 'No account matched those credentials. Register first to create a profile.' });
    }

    if (row.password_hash !== hashPassword(password)) {
      return res.status(401).json({ message: 'No account matched those credentials. Register first to create a profile.' });
    }

    return res.json({ ok: true, user: buildUserRecord(row) });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Unable to login.' });
  }
});

app.put('/api/profile', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const profile = req.body?.profile ?? {};

  if (!username) {
    return res.status(400).json({ message: 'Username is required to update the profile.' });
  }

  try {
    const db = await getPool();
    const [rows] = await db.execute('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    const row = rows[0];

    if (!row) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const nextProfile = {
      ...(jsonSafe(row.profile, {})),
      ...profile,
    };

    await db.execute('UPDATE users SET profile = ? WHERE id = ?', [JSON.stringify(nextProfile), row.id]);

    return res.json({
      ok: true,
      user: {
        ...buildUserRecord(row),
        profile: nextProfile,
      },
    });
  } catch (error) {
    console.error('Profile save failed:', error);
    return res.status(500).json({ message: 'Unable to save the profile.' });
  }
});

app.post('/api/admin/newsletters', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const title = String(req.body?.title ?? '').trim();
  const summary = String(req.body?.summary ?? '').trim();
  const category = String(req.body?.category ?? 'General').trim();

  if (normalizeUsername(username) !== 'admin' || password !== 'admin123') {
    return res.status(401).json({ message: 'Admin access required.' });
  }

  if (!title || !summary) {
    return res.status(400).json({ message: 'Title and summary are required.' });
  }

  try {
    const db = await getPool();
    await db.execute(
      'INSERT INTO newsletters (title, summary, category, created_by) VALUES (?, ?, ?, ?)',
      [title, summary, category || 'General', 'admin'],
    );

    return res.status(201).json({ ok: true, message: 'Newsletter created.' });
  } catch (error) {
    console.error('Newsletter create failed:', error);
    return res.status(500).json({ message: 'Unable to create the newsletter.' });
  }
});

app.listen(port, async () => {
  await ensureDatabase();
  console.log(`ScholarPath API running on http://localhost:${port}`);
});

import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mysql from 'mysql2/promise';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === 'production';
const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.join(rootDirectory, 'dist');
const adminUsername = String(process.env.ADMIN_USERNAME || 'admin').trim();
const adminPassword = process.env.ADMIN_PASSWORD;
const sessionSecret = process.env.SESSION_SECRET;
const sessionCookieName = 'scholarpath_session';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.PUBLIC_FRONTEND_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'scholarpath',
  waitForConnections: true,
  connectionLimit: 10,
  ...(process.env.MYSQL_SSL === 'true'
    ? {
        ssl: {
          rejectUnauthorized: true,
          ...(process.env.MYSQL_SSL_CA ? { ca: process.env.MYSQL_SSL_CA.replace(/\\n/g, '\n') } : {}),
        },
      }
    : {}),
};

app.set('trust proxy', isProduction ? Number(process.env.TRUST_PROXY || 1) : false);

let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

async function ensureDatabase() {
  if (!dbConfig.user) {
    throw new Error('Set MYSQL_USER in .env before starting the API.');
  }
  if (!adminPassword || !sessionSecret) {
    throw new Error('Set ADMIN_PASSWORD and SESSION_SECRET in .env before starting the API.');
  }
  if (!/^[A-Za-z0-9_]+$/.test(dbConfig.database)) {
    throw new Error('MYSQL_DATABASE must contain only letters, numbers, or underscores.');
  }
  if (sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long.');
  }
  if (isProduction && !dbConfig.password) {
    throw new Error('Production deployments require a password for MYSQL_USER.');
  }
  if (isProduction && process.env.MYSQL_SSL !== 'true') {
    throw new Error('Production deployments require MYSQL_SSL=true.');
  }
  if (isProduction && (adminPassword.length < 16 || adminPassword === 'admin123')) {
    throw new Error('Set a unique ADMIN_PASSWORD of at least 16 characters for production.');
  }
  if (isProduction && [adminPassword, sessionSecret].some((value) => /^(change_this|replace_with|generate_a_random)/i.test(value))) {
    throw new Error('Replace example admin/session secrets before deploying to production.');
  }

  const db = await getPool();
  await db.execute('SELECT 1');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NULL,
      profile JSON NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [userColumns] = await db.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`,
    [dbConfig.database],
  );
  if (!userColumns.length) {
    await db.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student'");
  }

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

  const [adminRows] = await db.execute('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [adminUsername]);
  if (adminRows.length) {
    await db.execute(
      "UPDATE users SET role = 'admin', password_hash = ? WHERE id = ?",
      [hashPassword(adminPassword), adminRows[0].id],
    );
  } else {
    await db.execute(
      'INSERT INTO users (username, password_hash, full_name, email, profile, role) VALUES (?, ?, ?, ?, ?, ?)',
      [adminUsername, hashPassword(adminPassword), 'Admin', 'admin@scholarpath.app', JSON.stringify({}), 'admin'],
    );
  }
}

function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

function hashPassword(value) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(String(value ?? ''), salt, 64);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

function verifyPassword(value, encoded) {
  const [algorithm, saltHex, hashHex] = String(encoded ?? '').split('$');
  if (algorithm !== 'scrypt') {
    const expectedLegacy = Buffer.from(String(encoded ?? ''), 'hex');
    const actualLegacy = crypto.createHash('sha256').update(String(value ?? '')).digest();
    return expectedLegacy.length === actualLegacy.length && crypto.timingSafeEqual(expectedLegacy, actualLegacy);
  }
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(String(value ?? ''), Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function createSessionToken(user) {
  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifySessionToken(token) {
  const [payload, signature] = String(token ?? '').split('.');
  if (!payload || !signature) return null;

  const expected = crypto.createHmac('sha256', sessionSecret).update(payload).digest();
  let actual;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return claims.expiresAt > Date.now() ? claims.userId : null;
  } catch {
    return null;
  }
}

function setSessionCookie(res, user) {
  res.cookie(sessionCookieName, createSessionToken(user), {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: sessionDurationMs,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
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
    isAdmin: row.role === 'admin',
  };
}

async function requireAuth(req, res, next) {
  const userId = verifySessionToken(req.cookies[sessionCookieName]);
  if (!userId) return res.status(401).json({ message: 'Please sign in again.' });

  try {
    const db = await getPool();
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (!rows.length) return res.status(401).json({ message: 'Your account could not be found.' });
    req.user = buildUserRecord(rows[0]);
    next();
  } catch (error) {
    console.error('Session validation failed:', error);
    res.status(503).json({ message: 'The account database is temporarily unavailable.' });
  }
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  const origin = req.get('Origin');
  const requestHost = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();

  if (!origin) {
    return next();
  }

  const sameOrigin = requestHost && (origin === `${req.protocol}://${requestHost}` || origin === `https://${requestHost}`);
  const allowedOrigin = allowedOrigins.some((allowed) => {
    try {
      return new URL(allowed).origin === origin;
    } catch {
      return allowed === origin;
    }
  });

  if (!isProduction) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  }

  if (!sameOrigin && !allowedOrigin) {
    return res.status(403).json({ message: 'Request origin is not allowed.' });
  }

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please try again later.' },
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many account creation attempts. Please try again later.' },
});

app.get('/api/health', async (_req, res) => {
  try {
    const db = await getPool();
    await db.execute('SELECT 1');
    res.json({ ok: true, message: 'ScholarPath API and database are healthy.' });
  } catch {
    res.status(503).json({ ok: false, message: 'ScholarPath database is unavailable.' });
  }
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

app.post('/api/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
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

app.post('/api/register', registerLimiter, async (req, res) => {
  const fullName = String(req.body?.fullName ?? '').trim();
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const email = String(req.body?.email ?? '').trim();

  if (!fullName || !username || !password) {
    return res.status(400).json({ message: 'Full name, username, and password are required.' });
  }
  if (password.length < 12) {
    return res.status(400).json({ message: 'Choose a password with at least 12 characters.' });
  }
  if (normalizeUsername(username) === normalizeUsername(adminUsername)) {
    return res.status(400).json({ message: 'That username is reserved.' });
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
      'INSERT INTO users (username, password_hash, full_name, email, profile, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashPassword(password), fullName, email || null, JSON.stringify(profile), 'student'],
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

app.post('/api/login', loginLimiter, async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');

  try {
    const db = await getPool();
    const [rows] = await db.execute('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    const row = rows[0];

    if (!row) {
      return res.status(401).json({ message: 'No account matched those credentials. Register first to create a profile.' });
    }

    if (!verifyPassword(password, row.password_hash)) {
      return res.status(401).json({ message: 'No account matched those credentials. Register first to create a profile.' });
    }

    if (!row.password_hash.startsWith('scrypt$')) {
      await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(password), row.id]);
    }

    setSessionCookie(res, row);
    return res.json({ ok: true, user: buildUserRecord(row) });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Unable to login.' });
  }
});

if (existsSync(distDirectory)) {
  app.use(express.static(distDirectory, {
    index: false,
    maxAge: isProduction ? '1d' : 0,
  }));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(distDirectory, 'index.html'));
  });
}

app.put('/api/profile', requireAuth, async (req, res) => {
  const profile = req.body?.profile ?? {};

  try {
    const db = await getPool();
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
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

app.post('/api/admin/newsletters', requireAuth, async (req, res) => {
  const title = String(req.body?.title ?? '').trim();
  const summary = String(req.body?.summary ?? '').trim();
  const category = String(req.body?.category ?? 'General').trim();

  if (!req.user.isAdmin) {
    return res.status(401).json({ message: 'Admin access required.' });
  }

  if (!title || !summary) {
    return res.status(400).json({ message: 'Title and summary are required.' });
  }

  try {
    const db = await getPool();
    await db.execute(
      'INSERT INTO newsletters (title, summary, category, created_by) VALUES (?, ?, ?, ?)',
      [title, summary, category || 'General', req.user.username],
    );

    return res.status(201).json({ ok: true, message: 'Newsletter created.' });
  } catch (error) {
    console.error('Newsletter create failed:', error);
    return res.status(500).json({ message: 'Unable to create the newsletter.' });
  }
});

ensureDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`ScholarPath API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(`Database setup failed: ${error.message}`);
    process.exitCode = 1;
  });

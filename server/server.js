require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'coinaverse-dev-secret-change-in-prod';
const DB_PATH = process.env.DATABASE_PATH || './coinaverse.db';

// ── Database setup ──────────────────────────────────────────────────────────
const db = new Database(path.resolve(DB_PATH));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT  NOT NULL,
    archetype   TEXT    DEFAULT 'guardian',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS progress (
    user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state_json  TEXT    NOT NULL DEFAULT '{}',
    updated_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username    TEXT    NOT NULL,
    archetype   TEXT    NOT NULL DEFAULT 'guardian',
    coins       INTEGER NOT NULL DEFAULT 0,
    xp          INTEGER NOT NULL DEFAULT 0,
    level       INTEGER NOT NULL DEFAULT 1,
    games_done  INTEGER NOT NULL DEFAULT 0,
    updated_at  TEXT    DEFAULT (datetime('now')),
    UNIQUE(user_id)
  );
`);

// ── Prepared statements ─────────────────────────────────────────────────────
const stmts = {
  createUser:   db.prepare('INSERT INTO users (username,email,password_hash,archetype) VALUES (?,?,?,?)'),
  findByEmail:  db.prepare('SELECT * FROM users WHERE email=? COLLATE NOCASE'),
  findByUser:   db.prepare('SELECT * FROM users WHERE username=? COLLATE NOCASE'),
  findById:     db.prepare('SELECT id,username,email,archetype,created_at FROM users WHERE id=?'),
  getProgress:  db.prepare('SELECT state_json FROM progress WHERE user_id=?'),
  setProgress:  db.prepare('INSERT INTO progress(user_id,state_json,updated_at) VALUES(?,?,datetime("now")) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json,updated_at=excluded.updated_at'),
  upsertLB:     db.prepare('INSERT INTO leaderboard(user_id,username,archetype,coins,xp,level,games_done,updated_at) VALUES(?,?,?,?,?,?,?,datetime("now")) ON CONFLICT(user_id) DO UPDATE SET username=excluded.username,archetype=excluded.archetype,coins=excluded.coins,xp=excluded.xp,level=excluded.level,games_done=excluded.games_done,updated_at=excluded.updated_at'),
  topLB:        db.prepare('SELECT username,archetype,coins,xp,level,games_done FROM leaderboard ORDER BY coins DESC,xp DESC LIMIT 100'),
};

// ── Middleware ──────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://coinaverse-app.vercel.app',
  'http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173',
  'capacitor://localhost', 'ionic://localhost',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('CORS: origin not allowed: ' + origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function makeToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '90d' });
}

// ── Auth routes ─────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, archetype } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'username, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (stmts.findByEmail.get(email)) return res.status(409).json({ error: 'Email already registered' });
    if (stmts.findByUser.get(username)) return res.status(409).json({ error: 'Username already taken' });

    const hash = await bcrypt.hash(password, 10);
    const info = stmts.createUser.run(username.trim(), email.toLowerCase().trim(), hash, archetype || 'guardian');
    const token = makeToken(info.lastInsertRowid);
    const user = stmts.findById.get(info.lastInsertRowid);
    res.json({ token, user });
  } catch (err) {
    console.error('register:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const row = stmts.findByEmail.get(email.toLowerCase().trim());
    if (!row) return res.status(401).json({ error: 'No account with that email' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: "Oops — that email or password doesn't match" });
    const token = makeToken(row.id);
    const { password_hash, ...user } = row;
    res.json({ token, user });
  } catch (err) {
    console.error('login:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = stmts.findById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ── Progress routes ─────────────────────────────────────────────────────────
app.get('/api/progress', authMiddleware, (req, res) => {
  const row = stmts.getProgress.get(req.user.id);
  res.json({ state: row ? JSON.parse(row.state_json) : null });
});

app.post('/api/progress', authMiddleware, (req, res) => {
  try {
    const { state } = req.body;
    if (!state || typeof state !== 'object') return res.status(400).json({ error: 'state object required' });
    const safe = JSON.stringify(state);
    stmts.setProgress.run(req.user.id, safe);

    // update leaderboard snapshot
    stmts.upsertLB.run(
      req.user.id,
      state.playerName || 'Player',
      state.archetype || 'guardian',
      Math.round(state.coins || 0),
      Math.round(state.xp || 0),
      Math.round(state.level || 1),
      Object.keys(state.gamesDone || {}).length,
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('progress POST:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Leaderboard routes ──────────────────────────────────────────────────────
app.get('/api/leaderboard', (req, res) => {
  const rows = stmts.topLB.all();
  res.json({ leaderboard: rows.map((r, i) => ({ rank: i + 1, ...r })) });
});

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Coinaverse server running on port ${PORT}`);
  console.log(`DB: ${path.resolve(DB_PATH)}`);
});

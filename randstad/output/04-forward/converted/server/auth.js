// Session-based auth (replaces legacy CustomAuthFilter, DEBT-0015).
// Cookies are HttpOnly/SameSite; Secure in production (RISK-0013).
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const express = require('express');
const { pool } = require('./db');
const config = require('./config');

function setupAuth(dbPool) {
  const sessionMiddleware = session({
    store: new PgSession({ pool: dbPool, createTableIfMissing: true }),
    secret: config.auth.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
      maxAge: config.auth.ttlHours * 3600 * 1000,
    },
  });

  const authRouter = express.Router();

  authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const { rows } = await pool.query('SELECT * FROM app_user WHERE email=$1', [email]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    res.json({ user: req.session.user });
  });

  authRouter.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  authRouter.get('/me', (req, res) => {
    res.json({ user: req.session?.user || null });
  });

  return { sessionMiddleware, authRouter };
}

async function ensureDefaultAdmin() {
  const { defaultAdminEmail, defaultAdminPassword } = config.auth;
  const { rows } = await pool.query('SELECT id FROM app_user WHERE email=$1', [defaultAdminEmail]);
  if (rows.length === 0) {
    const hash = bcrypt.hashSync(defaultAdminPassword, 10);
    await pool.query(
      'INSERT INTO app_user (email, password_hash, name, role) VALUES ($1,$2,$3,$4)',
      [defaultAdminEmail, hash, 'Administrator', 'admin']
    );
    console.log(`[auth] created default admin ${defaultAdminEmail}`);
  }
}

module.exports = { setupAuth, ensureDefaultAdmin };

// Customer account service (FS-0006): registration, profile, addresses.
// Pure validators are exported for unit tests; persistence is owner-scoped.
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function err(message, code = 'VALIDATION') { const e = new Error(message); e.code = code; return e; }

function assertRegistration({ email, password, name } = {}) {
  if (!EMAIL_RE.test(String(email || '').trim())) throw err('valid email required');
  if (String(password || '').length < 8) throw err('password must be at least 8 characters');
  if (!String(name || '').trim()) throw err('name required');
  return { email: email.trim().toLowerCase(), password, name: name.trim() };
}

function assertProfile({ name, phone } = {}) {
  if (!String(name || '').trim()) throw err('name required');
  if (phone && !/^[+\d][\d\s().-]{4,}$/.test(String(phone))) throw err('invalid phone');
  return { name: name.trim(), phone: phone ? String(phone).trim() : null };
}

function assertAddress(a = {}) {
  for (const f of ['line1', 'city', 'postalCode']) {
    if (!String(a[f] || '').trim()) throw err(`${f} required`);
  }
  const country = String(a.country || 'FR').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw err('country must be a 2-letter code');
  return {
    label: a.label ? String(a.label).trim() : null,
    line1: a.line1.trim(), city: a.city.trim(),
    postalCode: String(a.postalCode).trim(), country,
    isDefault: !!a.isDefault,
  };
}

async function register({ email, password, name }) {
  const v = assertRegistration({ email, password, name });
  const exists = await pool.query('SELECT 1 FROM app_user WHERE email=$1', [v.email]);
  if (exists.rowCount) throw err('email already registered', 'CONFLICT');
  const hash = bcrypt.hashSync(v.password, 10);
  const { rows } = await pool.query(
    `INSERT INTO app_user (email, password_hash, name, role) VALUES ($1,$2,$3,'customer')
     RETURNING id, email, name, role`, [v.email, hash, v.name]);
  return rows[0];
}

async function getProfile(userId) {
  const { rows } = await pool.query(
    'SELECT id, email, name, phone, role FROM app_user WHERE id=$1', [userId]);
  if (!rows[0]) throw err('user not found', 'NOT_FOUND');
  return rows[0];
}

async function updateProfile(userId, patch) {
  const v = assertProfile(patch);
  const { rows } = await pool.query(
    `UPDATE app_user SET name=$2, phone=$3 WHERE id=$1 RETURNING id, email, name, phone, role`,
    [userId, v.name, v.phone]);
  if (!rows[0]) throw err('user not found', 'NOT_FOUND');
  return rows[0];
}

async function listAddresses(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM address WHERE user_id=$1 ORDER BY is_default DESC, id', [userId]);
  return rows;
}

async function addAddress(userId, a) {
  const v = assertAddress(a);
  if (v.isDefault) await pool.query('UPDATE address SET is_default=false WHERE user_id=$1', [userId]);
  const { rows } = await pool.query(
    `INSERT INTO address (user_id, label, line1, city, postal_code, country, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, v.label, v.line1, v.city, v.postalCode, v.country, v.isDefault]);
  return rows[0];
}

async function updateAddress(userId, id, a) {
  const v = assertAddress(a);
  if (v.isDefault) await pool.query('UPDATE address SET is_default=false WHERE user_id=$1', [userId]);
  const { rows } = await pool.query(
    `UPDATE address SET label=$3, line1=$4, city=$5, postal_code=$6, country=$7, is_default=$8
     WHERE id=$2 AND user_id=$1 RETURNING *`,
    [userId, id, v.label, v.line1, v.city, v.postalCode, v.country, v.isDefault]);
  if (!rows[0]) throw err('address not found', 'NOT_FOUND');
  return rows[0];
}

async function removeAddress(userId, id) {
  const { rowCount } = await pool.query('DELETE FROM address WHERE id=$2 AND user_id=$1', [userId, id]);
  if (!rowCount) throw err('address not found', 'NOT_FOUND');
  return { ok: true };
}

module.exports = {
  assertRegistration, assertProfile, assertAddress, // pure (unit-tested)
  register, getProfile, updateProfile,
  listAddresses, addAddress, updateAddress, removeAddress,
};

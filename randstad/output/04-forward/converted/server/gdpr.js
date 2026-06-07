// GDPR data-subject rights (Wave 7 — DPR-0005 access/portability, DPR-0006 erasure).
// Erasure CASCADES to relational rows, agent conversation logs, AND pgvector semantic
// memory (DPR-0006 explicitly requires vector erasure). Order rows are retained for
// legal/tax purposes (DPR-0011) but their PII is scrubbed (anonymized).
const crypto = require('crypto');
const { pool } = require('./db');

function err(message, code = 'VALIDATION') { const e = new Error(message); e.code = code; return e; }

// DPR-0005: export everything we hold about a data subject (portable JSON).
async function exportData(userId) {
  if (!userId) throw err('login required', 'AUTH');
  const one = async (sql, p = []) => (await pool.query(sql, p)).rows;
  const profile = (await one('SELECT id, email, name, phone, role, created_at, deleted_at FROM app_user WHERE id=$1', [userId]))[0];
  if (!profile) throw err('user not found', 'NOT_FOUND');
  const addresses = await one('SELECT label, line1, city, postal_code, country, is_default FROM address WHERE user_id=$1', [userId]);
  const orders = await one(`SELECT id, status, total_cents, currency, customer_email, customer_name, created_at
                            FROM orders WHERE user_id=$1 ORDER BY id`, [userId]);
  const reviews = await one(`SELECT product_id, rating, title, body, created_at FROM product_review WHERE user_id=$1`, [userId]);
  const memory = await one(`SELECT content, pii, created_at FROM agent_memory WHERE user_id=$1`, [userId]);
  const messages = await one(`SELECT m.role, m.content, m.created_at FROM agent_message m
                              JOIN agent_session s ON s.id = m.session_id WHERE s.user_id=$1 ORDER BY m.id`, [userId]);
  const newsletter = await one('SELECT email, consent, created_at FROM newsletter_subscriber WHERE email=$1', [profile.email]);
  return {
    exportedAt: new Date().toISOString(),
    subject: { id: profile.id, email: profile.email, name: profile.name, phone: profile.phone, role: profile.role, since: profile.created_at },
    addresses, orders, reviews,
    agentMemory: memory, agentMessages: messages, newsletter,
    notice: 'Order records are retained in anonymized form for legal/tax obligations (DPR-0011).',
  };
}

// DPR-0006: erase a data subject. Deletes personal rows + agent logs + pgvector memory;
// anonymizes retained order rows; tombstones the account. Idempotent. Transactional.
async function eraseUser(userId) {
  if (!userId) throw err('login required', 'AUTH');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id, email FROM app_user WHERE id=$1 FOR UPDATE', [userId]);
    const user = rows[0];
    if (!user) throw err('user not found', 'NOT_FOUND');

    const erased = {};
    const del = async (key, sql, p) => { erased[key] = (await client.query(sql, p)).rowCount; };

    await del('addresses', 'DELETE FROM address WHERE user_id=$1', [userId]);
    await del('reviews', 'DELETE FROM product_review WHERE user_id=$1', [userId]);
    await del('agentMemory', 'DELETE FROM agent_memory WHERE user_id=$1', [userId]);          // pgvector erasure
    await del('agentSessions', 'DELETE FROM agent_session WHERE user_id=$1', [userId]);        // cascades agent_message
    await del('carts', 'DELETE FROM cart WHERE user_id=$1', [userId]);                         // cascades cart_item
    if (user.email) await del('newsletter', 'DELETE FROM newsletter_subscriber WHERE email=$1', [user.email]);

    // Retain orders for legal/tax (DPR-0011) but scrub PII.
    await del('ordersAnonymized', `UPDATE orders SET customer_email=NULL, customer_name='ERASED',
                                   ship_address='{}'::jsonb WHERE user_id=$1`, [userId]);

    // Tombstone the account: scrub PII, randomize credential, mark deleted.
    const anonEmail = `erased+${userId}@deleted.invalid`;
    const randomHash = crypto.randomBytes(32).toString('hex');
    await client.query(
      `UPDATE app_user SET email=$2, name=NULL, phone=NULL, password_hash=$3, deleted_at=now() WHERE id=$1`,
      [userId, anonEmail, randomHash]);

    await client.query('COMMIT');
    return { erased, account: 'anonymized', userId };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { exportData, eraseUser };

// Secret-at-rest encryption for merchant gateway credentials (RULE-0018; replaces the
// legacy EncryptionUtil/SecretKeySpec path, DEBT-0016). AES-256-GCM with a random IV per
// value; key derived from config. Secrets are NEVER returned in plaintext to clients/LLM —
// reads are masked. Decryption is server-side only, at point of use.
const crypto = require('crypto');
const config = require('./config');

// 32-byte key derived from the configured secret (scrypt). In production set CONFIG_ENC_KEY.
const KEY = crypto.scryptSync(config.secrets.configKey, 'shopiclaw-config-salt', 32);

function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Envelope: v1:iv:tag:ciphertext (base64) — self-describing for rotation.
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

function decryptSecret(envelope) {
  const [ver, ivB64, tagB64, dataB64] = String(envelope || '').split(':');
  if (ver !== 'v1') throw new Error('unsupported secret envelope');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

// Show only the last 4 chars; never expose the stored secret (RULE-0014/0018).
function maskSecret(plaintext) {
  const s = String(plaintext || '');
  if (!s) return null;
  return `••••${s.slice(-4)}`;
}

module.exports = { encryptSecret, decryptSecret, maskSecret };

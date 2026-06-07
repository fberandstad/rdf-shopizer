// Security headers (Wave 7 — RISK-0010/0011, DPR-0001; OWASP A05). No extra dependency:
// a focused header set (CSP, HSTS, anti-clickjacking, anti-MIME-sniff, referrer/permissions).
// CSP resolves the CAST top XSS finding (output encoding + restrictive sources).
const config = require('./../config');

// CSP: SPA served same-origin; allow inline styles (Tailwind injects), connect to same-origin
// + OpenAI (agent streaming). 'unsafe-inline' for styles only; scripts are self-hosted.
function contentSecurityPolicy() {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",            // anti-clickjacking (replaces X-Frame-Options)
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "connect-src 'self' https://api.openai.com",
    "font-src 'self' data:",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

function securityHeaders(req, res, next) {
  res.setHeader('Content-Security-Policy', contentSecurityPolicy());
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.removeHeader('X-Powered-By');
  // HSTS only over TLS / production (DPR-0001). Avoids breaking local http dev.
  if (config.nodeEnv === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
}

module.exports = { securityHeaders, contentSecurityPolicy };

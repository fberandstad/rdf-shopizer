import { test, expect, request as pwRequest } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers';

// Wave 7 — Hardening & Compliance. RISK-0010/0011/0020 + DPR-0005/0006/0008/0011/0012.
test.describe.configure({ mode: 'serial' });

const uniq = (p: string) => `${p}${Date.now()}${Math.floor(Math.random() * 1e4)}`;

test.describe('Hardening & Compliance (new app)', () => {
  test('RISK-0011: security headers (CSP, nosniff, frame-options) on responses', async ({ baseURL }) => {
    const ctx = await pwRequest.newContext({ baseURL });
    const res = await ctx.get('/api/ops/health');
    const h = res.headers();
    expect(h['content-security-policy']).toContain("default-src 'self'");
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['x-powered-by']).toBeUndefined(); // Express fingerprint removed
    await ctx.dispose();
  });

  test('DPR-0012: AI transparency disclosure is public and lists data-subject rights', async ({ baseURL }) => {
    const ctx = await pwRequest.newContext({ baseURL });
    const d = await (await ctx.get('/api/ai-disclosure')).json();
    expect(d.aiPowered).toBe(true);
    expect(d.humanEscalation).toBeTruthy();
    expect(d.rights.erasure).toContain('/api/account');
    await ctx.dispose();
  });

  test('DPR-0005: data export returns the subject\'s personal data', async ({ baseURL }) => {
    const ctx = await pwRequest.newContext({ baseURL });
    const email = `${uniq('gx')}@example.io`;
    await ctx.post('/auth/register', { data: { email, password: 'password123', name: 'Export Me' } });
    await ctx.post('/api/account/addresses', { data: { line1: '1 Rue Test', city: 'Paris', postalCode: '75001', country: 'FR' } });
    const exp = await (await ctx.get('/api/account/export')).json();
    expect(exp.subject.email).toBe(email);
    expect(exp.addresses.length).toBeGreaterThanOrEqual(1);
    expect(exp.notice).toMatch(/anonymized/i);
    await ctx.dispose();
  });

  test('DPR-0006: erasure removes account + PII, scrubs credentials (cascade)', async ({ baseURL }) => {
    const ctx = await pwRequest.newContext({ baseURL });
    const email = `${uniq('er')}@example.io`;
    await ctx.post('/auth/register', { data: { email, password: 'password123', name: 'Erase Me' } });
    await ctx.post('/api/account/addresses', { data: { line1: '2 Rue X', city: 'Lyon', postalCode: '69001', country: 'FR' } });
    // Place an order so we can confirm it is retained-but-anonymized (not blocked by FK).
    await ctx.post('/api/cart/items', { data: { sku: 'BK-001', quantity: 1 } });
    const order = await (await ctx.post('/api/checkout/order', { data: { customer: { name: 'Erase Me', email } } })).json();
    await ctx.post('/api/checkout/pay', { data: { orderId: order.id, paymentToken: 'tok_test_visa' } });

    const del = await ctx.delete('/api/account');
    expect(del.status()).toBe(200);
    const body = await del.json();
    expect(body.ok).toBe(true);
    expect(body.account).toBe('anonymized');

    // Session destroyed; old credentials no longer valid (password scrubbed).
    const me = await (await ctx.get('/auth/me')).json();
    expect(me.user).toBeNull();
    const relogin = await ctx.post('/auth/login', { data: { email, password: 'password123' } });
    expect(relogin.status()).toBe(401);
    await ctx.dispose();
  });

  test('DPR-0008: marketing consent can be withdrawn', async ({ baseURL }) => {
    const ctx = await pwRequest.newContext({ baseURL });
    const email = `${uniq('nl')}@example.io`;
    await ctx.post('/auth/register', { data: { email, password: 'password123', name: 'NL' } });
    await ctx.post('/api/newsletter', { data: { email, consent: true } });
    const w = await (await ctx.post('/api/newsletter/withdraw', { data: { email } })).json();
    expect(w.ok).toBe(true);
    expect(w.withdrawn).toBe(true);
    await ctx.dispose();
  });

  test('DPR-0011: admin can run the retention purge', async ({ baseURL }) => {
    const ctx = await pwRequest.newContext({ baseURL });
    await ctx.post('/auth/login', { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    const r = await ctx.post('/api/admin/retention/run', { data: {} });
    expect(r.status()).toBe(200);
    const counts = await r.json();
    expect(counts).toHaveProperty('agentMessages');
    expect(counts).toHaveProperty('toolAudit');
    await ctx.dispose();
  });
});

import { test, expect, request as pwRequest } from '@playwright/test';
import { login, clearCart, ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers';

// Golden master TEST-0015..0022 — Orders & Account (FS-0005/0006/0007/0009,
// RULE-0013/0014/0015/0020). Uses API via session-scoped request contexts.
test.describe.configure({ mode: 'serial' });

const uniqueEmail = (p: string) => `${p}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@example.io`;

// Build a fresh logged-in API context for a newly registered customer.
async function newCustomer(baseURL: string, name = 'Test Customer') {
  const ctx = await pwRequest.newContext({ baseURL });
  const email = uniqueEmail('cust');
  const res = await ctx.post('/auth/register', { data: { email, password: 'password123', name } });
  expect(res.status()).toBe(201);
  return { ctx, email };
}

test.describe('Account & Orders (new app)', () => {
  test('TEST-0018 register a new customer and authenticate', async ({ page, baseURL }) => {
    const { ctx, email } = await newCustomer(baseURL!);
    const me = await (await ctx.get('/auth/me')).json();
    expect(me.user.email).toBe(email);
    expect(me.user.role).toBe('customer');
    await ctx.dispose();
  });

  test('TEST-0019 profile update + address CRUD (owner-scoped)', async ({ baseURL }) => {
    const { ctx } = await newCustomer(baseURL!);
    const prof = await (await ctx.put('/api/account/profile',
      { data: { name: 'Ada Lovelace', phone: '+33 6 12 34 56 78' } })).json();
    expect(prof.name).toBe('Ada Lovelace');

    const addr = await (await ctx.post('/api/account/addresses',
      { data: { label: 'Home', line1: '1 Rue', city: 'Paris', postalCode: '75001', country: 'fr', isDefault: true } })).json();
    expect(addr.country).toBe('FR');
    const list = await (await ctx.get('/api/account/addresses')).json();
    expect(list.length).toBe(1);
    const del = await ctx.delete(`/api/account/addresses/${addr.id}`);
    expect(del.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('TEST-0019b invalid address rejected (422)', async ({ baseURL }) => {
    const { ctx } = await newCustomer(baseURL!);
    const res = await ctx.post('/api/account/addresses', { data: { city: 'Paris', postalCode: '75001' } });
    expect(res.status()).toBe(422);
    await ctx.dispose();
  });

  test('TEST-0020 product review tied to customer; rating bounds enforced', async ({ baseURL }) => {
    const { ctx } = await newCustomer(baseURL!);
    const bad = await ctx.post('/api/catalog/products/EL-001/reviews', { data: { rating: 9 } });
    expect(bad.status()).toBe(422);
    const ok = await (await ctx.post('/api/catalog/products/EL-001/reviews',
      { data: { rating: 5, title: 'Great', body: 'Love it' } })).json();
    expect(ok.rating).toBe(5);
    const reviews = await (await ctx.get('/api/catalog/products/EL-001/reviews')).json();
    expect(reviews.count).toBeGreaterThanOrEqual(1);
    expect(reviews.average).toBeGreaterThan(0);
    await ctx.dispose();
  });

  test('TEST-0022 newsletter subscribe (PII + consent)', async ({ baseURL }) => {
    const { ctx } = await newCustomer(baseURL!);
    const ok = await ctx.post('/api/newsletter', { data: { email: uniqueEmail('news'), consent: true } });
    expect(ok.status()).toBe(201);
    const noConsent = await ctx.post('/api/newsletter', { data: { email: uniqueEmail('news'), consent: false } });
    expect(noConsent.status()).toBe(422);
    await ctx.dispose();
  });

  test('TEST-0015/0017 invoice shows masked payment + supported cards', async ({ baseURL }) => {
    const { ctx } = await newCustomer(baseURL!);
    await ctx.post('/api/cart/items', { data: { sku: 'EL-001', quantity: 1 } });
    const order = await (await ctx.post('/api/checkout/order',
      { data: { customer: { name: 'Ada', email: 'ada@example.io' } } })).json();
    await ctx.post('/api/checkout/pay', { data: { orderId: order.id, paymentToken: 'tok_test_visa' } });
    const inv = await (await ctx.get(`/api/orders/${order.id}/invoice`)).json();
    expect(inv.payment.ref).toMatch(/^••••/);
    expect(inv.supportedCards).toEqual(['VISA', 'MASTERCARD', 'AMEX']);
    expect(inv.total).toBe(7999);
    await ctx.dispose();
  });

  test('TEST-0016 order access control: another customer cannot read it (RULE-0013)', async ({ baseURL }) => {
    const a = await newCustomer(baseURL!, 'Customer A');
    await a.ctx.post('/api/cart/items', { data: { sku: 'BK-001', quantity: 1 } });
    const order = await (await a.ctx.post('/api/checkout/order',
      { data: { customer: { name: 'A', email: 'a@example.io' } } })).json();

    const b = await newCustomer(baseURL!, 'Customer B');
    const denied = await b.ctx.get(`/api/orders/${order.id}`);
    expect(denied.status()).toBe(404); // not found for non-owner (no info leak)
    await a.ctx.dispose(); await b.ctx.dispose();
  });

  test('TEST-0021 digital download gated: customer w/o purchase 403, admin 200 (RULE-0015)', async ({ baseURL }) => {
    const { ctx } = await newCustomer(baseURL!);
    const forbidden = await ctx.get('/api/files/DL-001');
    expect(forbidden.status()).toBe(403);
    await ctx.dispose();

    const admin = await pwRequest.newContext({ baseURL });
    await admin.post('/auth/login', { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    const ok = await admin.get('/api/files/DL-001');
    expect(ok.status()).toBe(200);
    await admin.dispose();
  });
});

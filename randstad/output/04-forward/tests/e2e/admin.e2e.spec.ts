import { test, expect, request as pwRequest } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers';

// Golden master TEST-0023..0027 — Admin & Analytics (FS-0011..0014, RULE-0016..0020).
test.describe.configure({ mode: 'serial' });

const uniq = (p: string) => `${p}${Date.now()}${Math.floor(Math.random() * 1e4)}`;

async function adminCtx(baseURL: string) {
  const ctx = await pwRequest.newContext({ baseURL });
  const res = await ctx.post('/auth/login', { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  expect(res.status()).toBe(200);
  return ctx;
}
async function customerCtx(baseURL: string) {
  const ctx = await pwRequest.newContext({ baseURL });
  await ctx.post('/auth/register', { data: { email: `${uniq('cu')}@example.io`, password: 'password123', name: 'Cust' } });
  return ctx;
}

test.describe('Admin & Analytics (new app)', () => {
  test('TEST-0023 admin endpoints require authentication (401)', async ({ baseURL }) => {
    const anon = await pwRequest.newContext({ baseURL });
    const res = await anon.get('/api/admin/orders');
    expect(res.status()).toBe(401);
    await anon.dispose();
  });

  test('TEST-0024 RBAC: non-admin customer is forbidden (403)', async ({ baseURL }) => {
    const ctx = await customerCtx(baseURL!);
    const res = await ctx.get('/api/admin/orders');
    expect(res.status()).toBe(403);
    await ctx.dispose();
  });

  test('TEST-0025 admin catalog CRUD; product appears in storefront', async ({ baseURL }) => {
    const ctx = await adminCtx(baseURL!);
    const sku = uniq('SKU-').toUpperCase();
    const created = await ctx.post('/api/admin/products',
      { data: { sku, name: 'Admin Widget', priceCents: 1234, stock: 7, categoryCode: 'electronics' } });
    expect(created.status()).toBe(201);
    // Visible in the public catalog (search) and via product detail.
    const found = await (await ctx.get(`/api/catalog/products/${sku}`)).json();
    expect(found.price_cents).toBe(1234);
    // Update price + stock adjust.
    const upd = await (await ctx.put(`/api/admin/products/${sku}`, { data: { priceCents: 1500 } })).json();
    expect(upd.price_cents).toBe(1500);
    const stock = await (await ctx.patch(`/api/admin/products/${sku}/stock`, { data: { delta: -2 } })).json();
    expect(stock.stock).toBe(5);
    await ctx.dispose();
  });

  test('TEST-0026 admin order management: status transitions persist', async ({ baseURL }) => {
    // Create + pay an order as a customer, then admin fulfils it.
    const cust = await customerCtx(baseURL!);
    await cust.post('/api/cart/items', { data: { sku: 'BK-001', quantity: 1 } });
    const order = await (await cust.post('/api/checkout/order',
      { data: { customer: { name: 'C', email: 'c@example.io' } } })).json();
    await cust.post('/api/checkout/pay', { data: { orderId: order.id, paymentToken: 'tok_test_visa' } });

    const ctx = await adminCtx(baseURL!);
    const ok = await (await ctx.patch(`/api/admin/orders/${order.id}/status`, { data: { status: 'FULFILLED' } })).json();
    expect(ok.status).toBe('FULFILLED');
    // Illegal transition rejected (409).
    const bad = await ctx.patch(`/api/admin/orders/${order.id}/status`, { data: { status: 'AWAITING_PAYMENT' } });
    expect(bad.status()).toBe(409);
    await cust.dispose(); await ctx.dispose();
  });

  test('TEST-0027 gateway credentials stored encrypted; never returned in plaintext (RULE-0018)', async ({ baseURL }) => {
    const ctx = await adminCtx(baseURL!);
    const secret = 'sk_live_SUPERSECRET1234';
    const saved = await (await ctx.put('/api/admin/config/stripe',
      { data: { enabled: true, mode: 'authorizeAndCapture', secret } })).json();
    expect(saved.hasSecret).toBe(true);
    expect(JSON.stringify(saved)).not.toContain(secret); // plaintext never echoed
    const list = await (await ctx.get('/api/admin/config')).json();
    const stripe = list.find((c: any) => c.gateway === 'stripe');
    expect(stripe.hasSecret).toBe(true);
    expect(JSON.stringify(list)).not.toContain(secret); // masked on read
    await ctx.dispose();
  });
});

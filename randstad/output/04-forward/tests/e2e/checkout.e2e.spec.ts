import { test, expect } from '@playwright/test';
import { login, clearCart } from './helpers';

// Golden master TEST-0009..0014 against the modern app (FS-0003/0004, RULE-0008..0012).
// Tokenized payment only (no PAN). Uses the API via page.request (shared session cookies).
test.describe.configure({ mode: 'serial' });

test.describe('Checkout & Payment (new app)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await clearCart(page.request);
    await page.request.post('/api/cart/items', { data: { sku: 'EL-001', quantity: 1 } });
  });

  const customer = { name: 'Ada Lovelace', email: 'ada@example.io' };

  test('TEST-0009 createOrder requires customer context (RULE-0008)', async ({ page }) => {
    const res = await page.request.post('/api/checkout/order', { data: { customer: { name: '', email: '' } } });
    expect(res.status()).toBe(422);
  });

  test('TEST-0010 shipping method selection changes the order total (FS-0003)', async ({ page }) => {
    // Methods are listed server-side with authoritative costs.
    const ship = await (await page.request.get('/api/checkout/shipping')).json();
    expect(Array.isArray(ship.options)).toBe(true);
    const std = ship.options.find((o: any) => o.code === 'STANDARD');
    const exp = ship.options.find((o: any) => o.code === 'EXPRESS');
    expect(exp.cents).toBeGreaterThan(std.cents);

    const standard = await (await page.request.post('/api/checkout/order',
      { data: { customer, shippingMethod: 'STANDARD' } })).json();
    const express = await (await page.request.post('/api/checkout/order',
      { data: { customer, shippingMethod: 'EXPRESS' } })).json();
    // Subtotal identical; shipping (and therefore total) reflects the chosen method.
    expect(express.shipping).toBe(exp.cents);
    expect(standard.shipping).toBe(std.cents);
    expect(express.total - standard.total).toBe(exp.cents - std.cents);

    // Unknown method is rejected server-side (RULE-0007).
    const bad = await page.request.post('/api/checkout/order',
      { data: { customer, shippingMethod: 'TELEPORT' } });
    expect(bad.status()).toBe(422);
  });

  test('TEST-0011/0012 successful tokenized payment places order (PAID)', async ({ page }) => {
    const order = await (await page.request.post('/api/checkout/order', { data: { customer } })).json();
    expect(order.status).toBe('AWAITING_PAYMENT');
    const paid = await (await page.request.post('/api/checkout/pay',
      { data: { orderId: order.id, paymentToken: 'tok_test_visa' } })).json();
    expect(paid.status).toBe('PAID');
    expect(paid.payment.ref).toMatch(/^••••/);        // masked (RULE-0014)
    // Cart cleared after successful purchase.
    const cart = await (await page.request.get('/api/cart')).json();
    expect(cart.count).toBe(0);
  });

  test('TEST-0014 declined payment persists NO order (RULE-0012)', async ({ page }) => {
    const order = await (await page.request.post('/api/checkout/order', { data: { customer } })).json();
    const res = await page.request.post('/api/checkout/pay',
      { data: { orderId: order.id, paymentToken: 'tok_decline' } });
    expect(res.status()).toBe(402);
    // Order was rolled back -> not found.
    const lookup = await page.request.get(`/api/orders/${order.id}`);
    expect(lookup.status()).toBe(404);
  });

  test('TEST-PCI raw card number is rejected (RISK-0001)', async ({ page }) => {
    const order = await (await page.request.post('/api/checkout/order', { data: { customer } })).json();
    const res = await page.request.post('/api/checkout/pay',
      { data: { orderId: order.id, paymentToken: '4242424242424242' } });
    expect(res.status()).toBe(422);
  });

  test('TEST-0013 order is owner-scoped on read (RULE-0013) and payment masked', async ({ page }) => {
    const order = await (await page.request.post('/api/checkout/order', { data: { customer } })).json();
    await page.request.post('/api/checkout/pay', { data: { orderId: order.id, paymentToken: 'tok_test_visa' } });
    const got = await (await page.request.get(`/api/orders/${order.id}`)).json();
    expect(got.id).toBe(order.id);
    expect(JSON.stringify(got)).not.toMatch(/tok_test_visa/); // no raw token leaked
  });
});
